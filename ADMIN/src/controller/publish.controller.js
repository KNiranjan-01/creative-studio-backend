const Connection = require('../models/connection.model');
const CalendarEvent = require('../models/calendarEvent.model');
const asyncHandler = require('../utils/asyncHandler');
const { v2: cloudinary } = require('cloudinary');

// Configure Cloudinary from env
cloudinary.config({ cloudinary_url: process.env.CLOUDINARY_URL });

// ─── POST /api/publish ────────────────────────────────────────────────────────
// @desc  Publish content to one or more social platforms
// @access Protected
exports.publish = asyncHandler(async (req, res) => {
    const { platforms, text, imageB64s, eventId } = req.body;
    const userId = req.user._id;

    if (!platforms || !Array.isArray(platforms) || platforms.length === 0) {
        return res.status(400).json({ success: false, message: 'No platforms specified' });
    }

    if (!text && (!imageB64s || imageB64s.length === 0)) {
        return res.status(400).json({ success: false, message: 'Either text or images are required' });
    }

    const results = [];

    // ── Upload images to Cloudinary for platforms that need a public URL ──────
    let cloudinaryUrls = [];
    const needsCloudinary = platforms.some((p) =>
        ['instagram', 'facebook', 'linkedin'].includes(p.toLowerCase())
    );

    if (needsCloudinary && imageB64s && imageB64s.length > 0) {
        for (const b64 of imageB64s) {
            const uploadRes = await cloudinary.uploader.upload(b64, {
                resource_type: 'auto',
                folder: 'creative-studio'
            });
            cloudinaryUrls.push(uploadRes.secure_url);
        }
    }

    // ── Publish to each platform ───────────────────────────────────────────────
    for (const platform of platforms) {
        const normalizedPlatform = platform.toLowerCase();

        // Load connection WITH tokens (select: false fields must be explicitly requested)
        const connection = await Connection.findOne({ userId, platform: normalizedPlatform }).select(
            '+accessToken +refreshToken'
        );

        if (!connection) {
            results.push({ platform, success: false, error: `Not connected to ${platform}` });
            continue;
        }

        try {
            const { accessToken, profileId } = connection;
            let postUrl = '';

            // ── Twitter ──────────────────────────────────────────────────────
            if (normalizedPlatform === 'twitter') {
                const tweetRes = await fetch('https://api.twitter.com/2/tweets', {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ text: text || '' })
                });

                if (!tweetRes.ok) throw new Error(`Twitter: ${await tweetRes.text()}`);
                const tweetData = await tweetRes.json();
                postUrl = `https://twitter.com/user/status/${tweetData.data.id}`;

            // ── LinkedIn ──────────────────────────────────────────────────────
            } else if (normalizedPlatform === 'linkedin') {
                const authorUrn = `urn:li:person:${profileId}`;
                let shareMedia = { shareMediaCategory: 'NONE' };

                if (cloudinaryUrls.length > 0) {
                    shareMedia = {
                        shareMediaCategory: 'ARTICLE',
                        media: [{
                            status: 'READY',
                            description: { text: 'Image' },
                            originalUrl: cloudinaryUrls[0],
                            title: { text: 'Media' }
                        }]
                    };
                }

                const payload = {
                    author: authorUrn,
                    lifecycleState: 'PUBLISHED',
                    specificContent: {
                        'com.linkedin.ugc.ShareContent': {
                            shareCommentary: { text: text || '' },
                            ...shareMedia
                        }
                    },
                    visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' }
                };

                const liRes = await fetch('https://api.linkedin.com/v2/ugcPosts', {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        'Content-Type': 'application/json',
                        'X-Restli-Protocol-Version': '2.0.0'
                    },
                    body: JSON.stringify(payload)
                });

                if (!liRes.ok) throw new Error(`LinkedIn: ${await liRes.text()}`);
                const liData = await liRes.json();
                postUrl = `https://www.linkedin.com/feed/update/${liData.id}`;

            // ── Facebook ──────────────────────────────────────────────────────
            } else if (normalizedPlatform === 'facebook') {
                const pagesRes = await fetch(
                    `https://graph.facebook.com/me/accounts?access_token=${accessToken}`
                );
                const pagesData = await pagesRes.json();
                if (!pagesData.data?.length) throw new Error('No Facebook Pages found');

                const page = pagesData.data[0];
                const pageToken = page.access_token;
                const hasImage = cloudinaryUrls.length > 0;
                const endpoint = hasImage
                    ? `https://graph.facebook.com/${page.id}/photos`
                    : `https://graph.facebook.com/${page.id}/feed`;

                const bodyParams = { access_token: pageToken };
                if (hasImage) {
                    bodyParams.url = cloudinaryUrls[0];
                    if (text) bodyParams.message = text;
                } else {
                    bodyParams.message = text;
                }

                const fbRes = await fetch(endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(bodyParams)
                });

                if (!fbRes.ok) throw new Error(`Facebook: ${await fbRes.text()}`);
                const fbData = await fbRes.json();
                postUrl = `https://facebook.com/${fbData.id || fbData.post_id}`;

            // ── Instagram ──────────────────────────────────────────────────────
            } else if (normalizedPlatform === 'instagram') {
                if (cloudinaryUrls.length === 0) throw new Error('Instagram requires an image');

                const pagesRes = await fetch(
                    `https://graph.facebook.com/me/accounts?access_token=${accessToken}`
                );
                const pagesData = await pagesRes.json();
                if (!pagesData.data?.length) throw new Error('No Facebook Pages found for Instagram');

                const pageId = pagesData.data[0].id;
                const igRes = await fetch(
                    `https://graph.facebook.com/v19.0/${pageId}?fields=instagram_business_account&access_token=${accessToken}`
                );
                const igData = await igRes.json();
                if (!igData.instagram_business_account) {
                    throw new Error('No Instagram Professional account linked to this Facebook Page');
                }

                const igUserId = igData.instagram_business_account.id;

                const containerRes = await fetch(`https://graph.facebook.com/v19.0/${igUserId}/media`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        image_url: cloudinaryUrls[0],
                        caption: text || '',
                        access_token: accessToken
                    })
                });

                if (!containerRes.ok) throw new Error(`Instagram container: ${await containerRes.text()}`);
                const { id: containerId } = await containerRes.json();

                // Brief delay before publishing container
                await new Promise((r) => setTimeout(r, 2000));

                const publishRes = await fetch(`https://graph.facebook.com/v19.0/${igUserId}/media_publish`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ creation_id: containerId, access_token: accessToken })
                });

                if (!publishRes.ok) throw new Error(`Instagram publish: ${await publishRes.text()}`);
                const finalData = await publishRes.json();
                postUrl = `https://instagram.com/p/${finalData.id}`;
            }

            results.push({ platform, success: true, postUrl });

        } catch (platformErr) {
            console.error(`[Publish] ${platform} error:`, platformErr.message);
            results.push({ platform, success: false, error: platformErr.message });
        }
    }

    const allSuccessful = results.length > 0 && results.every((r) => r.success);

    // If successful and an eventId was provided, update the event status to 'Posted'
    if (allSuccessful && eventId) {
        try {
            await CalendarEvent.findOneAndUpdate(
                { _id: eventId, orgId: req.org._id },
                { status: 'Posted' }
            );
        } catch (err) {
            console.error('Failed to update event status to Posted:', err);
        }
    }

    res.json({ success: allSuccessful, results });
});

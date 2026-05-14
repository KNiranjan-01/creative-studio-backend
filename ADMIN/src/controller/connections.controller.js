const Connection = require('../models/connection.model');
const asyncHandler = require('../utils/asyncHandler');
const crypto = require('crypto');

const BASE_URL = process.env.BACKEND_URL || 'http://localhost:3000';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// ─── Helpers ───────────────────────────────────────────────────────────────────

function generateRandomString(length = 32) {
    return crypto.randomBytes(length).toString('hex');
}

function generateCodeChallenge(codeVerifier) {
    return crypto.createHash('sha256').update(codeVerifier).digest('base64url');
}

// ─── GET /api/connections/status ───────────────────────────────────────────────
// @desc  Get all platform connection statuses for the current user
// @access Protected
exports.getStatus = asyncHandler(async (req, res) => {
    const connections = await Connection.find({ userId: req.user._id });

    const platforms = ['twitter', 'linkedin', 'facebook', 'instagram'];
    const status = {};

    for (const platform of platforms) {
        const conn = connections.find((c) => c.platform === platform);
        status[platform] = conn
            ? {
                  connected: true,
                  profileName: conn.profileName,
                  profileId: conn.profileId,
                  connectedAt: conn.createdAt
              }
            : { connected: false };
    }

    res.json({ success: true, connections: status });
});

// ─── POST /api/connections/disconnect ──────────────────────────────────────────
// @desc  Disconnect a social media platform
// @access Protected
exports.disconnect = asyncHandler(async (req, res) => {
    const { platform } = req.body;

    if (!platform) {
        return res.status(400).json({ success: false, message: 'Platform is required' });
    }

    await Connection.findOneAndDelete({ userId: req.user._id, platform: platform.toLowerCase() });

    res.json({ success: true, message: `Disconnected from ${platform}` });
});

// ─── POST /api/connections/initiate/:platform ──────────────────────────────────
// @desc  Initiate OAuth flow — stores userId & state in session, returns authUrl
// @access Protected
exports.initiateOAuth = asyncHandler(async (req, res) => {
    const { platform } = req.params;
    const redirectUri = `${BASE_URL}/api/connections/${platform}/callback`;
    const state = generateRandomString(16);

    // Store state and user ID in session so we can verify on callback
    req.session.oauthState = state;
    req.session.oauthUserId = req.user._id.toString();
    req.session.oauthPlatform = platform;

    let authUrl = '';

    if (platform === 'twitter') {
        const clientId = process.env.TWITTER_CLIENT_ID;
        if (!clientId) return res.status(500).json({ success: false, message: 'TWITTER_CLIENT_ID not configured' });

        const codeVerifier = generateRandomString(64);
        req.session.twitterCodeVerifier = codeVerifier;
        const codeChallenge = generateCodeChallenge(codeVerifier);

        authUrl = `https://twitter.com/i/oauth2/authorize?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent('tweet.read tweet.write users.read offline.access')}&state=${state}&code_challenge=${codeChallenge}&code_challenge_method=S256`;

    } else if (platform === 'linkedin') {
        const clientId = process.env.LINKEDIN_CLIENT_ID;
        if (!clientId) return res.status(500).json({ success: false, message: 'LINKEDIN_CLIENT_ID not configured' });

        authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&scope=${encodeURIComponent('w_member_social openid profile email')}`;

    } else if (platform === 'facebook' || platform === 'instagram') {
        const clientId = process.env.FACEBOOK_CLIENT_ID;
        if (!clientId) return res.status(500).json({ success: false, message: 'FACEBOOK_CLIENT_ID not configured' });

        const scopes = platform === 'instagram'
            ? 'instagram_basic,instagram_content_publish,pages_show_list,pages_read_engagement'
            : 'pages_show_list,pages_read_engagement,pages_manage_posts';

        authUrl = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&scope=${encodeURIComponent(scopes)}`;

    } else {
        return res.status(400).json({ success: false, message: `Unknown platform: ${platform}` });
    }

    await new Promise((resolve, reject) => req.session.save((err) => (err ? reject(err) : resolve())));

    res.json({ success: true, authUrl });
});

// ─── GET /api/connections/:platform/callback ───────────────────────────────────
// @desc  OAuth callback — exchanges code, saves connection to MongoDB
// @access Public (browser redirect from OAuth provider)
exports.handleCallback = asyncHandler(async (req, res) => {
    const { platform } = req.params;
    const { code, state, error, error_description } = req.query;
    const redirectUri = `${BASE_URL}/api/connections/${platform}/callback`;

    if (error) {
        console.error(`[OAuth] ${platform} error:`, error, error_description);
        return res.redirect(`${FRONTEND_URL}/connections?error=${encodeURIComponent(error_description || error)}`);
    }

    if (!code) {
        return res.redirect(`${FRONTEND_URL}/connections?error=No+authorization+code+provided`);
    }

    // Validate state & recover userId from session
    const { oauthState, oauthUserId, twitterCodeVerifier } = req.session;

    if (!state || state !== oauthState) {
        return res.redirect(`${FRONTEND_URL}/connections?error=Invalid+state+parameter`);
    }

    if (!oauthUserId) {
        return res.redirect(`${FRONTEND_URL}/connections?error=Session+expired,+please+try+again`);
    }

    // Clean session
    delete req.session.oauthState;
    delete req.session.oauthUserId;
    delete req.session.oauthPlatform;
    delete req.session.twitterCodeVerifier;

    try {
        let accessToken = null;
        let refreshToken = null;
        let expiresAt = null;
        let profileId = null;
        let profileName = null;

        // ── Twitter ──────────────────────────────────────────────────────────
        if (platform === 'twitter') {
            const clientId = process.env.TWITTER_CLIENT_ID;
            const clientSecret = process.env.TWITTER_CLIENT_SECRET;

            const tokenRes = await fetch('https://api.twitter.com/2/oauth2/token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`
                },
                body: new URLSearchParams({
                    grant_type: 'authorization_code',
                    client_id: clientId,
                    redirect_uri: redirectUri,
                    code,
                    code_verifier: twitterCodeVerifier || ''
                })
            });

            if (!tokenRes.ok) throw new Error(`Twitter token exchange failed: ${await tokenRes.text()}`);
            const tokenData = await tokenRes.json();
            accessToken = tokenData.access_token;
            refreshToken = tokenData.refresh_token || null;
            expiresAt = tokenData.expires_in ? Date.now() + tokenData.expires_in * 1000 : null;

            const profileRes = await fetch('https://api.twitter.com/2/users/me', {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            if (!profileRes.ok) throw new Error(`Twitter profile fetch failed: ${await profileRes.text()}`);
            const { data: profile } = await profileRes.json();
            profileId = profile.id;
            profileName = profile.username;

        // ── LinkedIn ──────────────────────────────────────────────────────────
        } else if (platform === 'linkedin') {
            const clientId = process.env.LINKEDIN_CLIENT_ID;
            const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;

            const tokenRes = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                    grant_type: 'authorization_code',
                    client_id: clientId,
                    client_secret: clientSecret,
                    redirect_uri: redirectUri,
                    code
                })
            });

            if (!tokenRes.ok) throw new Error(`LinkedIn token exchange failed: ${await tokenRes.text()}`);
            const tokenData = await tokenRes.json();
            accessToken = tokenData.access_token;
            refreshToken = tokenData.refresh_token || null;
            expiresAt = tokenData.expires_in ? Date.now() + tokenData.expires_in * 1000 : null;

            const profileRes = await fetch('https://api.linkedin.com/v2/userinfo', {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            if (!profileRes.ok) throw new Error(`LinkedIn profile fetch failed: ${await profileRes.text()}`);
            const profileData = await profileRes.json();
            profileId = profileData.sub;
            profileName = profileData.name || profileData.given_name || 'LinkedIn User';

        // ── Facebook / Instagram ──────────────────────────────────────────────
        } else if (platform === 'facebook' || platform === 'instagram') {
            const clientId = process.env.FACEBOOK_CLIENT_ID;
            const clientSecret = process.env.FACEBOOK_CLIENT_SECRET;

            const tokenRes = await fetch(
                `https://graph.facebook.com/v19.0/oauth/access_token?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${clientSecret}&code=${code}`
            );
            if (!tokenRes.ok) throw new Error(`Facebook token exchange failed: ${await tokenRes.text()}`);
            const tokenData = await tokenRes.json();
            accessToken = tokenData.access_token;
            expiresAt = tokenData.expires_in
                ? Date.now() + tokenData.expires_in * 1000
                : Date.now() + 60 * 24 * 60 * 60 * 1000; // 60 days default

            const profileRes = await fetch(`https://graph.facebook.com/me?fields=id,name&access_token=${accessToken}`);
            if (!profileRes.ok) throw new Error(`Facebook profile fetch failed: ${await profileRes.text()}`);
            const profileData = await profileRes.json();
            profileId = profileData.id;
            profileName = profileData.name;
        }

        // ── Save to MongoDB (upsert) ──────────────────────────────────────────
        await Connection.findOneAndUpdate(
            { userId: oauthUserId, platform },
            { accessToken, refreshToken, expiresAt, profileId, profileName },
            { upsert: true, new: true, runValidators: true }
        );

        res.redirect(`${FRONTEND_URL}/connections?success=${platform}`);

    } catch (err) {
        console.error(`[OAuth] ${platform} callback error:`, err.message);
        res.redirect(`${FRONTEND_URL}/connections?error=${encodeURIComponent(err.message)}`);
    }
});

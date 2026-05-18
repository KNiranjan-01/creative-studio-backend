const Creative = require('../models/creative.model');
const asyncHandler = require('../utils/asyncHandler');
const { v2: cloudinary } = require('cloudinary');

cloudinary.config({ cloudinary_url: process.env.CLOUDINARY_URL });

exports.saveCreative = asyncHandler(async (req, res) => {
    const { name, prompt, imageBase64, size, type } = req.body;

    if (!name || !prompt || !imageBase64) {
        return res.status(400).json({ success: false, message: 'Name, prompt, and image base64 are required' });
    }

    // Upload base64 image to cloudinary
    // The folder will be: creative-studio/<org_id>/creatives
    const uploadRes = await cloudinary.uploader.upload(imageBase64, {
        resource_type: 'image',
        folder: `creative-studio/${req.org._id}/creatives`
    });

    const creative = await Creative.create({
        orgId: req.org._id,
        name,
        prompt,
        imageUrl: uploadRes.secure_url,
        size: size || '1080x1080',
        type: type || 'image',
        createdBy: req.user._id
    });

    res.status(201).json({ success: true, data: creative });
});

exports.getCreatives = asyncHandler(async (req, res) => {
    const creatives = await Creative.find({ orgId: req.org._id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: creatives });
});

exports.deleteCreative = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const creative = await Creative.findOneAndDelete({ _id: id, orgId: req.org._id });

    if (!creative) {
        return res.status(404).json({ success: false, message: 'Creative not found' });
    }

    res.status(200).json({ success: true, message: 'Creative deleted successfully' });
});

exports.toggleFavorite = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const creative = await Creative.findOne({ _id: id, orgId: req.org._id });

    if (!creative) {
        return res.status(404).json({ success: false, message: 'Creative not found' });
    }

    creative.isFavorite = !creative.isFavorite;
    await creative.save();

    res.status(200).json({ success: true, data: creative });
});

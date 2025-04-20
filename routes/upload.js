const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const Image = require('../models/Image');
const Token = require('../models/Token');
const admin = require('firebase-admin');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Multer Setup
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'uploads',
    allowed_formats: ['jpg', 'jpeg', 'png'],
  },
});

const upload = multer({ storage });

// POST /upload
router.post('/', upload.single('image'), async (req, res) => {
  try {
    const result = req.file.path;

    const newImage = new Image({
      imageUrl: result,
      timestamp: new Date(),
    });

    const savedImage = await newImage.save();

    // Send FCM notifications to all device tokens
    const tokenDocs = await Token.find({});
    const deviceTokens = tokenDocs.map(doc => doc.token);

    if (deviceTokens.length > 0) {
      const message = {
        notification: {
          title: '📸 New Image Captured!',
          body: 'A new image has been uploaded.',
        },
        tokens: deviceTokens,
      };

      try {
        const response = await admin.messaging().sendMulticast(message);
        console.log('📢 Notifications sent:', response);
      } catch (err) {
        console.error('❌ Notification error:', err);
      }
    }

    res.status(201).json({
      message: 'Image uploaded successfully',
      imageUrl: savedImage.imageUrl,
      timestamp: savedImage.timestamp,
    });
  } catch (err) {
    console.error('❌ Upload error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /upload/latest - Fetch the most recent image
// GET /upload/latest - Return the most recent image
router.get('/latest', async (req, res) => {
  try {
    const latestImage = await Image.findOne().sort({ timestamp: -1 });
    if (!latestImage) {
      return res.status(404).json({ message: 'No images found' });
    }
    res.status(200).json({
      imageUrl: latestImage.imageUrl,
      timestamp: latestImage.timestamp,
    });
  } catch (err) {
    console.error('❌ Fetch latest image error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /upload/all - Return the last 15 images sorted by newest first
router.get('/all', async (req, res) => {
  try {
    const images = await Image.find().sort({ timestamp: -1 }).limit(15);
    const imageData = images.map(img => ({
      imageUrl: img.imageUrl,
      timestamp: img.timestamp,
    }));
    res.status(200).json(imageData);
  } catch (err) {
    console.error('❌ Fetch all images error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

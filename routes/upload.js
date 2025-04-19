const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const Image = require('../models/Image');
const Token = require('../models/Token');
const admin = require('firebase-admin');

// Multer Setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname),
});

const upload = multer({ storage });

// POST /upload
router.post('/', upload.single('image'), async (req, res) => {
  try {
    const result = req.file.path;

    const newImage = new Image({ imageUrl: result });
    const savedImage = await newImage.save();

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

    res.status(201).json(savedImage);
  } catch (err) {
    console.error('❌ Upload error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

const express = require('express');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const Image = require('../models/Image');

const router = express.Router();

// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Multer + Cloudinary storage
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
    });

    const savedImage = await newImage.save();
    res.status(201).json(savedImage);
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


// GET /upload/latest - Get the latest uploaded image
router.get('/latest', async (req, res) => {
  try {
    const latestImage = await Image.findOne().sort({ timestamp: -1 });

    if (!latestImage) {
      return res.status(404).json({ message: 'No image found' });
    }

    res.json({ 
      imageUrl: latestImage.imageUrl,
      timestamp: latestImage.timestamp, 
    });
  } catch (error) {
    console.error('Error fetching latest image:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


 // GET /upload/all - Endpoint to get all images
router.get('/all', async (req, res) => {
  try {
    const images = await Image.find().sort({ timestamp: -1 }); // Sort by timestamp descending to get the latest images first

    if (!images.length) {
      return res.status(404).json({ message: 'No images found' });
    }

    res.json(images); // Send the array of images
  } catch (error) {
    console.error('Error fetching all images:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


module.exports = router;

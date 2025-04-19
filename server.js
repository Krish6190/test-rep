require('dotenv').config();
const admin = require('firebase-admin');
const express = require('express');
const mongoose = require('mongoose');
const uploadRoute = require('./routes/upload');
const Token = require('./models/Token'); // NEW: FCM token model

const app = express();
app.use(express.json());

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.applicationDefault(),
});

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ MongoDB connected'))
.catch((err) => console.error('❌ MongoDB error:', err));

// Routes
app.use('/upload', uploadRoute);

// Route to save FCM token
app.post('/save-token', async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ message: 'Token is required' });
  }

  try {
    const exists = await Token.findOne({ token });
    if (!exists) {
      await Token.create({ token });
      console.log(`✅ Token saved: ${token}`);
    }

    return res.status(200).json({ message: 'Token saved successfully' });
  } catch (error) {
    console.error('❌ Error saving token:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

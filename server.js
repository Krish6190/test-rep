require('dotenv').config();
const admin = require('firebase-admin');
const express = require('express');
const mongoose = require('mongoose');
const uploadRoute = require('./routes/upload');

const app = express();

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.applicationDefault(),
});

// Send a test push notification
app.post('/sendNotification', async (req, res) => {
  try {
    const message = {
      notification: {
        title: 'Motion Detected!',
        body: 'A new image has been uploaded to the system.',
      },
      token: req.body.token, // Pass the device token here
    };

    const response = await admin.messaging().send(message);
    console.log('Notification sent successfully:', response);
    res.status(200).json({ message: 'Notification sent successfully' });
  } catch (error) {
    console.error('Error sending notification:', error);
    res.status(500).json({ message: 'Error sending notification' });
  }
});

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch((err) => console.error('MongoDB error:', err));

// Routes
app.use('/upload', uploadRoute);

// Server
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

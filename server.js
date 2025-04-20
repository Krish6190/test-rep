require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const uploadRoute = require('./routes/upload');

const app = express();

// Middleware for parsing JSON bodies
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch((err) => console.error('MongoDB error:', err));

// Routes
app.use('/upload', uploadRoute); // Image upload and latest image routes

// Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const songRoutes = require('./routes/songRoutes');
const moodRoutes = require('./routes/moodRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/api/songs', songRoutes);
app.use('/api/mood', moodRoutes);

// Serve frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// MongoDB Connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB Connected');
    seedSongs();
  } catch (err) {
    console.error('❌ MongoDB Error:', err.message);
    process.exit(1);
  }
};

// Seed initial songs if DB is empty
const seedSongs = async () => {
  const Song = require('./models/Song');
  const count = await Song.countDocuments();
  if (count === 0) {
    const { seedData } = require('./models/seedData');
    await Song.insertMany(seedData);
    console.log('🎵 Songs seeded successfully');
  }
};

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Moody Player running on http://localhost:${PORT}`);
  });
});

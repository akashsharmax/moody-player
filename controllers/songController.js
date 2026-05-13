const Song = require('../models/Song');

// GET /api/songs?mood=happy
const getSongsByMood = async (req, res) => {
  try {
    const { mood } = req.query;
    const validMoods = ['happy', 'sad', 'angry', 'surprised', 'neutral', 'fearful', 'disgusted'];

    if (!mood || !validMoods.includes(mood.toLowerCase())) {
      return res.status(400).json({ success: false, message: 'Valid mood is required' });
    }

    const songs = await Song.find({ mood: mood.toLowerCase() }).lean();

    // Shuffle for variety
    const shuffled = songs.sort(() => Math.random() - 0.5).slice(0, 5);

    res.json({ success: true, mood, count: shuffled.length, songs: shuffled });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/songs/all
const getAllSongs = async (req, res) => {
  try {
    const songs = await Song.find().lean();
    res.json({ success: true, count: songs.length, songs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getSongsByMood, getAllSongs };

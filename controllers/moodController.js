const MoodLog = require('../models/MoodLog');
const Song = require('../models/Song');

// POST /api/mood/log
const logMood = async (req, res) => {
  try {
    const { mood, confidence } = req.body;
    const validMoods = ['happy', 'sad', 'angry', 'surprised', 'neutral', 'fearful', 'disgusted'];

    if (!mood || !validMoods.includes(mood)) {
      return res.status(400).json({ success: false, message: 'Valid mood required' });
    }

    // Get recommended songs for this mood
    const songs = await Song.find({ mood }).lean();
    const recommended = songs.sort(() => Math.random() - 0.5).slice(0, 5);

    // Save mood log
    const moodLog = await MoodLog.create({
      mood,
      confidence: confidence || null,
      songsRecommended: recommended.map(s => s._id),
    });

    res.status(201).json({
      success: true,
      message: 'Mood logged successfully',
      moodLog,
      songs: recommended,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/mood/history
const getMoodHistory = async (req, res) => {
  try {
    const history = await MoodLog.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('songsRecommended', 'title artist')
      .lean();

    res.json({ success: true, count: history.length, history });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { logMood, getMoodHistory };

const mongoose = require('mongoose');

const moodLogSchema = new mongoose.Schema({
  mood: {
    type: String,
    enum: ['happy', 'sad', 'angry', 'surprised', 'neutral', 'fearful', 'disgusted'],
    required: true
  },
  confidence: { type: Number }, // 0–1 confidence score from face-api
  songsRecommended: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Song' }],
}, { timestamps: true });

module.exports = mongoose.model('MoodLog', moodLogSchema);

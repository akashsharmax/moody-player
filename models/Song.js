const mongoose = require('mongoose');

const songSchema = new mongoose.Schema({
  title: { type: String, required: true },
  artist: { type: String, required: true },
  mood: {
    type: String,
    enum: ['happy', 'sad', 'angry', 'surprised', 'neutral', 'fearful', 'disgusted'],
    required: true
  },
  genre: { type: String },
  duration: { type: String },
  youtubeId: { type: String }, // YouTube embed ID for demo
  coverColor: { type: String }, // gradient color for card
}, { timestamps: true });

module.exports = mongoose.model('Song', songSchema);

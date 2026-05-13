const express = require('express');
const router = express.Router();
const { getSongsByMood, getAllSongs } = require('../controllers/songController');

// GET /api/songs?mood=happy
router.get('/', getSongsByMood);

// GET /api/songs/all
router.get('/all', getAllSongs);

module.exports = router;

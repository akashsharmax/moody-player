const express = require('express');
const router = express.Router();
const { logMood, getMoodHistory } = require('../controllers/moodController');

// POST /api/mood/log
router.post('/log', logMood);

// GET /api/mood/history
router.get('/history', getMoodHistory);

module.exports = router;

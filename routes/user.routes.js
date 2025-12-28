const express = require('express');
const router = express.Router();
const UserController = require('../controllers/user.controller');

router.get('/getWatchHistory',UserController.getWatchHistory);
router.post('/updateMovieWatched',UserController.updateMovieWatched);

module.exports = router;
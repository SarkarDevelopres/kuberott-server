const express = require('express');
const router = express.Router();
const MovieController = require('../controllers/movie.controller');

router.get('/getMovieList', MovieController.getMovieList);
router.get('/getAllMovies', MovieController.getAllMovies);
router.get('/getMovieListAdmin', MovieController.getMovieListAdmin);
router.get('/getMovieListByGenre', MovieController.getMovieListByGenre);
router.get('/getMovieListBySearch', MovieController.getMovieListBySearch);
router.get('/getMovieListByLanguage', MovieController.getMovieListByLanguage);
router.get('/fetchMovieData',MovieController.fetchMovieData);
router.get('/fetchMovieDataClient',MovieController.fetchMovieDataClient);
router.get('/fetchMovieURL',MovieController.fetchMovieURL);

router.post('/createWatchedData',MovieController.createWatchedData);

module.exports = router;
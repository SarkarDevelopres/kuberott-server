const express = require('express');
const router = express.Router();
const AdminController = require('../controllers/admin.controller');

router.post('/addEmployee', AdminController.createEmployee);
router.post('/updateEmployee', AdminController.updateEmployee);
router.post('/deleteEmployee', AdminController.deleteEmployee);
router.get('/fetchEmployees', AdminController.fetchEmployees);


router.get('/fetchStartUpData', AdminController.startUpData);
router.get('/fetchUsers', AdminController.fetchUsers);

router.post('/addMovie', AdminController.addMovie);
router.post('/recordMedia', AdminController.recordMedia);

router.post('/updateMovieData', AdminController.updateMovieData);
router.post('/updateMovieMedia', AdminController.updateMovieMedia);
router.post('/recordUpdatedMedia', AdminController.recordUpdatedMedia);

router.post('/deleteMovie', AdminController.deleteMovie);
router.post('/deleteUser', AdminController.deleteUser);

module.exports = router;
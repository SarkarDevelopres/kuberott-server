const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/auth.controller');

router.post('/userLogin', AuthController.userLogin);
router.post('/userSignUp', AuthController.userSignUp);

router.post('/employeeLogin', AuthController.employeeLogin);

module.exports = router;
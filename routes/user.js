const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const isAuth = require('../middlewares/is-auth');

router.post('/login', userController.loginUser);
router.post('/signup', userController.signupUser);
router.post('/logout', userController.logoutUser);

exports.routes = router;
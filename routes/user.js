const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const isAuth = require('../middlewares/is-auth');

router.post('/login', userController.logInUser);
router.post('/signup', userController.signUpUser);
router.post('/logout', userController.logOutUser);

exports.routes = router;
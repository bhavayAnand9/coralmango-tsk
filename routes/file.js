const express = require('express');
const router = express.Router();
const fileController = require('../controllers/fileController');
const isAuth = require('../middlewares/is-auth');

router.post('/get-user-files', isAuth, fileController.getUserFiles);
router.post('/submit-file', isAuth, fileController.submitFile);
router.delete('/del-user-file', isAuth, fileController.delUserFile);
router.post('/get-url', isAuth, fileController.getUrl);

exports.routes = router;
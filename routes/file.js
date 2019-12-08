const express = require('express');
const router = express.Router();
const fileController = require('../controllers/fileController');
const isAuth = require('../middlewares/is-auth');

router.post('/get-user-files', isAuth, fileController.getUserFiles);
router.post('/get-user-file', isAuth, fileController.getFile);
router.post('/submit-file', isAuth, fileController.submitFile);
router.post('/del-user-file', isAuth, fileController.delUserFile);
router.post('/get-url', isAuth, fileController.getUrl);
router.get('/get-file/:short_id', fileController.getFileByShortURL);

exports.routes = router;

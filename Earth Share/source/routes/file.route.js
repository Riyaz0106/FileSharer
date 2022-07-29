const express = require("express");
const multer = require('multer');
const router = express.Router();
const fileController = require('../controllers/file.controller');
const UserAccountcontroller = require('../controllers/user.controller');
const AdminAccountcontroller = require('../controllers/admin.controller');

const upload = multer({
    storage: multer.memoryStorage(),
});

/************************************* USER CONTROLLER ***************************************/

router.get('/login', UserAccountcontroller.getLoginPage);

router.get('/dashboard', UserAccountcontroller.getDashboard);

router.post('/user/login', UserAccountcontroller.login);

router.post('/user/signup', UserAccountcontroller.signup);

router.post('/user/logout', UserAccountcontroller.logout);

/*********************************** FILE CONTROLLER *****************************************/

router.get('/upload/file', fileController.uploadFile);

router.get('/user/myfiles', fileController.getAllfilesUser);

router.delete('/delete/file/id=:id', fileController.deleteFile);

router.post('/upload/file', upload.single('uploadfile'), fileController.uploadFile);

router.get('/get/file/id=:id', fileController.getFiledetails);

router.get('/download/file/id=:id', fileController.downloadFile);

router.post('/block/file/id=:id', fileController.createPendingrequests);

/************************************ ADMIN CONTROLLER ****************************************/

router.get('/admin/pendingRequests', AdminAccountcontroller.getPendingrequests);

router.get('/admin/completedRequests', AdminAccountcontroller.getCompletedrequests);

router.put('/admin/requests/file/id=:id/state=:state', AdminAccountcontroller.processPendingrequests);

router.get('/admin/requests/details/id=:id', AdminAccountcontroller.viewRequestdetails);

module.exports = router;
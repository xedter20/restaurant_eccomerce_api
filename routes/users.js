const express = require('express');
const router = express.Router();
const usersController = require('../controller/users');

const multer = require('multer');
const fs = require('fs');
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const path = `public/uploads/user`;
    fs.mkdirSync(path, { recursive: true });
    return cb(null, path);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '_' + file.originalname);
  }
});

const upload = multer({ storage: storage });

router.get('/all-user', usersController.getAllUser);
router.post('/signle-user', usersController.getSingleUser);

router.post('/add-user', usersController.postAddUser);
router.post('/edit-user', upload.any(), usersController.postEditUser);
router.post('/delete-user', usersController.getDeleteUser);

router.post('/change-password', usersController.changePassword);

router.get('/all-user', usersController.getAllUser);

router.get('/', usersController.allUsers);

module.exports = router;

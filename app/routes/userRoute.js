const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const userAuthCheck = require('../middleware/userAuthCheck')

router.post('/register', userController.userRegister)
router.post('/login', userController.userLogin)

//user login page and register page


//comment & like on blog by user
router.post('/blog/like/:blogId', userAuthCheck, userController.toggleLikeBlog);
router.post('/blog/comment/:blogId', userAuthCheck, userController.addComment);


module.exports = router
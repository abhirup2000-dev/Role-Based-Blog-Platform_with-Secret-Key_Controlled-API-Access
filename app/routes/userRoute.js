const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const userAuthCheck = require('../middleware/userAuthCheck')

const rateLimit = require("../utils/rateLimiter");
const viewController = require('../controllers/viewController');

router.post('/register', userController.userRegister)
router.post('/login', rateLimit, userController.userLogin)
router.get('/logout', userController.userLogout)


//user login page and register page
router.get("/login-view", viewController.userLoginPage)
router.get("/register-view", viewController.userRegisterPage)

//protected view routes
router.get("/home", userAuthCheck, viewController.userHomePage)
router.get("/view-blog/:id", userAuthCheck, viewController.userFullBlogView)
router.get("/profile", userAuthCheck, viewController.userprofile)


//update password
router.post("/password-update", userAuthCheck, userController.userPasswordUpdate)

//comment & like on blog by user
router.post('/blog/like/:blogId', userAuthCheck, userController.toggleLikeBlog);
router.post('/blog/comment/:blogId', userAuthCheck, userController.addComment);


module.exports = router
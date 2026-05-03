const express = require('express');
const router = express.Router();

const rateLimit = require("../utils/rateLimiter")

const writerAuthCheck = require('../middleware/writerAuthCheck')
const upload = require("../utils/cloudinaryStorage")

const writerController = require('../controllers/writerController')

const viewController = require('../controllers/viewController')


router.post('/login', rateLimit, writerController.writerLogin)
router.get('/logout', writerController.writerLogout)


//view routes
router.get('/login-view', viewController.writerLoginPage)
router.get('/profile', writerAuthCheck, viewController.writerprofile)
router.get('/dashboard', writerAuthCheck, viewController.writerDashboardPage)
router.get('/blogs', writerAuthCheck, viewController.writerBlogsPage)
router.get('/view/fullblog/:blogId', writerAuthCheck, viewController.writerfullBlogView)

//update password
router.post('/password-update', writerAuthCheck, writerController.WriterPasswordUpdate)

//blog operations (CRUD) from one route endpoint
router.all('/blog', writerAuthCheck, upload.single("coverImage"), writerController.blogHandlers)
router.all('/blog/:blogId', writerAuthCheck, upload.single("coverImage"), writerController.blogHandlers)



module.exports = router
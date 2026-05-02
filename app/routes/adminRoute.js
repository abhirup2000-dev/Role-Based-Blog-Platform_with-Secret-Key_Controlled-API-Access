const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const viewController = require("../controllers/viewController")

const upload = require("../utils/cloudinaryStorage")

const rateLimit = require("../utils/rateLimiter")

const {adminAuthCheck, verifyAdminApiKey} = require('../middleware/adminAuthCheck')

router.post('/register', adminController.adminRegister)
router.post('/login', rateLimit, adminController.adminLogin)
router.get('/logout', adminController.adminLogout)



//view routes
router.get("/login-view", viewController.adminLoginView)
router.get("/register-view", viewController.adminRegisterView)
//protected view routes
router.get("/dashboard", adminAuthCheck, viewController.adminDashboardPage)
router.get("/dashboard/blogs", adminAuthCheck, viewController.adminBlogsPage)
router.get("/profile", adminAuthCheck, viewController.adminprofile)
router.get("/writers", adminAuthCheck, viewController.adminWritersPage);
router.get("/fullblog-view/:id", adminAuthCheck, viewController.fullBlogView);



//create writer(API)
router.post('/create-writer', adminAuthCheck, adminController.writerRegister) 
router.post("/writers/:id/toggle", adminAuthCheck, adminController.toggleWriterStatus)


//admin update password(API)
router.post('/password-update', adminAuthCheck, adminController.adminPasswordUpdate)

//blog approval by admin(API)
router.post("/blog/approval/:blogId", adminAuthCheck, verifyAdminApiKey, adminController.approveAndPublishBlog);
router.post("/blog/reject/:blogId", adminAuthCheck, verifyAdminApiKey, adminController.rejectBlog);



//blog operations(CRUD) from one endpoint/route(API)
router.all("/blog", adminAuthCheck, upload.single("coverImage"), adminController.blogOperations);
router.all("/blog/:id", adminAuthCheck, upload.single("coverImage"), adminController.blogOperations);

module.exports = router
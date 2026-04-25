const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

const {adminAuthCheck, verifyAdminApiKey} = require('../middleware/adminAuthCheck')

router.post('/register', adminController.adminRegister)
router.post('/login', adminController.adminLogin)
// router.post('/logout', adminController.adminLogout)

//create writer(API)
router.post('/create-writer', adminAuthCheck, adminController.writerRegister) 


//admin update password(API)
router.post('/password-update', adminAuthCheck, adminController.adminPasswordUpdate)

//blog approval by admin(API)
router.post("/blog/approval/:blogId", adminAuthCheck, verifyAdminApiKey, adminController.approveAndPublishBlog);
router.post("/blog/reject/:blogId", adminAuthCheck, verifyAdminApiKey, adminController.rejectBlog);

//blog operations(CRUD) from one endpoint/route(API)
router.all("/blog", adminAuthCheck, verifyAdminApiKey, adminController.blogOperations);
router.all("/blog/:id", adminAuthCheck, verifyAdminApiKey, adminController.blogOperations);

module.exports = router
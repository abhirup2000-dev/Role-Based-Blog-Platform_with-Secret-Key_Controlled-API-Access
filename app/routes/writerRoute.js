const express = require('express');
const router = express.Router();

const {writerAuthCheck, verifyWriterApiKey} = require('../middleware/writerAuthCheck')

const writerController = require('../controllers/writerController')

router.post('/login', writerController.writerLogin)

//writer loginpage && writer registerpage && writer dashboardpage && update password page



//blog operations(CRUD)(API)
router.get('/allblogs', writerAuthCheck, verifyWriterApiKey, writerController.getallBlogs) 
router.get('/blog', writerAuthCheck, verifyWriterApiKey, writerController.getMyBlogs) 
router.post('/create-blog', writerAuthCheck, verifyWriterApiKey, writerController.createBlog) 
router.put('/update-blog/:id', writerAuthCheck, verifyWriterApiKey, writerController.updateBlog) 
router.delete('/delete-blog/:id', writerAuthCheck, verifyWriterApiKey, writerController.deleteBlog) 


module.exports = router
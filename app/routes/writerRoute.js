const express = require('express');
const router = express.Router();

const {writerAuthCheck, verifyWriterApiKey} = require('../middleware/writerAuthCheck')

const writerController = require('../controllers/writerController')

router.post('/login', writerController.writerLogin)
// router.post('/logout', writerController.writerLogout)


//blog operations (CRUD) from one route endpoint
router.all('/blog', writerAuthCheck, verifyWriterApiKey, writerController.blogsHandler)
router.all('/blog/:blogId', writerAuthCheck, verifyWriterApiKey, writerController.blogsHandler)



module.exports = router
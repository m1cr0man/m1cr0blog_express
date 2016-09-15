const express = require('express');
const blog = require('../controllers/blog');
const users = require('../controllers/users');
const admin = require('../controllers/admin');
const uploads = require('../controllers/uploads');

const router = express.Router();
const adminRouter = express.Router();

// Admin authentication
router.use('/admin', adminRouter);
adminRouter.all('/login', users.login);
adminRouter.all('/logout', users.logout);
adminRouter.use('/', users.isLoggedIn);

// All links past this point require authentication
adminRouter.get('/', admin.index);

// User management
adminRouter.get('/users', users.index);
adminRouter.all('/users/add', users.add);
adminRouter.all('/users/:username', users.edit);
adminRouter.get('/users/:username/delete', users.delete);

// Blog management
adminRouter.get('/blog', blog.list);
adminRouter.all('/blog/add', blog.add);
adminRouter.all('/blog/:id', blog.edit);
adminRouter.get('/blog/:id/publish', blog.publish);
adminRouter.post('/blog/:id/upload', blog.upload);
adminRouter.get('/blog/:id/delete', blog.delete);
adminRouter.get('/blog/:id/deleteFile/:fileName', blog.deleteFile);

// Uploader
router.get('/uploads', (req, res) =>
	res.redirect('//m1cr0man.com'));
router.post('/uploads', uploads.upload);
router.get('/uploads/:args', uploads.view);
router.get('/uploads/:args/delete/:deleteID', uploads.delete);

// Main blog
router.get('/', blog.index);
router.get('/projects', blog.projects);
router.get('/:url', blog.view);

module.exports = router;

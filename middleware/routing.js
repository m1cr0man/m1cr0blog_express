const express = require('express');
const blog = require('../controllers/blog');
const users = require('../controllers/users');
const admin = require('../controllers/admin');

const router = express.Router();
const adminRouter = express.Router();

// Main blog
router.get('/', blog.index);

// Admin authentication
router.use('/admin', adminRouter);
adminRouter.all('/login', users.login);
adminRouter.all('/logout', users.logout);
adminRouter.use('/', users.isLoggedIn);

// All links past this point require authentication
adminRouter.get('/', admin.index);

// User management
adminRouter.get('/users/', users.index);
adminRouter.all('/users/add', users.add);
adminRouter.all('/users/:username', users.edit);
adminRouter.all('/users/:username/delete', users.delete);

// Blog management
adminRouter.get('/blog/', blog.list);
adminRouter.all('/blog/add', blog.add);
adminRouter.all('/blog/:url', blog.edit);

module.exports = router;

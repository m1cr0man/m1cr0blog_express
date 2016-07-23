const express = require('express');

const router = express.Router();

const blogs = require('../controllers/blogs');
router.get('/', blogs.index);

module.exports = router;

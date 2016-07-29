const postModel = require('../models/post');

const VIEW_DIR = 'blog/';

module.exports = {
	index: (req, res, next) =>
		res.render(VIEW_DIR + 'index'),

	list: (req, res, next) =>
		res.render(VIEW_DIR + 'list', {data: postModel.getAll()}),

	add: (req, res, next) => {
		var errorcb = error => res.status(400).render(VIEW_DIR + 'edit', {error: error, data: req.body});

		if (req.method != 'POST') return res.render(VIEW_DIR + 'edit');

		if (postModel.exists(req.body.url)) return errorcb('URL already in use');

		postModel.create(req.body);

		return res.redirect('.');
	},

	edit: (req, res, next) => {
		var errorcb = error => res.status(400).render('error', {message: error, error: req.body});

		if (!postModel.exists(req.params.url)) return errorcb('URL doesn\'t exist');

		var data = postModel.get(req.params.url);

		if (req.method != 'POST') return res.render(VIEW_DIR + 'edit', {data: data});

		postModel.update(req.body, req.params.url);

		return res.redirect('.');
	}
};

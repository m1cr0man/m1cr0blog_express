const postModel = require('../models/post');

const VIEW_DIR = 'blog/';

module.exports = {
	index: (req, res) =>
		res.render(VIEW_DIR + 'index', {data: postModel.getLatest()}),

	view: (req, res, next) => {
		var data = postModel.find(req.params.url);
		if (!data) return next();
		return res.render(VIEW_DIR + 'index', {data: data});
	},

	list: (req, res) =>
		res.render(VIEW_DIR + 'list', {data: postModel.getAll()}),

	add: (req, res) =>
		res.redirect(postModel.create() + '/'),

	edit: (req, res, next) => {
		if (!postModel.exists(req.params.id)) return next(Error('Post doesn\'t exist'));

		if (req.method != 'POST') {

			// Combine tags back into raw csv
			var data = postModel.get(req.params.id);
			if (data.tags) data.tags = data.tags.join(',');
			return res.render(VIEW_DIR + 'edit', {data: data});
		}

		postModel.update(req.params.id, req.body);

		return res.redirect('.?action=updated');
	},

	publish: (req, res) => {
		postModel.publish(req.params.id);
		return res.redirect('../');
	},

	upload: (req, res) => {
		if (!req.files.file) return res.status(400).send('No file');

		return postModel.addFile(req.params.id, req.files.file, err => {
			if (err) return res.status(400).send(err);

			return res.status(200).send('ok');
		});
	},

	deleteFile: (req, res) => {
		postModel.removeFile(req.params.id, req.params.fileName);
		return res.status(200).send('ok');
	}
};

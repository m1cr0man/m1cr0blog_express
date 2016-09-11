const marked = require('marked');
const postModel = require('../models/post');

const VIEW_DIR = 'blog/';

module.exports = {
	index: (req, res) => {
		var data = postModel.getLatest();
		data.body = marked(data.markdown);
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

		var result = postModel.addFile(req.params.id, req.files.file);

		if (typeof result == 'string') return res.status(400).send(result);

		return res.status(200).send('ok');
	},

	deleteFile: (req, res) => {
		postModel.removeFile(req.params.id, req.params.fileName);
		return res.status(200).send('ok');
	}
};

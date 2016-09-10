const postModel = require('../models/post');

const VIEW_DIR = 'blog/';

module.exports = {
	index: (req, res) =>
		res.render(VIEW_DIR + 'index'),

	list: (req, res) =>
		res.render(VIEW_DIR + 'list', {data: postModel.getAll()}),

	add: (req, res) =>
		res.redirect(postModel.create() + '/'),

	publish: (req, res) => {
		postModel.publish(req.params.id);
		return res.redirect('../');
	},

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
	}
};

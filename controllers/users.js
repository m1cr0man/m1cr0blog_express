const userModel = require('../models/user');
const cookies = require('../middleware/fs-cookie');

module.exports = {
	isLoggedIn: (req, res, next) => {
		if (req.cookieData) return next();
		return res.redirect('/admin/login');
	},

	login: (req, res, next) => {
		if (req.method != 'POST') return res.render('users/login');

		if (!userModel.verify(req.body)) return res.status(400).render('users/login', {error: 'Invalid input data'});

		return userModel.checkLogin(req.body, result => {
			if (result !== true) return res.status(400).render('users/login', {error: result});

			// Create the cookie
			cookies.create(req, res, req.body.username);
			return res.redirect('/admin');
		});
	},

	logout: (req, res, next) => {
		cookies.delete(req);
		return res.redirect('/');
	},

	index: (req, res, next) =>
		res.render('users/index', {data: userModel.getAll()}),

	add: (req, res, next) => {
		if (req.method != 'POST') return res.render('users/edit');

		if (!userModel.verify(req.body)) return res.status(400).render('users/edit', {error: 'Invalid input data', data: req.body});
		if (req.body.password.length < 4) return res.status(400).render('users/edit', {error: 'Password too short', data: req.body});

		userModel.add(req.body);

		return res.redirect('.?action=added');
	},

	edit: (req, res, next) => {
		if (req.method != 'POST') {
			var data = userModel.get(req.params.username);
			data.username = req.params.username;
			return res.render('users/edit', {data: data});
		}

		if (!userModel.verify(req.body)) return res.status(400).render('users/edit', {error: 'Invalid input data', data: req.body});

		userModel.update(req.params.username, req.body);

		return res.redirect('.?action=updated');
	},

	delete: (req, res, next) => {
		userModel.delete(req.params.username);
		return res.redirect('..?action=deleted');
	}
};

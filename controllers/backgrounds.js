const backgroundModel = require('../models/background');
const userModel = require('../models/user');

module.exports = {
	checkUser: (req, res, next) => {
		// Find the user
		var user = userModel.checkToken(req.query.token);

		if (typeof user == 'string') return res.status(400).send(user);

		res.locals.user = user;
		return next();
	},

	get: (req, res) => {
		var file = backgroundModel.get(res.locals.user.userID);
		if (!file) return res.status(404).send('No backgrounds available');

		return res.status(200).sendFile(file);
	},

	forceChange: (req, res, next) => {
		var file = backgroundModel.forceChange(res.locals.user.userID);
		if (!file) return res.status(404).send('No backgrounds available');

		return res.status(200).sendFile(file);
	},
};

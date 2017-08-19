const backgroundModel = require('../models/background');
const userModel = require('../models/user');

module.exports = {
	get: (req, res) => {
		// Find the user
		var user = userModel.checkToken(req.query.token);

		if (typeof user == 'string') return res.status(400).send(user);

		var file = backgroundModel.get(user.userID);
		if (!file) return res.status(404).send('No backgrounds available');

		return res.status(200).sendFile(file);
	},

	forceChange: (req, res, next) => {
		// Find the user
		var user = userModel.checkToken(req.query.token);

		if (typeof user == 'string') return res.status(400).send(user);

		var file = backgroundModel.forceChange(user.userID);
		if (!file) return res.status(404).send('No backgrounds available');

		return res.status(200).sendFile(file);
	},
};

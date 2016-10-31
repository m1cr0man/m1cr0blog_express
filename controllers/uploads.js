const uploadModel = require('../models/upload');
const userModel = require('../models/user');

const VIEW_DIR = 'uploads/';

module.exports = {
	upload: (req, res) => {

		// Check the uploaded file
		if (!req.files.file) return res.status(400).send('No file uploaded');

		// Find the user
		var user = userModel.checkToken(req.body.token);

		if (typeof user == 'string') return res.status(400).send(user);

		// Upload the file
		var file = uploadModel.add(user.userID, req.files.file);

		return res.status(200).send(user.userID + file.id + ' ' + file.deleteID);
	},

	view: (req, res, next) => {
		if (typeof req.params.args != 'string') return res.status(400).send('Invalid arguments');
		if (req.params.args.length != 4) return res.status(400).send('Invalid arguments');

		// Break up the URL
		var userID = req.params.args[0];
		var id = req.params.args.substr(1);

		var data = uploadModel.get(userID, id);

		// 404
		if (!data) return next();

		data.userID = userID;
		data.id = id;
		data.path = '/uploads/' + userID + '/' + data.filename;

		return res.render(VIEW_DIR + 'view', {data: data});
	},

	delete: (req, res) => {
		if (typeof req.params.args != 'string') return res.status(400).send('Invalid arguments');
		if (req.params.args.length != 4) return res.status(400).send('Invalid arguments');

		// Break up the URL
		var userID = req.params.args[0];
		var id = req.params.args.substr(1);

		var result = uploadModel.delete(userID, id, req.params.deleteID);

		// 500 if it didn't delete
		if (result) return res.status(400).send(result);

		return res.status(200).send('File deleted');
	}
}

const fs = require('fs');
const crypto = require('crypto');
const bcrypt = require('bcrypt-nodejs');

const USER_STORAGE_DIR = 'private/users/';

if (!fs.existsSync(USER_STORAGE_DIR)) fs.mkdirSync(USER_STORAGE_DIR);

const read = username =>
	JSON.parse(fs.readFileSync(USER_STORAGE_DIR + username, 'utf8'));

const write = (username, data) =>
	fs.writeFileSync(USER_STORAGE_DIR + username, JSON.stringify(data), 'utf8');

module.exports = {
	checkLogin: (data, cb) => {
		var user_path = USER_STORAGE_DIR + data.username;
		if (!data.username || !fs.existsSync(user_path)) return cb('Invalid username');

		var userdata = read(data.username);

		return bcrypt.compare(data.password, userdata.password, (err, valid) => {
			if (err || !valid) return cb(err || 'Invalid password');
			return cb(true);
		});
	},

	verify: data => {
		var username_verified = typeof data.username == 'string' && data.username.match(new RegExp(/^[\da-zA-Z]{3,}$/i));
		var password_verified = !data.password || typeof data.password == 'string' && data.password.match(new RegExp(/^.{4,}$|/i));
		return username_verified && password_verified;
	},

	add: data => {
		var userdata = {
			password: bcrypt.hashSync(data.password),
			token: crypto.randomBytes(20).toString('hex')
		}
		write(data.username, userdata);
		return userdata;
	},

	update: (username, data) => {
		var userdata = read(username);

		if (username != data.username) fs.unlinkSync(USER_STORAGE_DIR + username);
		if (data.password) userdata.password = bcrypt.hashSync(data.password);

		write(data.username, userdata);
	},

	getAll: _ => {
		var data = {};
		for (username of fs.readdirSync(USER_STORAGE_DIR, 'utf8')) {
			data[username] = read(username);
		}
		return data;
	},

	get: username =>
		read(username),

	exists: username =>
		fs.existsSync(USER_STORAGE_DIR + user_path),

	delete: username =>
		fs.unlinkSync(USER_STORAGE_DIR + username)
};

const fs = require('fs');
const crypto = require('crypto');

const COOKIE_STORAGE_DIR = 'private/cookies/';
const EXPIRY_MS = 3600000;

if (!fs.existsSync(COOKIE_STORAGE_DIR)) fs.mkdirSync(COOKIE_STORAGE_DIR);

// Delete cookies from last run
for (cookie of fs.readdirSync(COOKIE_STORAGE_DIR, 'utf8')) fs.unlinkSync(COOKIE_STORAGE_DIR + cookie);

module.exports = {
	exists: req =>
		req.signedCookies.token &&
		fs.existsSync(COOKIE_STORAGE_DIR + req.signedCookies.token),

	create: (req, res, data) => {
		var hash = crypto.randomBytes(20).toString('hex');
		fs.writeFileSync(COOKIE_STORAGE_DIR + hash, data || '', 'utf8');
		res.cookie('token', hash, {maxAge: EXPIRY_MS, path: '/admin', signed: true});
		req.cookieData = data;
		return hash;
	},

	delete: req => {
		var client_hash = req.cookieData;
		delete req.cookieData;
		return fs.existsSync(COOKIE_STORAGE_DIR + client_hash) &&
		  fs.unlinkSync(COOKIE_STORAGE_DIR + client_hash);
	},

	load: (req, res, next) => {
		if (req.signedCookies.token && fs.existsSync(COOKIE_STORAGE_DIR + req.signedCookies.token)) {
			req.cookieData = fs.readFileSync(COOKIE_STORAGE_DIR + req.signedCookies.token, 'utf8');
		}
		return next();
	}
};

const mime = require('mime-types');
const path = require('path');
const fs = require('fs');

const j = path.join;

const STORAGE_DIR = 'public/uploads/';
const META_STORAGE_DIR = 'private/uploads/';
const RETAIN_LENGTH = 1000 * 60 * 60 * 24 * 7; // Milliseconds

if (!fs.existsSync(STORAGE_DIR)) fs.mkdirSync(STORAGE_DIR);
if (!fs.existsSync(META_STORAGE_DIR)) fs.mkdirSync(META_STORAGE_DIR);

const protectedRead = path => fs.existsSync(path) && fs.readFileSync(path, 'utf8') || '';

const readMeta = (userID, id) => {
	var data = JSON.parse(protectedRead(j(META_STORAGE_DIR, userID, id))) || {};

	// Add ID to object
	data.id = id;

	return data;
}

const writeMeta = (userID, id, data) => {

	// Strip ID from object
	if (data.id) delete data.id;

	// Make user's meta directory
	var dir = j(META_STORAGE_DIR, userID);
	if (!fs.existsSync(dir)) fs.mkdirSync(dir);

	return fs.writeFileSync(j(dir, id), JSON.stringify(data), 'utf8');
}

// From StackOverflow
const formatSize = (bytes) => {
   if (bytes == 0) return '0 Bytes';
   var k = 1000;
   var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
   var i = Math.floor(Math.log(bytes) / Math.log(k));
   return parseFloat((bytes / Math.pow(k, i)).toFixed(3)) + ' ' + sizes[i];
}

module.exports = {
	get: (userID, id) => {
		if (!fs.existsSync(j(META_STORAGE_DIR, userID, id))) return;

		var data = readMeta(userID, id);

		if (!data.filename) return;

		// Read file info
		var stats = fs.statSync(j(STORAGE_DIR, userID, data.filename));
		data.date = stats.mtime;
		data.size = formatSize(stats.size);

		data.mimeType = mime.lookup(data.filename) || 'Unknown/';
		data.type = data.mimeType.match(/^[^\/]+/g);

		// Increment & save view count
		data.views += 1;
		writeMeta(userID, id, data);

		return data;
	},

	add: (userID, file) => {

		// Create user's folders
		if (!fs.existsSync(STORAGE_DIR + userID)) fs.mkdirSync(STORAGE_DIR + userID);
		if (!fs.existsSync(META_STORAGE_DIR + userID)) fs.mkdirSync(META_STORAGE_DIR + userID);

		// Delete old files
		var all_ids = fs.readdirSync(META_STORAGE_DIR + userID);
		var curdate = new Date();
		for (id of all_ids) {
			var upload_date = fs.statSync(j(META_STORAGE_DIR, userID, id)).mtime;

			// Has the file expired?
			if (curdate - upload_date >= RETAIN_LENGTH) {
				var data = readMeta(userID, id);
				if (fs.existsSync(j(STORAGE_DIR, userID, data.filename)))
					fs.unlinkSync(j(STORAGE_DIR, userID, data.filename));
				fs.unlinkSync(j(META_STORAGE_DIR, userID, id));
			}
		}

		// Generate unique id
		var id = '';
		do {
			id = Math.random().toString(36).slice(-3);
		} while (all_ids.indexOf(id) + 1);

		// Rename file if one already exists
		var new_name = file.filename;
		var num = 1;
		while (fs.existsSync(j(STORAGE_DIR, userID, new_name))) {
			new_name = file.filename.replace(/^.+?(?=\.[^\.]*$|$)/g, '$&_' + num);
			num += 1;
		}

		// Save the file
		fs.renameSync(file.file, j(STORAGE_DIR, userID, new_name));

		var new_meta = {
			filename: new_name,
			deleteID: Math.random().toString(36).slice(2),
			views: 0
		};

		writeMeta(userID, id, new_meta);

		new_meta.id = id;

		return new_meta;
	},

	delete: (userID, id, deleteID) => {
		var data = readMeta(userID, id);

		// Check the file exists
		if (!data.filename) return 'Invalid id';

		// Check the deleteID
		if (data.deleteID != deleteID) return 'Invalid deleteID';

		// Delete the file
		fs.unlinkSync(j(STORAGE_DIR, userID, data.filename));

		// Delete the metadata
		fs.unlinkSync(j(META_STORAGE_DIR, userID, id));
	}
}

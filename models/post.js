const marked = require('marked');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');

const j = path.join;

// Meta data:
// - url -> string
// - title -> string
// - image -> string
// - tags -> string[]
// - draft -> boolean
// - published -> Object Date or null if unpublished

const POST_STORAGE_DIR = 'private/posts/';
const FILE_STORAGE_DIR = 'public/posts/';
const META_FILE = POST_STORAGE_DIR + 'index.json';

// Initialise folders + meta file
if (!fs.existsSync(POST_STORAGE_DIR)) fs.mkdirSync(POST_STORAGE_DIR);
if (!fs.existsSync(FILE_STORAGE_DIR)) fs.mkdirSync(FILE_STORAGE_DIR);
if (!fs.existsSync(META_FILE)) fs.writeFileSync(META_FILE, JSON.stringify({}), 'utf8');

var protectedRead = path => fs.existsSync(path) && fs.readFileSync(path, 'utf8') || '';

var readMeta = _ => JSON.parse(protectedRead(META_FILE)) || {};

var writeMeta = meta => fs.writeFileSync(META_FILE, JSON.stringify(meta), 'utf8');

var readMarkdown = id => protectedRead(POST_STORAGE_DIR + id);

var writeMarkdown = (id, markdown) => fs.writeFileSync(POST_STORAGE_DIR + id, markdown, 'utf8');

module.exports = {
	getAll: _ =>
		readMeta(),

	get: id => {
		var data = readMeta()[id] || {};
		data.markdown = readMarkdown(id);
		data.id = id;
		data.files = [];
		if (fs.existsSync(FILE_STORAGE_DIR + id)) data.files = fs.readdirSync(FILE_STORAGE_DIR + id);
		return data;
	},

	exists: id => {
		var all_meta = readMeta();
		return !!all_meta[id];
	},

	create: _ => {
		var all_meta = readMeta();

		var new_id = null;
		do {
			new_id = crypto.randomBytes(4).toString('hex');
		} while (all_meta[new_id]);

		all_meta[new_id] = {
			draft: true
		}

		writeMeta(all_meta);
		writeMarkdown(new_id, '');

		return new_id;
	},

	update: (id, input) => {
		var all_meta = readMeta();

		// If this is a new post, there won't be any meta data
		if (!all_meta[id]) all_meta[id] = {}

		// Update metadata
		if (input.tags) all_meta[id].tags = input.tags.split(',');
		if (input.title) all_meta[id].url = input.url;
		if (input.title) all_meta[id].title = input.title;
		if (input.image) all_meta[id].image = input.image;
		writeMeta(all_meta);

		// Update markdown
		writeMarkdown(id, input.markdown);
	},

	addFile: (id, file) => {
		if (!file) return 'No file';

		if (fs.existsSync(j(FILE_STORAGE_DIR, id, file.filename))) {
			return 'File exists';
		}

		if (!fs.existsSync(j(FILE_STORAGE_DIR, id))) {
			fs.mkdirSync(j(FILE_STORAGE_DIR, id));
		}

		return fs.renameSync(file.file, j(FILE_STORAGE_DIR, id, file.filename));
	},

	removeFile: (id, fileName) => {
		var path = j(FILE_STORAGE_DIR, id, fileName);
		if (fs.existsSync(path)) return fs.unlinkSync(path);
		return false;
	},

	publish: id => {
		var all_meta = readMeta();

		all_meta[id].draft = false;
		all_meta[id].published = new Date();

		writeMeta(all_meta);
	}
};

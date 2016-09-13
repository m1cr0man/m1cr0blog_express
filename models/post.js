const marked = require('marked');
const crypto = require('crypto');
const lwip = require('lwip');
const path = require('path');
const lo = require('lodash');
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
const IMAGE_TYPES = [
	'png',
	'jpg',
	'jpeg',
	'gif'
]

// Initialise folders + meta file
if (!fs.existsSync(POST_STORAGE_DIR)) fs.mkdirSync(POST_STORAGE_DIR);
if (!fs.existsSync(FILE_STORAGE_DIR)) fs.mkdirSync(FILE_STORAGE_DIR);
if (!fs.existsSync(META_FILE)) fs.writeFileSync(META_FILE, JSON.stringify({}), 'utf8');

var protectedRead = path => fs.existsSync(path) && fs.readFileSync(path, 'utf8') || '';

var writeMarkdown = (id, markdown) => fs.writeFileSync(POST_STORAGE_DIR + id, markdown, 'utf8');

var readMarkdown = id => protectedRead(POST_STORAGE_DIR + id);

var readFiles = id => {
	if (!fs.existsSync(FILE_STORAGE_DIR + id)) return [];
	var data = fs.readdirSync(FILE_STORAGE_DIR + id);
	lo.remove(data, val => val == 'h256' || val == 'h384');
	return data;
}

var writeMeta = meta => fs.writeFileSync(META_FILE, JSON.stringify(meta), 'utf8');

var readMeta = _ => {
	var data = JSON.parse(protectedRead(META_FILE)) || {};

	// Add IDs to objects
	for (id in data) data[id].id = id;

	return data;
}

module.exports = {
	getAll: _ =>
		readMeta(),

	getLatest: _ => {
		var all_meta = readMeta();

		// Sort by date
		var sorted_meta = lo.sortBy(lo.filter(all_meta, val => !val.draft), val => val.date);
		var latest_post = sorted_meta[0];

		latest_post.next_posts = sorted_meta.slice(1, 4);
		latest_post.markdown = marked(readMarkdown(latest_post.id));
		latest_post.files = readFiles(latest_post.id);

		return latest_post;
	},

	get: id => {
		var all_meta = readMeta();

		var data = all_meta[id];
		data.markdown = readMarkdown(id);
		data.files = readFiles(id);

		return data;
	},

	find: url => {
		var all_meta = readMeta();

		// 404
		var all_meta_url = lo.keyBy(all_meta, val => val.url);
		if (!url || !all_meta_url[url]) return false;

		var data = all_meta_url[url];
		data.markdown = marked(readMarkdown(data.id));

		// Get a list of "next" articles
		var sorted_meta = lo.sortBy(lo.filter(all_meta, val => !val.draft), val => val.date);
		var article_index = sorted_meta.indexOf(data);
		data.next_posts = [];

		// One newer, if any
		if (article_index > 0) data.next_posts.push(sorted_meta[0]);

		// One earlier, if any
		if (article_index < sorted_meta.length - 1) data.next_posts.push(sorted_meta[sorted_meta.length - 1]);

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
		if (input.url) all_meta[id].url = input.url;
		if (input.title) all_meta[id].title = input.title;
		if (input.image) all_meta[id].image = input.image;
		writeMeta(all_meta);

		// Update markdown
		writeMarkdown(id, input.markdown);
	},

	addFile: (id, file, cb) => {
		if (!file) return cb('No file');

		if (fs.existsSync(j(FILE_STORAGE_DIR, id, file.filename))) {
			return cb('File exists');
		}

		if (!fs.existsSync(j(FILE_STORAGE_DIR, id))) {
			fs.mkdirSync(j(FILE_STORAGE_DIR, id));
		}

		// Move the file to the right place
		var path = j(FILE_STORAGE_DIR, id, file.filename);
		fs.renameSync(file.file, path);

		// Create thumbnails if necessary
		if (!(IMAGE_TYPES.indexOf(file.filename.toLowerCase().match(/[^\.]+$/g)[0]) + 1)) return cb();

		var path_256 = j(FILE_STORAGE_DIR, id, 'h256');
		var path_384 = j(FILE_STORAGE_DIR, id, 'h384')
		if (!fs.existsSync(path_256)) fs.mkdirSync(path_256);
		if (!fs.existsSync(path_384)) fs.mkdirSync(path_384);

		return lwip.open(path, (err, image) => {
			if (err) return cb(err);

			var ratio_384 = 384 / image.height();
			image.batch()
				.scale(ratio_384)
				.writeFile(j(path_384, file.filename), err => {
					if (err) return cb(err);

					var ratio_256 = 256 / image.height();
					return image.batch()
						.scale(ratio_256)
						.writeFile(j(path_256, file.filename), err => {
							if (err) return cb(err);

							return cb();
						});
				});
		});
	},

	removeFile: (id, fileName) => {
		var root_path = j(FILE_STORAGE_DIR, id);
		var path = j(root_path, fileName);
		var path_256 = j(root_path, 'h256', fileName);
		var path_384 = j(root_path, 'h384', fileName);
		if (fs.existsSync(path)) fs.unlinkSync(path);

		// Remove thumbnails
		if (fs.existsSync(path_256)) fs.unlinkSync(path_256);
		if (fs.existsSync(path_384)) fs.unlinkSync(path_384);
		return false;
	},

	publish: id => {
		var all_meta = readMeta();

		all_meta[id].draft = false;
		all_meta[id].published = new Date();

		writeMeta(all_meta);
	}
};

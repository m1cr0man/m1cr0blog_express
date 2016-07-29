const marked = require('marked');
const fs = require('fs');

// Meta data:
// - tags -> string[]
// - date -> Object Date
// - title -> string
// - image -> string

const POST_STORAGE_DIR = 'private/posts/';
const IMAGE_STORAGE_DIR = 'public/images/';
const META_FILE = POST_STORAGE_DIR + 'index.json';

// Initialise folders + meta file
if (!fs.existsSync(POST_STORAGE_DIR)) fs.mkdirSync(POST_STORAGE_DIR);
if (!fs.existsSync(IMAGE_STORAGE_DIR)) fs.mkdirSync(IMAGE_STORAGE_DIR);
if (!fs.existsSync(META_FILE)) fs.writeFileSync(META_FILE, JSON.stringify({}), 'utf8');

var readMeta = _ => JSON.parse(fs.readFileSync(META_FILE, 'utf8')) || {};

var writeMeta = meta => fs.writeFileSync(META_FILE, JSON.stringify(meta), 'utf8');

var readMarkdown = url => fs.readFileSync(POST_STORAGE_DIR + url, 'utf8');

var writeMarkdown = (url, markdown) => fs.writeFileSync(POST_STORAGE_DIR + url, markdown, 'utf8');

module.exports = {
	exists: url =>
		fs.existsSync(POST_STORAGE_DIR + url),

	getAll: _ =>
		readMeta(),

	get: url => {
		var data = readMeta()[url];
		data.markdown = readMarkdown(url);
		data.url = url;
		return data;
	},

	create: (input) => {

		// Add Metadata
		// TODO this doesnt work
		var all_meta = readMeta();
		all_meta[input.url] = {
			tags: input.tags,
			date: new Date(),
			title: input.title,
			image: input.image
		}
		writeMeta(all_meta);

		// Save markdown
		writeMarkdown(input.url, input.markdown);
	},

	update: (input, old_url) => {
		var all_meta = readMeta();
		var url = input.url;

		// Delete old data
		if (old_url != url) {
			fs.unlinkSync(POST_STORAGE_DIR + old_url);
			delete all_meta[old_url];
			all_meta[url] = {};
		}

		// Update metadata
		if (input.tags) all_meta[url].tags = input.tags;
		if (input.date) all_meta[url].date = input.date;
		if (input.title) all_meta[url].title = input.title;
		if (input.image) all_meta[url].image = input.image;
		writeMeta(all_meta);

		// Update markdown
		writeMarkdown(url, input.markdown);
	}
};

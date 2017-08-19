const path = require('path');
const fs = require('fs');

const j = path.join;

const STORAGE_DIR = 'public/backgrounds/';
const META_FILE = 'private/seen_backgrounds.json';
const EXPIRY = 1000 * 60 * 60 * 12; // Milliseconds

/* Structure:
 *	{
 *		userid: [
 *			{
 *				path: 'string',
 *				date: miliseconds
 *			},
 *			{
 *				path: 'string',
 *				date: miliseconds
 *			},
 *			...
 *		] // chronologically ordered
 *	}
 */
var seenBgs = {};

/* Structure:
 *	{
 *		userid: [
 *			'path',
 *			'path',
 *			...
 *		]
 *	}
 */
const availableBgs = {};

// Cache seen background lists
if (fs.existsSync(META_FILE)) {
	seenBgs = JSON.parse(fs.readFileSync(META_FILE, 'utf8')) || {};
}

// Cache the available backgrounds
if (!fs.existsSync(STORAGE_DIR)) fs.mkdirSync(STORAGE_DIR);
for (userID of fs.readdirSync(STORAGE_DIR)) {
	availableBgs[userID] = [];
	var userPath = j(STORAGE_DIR, userID);
	for (gallery of fs.readdirSync(userPath)) {
		for (image of fs.readdirSync(j(userPath, gallery))) {
			availableBgs[userID].push(j(gallery, image));
		}
	}
}

const getPath = (userID, img) =>
	path.resolve(STORAGE_DIR, userID, img)

const getSeenBgs = (userID) => {
	if (!seenBgs[userID]) {
		seenBgs[userID] = [];
	}
	return seenBgs[userID];
};

const writeSeenBgs = () => {
	fs.writeFileSync(META_FILE, JSON.stringify(seenBgs), 'utf8');
};

const pickRandomBackground = (userID) => {
	const len = availableBgs[userID].length;
	const randIndex = Math.floor(Math.random() * len);
	return availableBgs[userID][randIndex];
}

const getBackground = (userID, date, expiry) => {
	if (!availableBgs[userID]) return '';

	var seen = getSeenBgs(userID);
	const seenBgsIndexed = {};

	for (var i = seen.length - 1; i >= 0; i--) {
		var bg = seen[i];

		// Two conditions to make sure background is dated within a certain frame
		// Allows us to cache the next backgrounds and mark them as seen
		if (bg.date < date && bg.date + expiry > date) {
			return getPath(userID, bg.path);
		}
		seenBgsIndexed[bg.path] = true;
	}

	// Get a new background
	var newBg;
	var maxLoops = availableBgs[userID];
	do {
		newBg = pickRandomBackground(userID);
		maxLoops--;
	} while (seenBgsIndexed[newBg] && maxLoops > 0);

	// Seen all the backgrounds? Reset
	// No need to select a new one that will be done
	if (!maxLoops) {
		seen = [];
		seenBgs[userID] = seen;
	}

	// Mark it as seen and save
	seen.push({
		path: newBg,
		date: date
	});
	writeSeenBgs();

	return getPath(userID, newBg);
}

module.exports = {
	get: (userID) => {
		return getBackground(userID, Date.now(), EXPIRY);
	},

	getNext: (userID) => {
		return getBackground(userID, Date.now() + EXPIRY, EXPIRY);
	},

	forceChange: (userID) => {
		return getBackground(userID, Date.now(), 0);
	}
};

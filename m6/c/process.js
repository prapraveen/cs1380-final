const fs = require('fs');
const path = require('path');

let stopwords;

function processText(text, stopwordsPath) {
	if (!stopwords) {
		stopwords = new Set(
			fs.readFileSync(stopwordsPath, 'utf-8').split('\n').map(w => w.trim()).filter(Boolean)
		);
	}

  return text
    .replace(/[^\x00-\x7F]/g, '')
    .toLowerCase()
    .split(/[^a-z]+/)
    .filter(w => w.length > 0 && !stopwords.has(w));
}

function filterStopWords(terms, stopwordsPath) {
	if (!stopwords) {
		stopwords = new Set(
			fs.readFileSync(stopwordsPath, 'utf-8').split('\n').map(w => w.trim()).filter(Boolean)
		);
	}
    
    return terms.filter(w => w.length > 0 && !stopwords.has(w))
}

module.exports = { processText, filterStopWords };

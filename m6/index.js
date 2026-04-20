const fs = require('fs');
const path = require('path');
const distribution = require('../distribution.js')({ ip: '127.0.0.1', port: 1234 });
require('../test/helpers/sync-guard');
const { performance } = require('node:perf_hooks');

const id = distribution.util.id;

const n1 = { ip: '127.0.0.1', port: 8000 };
const n2 = { ip: '127.0.0.1', port: 8001 };
const n3 = { ip: '127.0.0.1', port: 8002 };

const groupA = {};
groupA[id.getSID(n1)] = n1;
groupA[id.getSID(n2)] = n2;
groupA[id.getSID(n3)] = n3;



distribution.local.groups.put({ gid: 'page_content', hash: id.naiveHash }, groupA, (e, v) => {
	distribution.page_content.groups.put({ gid: 'page_content', hash: id.naiveHash }, groupA, (e, v) => {

		distribution.page_content.store.get(null, (e, keys) => {
			if (e) { console.error(e); process.exit(1); }
			const totalDocs = keys.length;
			console.log(`Indexing ${totalDocs} pages...`);

			const mapper = (hashedURL, page, cb) => {
				const path = require('path');
				const m6 = path.join(process.cwd(), 'm6', 'c');
				const { getText } = require(path.join(m6, 'getText.js'));
				const { processText } = require(path.join(m6, 'process.js'));
				const { stemTerms } = require(path.join(m6, 'stem.js'));

				const { url, body } = page;

				console.log(`Processing ${url}`);

				const stopwords = path.join(process.cwd(), 'm6', 'd', 'stopwords.txt');
				const text = getText(body);
				const filtered = processText(text, stopwords);
				const terms = stemTerms(filtered);
					// .slice(0, 100);

				if (terms.length === 0) return cb([]);

				const counts = Object.create(null);
				const totalTerms = terms.length;
				for (const term of terms) {
					counts[term] = (counts[term] || 0) + (1 / totalTerms);
				}

				const res = Object.entries(counts).map(([term, tf]) => ({
					[term]: { [url]: tf },
				}));
				cb(res);
			};

			const reducer = eval(`(key, values) => {
				const idf = Math.log10(${totalDocs} / values.length);
				const result = {};
				for (const val of values) {
					const url = Object.keys(val)[0];
					const tf = Object.values(val)[0];
					result[url] = Math.round(tf * idf * 1000) / 1000;
				}
				return {[key]: result};
			}`);

			const start = performance.now();
			distribution.page_content.mr.exec({ keys, map: mapper, reduce: reducer }, (e, results) => {
				if (e) { console.error(e); process.exit(1); }

				const lines = results
					.map(obj => {
						const [term, docScores] = Object.entries(obj)[0];
						const sorted = Object.entries(docScores).sort((a, b) => b[1] - a[1]);
						return term + ' | ' + sorted.map(([url, score]) => `${url} ${score}`).join(' ');
					})
					.sort();

				const outPath = path.join(process.cwd(), 'm6', 'd', 'global-index.txt');
				fs.writeFileSync(outPath, lines.join('\n') + '\n');
				console.log(`Done in ${((performance.now() - start) / 1000).toFixed(1)}s — ${results.length} terms indexed.`);
			});
		});
	});
});

const fs = require('fs');
const path = require('path');
const distribution = require('../distribution.js')({ ip: '127.0.0.1', port: 1234 });
require('../test/helpers/sync-guard');
const { performance } = require('node:perf_hooks');

const id = distribution.util.id;

const n1 = { ip: '54.89.198.234', port: 8080 };
const n2 = { ip: '107.20.45.31', port: 8080 };
const n3 = { ip: '52.91.67.55', port: 8080 };

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

				const stopwords = path.join(process.cwd(), 'm6', 'd', 'stopwords.txt');
				const text = getText(body);
				const filtered = processText(text, stopwords);
				const terms = stemTerms(filtered).slice(0, 150);

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
				if (!Array.isArray(values) || values.length === 0) return null;
				const idf = Math.log10(${totalDocs} / values.length);
				const result = {};
				for (const val of values) {
					const url = Object.keys(val)[0];
					const tf = Object.values(val)[0];
					result[url] = Math.round(tf * idf * 1000) / 1000;
				}
				return { [key]: result };
			}`);

			const start = performance.now();

			distribution.page_content.mr.exec({ map: mapper, reduce: reducer }, (e, results) => {
				if (e) { console.error(e); process.exit(1); }

				const lines = results
					.filter(Boolean)
					.map(obj => {
						const [term, docScores] = Object.entries(obj)[0];
						const sorted = Object.entries(docScores).sort((a, b) => b[1] - a[1]);
						return term + ' | ' + sorted.map(([url, score]) => `${url} ${score}`).join(' ');
					})
					.sort();

				const outPath = path.join(process.cwd(), 'm6', 'd', 'global-index.txt');
				fs.writeFileSync(outPath, lines.join('\n') + '\n');

				const seconds = (performance.now() - start) / 1000;
				console.log(`latency: ${seconds.toFixed(2)} s`);
				console.log(`doc throughput: ${(totalDocs / seconds).toFixed(2)} docs/s`);
				console.log(`term throughput: ${(lines.length / seconds).toFixed(2)} terms/s`);
			});
		});
	});
});

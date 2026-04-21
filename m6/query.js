// #!/usr/bin/env node

/*
Search the inverted index for a particular (set of) terms.
Usage: ./query.js your search terms

The behavior of this JavaScript file should be similar to the following shell pipeline:
grep "$(echo "$@" | ./c/process.sh | ./c/stem.js | tr "\r\n" "  ")" d/global-index.txt

Here is one idea on how to develop it:
1. Read the command-line arguments using `process.argv`. A user can provide any string to search for.
2. Normalize, remove stopwords from and stem the query string — use already developed components
3. Search the global index using the processed query string.
4. Print the matching lines from the global index file.

Examples:
./query.js A     # Search for "A" in the global index. This should return all lines that contain "A" as part of an 1-gram, 2-gram, or 3-gram.
./query.js A B   # Search for "A B" in the global index. This should return all lines that contain "A B" as part of a 2-gram, or 3-gram.
./query.js A B C # Search for "A B C" in the global index. This should return all lines that contain "A B C" as part of a 3-gram.

Note: Since you will be removing stopwords from the search query, you will not find any matches for words in the stopwords list.

The simplest way to use existing components is to call them using execSync.
For example, `execSync(`echo "${input}" | ./c/process.sh`, {encoding: 'utf-8'});`
*/


const fs = require('fs');
const {execSync} = require('child_process');
const readline = require("readline");
const path = require('path');
// const path = require('path');

const indexFile = 'd/global-index.txt';
const indexData = fs.readFileSync(indexFile, 'utf-8');

function query(args) {
  // const query = args.join(' ');
  const query = args;
  // const processedQuery = execSync(`echo "${query}" | ./c/process.sh | ./c/stem.js`, {encoding: 'utf-8'}).trim();
  const m6 = path.join(process.cwd(), 'c');
  const { processText } = require(path.join(m6, 'process.js'));
  const { stemTerms } = require(path.join(m6, 'stem.js'));
  let processedQuery = processText(query, 'd/stopwords.txt');
  processedQuery = stemTerms(processedQuery);
  processedQuery = processedQuery.join(' ');
  const terms = processedQuery.split(/\s+/).filter((term) => term.length > 0);

  if (terms.length === 0) return;

  const indexLines = indexData.split('\n');

  const results = [];
  for (let line of indexLines) {
    line = decodeURI(line);
    const [term] = line.split('|').map((part) => part.trim());
    if (term.includes(processedQuery)) {
      results.push(line);
    }
    
  }

  console.log("");
  console.log("========SEARCH=RESULTS========");
  for (const result of results) {
    console.log(result);
  }
  console.log("");
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: "Search: "
});

rl.prompt();

rl.on("line", (line) => {
  const input = line.trim();
  query(input);

  rl.prompt();
});

rl.on("close", () => {
  process.exit(0);
});

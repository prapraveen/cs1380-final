const fs = require("fs");
const { disconnect } = require("node:cluster");
const distribution = require('../distribution.js')({ip: '127.0.0.1', port: 1234});
require('../test/helpers/sync-guard');
const { performance } = require('node:perf_hooks');


const id = distribution.util.id;

const n1 = {ip: '127.0.0.1', port: 8000};
const n2 = {ip: '127.0.0.1', port: 8001};
const n3 = {ip: '127.0.0.1', port: 8002};
const allNodes = [n1, n2, n3];

const groupA = {};
groupA[id.getSID(n1)] = n1;
// Add nodes n2 and n3 to the group...
groupA[id.getSID(n2)] = n2;
groupA[id.getSID(n3)] = n3;

// let seed_urls = ["apartments.com", "craigslist.org", "zillow.com", "airbnb.com"];
let seed_urls = ["https://airbnb.com"];
let seed_url_keys = seed_urls.map(encodeURIComponent);


distribution.local.groups.put({gid: "urls_queue", hash: id.naiveHash}, groupA, (e, v) => {
  if (e) console.log(e);
  if (v) console.log(v);

  distribution.local.groups.put({gid: "page_content", hash: id.naiveHash}, groupA, (e, v) => {
    if (e) console.log(e);
    if (v) console.log(v);

    distribution.urls_queue.groups.put({gid: "urls_queue", hash: id.naiveHash}, groupA, (e, v) => {
      distribution.page_content.groups.put({gid: "page_content", hash: id.naiveHash}, groupA, (e, v) => {

        const num_items = seed_urls.length;
        const insert_items = (count, callback) => {
          if (count == num_items) {
            return callback();
          }
          return distribution.urls_queue.store.put(seed_urls[count], seed_url_keys[count], () => insert_items(count + 1, callback));
        }

        insert_items(0, () => {
          const mapper = (encodedURL, url, cb) => {

            const curlHTML = (url, redirectCounter, cb) => {
              if (!url.endsWith('/')) {
                url += '/';
              }

              if (redirectCounter <= 0) {
                console.log("hit redirect limit");
                return cb("")
              }

              if (!url.startsWith("http://") && !url.startsWith("https://")) {
                url = "https://" + url;
              }

              let proto;
              proto = url.startsWith("https") ? distribution.https : distribution.http;

              proto.get(url, (res) => {
                if (res.statusCode >= 300 && res.statusCode <= 399) {
                  console.log("hit redirect...")
                  const redirectURL = res.headers["location"];
                  if (!redirectURL) {
                    console.log("no redirect url");
                    return cb("");
                  }
                  const new_url = new URL(redirectURL, url).href;
                  console.log("redirecting...");
                  return curlHTML(new_url, redirectCounter - 1, cb);
                }

                if (res.statusCode != 200) {
                  console.log("invalid status code:", res.statusCode);
                  return cb("");
                }

                if (!res.headers["content-type"]) {
                  console.log("no content type");
                  return cb("");
                }

                if (!res.headers["content-type"].includes("text/html")) {
                  console.log("not text");
                  return cb("");
                }

                let data = '';
                res.on('data', (chunk) => {
                  data += chunk;
                });

                res.on('end', () => {
                  cb(data);
                })

                res.on('error', (e) => {
                  console.log(e);
                  cb("");
                })
              })
            }

            curlHTML(url, 3, (data) => {
              distribution["page_content"].store.put(data, encodedURL, (e, v) => {
                if (e) console.log("line 67:", e);
                res = [];
                const dom = new distribution.JSDOM(data);
                const anchors = dom.window.document.querySelectorAll('a[href]');

                for (const anchor of anchors) {
                  const href = anchor.getAttribute('href');
                  if (href.startsWith("#")) continue;

                  let baseURL = url;
                  if (baseURL.endsWith('index.html')) {
                    baseURL = baseURL.slice(0, baseURL.length - 'index.html'.length);
                  } else if (!baseURL.endsWith('/')) {
                    baseURL += '/';
                  }

                  const new_url = new distribution.URL(href, baseURL).href;
                  // res.push( {[encodeURIComponent(new_url)]: 1} );
                  res.push(new_url);
                }

                distribution.urls_queue.store.del(encodedURL, (e, v) => {
                  if (e) console.log(e);
                  let newURLsCounter = 0;
                  let totalNewUrls = res.length
                  if (newURLsCounter == totalNewUrls) {
                    cb(res);
                  }
                  res.forEach((u) => {
                    distribution.urls_queue.store.put(u, encodeURIComponent(u), (e, v) => {
                      if (e) console.log(e);
                      newURLsCounter++;
                      if (newURLsCounter == totalNewUrls) {
                        res = res.map((u) => {return {[encodeURIComponent(u)]: 1}; });
                        cb(res);
                      }
                    })
                  })
                })
              })
            })
          }

          const reducer = (encodedURL, values) => {
            return {[encodedURL]: 1};
          }

          distribution.urls_queue.store.get(null, (e, v) => {
            console.log(v);
            if (e) console.log(e);
            const start = performance.now();
            distribution.urls_queue.mr.exec({keys: v, map: mapper, reduce: reducer}, (e, v) => {
              const total_time = performance.now() - start;
              console.log("v:", v);
              const values = Object.keys(v[0]).map(url => decodeURIComponent(url));
              console.log(`Total time for ${values.length} matches: ${total_time}`);
            })
          })

        })
      })
    })

  })
})

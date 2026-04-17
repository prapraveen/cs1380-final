const fs = require("fs");
const { disconnect } = require("node:cluster");
const distribution = require('../distribution.js')({ip: '127.0.0.1', port: 1234});
require('../test/helpers/sync-guard');
const { performance } = require('node:perf_hooks');


const id = distribution.util.id;
const ENQUEUE_DELAY_MS = 50;
const STORE_RETRY_MS = 200;

const n1 = {ip: '172.31.42.233', port: 8000};
const n2 = {ip: '172.31.44.77', port: 8000};
const n3 = {ip: '172.31.37.180', port: 8000};
const allNodes = [n1, n2, n3];

const groupA = {};
groupA[id.getSID(n1)] = n1;
// Add nodes n2 and n3 to the group...
groupA[id.getSID(n2)] = n2;
groupA[id.getSID(n3)] = n3;

// let seed_urls = ["apartments.com", "craigslist.org", "zillow.com", "airbnb.com"];
let seed_urls = ["https://en.wikipedia.org/wiki/distributed_computing"];
let seed_url_keys = seed_urls.map(distribution.util.id.getID);


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
          const mapper = (hashedURL, url, cb) => {
            distribution.page_content.store.keyExists(hashedURL, (e, exists) => {
              if (exists) {
                distribution.urls_queue.store.del(hashedURL, (e, v) => {
                  return cb([]);
                })
              } else {
                const curlHTML = (url, redirectCounter, cb) => {
                  console.log("CRAWLING:", url);
                  if (url.endsWith('/') && url.length > 0) {
                    url = url.slice(0, -1);
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

                  const options = {
                    hostname: new URL(url).hostname,
                    path: new URL(url).pathname + new URL(url).search,
                    method: "GET",
                    headers: {
                      "User-Agent": "Cs1380-final-project/1.0 (praveen_prabaharan@brown.edu)"
                    }
                  }

                  const req = proto.request(options, (res) => {
                    if (res.statusCode >= 300 && res.statusCode <= 399) {
                      console.log(url, "hit redirect...")
                      const redirectURL = res.headers["location"];
                      if (!redirectURL) {
                        console.log(url, "no redirect url");
                        return cb("");
                      }
                      const new_url = new URL(redirectURL, url).href;
                      console.log(url, "redirecting to", new_url);
                      return curlHTML(new_url, redirectCounter - 1, cb);
                    }

                    if (res.statusCode != 200) {
                      console.log(url, "invalid status code:", res.statusCode);
                      console.log(options);
                      return cb("");
                    }

                    if (!res.headers["content-type"]) {
                      console.log(url, "no content type");
                      return cb("");
                    }

                    if (!res.headers["content-type"].includes("text/html")) {
                      console.log(url, "not text");
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

                  req.on('error', (e) => {
                    console.log(e);
                    cb("");
                  })
                  req.end();
                }

                curlHTML(url, 3, (data) => {
                  if (data === "") {
                    distribution.urls_queue.store.del(hashedURL, (e, v) => {
                      return cb([]);
                    })
                  } else {
                    distribution.page_content.store.put({url: url, body: data}, hashedURL, (e, v) => {
                      if (e) console.log("line 67:", e);
                      const discoveredUrls = [];
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
                        discoveredUrls.push(new_url);
                      }

                      distribution.urls_queue.store.del(hashedURL, (e, v) => {
                        if (e) console.log(e);
                        const enqueueNextUrl = (index) => {
                          if (index >= discoveredUrls.length) {
                            return cb([]);
                          }

                          const nextUrl = discoveredUrls[index];
                          const nextHashedUrl = distribution.util.id.getID(nextUrl);

                          distribution.page_content.store.keyExists(nextHashedUrl, (existsError, exists) => {
                            if (existsError) {
                              console.log("error checking page_content before enqueue:", existsError);
                            }

                            const continueToNext = () => {
                              setTimeout(() => enqueueNextUrl(index + 1), ENQUEUE_DELAY_MS);
                            };

                            if (exists) {
                              return continueToNext();
                            }

                            const tryPut = (attempt) => {
                              distribution.urls_queue.store.put(nextUrl, nextHashedUrl, (putError) => {
                                if (!putError) {
                                  return continueToNext();
                                }

                                console.log("error trying to store:", putError);
                                if (attempt < 2) {
                                  return setTimeout(() => tryPut(attempt + 1), STORE_RETRY_MS * (attempt + 1));
                                }

                                continueToNext();
                              });
                            };

                            tryPut(0);
                          });
                        };

                        enqueueNextUrl(0);
                      })
                    })

                  }
                })
              }
            })

          }

          const reducer = (hashedURL, values) => {
            return {[hashedURL]: 1};
          }

          distribution.urls_queue.store.get(null, (e, v) => {
            // console.log(v);
            if (e) console.log(e);
            const start = performance.now();
            distribution.urls_queue.mr.exec({keys: v, map: mapper, reduce: reducer}, (e, v) => {
              const total_time = performance.now() - start;
              console.log("done in", total_time);
              // console.log("v:", v);
              // const values = Object.keys(v[0]).map(url => decodeURIComponent(url));
              // console.log(`Total time for ${values.length} matches: ${total_time}`);
            })
          })

        })
      })
    })

  })
})

#!/bin/bash
# This is the main entry point of the search engine.
cd "$(dirname "$0")" || exit 1

TOTAL_CRAWL_TIME=0
TOTAL_INDEX_TIME=0
TOTAL_PAGES=0

while read -r url; do

  if [[ "$url" == "stop" ]]; then
    # stop the engine if it sees the string "stop" 
    exit;
  fi

  echo "[engine] crawling $url">/dev/stderr
  start_crawl=$(date +%s%N)
  ./crawl.sh "$url" >d/content.txt
  end_crawl=$(date +%s%N)
  crawl_time=$((end_crawl - start_crawl))
  TOTAL_CRAWL_TIME=$((TOTAL_CRAWL_TIME + crawl_time))

  echo "[engine] indexing $url">/dev/stderr
  start_index=$(date +%s%N)
  ./index.sh d/content.txt "$url"
  end_index=$(date +%s%N)
  index_time=$((end_index - start_index))
  TOTAL_INDEX_TIME=$((TOTAL_INDEX_TIME + index_time))

  TOTAL_PAGES=$((TOTAL_PAGES + 1))

  if  [[ "$(cat d/visited.txt | wc -l)" -ge "$(cat d/urls.txt | wc -l)" ]]; then
      # stop the engine if it has seen all available URLs
      break;
  fi

done < <(tail -f d/urls.txt)

echo "[timer] crawl throughput time (ms): $(awk "BEGIN {print ($TOTAL_CRAWL_TIME / $TOTAL_PAGES) / 1000000}")" >/dev/stderr
echo "[timer] index throughput time (ms): $(awk "BEGIN {print ($TOTAL_INDEX_TIME / $TOTAL_PAGES) / 1000000}")" >/dev/stderr
echo "[timer] total pages processed: $TOTAL_PAGES" >/dev/stderr
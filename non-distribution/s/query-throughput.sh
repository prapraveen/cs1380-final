#!/bin/bash

TOTAL_QUERY_TIME=0
TOTAL_QUERIES=50

start=$(date +%s%N)

for i in $(seq 1 $TOTAL_QUERIES); do
  ./query.js "search" > /dev/null 2>&1
done

end=$(date +%s%N)

TOTAL_QUERY_TIME=$((end - start))

echo "[timer] query throughput time (ms): $(awk "BEGIN {print ($TOTAL_QUERY_TIME / $TOTAL_QUERIES) / 1000000}")"
echo "[timer] total queries processed: $TOTAL_QUERIES"
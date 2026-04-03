#!/bin/bash

./crawl.sh "$1" > crawl-out.txt

echo "time to index"
time ./index.sh crawl-out.txt > index-out.txt

echo "number of terms:"
wc -l d/global-index.txt

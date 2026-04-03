#!/bin/bash

./crawl.sh "$1" > crawl-out.txt

./index.sh crawl-out.txt > index-out.txt

echo "time to query 'mystery':"
time ./query.js mystery
echo "^^^time to query 'mystery':"

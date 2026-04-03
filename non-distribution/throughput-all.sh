#!/bin/bash

echo "/dev/null" > crawl-out.txt
echo "/dev/null" > index-out.txt

time ./crawl.sh "$1" > crawl-out.txt

time ./index.sh crawl-out.txt > index-out.txt

time ./query.js mystery > "/dev/null"

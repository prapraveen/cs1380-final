#!/bin/bash

echo "/dev/null" > d/urls.txt

echo "Time to crawl: "
time ./crawl.sh "$1"

echo "Number of URLs crawled: "
wc -l d/urls.txt 

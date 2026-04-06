#!/bin/bash
# This is a student test
BASE_URL="http://example.com/dir/"
HTML='<html><body><a href="hi.html">hi</a><a href="/brown.html">brown2</a><a href="https://brown.edu/cs">browncs</a></body></html>'
EXPECTED="http://example.com/brown.html
http://example.com/dir/hi.html
https://brown.edu/cs"

OUTPUT=$(echo "$HTML" | ../c/getURLs.js "$BASE_URL" | sort)

if [ "$(echo "$OUTPUT" | tr -d '\n')" == "$(echo "$EXPECTED" | tr -d '\n')" ]; then
    echo "test passed."
    exit 0
else
    echo "got: $OUTPUT"
    echo "expected: $EXPECTED"
    exit 1
fi
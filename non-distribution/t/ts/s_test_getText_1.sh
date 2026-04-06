#!/bin/bash
# This is a student test
HTML="<html><body><p>This is a test page.</p></body></html>"
EXPECTED=$'This is a test page.'
OUTPUT=$(echo "$HTML" | ./c/getText.js)

if [ "$OUTPUT" == "$EXPECTED" ]; then
	echo "test passed."
	exit 0
else
	echo "got: $OUTPUT"
	echo "expected: $EXPECTED"
	exit 1
fi
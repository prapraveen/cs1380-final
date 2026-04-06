#!/bin/bash
# This is a student test

GLOBAL_FILE=$(mktemp)
echo -e "word1 | url1 1\nword2 | url2 2" > "$GLOBAL_FILE"

LOCAL_INPUT="word1 | 3 | url1
word1 | 4 | url3
word2 | 5 | url2
word2 | 6 | url4"

EXPECTED="word1 | url1 4 url3 4
word2 | url2 7 url4 6"

OUTPUT=$(echo -e "$LOCAL_INPUT" | ../c/merge.js "$GLOBAL_FILE")
rm "$GLOBAL_FILE"

if [ "$OUTPUT" == "$EXPECTED" ]; then
	echo "test passed."
	exit 0
else
	echo "got: $OUTPUT"
	echo "expected: $EXPECTED"
	exit 1
fi
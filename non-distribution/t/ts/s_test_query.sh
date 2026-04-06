#!/bin/bash
# This is a student test
GLOBAL_FILE=$(mktemp)
echo -e "stuff | url1 2\ncheck stuff | url2 1\nother | url3 3" > "$GLOBAL_FILE"

mv "$GLOBAL_FILE" d/global-index.txt

QUERY="stuff"

EXPECTED="stuff | url1 2
check stuff | url2 1"

OUTPUT=$(./query.js "$QUERY")
rm d/global-index.txt

if [ "$OUTPUT" == "$EXPECTED" ]; then
	echo "test passed."
	exit 0
else
	echo "got: $OUTPUT"
	echo "expected: $EXPECTED"
	exit 1
fi
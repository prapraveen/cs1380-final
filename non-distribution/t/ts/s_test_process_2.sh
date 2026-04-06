#!/bin/bash
# This is a student test
TEXT="this café woo!"
EXPECTED="caf
woo"

pwd

OUTPUT=$(echo "$TEXT" | ./c/process.sh)

if [ "$OUTPUT" == "$EXPECTED" ]; then
	echo "test passed."
	exit 0
else
	echo "got: $OUTPUT"
	echo "expected: $EXPECTED"
	exit 1
fi


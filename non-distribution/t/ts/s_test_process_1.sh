#!/bin/bash
# This is a student test
TEXT="The quick Brown® fox jumps over the lazy d0g! 2026"
EXPECTED=$'the\nquick\nbrown\nfox\njumps\nover\nthe\nlazy\nd\ng'
OUTPUT=$(echo "$TEXT" | ./c/process.sh)

if [ "$OUTPUT" == "$EXPECTED" ]; then
	echo "test passed."
	exit 0
else
	echo "got: $OUTPUT"
	echo "expected: $EXPECTED"
	exit 1
fi
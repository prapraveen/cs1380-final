#!/bin/bash
INPUT="running
jumped
cats
running"

EXPECTED="run
jump
cat
run"

OUTPUT=$(echo "$INPUT" | ../c/stem.js)

if [ "$OUTPUT" == "$EXPECTED" ]; then
    echo "test passed."
	exit 0
else
	echo "got: $OUTPUT"
	echo "expected: $EXPECTED"
    exit 1
fi
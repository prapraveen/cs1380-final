#!/bin/bash
# This is a student test
HTML='<html><body><p class="intro" data-v-fbfe3a03=""> A <span class="keyword" data-v-fbfe3a03=""> computer scientist</span>, <span class="keyword" data-v-fbfe3a03=""> philosopher</span>, <span class="keyword active" data-v-fbfe3a03=""> video-game developer </span> and <span class="keyword tea" data-v-fbfe3a03="">tea enthusiast</span>.</p></body></html>'
EXPECTED=$'A computer scientist, philosopher, video-game developer and tea enthusiast.'
OUTPUT=$(echo "$HTML" | ./c/getText.js)

if [ "$OUTPUT" == "$EXPECTED" ]; then
	echo "test passed."
	exit 0
else
	echo "got: $OUTPUT"
	echo "expected: $EXPECTED"
	exit 1
fi
#!/bin/bash
# This is a student test

T_FOLDER=${T_FOLDER:-t}
R_FOLDER=${R_FOLDER:-}

cd "$(dirname "$0")/..$R_FOLDER" || exit 1

DIFF=${DIFF:-diff}


if $DIFF -w <(cat ts/comb-in.txt | ../c/combine.sh | sed 's/\t*$//' | sed 's/\s/ /g' | sort | uniq) <(cat ts/comb-out.txt | sed 's/\t*$//' | sed 's/\s/ /g' | sort | uniq) >&2;
then
    echo "$0 success: ngrams are identical"
    exit 0
else
    echo "$0 failure: ngrams are not identical"
    exit 1
fi

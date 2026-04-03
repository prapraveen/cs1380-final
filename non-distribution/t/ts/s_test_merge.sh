#!/bin/bash
# This is a student test

T_FOLDER=${T_FOLDER:-t}
R_FOLDER=${R_FOLDER:-}

cd "$(dirname "$0")/..$R_FOLDER" || exit 1

DIFF=${DIFF:-diff}
DIFF_PERCENT=${DIFF_PERCENT:-0}

cat /dev/null > ts/global-index.txt

files=(ts/m{1..3}.txt)

for file in "${files[@]}"
do
    cat "$file" | ../c/merge.js ts/global-index.txt > ts/temp-global-index.txt
    mv ts/temp-global-index.txt ts/global-index.txt
done

if DIFF_PERCENT=$DIFF_PERCENT ./gi-diff.js <(sort ts/global-index.txt) <(sort ts/m4.txt) >&2;
then
    echo "$0 success: global indexes are identical"
    exit 0
else
    echo "$0 failure: global indexes are not identical"
    exit 1
fi

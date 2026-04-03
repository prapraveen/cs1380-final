#!/bin/bash
# This is a student test

T_FOLDER=${T_FOLDER:-t}
R_FOLDER=${R_FOLDER:-}

cd "$(dirname "$0")/..$R_FOLDER" || exit 1

DIFF=${DIFF:-diff}
DIFF_PERCENT=${DIFF_PERCENT:-0}

cd ../

cat /dev/null > d/visited.txt
cat /dev/null > d/global-index.txt

cat "$T_FOLDER"/d/u2.txt > d/urls.txt

./engine.sh

EXIT=0

if $DIFF <(sort d/visited.txt) <(sort "$T_FOLDER"/d/v2.txt) >&2;
then
    echo "$0 success: visited urls are identical"
else
    echo "$0 failure: visited urls are not identical"
    EXIT=1
fi

exit $EXIT

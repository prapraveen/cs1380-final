#!/bin/bash

# Convert input to a stream of non-stopword terms
# Usage: input > ./process.sh > output

# Convert non-letter characters to newlines, make lowercase, convert to ASCII; then remove stopwords (inside d/stopwords.txt)
# Non-letter characters include things like ©, ®, and ™ as well!
#
# Commands that will be useful: tr, iconv, grep

# Tip: Make sure your program doesn't emit a non-zero exit code if there are no words left after removing stopwords.
# You can combine the grep invocation with `|| true` to achieve this. Be careful though, as this will also hide other errors!

T_FOLDER=${T_FOLDER:-t}
R_FOLDER=${R_FOLDER:-}

cd "$(dirname "$0")/..$R_FOLDER" || exit 1

tr '[:upper:]' '[:lower:]' | tr -cs '[:lower:]' '\n' | grep -vFxf "$T_FOLDER"/../d/stopwords.txt || true

#!/bin/sh

# init proof 

mkdir -p ./datas/merkles/


FILE=./scripts/datas/users.cache.json
if test -f "$FILE"; then
    echo "users.cache.json is exists"
else
   echo "{}" > "$FILE"
fi

FILE=./scripts/datas/tokens.cache.json
if test -f "$FILE"; then
    echo "tokens.cache.json is exists"
else
   echo "{}" > "$FILE"
fi


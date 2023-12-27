#!/bin/sh

# init proof 

mkdir -p ./datas/merkles/


FILE=./scripts/datas/users.cache.json
if test -f "$FILE"; then
    echo "use exists users.cache.json"
else
   echo "{}" >> "$FILE"
fi


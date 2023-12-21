FILE=secrets.json
if test -f "$FILE"; then
   rm "$FILE"
fi

ln -s ~/.wallet/secrets.json secrets.json

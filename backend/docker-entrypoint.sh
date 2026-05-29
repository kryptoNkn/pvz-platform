#!/bin/sh
set -eu

if [ "$(id -u)" = "0" ]; then
    if [ ! -d /app/uploads ] || [ "$(stat -c '%u:%g' /app/uploads)" != "10001:10001" ]; then
        chown -R 10001:10001 /app/uploads
    fi

    exec gosu 10001:10001 "$@"
fi

exec "$@"

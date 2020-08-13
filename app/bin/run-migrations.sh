#!/bin/sh

set -euo nounset

sleep 10
while (! exec npm run migrate); do
  >&2 echo "Postgres is unavailable - sleeping"
  sleep 10
done

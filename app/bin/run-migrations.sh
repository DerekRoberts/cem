#!/bin/sh
#
set -euo nounset

# Migrate with retries
#
while true; do
  echo "Waiting 5 seconds for Postgres to start"
  sleep 5
  npm run migrate | grep -iE 'Already up to date|Batch [0-9]* run: [0-9]* migrations'
  [[ $? -eq 0 ]] && break
done

echo "Migrations complete!  Exiting."

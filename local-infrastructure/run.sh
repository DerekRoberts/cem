#!/bin/bash
# 
# https://bcgov.github.io/common-forms-toolkit/local-infrastructure/
#
# Prerequisites: docker, docker compose and python
#
set -euxo pipefail

# Stop, build and bring up containers as services (daemons)
#
docker-compose stop
docker-compose build
docker-compose up -d

# Wait for keycloak to start and create local users
#
sleep 10
docker exec -ti comfort_keycloak bash /tmp/keycloak-local-user.sh

# Show status of containers
#
docker ps

# If python3 is installed then browse to keycloak
#
(! which python) || python -m webbrowser http://localhost:28080/

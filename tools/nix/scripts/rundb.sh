#!/bin/bash

# Init db
initdb

# Start postgres
pg_ctl start -o "-k '$PGHOST'"

# Create postgres user
createuser -s -r postgres

# Set postgres superuser password
psql -U postgres -c "ALTER ROLE postgres WITH PASSWORD 'postgres';"

# Create databases owned by the role that will run migrations
createdb -O postgres imeetly

# Ensure the migrator role can create objects in the default schema
for db in imeetly; do
  psql -d "$db" -c "
    CREATE SCHEMA IF NOT EXISTS app;
    CREATE SCHEMA IF NOT EXISTS auth;
    CREATE SCHEMA IF NOT EXISTS drizzle;
    GRANT USAGE ON SCHEMA app, auth, drizzle, public TO postgres;
  "
done

exit 0
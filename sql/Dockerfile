FROM postgres:16.1-alpine
ENV POSTGRES_USER=captain
ENV POSTGRES_PASSWORD=GiveHimTheClamps
ENV POSTGRES_DB=lobster

COPY create_tables.sql /docker-entrypoint-initdb.d/1_create_tables.sql
COPY populate.sql /docker-entrypoint-initdb.d/2_populate.sql

# docker-compose exec -it lobster-postgres bash
# psql -U captain -d lobster

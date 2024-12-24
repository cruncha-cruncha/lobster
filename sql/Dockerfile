FROM postgres:16.1-alpine
ENV POSTGRES_USER=captain
ENV POSTGRES_PASSWORD=GiveHimTheClamps
ENV POSTGRES_DB=lobster

COPY create_tables/fixed.sql /docker-entrypoint-initdb.d/1_fixed.sql
COPY create_tables/main.sql /docker-entrypoint-initdb.d/2_main.sql
COPY default_data/fixed.sql /docker-entrypoint-initdb.d/4_fixed.sql
COPY default_data/main.sql /docker-entrypoint-initdb.d/5_main.sql

# docker-compose exec -it lobster-postgres bash
# psql -U captain -d lobster

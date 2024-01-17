FROM rust:1-buster AS builder
WORKDIR /app
ARG SQLX_OFFLINE=true
COPY . . 
RUN cargo build -F cors

FROM debian:buster-slim
WORKDIR /app
COPY --from=builder /app/.env ./.env
COPY --from=builder /app/target/debug/lobster-tail ./lobster-tail
CMD ["/app/lobster-tail"]

# with Postgres running:
# cargo sqlx prepare -- -F cors

# then update the .env file:
# DATABASE_URL="...@host.docker.internal/..." # will change when the Postgres container gets set up
# HOSTING_ADDR="0.0.0.0:3000"

# then:
# docker build -t lobster-backend .
# docker run --name lobster-backend -dp 127.0.0.1:3000:3000 lobster-backend
# docker start lobster-backend

# can test GET: http://127.0.0.1:3000/countries



FROM rust:1-buster AS builder
WORKDIR /app
ARG SQLX_OFFLINE=true
COPY . . 
ADD .env.docker .env
RUN cargo build -F cors

FROM debian:buster-slim
WORKDIR /app
COPY --from=builder /app/.env ./.env
COPY --from=builder /app/target/debug/lobster-tail ./lobster-tail
CMD ["/app/lobster-tail"]

# with Postgres running:
# cargo sqlx prepare -- -F cors

# can test GET: http://127.0.0.1:3000/countries



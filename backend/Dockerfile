FROM rust:1-buster AS builder
WORKDIR /app
ARG SQLX_OFFLINE=true
COPY . . 
ADD .env.docker .env
RUN cargo build -F cors

FROM debian:buster-slim
WORKDIR /app

RUN apt-get update && apt-get install -y curl

COPY --from=builder /app/.env ./.env
COPY --from=builder /app/private.pem ./private.pem
COPY --from=builder /app/public.pem ./public.pem
COPY --from=builder /app/target/debug/lobster-tail ./lobster-tail

EXPOSE 28/udp

CMD ["/app/lobster-tail"]

# with Postgres running:
# cargo sqlx prepare -- -F cors

# can test GET: http://127.0.0.1:3000/countries



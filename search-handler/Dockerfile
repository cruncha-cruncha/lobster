FROM golang:1.22-alpine
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download

COPY *.go ./
COPY public.pem ./
ADD .env.docker .env

RUN CGO_ENABLED=0 GOOS=linux go build -o /search-handler

EXPOSE 28/udp

CMD ["/search-handler"]
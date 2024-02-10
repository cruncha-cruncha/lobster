package main

import (
	"encoding/json"
	"log"

	amqp "github.com/rabbitmq/amqp091-go"
)

const (
	PCM_ACTION_HELLO  = 1
	PCM_ACTION_CREATE = 2
	PCM_ACTION_UPDATE = 3
	PCM_ACTION_DELETE = 4
)

type PostChangeMessage struct {
	Action int             `json:"action"`
	UUID   string          `json:"uuid"`
	Info   *PostChangeInfo `json:"info"`
}

type PostChangeInfo struct {
	AuthorID  int     `json:"author_id"`
	Title     string  `json:"title"`
	Content   string  `json:"content"`
	Price     float64 `json:"price"`
	Currency  string  `json:"currency"`
	Latitude  float64 `json:"latitude"`
	Longitude float64 `json:"longitude"`
	CreatedAt string  `json:"created_at"`
	UpdatedAt string  `json:"updated_at"`
}

func panicOnError(err error, msg string) {
	if err != nil {
		log.Panicf("%s: %s", msg, err)
	}
}

type Rabbit struct {
	conn *amqp.Connection
	ch   *amqp.Channel
	msgs <-chan amqp.Delivery
}

func NewRabbit() Rabbit {
	conn, err := amqp.Dial("amqp://mad-hatter:24carrot@lobster-rabbit:5672")
	panicOnError(err, "Failed to connect to RabbitMQ")

	ch, err := conn.Channel()
	panicOnError(err, "Failed to open a channel")

	err = ch.ExchangeDeclare(
		"post-changed", // name
		"direct",       // type
		false,          // durable
		false,          // auto-deleted
		false,          // internal
		false,          // no-wait
		nil,            // arguments
	)
	panicOnError(err, "Failed to declare the post-changed exchange")

	q, err := ch.QueueDeclare(
		"search-ingest", // name
		false,           // durable
		false,           // delete when unused
		false,           // exclusive
		false,           // no-wait
		nil,             // arguments
	)
	panicOnError(err, "Failed to declare the search-ingest queue")

	err = ch.QueueBind(
		"search-ingest", // queue name
		"search-ingest", // routing key
		"post-changed",  // exchange
		false,           // no-wait
		nil,             // args
	)
	panicOnError(err, "Failed to bind the search-ingest queue to the post-changed exchange")

	msgs, err := ch.Consume(
		q.Name, // queue
		"",     // consumer
		true,   // auto-ack
		false,  // exclusive
		false,  // no-local
		false,  // no-wait
		nil,    // args
	)
	panicOnError(err, "Failed to register a consumer for search-ingest")

	return Rabbit{
		conn: conn,
		ch:   ch,
		msgs: msgs,
	}
}

func (rabbit Rabbit) Listen() chan bool {
	shutdown := make(chan bool)

	go func(shutdown chan bool) {
		for {
			select {
			case d := <-rabbit.msgs:
				data := PostChangeMessage{}
				err := json.Unmarshal(d.Body, &data)
				if err != nil {
					log.Println("Failed to unmarshal to PostChangeMessage", err)
				} else {
					log.Println("Unmarshalled object:", data.Action, data.UUID, data.Info)
				}
			case _ = <-shutdown:
				log.Println("Received shutdown signal")
				return
			}
		}
	}(shutdown)

	return shutdown
}

func (rabbit Rabbit) Close() {
	rabbit.ch.Close()
	rabbit.conn.Close()
}

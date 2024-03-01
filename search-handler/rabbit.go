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
	UUID     string  `json:"uuid"`
	AuthorID int     `json:"author_id"`
	Title    string  `json:"title"`
	Content  string  `json:"content"`
	Price    float64 `json:"price"`
	Currency int     `json:"currency"`
	Country  int     `json:"country"`
	Location struct {
		Latitude  float64 `json:"lat"`
		Longitude float64 `json:"lon"`
	} `json:"location"`
	CreatedAt    int `json:"created_at"`
	UpdatedAt    int `json:"updated_at"`
	CommentCount int `json:"comment_count"`
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
		"fanout",       // type
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

func (rabbit Rabbit) Listen(elastic Elastic) chan bool {
	shutdown := make(chan bool)

	go func(elastic Elastic, shutdown chan bool) {
		for {
			select {
			case d := <-rabbit.msgs:
				data := PostChangeMessage{}
				err := json.Unmarshal(d.Body, &data)
				if err != nil {
					log.Println("Failed to unmarshal to PostChangeMessage", err)
				} else {
					var err error

					switch data.Action {
					case PCM_ACTION_HELLO:
						log.Println("Hello!")
					case PCM_ACTION_CREATE:
						err = elastic.ingestPostChange(data)
					case PCM_ACTION_UPDATE:
						err = elastic.ingestPostChange(data)
					case PCM_ACTION_DELETE:
						err = elastic.removePost(data.UUID)
					default:
						log.Println("Unknown action", data.Action)
					}

					if err != nil {
						log.Println("Rabbit handler error: ", err)
					}
				}
			case _ = <-shutdown:
				log.Println("Received shutdown signal")
				return
			}
		}
	}(elastic, shutdown)

	return shutdown
}

func (rabbit Rabbit) Close() {
	rabbit.ch.Close()
	rabbit.conn.Close()
}

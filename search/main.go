package main

import (
	"encoding/json"

	"github.com/gofiber/fiber/v3"
)

type QueryArgs struct {
	Term string `json:"term"`
}

func main() {
	elastic := NewElastic()
	rabbit := NewRabbit()
	shutdown := rabbit.Listen(elastic)
	defer rabbit.Close()
	defer func() { shutdown <- true }()

	app := fiber.New()

	app.Get("/hello", func(c fiber.Ctx) error {
		return c.SendString("hello, world")
	})

	app.Post("/search/posts", func(c fiber.Ctx) error {
		queryArgs := new(QueryArgs)
		body := c.Body()
		if err := json.Unmarshal(body, queryArgs); err != nil {
			return err
		}

		posts, err := elastic.basicPostsSearch(queryArgs.Term)
		if err != nil {
			return c.Status(500).SendString(err.Error())
		}

		return c.JSON(posts)
	})

	app.Listen(":3001")
}

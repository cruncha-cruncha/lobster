package main

import "github.com/gofiber/fiber/v3"

func main() {
	rabbit := NewRabbit()
	shutdown := rabbit.Listen()
	defer rabbit.Close()
	defer func() { shutdown <- true }()

	app := fiber.New()

    app.Get("/hello", func(c fiber.Ctx) error {
        return c.SendString("hello, world")
    })

    app.Listen(":3001")
}

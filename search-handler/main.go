package main

import (
	"encoding/json"
	"io"
	"net/http"
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

	http.HandleFunc("/hello", func(w http.ResponseWriter, req *http.Request) {
		if req.Method != "GET" {
			http.Error(w, "Invalid request method", 405)
			return
		}

		io.WriteString(w, "hello, world\n")
	})

	http.HandleFunc("/search/posts", func(w http.ResponseWriter, req *http.Request) {
		if req.Method != "POST" {
			http.Error(w, "Invalid request method", 405)
			return
		}

		var queryArgs QueryArgs
		decoder := json.NewDecoder(req.Body)
		if err := decoder.Decode(&queryArgs); err != nil {
			panic(err)
		}

		posts, err := elastic.basicPostsSearch(queryArgs.Term)
		if err != nil {
			http.Error(w, err.Error(), 500)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(posts)
	})


	err := http.ListenAndServe(":3001", nil)
	panicOnError(err, "Failed to start server")
}

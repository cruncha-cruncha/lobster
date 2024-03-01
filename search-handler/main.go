package main

import (
	"encoding/json"
	"io"
	"net/http"
)

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

		var params PostSearchParams
		decoder := json.NewDecoder(req.Body)
		if err := decoder.Decode(&params); err != nil {
			http.Error(w, "Invalid request body", 400)
			return
		}

		var err error
		var posts []PostChangeInfo
		if !params.Full {
			posts, err = elastic.basicPostsSearch(params.Term)
		} else {
			posts, err = elastic.fullPostsSearch(params)
		}

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

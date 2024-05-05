package main

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"strings"

	"github.com/golang-jwt/jwt/v4"
	"github.com/joho/godotenv"
)

func main() {
	fmt.Println("Starting server...")
	
	godotenv.Load()
	
	publicKey := readPublicKey()
	elastic := NewElastic()
	comm := NewComm()

	go comm.Listen(elastic)
	defer comm.Close()

	http.HandleFunc("/hello", func(w http.ResponseWriter, req *http.Request) {
		if req.Method != http.MethodGet {
			http.Error(w, "Invalid request method", 405)
			return
		}

		io.WriteString(w, "hello, world\n")
	})

	http.HandleFunc("/search/posts", func(w http.ResponseWriter, req *http.Request) {
		if req.Method == http.MethodOptions {
			corsPreflight(w, req)
			return
		}
		if req.Method != http.MethodPost {
			http.Error(w, "Invalid request method", 405)
			return
		}

		// check authentication
		{
			authHeader := req.Header.Get("Authorization")
			if authHeader == "" {
				http.Error(w, "Unauthorized", 401)
				return
			}
			parts := strings.Split(authHeader, " ")
			if len(parts) != 2 || parts[0] != "Bearer" {
				http.Error(w, "Unauthorized", 401)
				return
			}
			token, err := jwt.Parse(parts[1], func(token *jwt.Token) (interface{}, error) {
				return publicKey, nil
			})
			if err != nil || !token.Valid {
				http.Error(w, "Unauthorized", 401)
				return
			}
		}
		
		var params PostSearchParams
		decoder := json.NewDecoder(req.Body)
		if err := decoder.Decode(&params); err != nil {
			fmt.Println(err)
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

		out := struct {
			Found []PostChangeInfo `json:"found"`
		}{
			Found: posts,
		}

		corsPreflight(w, req)
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(out)
	})

	err := http.ListenAndServe(":3001", nil)
	panicOnError(err, "Failed to start server")
}

func corsPreflight(w http.ResponseWriter, r *http.Request) {
	headers := w.Header()

	headers["Vary"] = []string{}
	headers["Access-Control-Allow-Credentials"] = []string{"true"}
	headers["Access-Control-Allow-Origin"] = []string{"*"}

	reqHeadersRaw := r.Header["Access-Control-Request-Headers"]
	headers["Access-Control-Allow-Headers"] = reqHeadersRaw

	headers["Access-Control-Allow-Methods"] = r.Header["Access-Control-Request-Method"]
}

func readPublicKey() interface{} {
	dat, err := os.ReadFile("./public.pem")
	panicOnError(err, "Failed to read public key")

	key, err := jwt.ParseRSAPublicKeyFromPEM(dat)
    if err != nil {
        panicOnError(err, "Failed to parse public key")
    }

	return key
}

func panicOnError(err error, msg string) {
	if err != nil {
		log.Panicf("%s: %s", msg, err)
	}
}
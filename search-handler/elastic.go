package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
)

type Elastic struct {
	client http.Client
}

func NewElastic() Elastic {
	log.Println("Setting up Elasticsearch")

	client := http.Client{}

	// not thread-safe
	if res, err := client.Head("http://lobster-elastic:9200/posts"); err != nil {
		log.Println("Failed to determine if index exists:", err)
	} else if res.StatusCode != http.StatusOK {
		body := []byte(`{
			"settings": {
				"number_of_shards": 1,
				"number_of_replicas": 0
			},
			"mappings": {
				"properties": {
					"uuid":          { "type": "keyword" },
					"author_id":     { "type": "integer" },
					"title":         { "type": "text" },
					"content":       { "type": "text" },
					"price":         { "type": "float" },
					"currency":      { "type": "keyword" },
					"latitude":      { "type": "float" },
					"longitude":     { "type": "float" },
					"created_at":    { "type": "date" },
					"updated_at":    { "type": "date" },
					"comment_count": { "type": "integer" }
				}
			}
		}`)

		req, err := http.NewRequest("PUT", "http://lobster-elastic:9200/posts", bytes.NewBuffer(body))
		panicOnError(err, "Failed to create index request")

		if res, err := client.Do(req); err != nil {
			log.Println("Failed to create index:", err)
		} else if res.StatusCode != http.StatusOK {
			log.Println("Failed to create index:", res.Status)
		}
	}

	return Elastic{
		client: client,
	}
}

func (elastic Elastic) ingestPostChange(data PostChangeMessage) error {
	log.Println("ingesting post", data.UUID)

	doc, err := json.Marshal(data.Info)
	if err != nil {
		return err
	}

	req, _ := http.NewRequest("PUT", fmt.Sprintf("http://lobster-elastic:9200/posts/_doc/%s", data.UUID), bytes.NewBuffer(doc))
	req.Header.Set("Content-Type", "application/json")

	_, err = elastic.client.Do(req)

	return err
}

func (elastic Elastic) removePost(uuid string) error {
	log.Println("removing post", uuid)

	req, _ := http.NewRequest("DELETE", fmt.Sprintf("http://lobster-elastic:9200/posts/_doc/%s", uuid), nil)

	_, err := elastic.client.Do(req)

	return err
}

func (elastic Elastic) basicPostsSearch(term string) ([]PostChangeInfo, error) {
	log.Println("searching for posts with query:", term)

	query := []byte(`{
		"query": {
			"multi_match": {
				"query": "` + term + `",
				"fields": ["title", "content"]
			}
		}
	}`)

	req, _ := http.NewRequest("POST", "http://lobster-elastic:9200/posts/_search", bytes.NewBuffer(query))
	req.Header.Set("Content-Type", "application/json")

	res, err := elastic.client.Do(req)
	if err != nil {
		return nil, err
	}

	var data PostsQueryResponse

	if err := json.NewDecoder(res.Body).Decode(&data); err != nil {
		return nil, err
	}

	out := make([]PostChangeInfo, len(data.Hits.Hits))
	for i, hit := range data.Hits.Hits {
		out[i] = hit.Source
	}

	return out, nil
}

type PostsQueryResponse struct {
	Hits struct {
		Hits []struct {
			Source PostChangeInfo `json:"_source"`
		} `json:"hits"`
	} `json:"hits"`
}

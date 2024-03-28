package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"regexp"
	"strings"
)

// is thread-safe
type Elastic struct {
	client http.Client
}

func NewElastic() Elastic {
	log.Println("Setting up Elasticsearch")
	client := http.Client{}

	// req, _ := http.NewRequest("DELETE", "http://lobster-elastic:9200/posts", nil)
	// client.Do(req)

	if res, err := client.Head("http://lobster-elastic:9200/posts"); err != nil {
		log.Println("Failed to determine if index exists:", err)
	} else if res.StatusCode != http.StatusOK {
		body := []byte(`{
			"mappings": {
				"properties": {
					"uuid":          { "type": "keyword" },
					"author_id":     { "type": "integer" },
					"title":         { "type": "text" },
					"content":       { "type": "text" },
					"images":        { "type": "keyword", "index": false },
					"price":         { "type": "float" },
					"currency":      { "type": "keyword" },
					"country":       { "type": "integer" },
					"location":      { "type": "geo_point" },
					"created_at":    { "type": "date" },
					"updated_at":    { "type": "date" },
					"comment_count": { "type": "integer" }
				}
			}
		}`)

		req, _ := http.NewRequest("PUT", "http://lobster-elastic:9200/posts", bytes.NewBuffer(body))
		req.Header.Set("Content-Type", "application/json")

		if res, err := client.Do(req); err != nil {
			log.Panic("Failed to create index:", err)
		} else if res.StatusCode != http.StatusOK {
			log.Panic("Failed to create index:", res.Status)
		} else {
			log.Println("Created posts index")
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

	res, err := elastic.client.Do(req)
	if err != nil {
		return err
	}
	defer res.Body.Close()
	if res.StatusCode != http.StatusCreated {
		bodyBytes, _ := io.ReadAll(res.Body)
		bodyString := string(bodyBytes)
		log.Println("BAD INGEST CHANGE POST: " + bodyString)

		return fmt.Errorf("Failed to ingest post: %s", res.Status)
	}

	return err
}

func (elastic Elastic) removePost(uuid string) error {
	log.Println("removing post", uuid)

	req, _ := http.NewRequest("DELETE", fmt.Sprintf("http://lobster-elastic:9200/posts/_doc/%s", uuid), nil)

	res, err := elastic.client.Do(req)
	if err != nil {
		return err
	}
	defer res.Body.Close()
	if res.StatusCode != http.StatusOK {
		bodyBytes, _ := io.ReadAll(res.Body)
		bodyString := string(bodyBytes)
		log.Println("BAD INGEST REMOVE POST: " + bodyString)

		return fmt.Errorf("Failed to ingest post: %s", res.Status)
	}

	return err
}

var doubleQuoteRegex = regexp.MustCompile(`"+`)

func escapeTerm(str string) string {
	return doubleQuoteRegex.ReplaceAllString(str, "\"")
}

func (elastic Elastic) basicPostsSearch(term string) ([]PostChangeInfo, error) {
	log.Println("searching for posts with basic query:", term)
	var data PostsQueryResponse

	query := []byte(`{
		"from": 0, "size": 10,
		"query": {
			"combined_fields": {
				"query": "` + escapeTerm(term) + `",
				"fields": ["title", "content"],
				"operator": "or"
			}
		}
	}`)

	req, _ := http.NewRequest(http.MethodPost, "http://lobster-elastic:9200/posts/_search", bytes.NewBuffer(query))
	req.Header.Set("Content-Type", "application/json")

	res, err := elastic.client.Do(req)
	if err != nil {
		return nil, err
	}
	defer res.Body.Close()
	if res.StatusCode != http.StatusOK {
		bodyBytes, _ := io.ReadAll(res.Body)
		bodyString := string(bodyBytes)
		log.Println("BAD BASIC POSTS SEARCH: " + bodyString)

		return nil, fmt.Errorf("Failed to search posts: %s", res.Status)
	}

	if err := json.NewDecoder(res.Body).Decode(&data); err != nil {
		return nil, err
	}

	out := make([]PostChangeInfo, len(data.Hits.Hits))
	for i, hit := range data.Hits.Hits {
		out[i] = hit.Source
	}

	return out, nil
}

type PostSearchParams struct {
	Full   bool `json:"full"`
	Offset int  `json:"offset"`
	Limit  int  `json:"limit"`
	// 0 = relevance, 1 = price asc, 2 = price desc, 3 = date asc, 4 = date desc
	SortBy    int    `json:"sort_by"`
	Term      string `json:"term"`
	Countries []int  `json:"countries"`
	Location  struct {
		Valid     bool    `json:"valid"`
		Latitude  float64 `json:"latitude"`
		Longitude float64 `json:"longitude"`
		Radius    float64 `json:"radius"`
	} `json:"location"`
	NoPrice struct {
		Only    bool `json:"only"`
		Exclude bool `json:"exclude"`
	} `json:"no_price"`
	PriceRange struct {
		Valid bool    `json:"valid"`
		Min   float64 `json:"min"`
		Max   float64 `json:"max"`
	} `json:"price_range"`
}

// example query:
/* {
	"full": true,
    "offset": 0,
    "limit": 10,
	"sort_by": 0,
	"term": "hello world",
	"countries": [1, 2, 3],
	"location": {
		"valid": true,
		"latitude": 0.0,
		"longitude": 0.0,
		"radius": 100.0,
	},
	"no_price": {
		"only": false,
		"exclude": false
	},
	"price_range": {
		"valid": true,
		"min": 0.0,
		"max": 100.0
	}
} */

func (elastic Elastic) fullPostsSearch(params PostSearchParams) ([]PostChangeInfo, error) {
	log.Println("searching for posts with advanced query", params)
	var data PostsQueryResponse

	var queryString string
	queryString += `{`
	queryString += `"from":` + fmt.Sprint(params.Offset) + `,`
	queryString += `"size":` + fmt.Sprint(params.Limit) + `,`
	queryString += `"sort":[`
	switch params.SortBy {
	case 1:
		queryString += `{"price":{"order":"asc"}},`
	case 2:
		queryString += `{"price":{"order":"desc"}},`
	case 3:
		queryString += `{"updated_at":{"order":"asc"}},`
	case 4:
		queryString += `{"updated_at":{"order":"desc"}},`
	}
	queryString += `{"_score":{"order":"desc"}}`
	queryString += `],` // sort
	queryString += `"query":{`
	queryString += `"bool":{`
	queryString += `"must":{`
	if params.NoPrice.Only {
		queryString += `"term":{`
		queryString += `"currency":0`
		queryString += `},` // term
	}
	queryString += `"combined_fields":{`
	queryString += `"query":"` + escapeTerm(params.Term) + `",`
	queryString += `"fields":["title","content"]`
	queryString += `}`  // combined_fields
	queryString += `},` // must
	if params.NoPrice.Exclude {
		queryString += `"must_not":{`
		queryString += `"term":{`
		queryString += `"currency":0`
		queryString += `}`  // term
		queryString += `},` // must_not
	}
	if params.PriceRange.Valid {
		queryString += `"minimum_should_match":1,`
		queryString += `"should":[`
		if !params.NoPrice.Only && !params.NoPrice.Exclude {
			queryString += `{"term":{`
			queryString += `"currency":0`
			queryString += `}},` // term
		}
		queryString += `{"range":{`
		queryString += `"price":{`
		queryString += `"gte":` + fmt.Sprint(params.PriceRange.Min) + `,`
		queryString += `"lte":` + fmt.Sprint(params.PriceRange.Max)
		queryString += `}`  // price
		queryString += `}}` // range
		queryString += `],` // should
	}
	queryString += `"filter":[`
	if params.Location.Valid {
		queryString += `{"geo_distance":{`
		queryString += `"distance":"` + fmt.Sprint(params.Location.Radius) + `km",`
		queryString += `"location":{`
		queryString += `"lat":"` + fmt.Sprint(params.Location.Latitude) + `",`
		queryString += `"lon":"` + fmt.Sprint(params.Location.Longitude) + `"`
		queryString += `}`   // location
		queryString += `}},` // geo_distance
	}
	queryString += `{"terms":{`
	queryString += `"country":`
	queryString += strings.Join(strings.Fields(fmt.Sprint(params.Countries)), ",")
	queryString += `}}` // terms
	queryString += `]`  // filter
	queryString += `}`  // bool
	queryString += `}`  // query
	queryString += `}`  // root
	query := []byte(queryString)

	req, _ := http.NewRequest(http.MethodPost, "http://lobster-elastic:9200/posts/_search", bytes.NewBuffer(query))
	req.Header.Set("Content-Type", "application/json")

	res, err := elastic.client.Do(req)
	if err != nil {
		return nil, err
	}
	defer res.Body.Close()
	if res.StatusCode != http.StatusOK {
		bodyBytes, _ := io.ReadAll(res.Body)
		bodyString := string(bodyBytes)
		log.Println("BAD ADVANCED POSTS SEARCH: " + bodyString)

		return nil, fmt.Errorf("Failed to search posts: %s", res.Status)
	}

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

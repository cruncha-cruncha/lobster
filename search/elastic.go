package main

import (
	"context"
	"encoding/json"
	"log"

	"github.com/elastic/go-elasticsearch/v8"
	"github.com/elastic/go-elasticsearch/v8/typedapi/core/search"
	"github.com/elastic/go-elasticsearch/v8/typedapi/indices/create"
	"github.com/elastic/go-elasticsearch/v8/typedapi/some"
	"github.com/elastic/go-elasticsearch/v8/typedapi/types"
)

type Elastic struct {
	client *elasticsearch.TypedClient
} 

func NewElastic() Elastic {
	log.Println("Setting up Elasticsearch")

	bgCtx := context.Background()

	cfg := elasticsearch.Config{
		Addresses: []string{
			"http://lobster-elastic:9200",
		},
	}

	typedClient, err := elasticsearch.NewTypedClient(cfg)
	panicOnError(err, "Failed to create Elasticsearch client")

	// not thread-safe
	if exists, err := typedClient.Indices.Exists("posts").Do(bgCtx); err != nil {
		log.Println("Failed to determine if index exists:", err)
	} else if !exists {
		_, err = typedClient.Indices.Create("posts").
			Request(&create.Request{
				Mappings: &types.TypeMapping{
					AllField: &types.AllField{},
					IndexField: &types.IndexField{},
					Meta_: types.Metadata{},
					Source_: &types.SourceField{},
					Properties: map[string]types.Property{
						"uuid":          types.FieldMapping{

						},
						"author_id":     types.NewIntegerNumberProperty(),
						"title":         types.NewTextProperty(),
						"content":       types.NewTextProperty(),
						"price":         types.NewFloatNumberProperty(),
						"currency":      types.NewKeywordProperty(),
						"latitude":      types.NewFloatNumberProperty(), // TODO: geo_point
						"longitude":     types.NewFloatNumberProperty(),
						"created_at":    types.NewDateProperty(),
						"updated_at":    types.NewDateProperty(),
						"comment_count": types.NewIntegerNumberProperty(), // TODO: also rank
					},
				},
			}).Do(bgCtx)
		panicOnError(err, "Failed to create index")
	}

	return Elastic {
		client: typedClient,
	}
}

func (elastic Elastic) ingestPostChange(data PostChangeMessage) error {
	log.Println("ingesting post", data.UUID)

	_, err := elastic.client.Index("posts").
		Id(data.UUID).
		Request(data.Info).
		Do(context.Background())

	return err
}

func (elastic Elastic) basicPostsSearch(query string) ([]PostChangeInfo, error) {
	log.Println("searching for posts with query:", query)

	resp, err := elastic.client.Search().
		Index("posts").
		Request(&search.Request{
			From: some.Int(0),
			Size: some.Int(10),
			Query: &types.Query{
				CombinedFields: &types.CombinedFieldsQuery{
					Fields: []string{"title", "content"},
					//Operator: CombinedFieldsOperator.Or,
					Query: query,
				},
			},
		}).
		Do(context.Background())
	if err != nil {
		return nil, err
	}

	posts := make([]PostChangeInfo, len(resp.Hits.Hits))
	for i, hit := range resp.Hits.Hits {
		var post PostChangeInfo
		if err := json.Unmarshal(hit.Source_, &post); err != nil {
			log.Println("failed to unmarshal post", err)
		} else {
			posts[i] = post
		}
	}

	return posts, nil
}

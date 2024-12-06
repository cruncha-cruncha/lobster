# Lobster
This is a playground for practicing full-stack micro-architecture development. When it's finished (never will be), it'll be a local buy/sell/trade site similar to [Kijiji](https://www.kijiji.ca/).

## Components
- React frontend
- Rust backend for CRUD operations
- PostgreSQL main db / source of truth
- Searchable content ingestion: Rust -> RabbitMQ -> Golang -> ElasticSearch
- Searching: Golang <-> ElasticSearch
- Custom test suite written in Python
- Docker-compose to wrangle it all

## Details
- Users can publish, draft, and delete posts (advertising something for sale)
- Users can comment on a post at most once, but can then edit or delete. All subsequent communication between poster and commenter is through replies to their comment
- Posters can mark an item as sold to a commenter, after which the commenter can leave a review
- Posts, comments, and replies can be reported for abuse
- A user's post and comment history is public

## Roadmap
- need to be able to mark posts as sold
- need to be able to leave a review
- need to be able to report bad behaviour
- expand test suite to include more code paths
- migrate most frontend API calls to use [TanStack / React Query](https://www.npmjs.com/package/@tanstack/react-query) for caching
- add admin and moderator screens
- new activity notifications
- i18n on the frontend

## Setup
- todo

# Lobster
This is a playground for practicing full-stack micro-architecture development. I wanted to hang three paintings in my apartment, perfectly level. I knew someone in the building must have a laser level, wouldn't it be great if we could lend eachother stuff? 

A 'tool' is anything that does not significantly diminish with use. Like a measuring device, cooking utensil, or gardening shovel. Each apartment is a different 'store'. Tools belong to exactly one store. Tools cannot be reserved in advance.

## Technical Specifications
- React frontend
- Rust backend, using the axum framework, and sqlx for db operations
- PostgreSQL db
- Docker-compose to wrangle it all

## Details
- high-level roles: library admin, store admin, user admin.
- other roles: store owner, tool manager.
- Any user can open as many stores as they want
- Every new store is in the 'pending' state until approved by a store admin
- All users can see all other users, stores, tools, and grievances
- Only high-level roles can see user emails
- Any user can open a grievance against another user. The author, accused, and any user admin can reply
- Anyone can sign up with a username and password, but must be approved by a user admin
- Store names must be unique
- Usernames do not have to be unique

## Setup
### Postgres
1. Create a new Postgres database, save the credentials
2. Run, in order, sql/create_tables/fixed.sql, sql/create_tables/main.sql, sql/default_data/fixed.sql, sql/default_data/main.sql
### Backend
1. Create and populate a .env file, based on .env.example
2. Make sure Postgres is running and set up
3. `cd backend`
4. If preparing to run inside docker, `cargo sqlx prepare -- -F cors`, or without `-F cors` if CORS isn't needed
5. If running locally, `cargo run -F cors`
### Frontend
1. `cd frontend`
2. If running locally, `nvm use && npm run dev`, then visit localhost:5173

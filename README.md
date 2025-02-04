# Lobster
This is a playground for practicing full-stack micro-architecture development. I wanted to hang three paintings in my apartment, perfectly level. I knew someone in the building must have a laser level, wouldn't it be great if we could lend eachother stuff? 

A 'tool' is anything that does not significantly diminish with use; like a measuring device, cooking utensil, or gardening shovel. Each apartment is a different 'store'. Tools belong to exactly one store. Tools cannot be reserved in advance.

## Technical Specifications
- React frontend, vite, vanilla js
- Rust backend, axum framework, sqlx
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
- Anyone can sign up with a username and password, but must be approved by a user admin before they're able to login
- Store names must be unique
- Usernames do not have to be unique

## Setup
### Postgres
1. `cd sql`
2. Create a new Postgres database, save the credentials
3. Run, in order, create_tables/fixed.sql, create_tables/main.sql, default_data/fixed.sql, default_data/main.sql
### Backend
1. `cd backend`
2. Create and populate a .env file, based on .env.example
3. Make sure Postgres is running and set up
4. Install/use rust version 1.80 or above
5. If preparing to run inside docker, `cargo sqlx prepare -- -F cors` (omit `-F cors` if CORS support isn't required)
6. If running locally, `cargo run -F cors`
### Frontend
1. `cd frontend`
2. If running locally, confirm VITE_SERVER_URL in .env matches the backend address (HOSTING_ADDR in the backend .env), and update if it doesn't. See .env.docker for how it should be set up.
3. If running locally, install node if not already installed
4. If running locally, `nvm use && npm run dev`, then visit localhost:5173
### Docker
1. Install docker and docker-compose if not already installed
2. `docker-compose build`
3. `docker-compose up`
5. Visit localhost:4173

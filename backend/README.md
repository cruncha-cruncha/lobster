# Backend

Written in Rust, and uses the [Axum framework](https://github.com/tokio-rs/axum). 

I decided to use [sqlx](https://github.com/launchbadge/sqlx) for it's compile-time type-checking. At work we kept pushing code that would throw type errors when querying the db. IMO, the interface between two systems is the perfect place for type checking (see ajv on the frontend), as it protects the validity of all the schemas inside. For sqlx to do it's job, it needs a db connection and prepared queries (run `cargo sqlx prepare`). This would complicate CI/CD, but I'm not there yet.

There are three auth levels: user, moderator, and admin. Authorization is handled by simple [jwt](https://jwt.io/)s with RSA signing. Emails are encrypted at rest with AES. Passwords are hashed with pbkdf2, only 20000 rounds for development. 

Every table/relation has a corresponding file in the db_structs folder, as well as a type for every column. This facilitates reading/insertion, as structs can be built from existing types.

CORS is optionally supported by the cargo feature / build flag "cors".

I'm surprised by how many crates I had to import, and that none of them are stable, bet that seems to be the way of things.
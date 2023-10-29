CREATE TABLE countries (
    id INTEGER GENERATED ALWAYS AS IDENTITY,
    name TEXT NOT NULL,
    PRIMARY KEY (id),
    UNIQUE (name)
);

CREATE TABLE cities (
    id INTEGER GENERATED ALWAYS AS IDENTITY,
    country INTEGER NOT NULL,
    location POINT NOT NULL,
    name TEXT NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_country
      FOREIGN KEY(country) 
        REFERENCES countries(id)
);

CREATE INDEX IF NOT EXISTS idx_cities_location ON cities USING gist(location);

CREATE TABLE languages (
    id INTEGER GENERATED ALWAYS AS IDENTITY,
    name TEXT NOT NULL,
    PRIMARY KEY (id)
);

CREATE TABLE currencies (
    id INTEGER GENERATED ALWAYS AS IDENTITY,
    name TEXT NOT NULL,
    symbol TEXT NOT NULL,
    PRIMARY KEY (id)
);

CREATE TABLE users (
    id INTEGER GENERATED ALWAYS AS IDENTITY,
    name TEXT NOT NULL, -- TODO: external search index?
    ip_address INET NOT NULL,
    email TEXT NOT NULL,
    salt BYTEA NOT NULL,
    password CHAR(64) NOT NULL,
    created_at TIMESTAMP DEFAULT current_timestamp NOT NULL,
    updated_at TIMESTAMP DEFAULT current_timestamp NOT NULL,
    language INTEGER NOT NULL,
    country INTEGER NOT NULL,
    location POINT NOT NULL,
    near TEXT NOT NULL,
    changes JSONB NOT NULL,
    PRIMARY KEY (id),
    UNIQUE (email),
    CONSTRAINT fk_language
      FOREIGN KEY(language)
        REFERENCES languages(id),
    CONSTRAINT fk_country
      FOREIGN KEY(country) 
	    REFERENCES countries(id)
);

CREATE TABLE search_sorts (
    id INTEGER GENERATED ALWAYS AS IDENTITY,
    name TEXT NOT NULL,
    PRIMARY KEY (id),
    UNIQUE (name)
);

-- no primary key nor constraints (for performance)
CREATE TABLE searches (
    user_id INTEGER NOT NULL,
    ip_address INET NOT NULL,
    text TEXT NOT NULL,
    location POINT NOT NULL,
    radius INTEGER NOT NULL,
    price_min DECIMAL,
    price_max DECIMAL,
    country INTEGER,
    sort INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT current_timestamp NOT NULL,
    page INTEGER NOT NULL
);

-- no primary key nor constraints (for performance)
CREATE TABLE post_views (
    user_id INTEGER NOT NULL,
    ip_address INET NOT NULL,
    post_uuid UUID NOT NULL,
    created_at TIMESTAMP DEFAULT current_timestamp NOT NULL
);

CREATE TABLE posts (
    uuid UUID NOT NULL,
    author_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    images TEXT[] NOT NULL,
    content TEXT NOT NULL,
    price DECIMAL NOT NULL,
    currency INTEGER NOT NULL,
    location POINT NOT NULL,
    created_at TIMESTAMP DEFAULT current_timestamp NOT NULL,
    updated_at TIMESTAMP DEFAULT current_timestamp NOT NULL,
    deleted BOOLEAN NOT NULL,
    draft BOOLEAN NOT NULL,
    changes JSONB NOT NULL,
    PRIMARY KEY (uuid),
    CONSTRAINT fk_currency
      FOREIGN KEY(currency)
        REFERENCES currencies(id)
);

CREATE INDEX IF NOT EXISTS idx_posts_author_id ON posts USING btree(author_id);

CREATE TABLE sales (
    post_uuid UUID NOT NULL,
    buyer_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT current_timestamp NOT NULL,
    reviewed_at TIMESTAMP,
    price TEXT NOT NULL,
    rating INTEGER,
    review TEXT,
    PRIMARY KEY(post_uuid)
);

CREATE INDEX IF NOT EXISTS idx_sales_buyer_id ON sales USING btree(buyer_id);

CREATE TABLE resource_types (
    id INTEGER GENERATED ALWAYS AS IDENTITY,
    name TEXT NOT NULL,
    PRIMARY KEY (id),
    UNIQUE (name)
);

CREATE TABLE abuse_status (
    id INTEGER GENERATED ALWAYS AS IDENTITY,
    name TEXT NOT NULL,
    PRIMARY KEY (id),
    UNIQUE (name)
);

CREATE TABLE abuses (
    uuid UUID NOT NULL,
    resource_uuid UUID NOT NULL,
    resource_type INTEGER NOT NULL,
    offender_id INTEGER NOT NULL,
    reporter_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT current_timestamp NOT NULL,
    updated_at TIMESTAMP DEFAULT current_timestamp NOT NULL,
    status INTEGER NOT NULL,
    comments JSONB NOT NULL,
    PRIMARY KEY (uuid),
    CONSTRAINT fk_resource_type
      FOREIGN KEY(resource_type)
        REFERENCES resource_types(id),
    CONSTRAINT fk_status
      FOREIGN KEY(status)
        REFERENCES abuse_status(id)
);

CREATE INDEX IF NOT EXISTS idx_abuses_offender_id ON abuses USING btree(offender_id);
CREATE INDEX IF NOT EXISTS idx_abuses_reporter_id ON abuses USING btree(reporter_id);

CREATE TABLE comments (
    uuid UUID NOT NULL,
    post_uuid UUID NOT NULL,
    author_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT current_timestamp NOT NULL,
    updated_at TIMESTAMP DEFAULT current_timestamp NOT NULL,
    deleted BOOLEAN NOT NULL,
    changes JSONB NOT NULL,
    viewed_by_author BOOLEAN NOT NULL,
    viewed_by_poster BOOLEAN NOT NULL,
    author_notifications JSONB NOT NULL,
    poster_notifications JSONB NOT NULL,
    PRIMARY KEY (uuid),
    UNIQUE (post_uuid, author_id)
);

CREATE INDEX IF NOT EXISTS idx_comments_author_id ON comments USING btree(author_id);

CREATE TABLE replies (
    uuid UUID NOT NULL,
    comment_uuid UUID NOT NULL,
    author_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT current_timestamp NOT NULL,
    updated_at TIMESTAMP DEFAULT current_timestamp NOT NULL,
    deleted BOOLEAN NOT NULL,
    changes JSONB NOT NULL,
    PRIMARY KEY (uuid)
);

CREATE INDEX IF NOT EXISTS idx_replies_comment_uuid ON replies USING hash(comment_uuid);

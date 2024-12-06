CREATE TABLE countries (
    id INTEGER GENERATED ALWAYS AS IDENTITY,
    short TEXT NOT NULL,
    name TEXT NOT NULL,
    PRIMARY KEY (id),
    UNIQUE (name)
);

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

CREATE TABLE invitations (
    id INTEGER GENERATED ALWAYS AS IDENTITY,
    email BYTEA NOT NULL,
    claim_level INTEGER NOT NULL,
    code TEXT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT current_timestamp NOT NULL,
    PRIMARY KEY (id),
    UNIQUE (email)
);

CREATE TABLE recovery_requests (
    id INTEGER GENERATED ALWAYS AS IDENTITY,
    email BYTEA NOT NULL,
    code TEXT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT current_timestamp NOT NULL,
    PRIMARY KEY (id),
    UNIQUE (email)
);

CREATE TABLE users (
    id INTEGER GENERATED ALWAYS AS IDENTITY,
    claim_level INTEGER NOT NULL,
    first_name TEXT NOT NULL, -- TODO: external search index?
    bio TEXT,
    email BYTEA NOT NULL,
    salt BYTEA NOT NULL,
    password BYTEA NOT NULL,
    created_at TIMESTAMPTZ DEFAULT current_timestamp NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT current_timestamp NOT NULL,
    banned_until TIMESTAMPTZ,
    language INTEGER NOT NULL,
    country INTEGER NOT NULL,
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

CREATE TABLE posts (
    uuid UUID NOT NULL,
    author_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    images TEXT[] NOT NULL,
    content TEXT NOT NULL,
    price REAL NOT NULL,
    currency INTEGER NOT NULL,
    country INTEGER NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    created_at TIMESTAMPTZ DEFAULT current_timestamp NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT current_timestamp NOT NULL,
    draft BOOLEAN NOT NULL,
    deleted BOOLEAN NOT NULL,
    sold BOOLEAN NOT NULL, -- denormalized
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
    created_at TIMESTAMPTZ DEFAULT current_timestamp NOT NULL,
    reviewed_at TIMESTAMPTZ,
    price TEXT,
    rating REAL,
    review TEXT,
    changes JSONB NOT NULL,
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
    resource_uuid UUID,
    resource_type INTEGER NOT NULL,
    offender_id INTEGER NOT NULL,
    reporter_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT current_timestamp NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT current_timestamp NOT NULL,
    status INTEGER NOT NULL,
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

CREATE TABLE abuse_comments (
    uuid UUID NOT NULL,
    abuse_uuid UUID NOT NULL,
    author_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT current_timestamp NOT NULL,
    PRIMARY KEY (uuid)
);

CREATE TABLE comments (
    uuid UUID NOT NULL,
    post_uuid UUID NOT NULL,
    poster_id INTEGER NOT NULL, -- denormalized
    author_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT current_timestamp NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT current_timestamp NOT NULL,
    deleted BOOLEAN NOT NULL,
    changes JSONB NOT NULL,
    PRIMARY KEY (uuid),
    UNIQUE (post_uuid, author_id)
);

CREATE INDEX IF NOT EXISTS idx_comments_poster_id ON comments USING btree(poster_id);
CREATE INDEX IF NOT EXISTS idx_comments_author_id ON comments USING btree(author_id);

CREATE TABLE replies (
    uuid UUID NOT NULL,
    comment_uuid UUID NOT NULL,
    author_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT current_timestamp NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT current_timestamp NOT NULL,
    deleted BOOLEAN NOT NULL,
    changes JSONB NOT NULL,
    PRIMARY KEY (uuid)
);

CREATE INDEX IF NOT EXISTS idx_replies_comment_uuid ON replies USING hash(comment_uuid);

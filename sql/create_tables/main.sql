CREATE SCHEMA main;

CREATE TABLE main.library_information (
    uuid UUID DEFAULT gen_random_uuid() NOT NULL,
    name TEXT NOT NULL,
    maximum_rental_period INTEGER NOT NULL, -- hours
    maximum_future INTEGER NOT NULL, -- days
    PRIMARY KEY (uuid)
);

CREATE TABLE main.users (
    id INTEGER GENERATED ALWAYS AS IDENTITY,
    username TEXT NOT NULL,
    status INTEGER NOT NULL,
    email BYTEA NOT NULL,
    created_at TIMESTAMPTZ DEFAULT current_timestamp NOT NULL,
    PRIMARY KEY (id),
    UNIQUE (email),
    CONSTRAINT fk_status
      FOREIGN KEY(status)
        REFERENCES fixed.user_statuses(id)
);

CREATE INDEX IF NOT EXISTS idx_users_email ON main.users USING btree(email);

CREATE TABLE main.permissions (
    id INTEGER GENERATED ALWAYS AS IDENTITY,
    user_id INTEGER NOT NULL,
    role_id INTEGER NOT NULL,
    store_id INTEGER,
    status INTEGER NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_role
      FOREIGN KEY(role_id)
        REFERENCES fixed.roles(id),
    CONSTRAINT fk_status
      FOREIGN KEY(status)
        REFERENCES fixed.permission_statuses(id)
);

CREATE INDEX IF NOT EXISTS idx_permissions_user_id ON main.permissions USING btree(user_id);
CREATE INDEX IF NOT EXISTS idx_permissions_role_id ON main.permissions USING btree(role_id);
CREATE INDEX IF NOT EXISTS idx_permissions_store_id ON main.permissions USING btree(store_id);

CREATE TABLE main.stores (
    id INTEGER GENERATED ALWAYS AS IDENTITY,
    name TEXT NOT NULL,
    status INTEGER NOT NULL,
    location TEXT NOT NULL,
    hours TEXT NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT current_timestamp NOT NULL,
    PRIMARY KEY (id),
    UNIQUE (name),
    CONSTRAINT fk_status
      FOREIGN KEY(status)
        REFERENCES fixed.store_statuses(id)
);

CREATE TABLE main.rental_categories (
    id INTEGER GENERATED ALWAYS AS IDENTITY,
    name TEXT NOT NULL,
    synonyms TEXT[] NOT NULL,
    description TEXT,
    default_rental_period INTEGER,
    PRIMARY KEY (id)
);

CREATE TABLE main.rental_category_relationships (
    parent_id INTEGER NOT NULL,
    child_id INTEGER NOT NULL,
    PRIMARY KEY (parent_id, child_id),
    CONSTRAINT fk_parent
      FOREIGN KEY(parent_id)
        REFERENCES main.rental_categories(id),
    CONSTRAINT fk_child
      FOREIGN KEY(child_id)
        REFERENCES main.rental_categories(id)
);

CREATE TABLE main.tools (
    id INTEGER GENERATED ALWAYS AS IDENTITY,
    real_id TEXT,
    store_id INTEGER NOT NULL,
    category_id INTEGER,
    default_rental_period INTEGER,
    description TEXT,
    pictures TEXT[] NOT NULL,
    status INTEGER NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_status
      FOREIGN KEY(status)
        REFERENCES fixed.tool_statuses(id)
);

CREATE INDEX IF NOT EXISTS idx_tools_store_id ON main.tools USING btree(store_id);
CREATE INDEX IF NOT EXISTS idx_tools_category_id ON main.tools USING btree(category_id);

CREATE TABLE main.rentals (
    id INTEGER GENERATED ALWAYS AS IDENTITY,
    tool_id INTEGER NOT NULL,
    renter_id INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT current_timestamp NOT NULL,
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    pickup_date TIMESTAMPTZ,
    return_date TIMESTAMPTZ,
    status INTEGER NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_status
      FOREIGN KEY(status)
        REFERENCES fixed.rental_statuses(id)
);

CREATE INDEX IF NOT EXISTS idx_rentals_tool_id ON main.rentals USING btree(tool_id);
CREATE INDEX IF NOT EXISTS idx_rentals_renter_id ON main.rentals USING btree(renter_id);

CREATE TABLE main.grievances (
    id INTEGER GENERATED ALWAYS AS IDENTITY,
    author_id INTEGER NOT NULL,
    accused_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT current_timestamp NOT NULL,
    status INTEGER NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_status
      FOREIGN KEY(status)
        REFERENCES fixed.grievance_statuses(id)
);
CREATE SCHEMA IF NOT EXISTS main;

CREATE TABLE main.library_information (
    uuid UUID DEFAULT gen_random_uuid() NOT NULL,
    name TEXT NOT NULL,
    PRIMARY KEY (uuid)
);

CREATE TABLE main.users (
    id INTEGER GENERATED ALWAYS AS IDENTITY,
    username TEXT NOT NULL,
    status INTEGER NOT NULL,
    email_address TEXT NOT NULL,
    salt BYTEA NOT NULL,
    password BYTEA NOT NULL,
    created_at TIMESTAMPTZ DEFAULT current_timestamp NOT NULL,
    code TEXT NOT NULL,
    PRIMARY KEY (id),
    UNIQUE (email_address),
    UNIQUE (code),
    CONSTRAINT fk_status
      FOREIGN KEY(status)
        REFERENCES fixed.user_statuses(id)
);

CREATE INDEX IF NOT EXISTS idx_users_email ON main.users USING btree(email_address);

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
    email_address TEXT,
    phone_number TEXT NOT NULL,
    rental_information TEXT,
    other_information TEXT,
    code TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT current_timestamp NOT NULL,
    PRIMARY KEY (id),
    UNIQUE (name),
    UNIQUE (code),
    CONSTRAINT fk_status
      FOREIGN KEY(status)
        REFERENCES fixed.store_statuses(id)
);

CREATE TABLE main.tool_categories (
    id INTEGER GENERATED ALWAYS AS IDENTITY,
    name TEXT NOT NULL,
    synonyms TEXT[] NOT NULL,
    description TEXT,
    PRIMARY KEY (id)
);

CREATE TABLE main.tools (
    id INTEGER GENERATED ALWAYS AS IDENTITY,
    real_id TEXT NOT NULL,
    store_id INTEGER NOT NULL,
    rental_hours INTEGER NOT NULL,
    short_description TEXT NOT NULL,
    long_description TEXT,
    status INTEGER NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_status
      FOREIGN KEY(status)
        REFERENCES fixed.tool_statuses(id)
);

CREATE INDEX IF NOT EXISTS idx_tools_store_id ON main.tools USING btree(store_id);
CREATE INDEX IF NOT EXISTS idx_tools_category_id ON main.tools USING btree(category_id);

CREATE TABLE main.tool_photos (
    id INTEGER GENERATED ALWAYS AS IDENTITY,
    tool_id INTEGER,
    photo_key TEXT NOT NULL,
    original_name TEXT NOT NULL,
    PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_tool_photos_tool_id ON main.tool_photos USING btree(tool_id);
CREATE INDEX IF NOT EXISTS idx_tool_photos_photo_key ON main.tool_photos USING btree(photo_key);

CREATE TABLE main.tool_classifications (
    tool_id INTEGER NOT NULL,
    category_id INTEGER NOT NULL,
    PRIMARY KEY (tool_id, category_id)
);

CREATE INDEX IF NOT EXISTS idx_tool_classifications_tool_id ON main.tool_classifications USING btree(tool_id);
CREATE INDEX IF NOT EXISTS idx_tool_classifications_category_id ON main.tool_classifications USING btree(category_id);

CREATE TABLE main.rentals (
    id INTEGER GENERATED ALWAYS AS IDENTITY,
    tool_id INTEGER NOT NULL,
    renter_id INTEGER NOT NULL,
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ,
    PRIMARY KEY (id)
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

CREATE INDEX IF NOT EXISTS idx_grievances_author_id ON main.grievances USING btree(author_id);
CREATE INDEX IF NOT EXISTS idx_grievances_accused_id ON main.grievances USING btree(accused_id);

CREATE TABLE main.grievance_replies (
    id INTEGER GENERATED ALWAYS AS IDENTITY,
    grievance_id INTEGER NOT NULL,
    author_id INTEGER NOT NULL,
    text TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT current_timestamp NOT NULL,
    PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_grievance_replies_grievance_id ON main.grievance_replies USING btree(grievance_id);

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_fuzzy_users ON main.users
  USING gist(username gist_trgm_ops(siglen=256));

CREATE INDEX IF NOT EXISTS idx_fuzzy_users_with_email ON main.users
  USING gist((username || ' ' || email_address) gist_trgm_ops(siglen=256));

CREATE INDEX IF NOT EXISTS idx_fuzzy_stores ON main.stores
  USING gist((name || ' ' || COALESCE(rental_information, '') || ' ' || COALESCE(other_information, '')) gist_trgm_ops(siglen=256));

CREATE INDEX IF NOT EXISTS idx_fuzzy_stores_with_contact ON main.stores
  USING gist((name || ' ' || location || ' ' || COALESCE(email_address, '') || ' ' || phone_number || ' ' || COALESCE(rental_information, '') || ' ' || COALESCE(other_information, '')) gist_trgm_ops(siglen=256));

CREATE INDEX IF NOT EXISTS idx_fuzzy_tool_categories ON main.tool_categories
  USING gist((name || ' ' || COALESCE(description, '') || ' ' || ARRAY_TO_STRING(synonyms, ' ')) gist_trgm_ops(siglen=256));

CREATE INDEX IF NOT EXISTS idx_fuzzy_tools ON main.tools
  USING gist((real_id || ' ' || short_description || ' ' || COALESCE(long_description, '')) gist_trgm_ops(siglen=256));

CREATE INDEX IF NOT EXISTS idx_fuzzy_grievances ON main.grievances
  USING gist(title gist_trgm_ops(siglen=256));
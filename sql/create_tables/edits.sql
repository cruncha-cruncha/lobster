CREATE SCHEMA edits;

CREATE TABLE edits.library_information (
    id INTEGER GENERATED ALWAYS AS IDENTITY,
    editor_id INTEGER NOT NULL,
    changes JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT current_timestamp NOT NULL,
    PRIMARY KEY (id)
)

CREATE INDEX IF NOT EXISTS idx_library_information_editor_id ON edits.library_information USING btree(editor_id);

CREATE TABLE edits.users (
    id INTEGER GENERATED ALWAYS AS IDENTITY,
    user_id INTEGER NOT NULL,
    editor_id INTEGER NOT NULL,
    changes JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT current_timestamp NOT NULL,
    PRIMARY KEY (id)
)

CREATE INDEX IF NOT EXISTS idx_user_edits_user_id ON edits.users USING btree(user_id);
CREATE INDEX IF NOT EXISTS idx_user_edits_editor_id ON edits.users USING btree(editor_id);

CREATE TABLE edits.rentals (
    id INTEGER GENERATED ALWAYS AS IDENTITY,
    rental_id INTEGER NOT NULL,
    editor_id INTEGER NOT NULL,
    changes JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT current_timestamp NOT NULL,
    PRIMARY KEY (id)
)

CREATE INDEX IF NOT EXISTS idx_rental_edits_rental_id ON edits.rentals USING btree(rental_id);
CREATE INDEX IF NOT EXISTS idx_rental_edits_editor_id ON edits.rentals USING btree(editor_id);

CREATE TABLE edits.stores (
    id INTEGER GENERATED ALWAYS AS IDENTITY,
    store_id INTEGER NOT NULL,
    editor_id INTEGER NOT NULL,
    changes JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT current_timestamp NOT NULL,
    PRIMARY KEY (id)
)

CREATE INDEX IF NOT EXISTS idx_store_edits_store_id ON edits.stores USING btree(store_id);
CREATE INDEX IF NOT EXISTS idx_store_edits_editor_id ON edits.stores USING btree(editor_id);

CREATE TABLE edits.tools (
    id INTEGER GENERATED ALWAYS AS IDENTITY,
    tool_id INTEGER NOT NULL,
    editor_id INTEGER NOT NULL,
    changes JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT current_timestamp NOT NULL,
    PRIMARY KEY (id)
)

CREATE INDEX IF NOT EXISTS idx_tool_edits_tool_id ON edits.tools USING btree(tool_id);
CREATE INDEX IF NOT EXISTS idx_tool_edits_editor_id ON edits.tools USING btree(editor_id);

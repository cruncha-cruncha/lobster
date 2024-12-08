CREATE TABLE public.library (
    uuid UUID DEFAULT gen_random_uuid() NOT NULL,
    name TEXT NOT NULL,
    maximum_rental_period INTEGER,
    PRIMARY KEY (uuid)
);

CREATE TABLE public.password_reset_requests (
    id INTEGER GENERATED ALWAYS AS IDENTITY,
    email BYTEA NOT NULL,
    code TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT current_timestamp NOT NULL,
    PRIMARY KEY (id),
    UNIQUE (email)
);

CREATE TABLE public.users (
    id INTEGER GENERATED ALWAYS AS IDENTITY,
    username TEXT NOT NULL,
    status INTEGER NOT NULL,
    email BYTEA NOT NULL,
    salt BYTEA NOT NULL,
    password BYTEA NOT NULL,
    PRIMARY KEY (id),
    UNIQUE (username),
    UNIQUE (email),
    CONSTRAINT fk_status
      FOREIGN KEY(status)
        REFERENCES fixed.user_statuses(id)
);

CREATE TABLE public.library_permissions (
    id INTEGER GENERATED ALWAYS AS IDENTITY,
    user_id INTEGER NOT NULL,
    role_id INTEGER NOT NULL,
    status INTEGER NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_role
      FOREIGN KEY(role_id)
        REFERENCES fixed.roles(id),
    CONSTRAINT fk_status
      FOREIGN KEY(status)
        REFERENCES fixed.permission_statuses(id)
);

CREATE INDEX IF NOT EXISTS idx_library_permissions_user_id ON public.library_permissions USING btree(user_id);

CREATE TABLE public.vendor_permissions (
    id INTEGER GENERATED ALWAYS AS IDENTITY,
    user_id INTEGER NOT NULL,
    role_id INTEGER NOT NULL,
    store_id INTEGER NOT NULL,
    status INTEGER NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_role
      FOREIGN KEY(role_id)
        REFERENCES fixed.roles(id),
    CONSTRAINT fk_status
      FOREIGN KEY(status)
        REFERENCES fixed.permission_statuses(id)
);

CREATE INDEX IF NOT EXISTS idx_vendor_permissions_user_id ON public.vendor_permissions USING btree(user_id);
CREATE INDEX IF NOT EXISTS idx_vendor_permissions_store_id ON public.vendor_permissions USING btree(store_id);

CREATE TABLE public.stores (
    id INTEGER GENERATED ALWAYS AS IDENTITY,
    name TEXT NOT NULL,
    status INTEGER NOT NULL,
    description TEXT NOT NULL,
    PRIMARY KEY (id),
    UNIQUE (name),
    CONSTRAINT fk_status
      FOREIGN KEY(status)
        REFERENCES fixed.store_statuses(id)
)

CREATE TABLE public.rental_categories (
    id INTEGER GENERATED ALWAYS AS IDENTITY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    default_rental_period INTEGER,
    PRIMARY KEY (id),
    UNIQUE (name),
)

CREATE TABLE public.rental_category_relationships (
    parent_id INTEGER NOT NULL,
    child_id INTEGER NOT NULL,
    PRIMARY KEY (parent_id, child_id),
    CONSTRAINT fk_parent
      FOREIGN KEY(parent_id)
        REFERENCES public.rental_categories(id),
    CONSTRAINT fk_child
      FOREIGN KEY(child_id)
        REFERENCES public.rental_categories(id)
)

CREATE TABLE public.tools (
    id INTEGER GENERATED ALWAYS AS IDENTITY,
    real_id TEXT NOT NULL,
    store_id INTEGER NOT NULL,
    category_id INTEGER NOT NULL,
    default_rental_period INTEGER,
    description TEXT NOT NULL,
    pictures TEXT[] NOT NULL,
    status INTEGER NOT NULL,
    -- TODO: optional extras, attachments, implements, parts, etc.
    PRIMARY KEY (id),
    CONSTRAINT fk_status
      FOREIGN KEY(status)
        REFERENCES fixed.tool_statuses(id)
)

CREATE INDEX IF NOT EXISTS idx_tools_store_id ON public.tools USING btree(store_id);
CREATE INDEX IF NOT EXISTS idx_tools_category_id ON public.tools USING btree(category_id);

CREATE TABLE public.rentals (
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
)

CREATE INDEX IF NOT EXISTS idx_rentals_tool_id ON public.rentals USING btree(tool_id);
CREATE INDEX IF NOT EXISTS idx_rentals_renter_id ON public.rentals USING btree(renter_id);

CREATE TABLE public.grievances (
    id INTEGER GENERATED ALWAYS AS IDENTITY,
    author_id INTEGER NOT NULL,
    accused_id INTEGER NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT current_timestamp NOT NULL,
    status INTEGER NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_status
      FOREIGN KEY(status)
        REFERENCES fixed.grievance_statuses(id)
)
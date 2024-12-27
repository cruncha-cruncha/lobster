CREATE SCHEMA fixed;

CREATE TABLE fixed.roles (
    id INTEGER GENERATED ALWAYS AS IDENTITY,
    name TEXT NOT NULL,
    PRIMARY KEY (id),
    UNIQUE (name)
);

CREATE TABLE fixed.user_statuses (
    id INTEGER GENERATED ALWAYS AS IDENTITY,
    name TEXT NOT NULL,
    PRIMARY KEY (id),
    UNIQUE (name)
);

CREATE TABLE fixed.permission_statuses (
    id INTEGER GENERATED ALWAYS AS IDENTITY,
    name TEXT NOT NULL,
    PRIMARY KEY (id),
    UNIQUE (name)
);

CREATE TABLE fixed.store_statuses (
    id INTEGER GENERATED ALWAYS AS IDENTITY,
    name TEXT NOT NULL,
    PRIMARY KEY (id),
    UNIQUE (name)
);

CREATE TABLE fixed.tool_statuses (
    id INTEGER GENERATED ALWAYS AS IDENTITY,
    name TEXT NOT NULL,
    PRIMARY KEY (id),
    UNIQUE (name)
);

CREATE TABLE fixed.grievance_statuses (
    id INTEGER GENERATED ALWAYS AS IDENTITY,
    name TEXT NOT NULL,
    PRIMARY KEY (id),
    UNIQUE (name)
);

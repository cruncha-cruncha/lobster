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


INSERT INTO fixed.roles (name)
VALUES ('library_admin'), ('user_admin'), ('store_admin'), ('store_rep'), ('tool_manager');

INSERT INTO fixed.user_statuses (name)
VALUES ('active'), ('inactive'), ('suspended'), ('banned');

INSERT INTO fixed.permission_statuses (name)
VALUES ('active'), ('inactive'), ('revoked'), ('relinquished');

INSERT INTO fixed.store_statuses (name)
VALUES ('active'), ('inactive'), ('pending'), ('closed'), ('deleted'), ('suspended'), ('banned');

INSERT INTO fixed.tool_statuses (name)
VALUES ('available'), ('rented'), ('maintenance'), ('broken'), ('lost'), ('stolen'), ('retired');

INSERT INTO fixed.grievance_statuses (name)
VALUES ('open'), ('closed'), ('resolved'), ('escalated'), ('dismissed'), ('ban'), ('suspension');


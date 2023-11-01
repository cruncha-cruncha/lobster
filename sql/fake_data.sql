INSERT INTO users (name, ip_address, email, salt, password, created_at, updated_at, language, country, latitude, longitude, near, changes)
VALUES (
    'Liam',
    '192.168.0.1',
    '_@gmail.com',
    '',
    '',
    NOW(),
    NOW(),
    1,
    1,
    45.4215,
    -75.6972,
    'Center Town',
    '{}'::JSONB
);

INSERT INTO posts (uuid, author_id, title, images, content, price, currency, latitude, longitude, created_at, updated_at, draft, deleted, changes)
VALUES (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    1,
    'My first post',
    '{"https://www.google.com/images/branding/googlelogo/1x/googlelogo_color_272x92dp.png"}',
    'This is my first post',
    0.0,
    1,
    45.4215,
    -75.6972,
    NOW(),
    NOW(),
    FALSE,
    FALSE,
    '[]'::JSONB
);

INSERT INTO comments (uuid, post_uuid, author_id, content, created_at, updated_at, deleted, changes, viewed_by_author, viewed_by_poster)
VALUES (
    'b2e67c99-9c0b-4ef8-bb6d-6bb9bd380a12',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    1,
    'This is my first comment',
    NOW(),
    NOW(),
    FALSE,
    '[]'::JSONB,
    FALSE,
    FALSE
);

INSERT INTO replies (uuid, comment_uuid, author_id, content, created_at, updated_at, deleted, changes)
VALUES (
    'c3e67c99-9c0b-4ef8-bb6d-6bb9bd380a13',
    'b2e67c99-9c0b-4ef8-bb6d-6bb9bd380a12',
    1,
    'This is my first reply',
    NOW(),
    NOW(),
    FALSE,
    '[]'::JSONB
);


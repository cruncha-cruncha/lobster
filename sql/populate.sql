INSERT INTO countries (name)
VALUES ('Canada');

INSERT INTO cities (country, latitude, longitude, name)
VALUES (1, 45.4215, -75.6972, 'Ottawa');

INSERT INTO languages (name)
VALUES ('English'), ('French');

INSERT INTO currencies (name, symbol)
VALUES ('Canadian Dollar', 'CAD');

INSERT INTO search_sorts (name)
VALUES ('Newest'), ('Oldest'), ('Price (Low to High)'), ('Price (High to Low)');

INSERT INTO resource_types (name)   
VALUES ('user'), ('post'), ('comment'), ('reply'), ('sale'), ('review');

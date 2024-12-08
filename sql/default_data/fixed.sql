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

INSERT INTO fixed.rental_statuses (name)
VALUES ('pending'), ('cancelled'), ('rented'), ('returned'), ('bad'), ('forgiven');

INSERT INTO fixed.grievance_statuses (name)
VALUES ('open'), ('closed'), ('resolved'), ('dismissed'), ('ban'), ('suspension');


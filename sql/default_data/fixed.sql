INSERT INTO fixed.roles (name)
VALUES ('library_admin'), ('user_admin'), ('store_admin'), ('store_rep'), ('tool_manager');

INSERT INTO fixed.user_statuses (name)
VALUES ('active'), ('pending'), ('banned');

INSERT INTO fixed.permission_statuses (name)
VALUES ('active'), ('revoked');

INSERT INTO fixed.store_statuses (name)
VALUES ('active'), ('pending'), ('closed'), ('banned');

INSERT INTO fixed.tool_statuses (name)
VALUES ('available'), ('rented'), ('maintenance'), ('broken'), ('lost'), ('stolen'), ('retired');

INSERT INTO fixed.grievance_statuses (name)
VALUES ('open'), ('closed');


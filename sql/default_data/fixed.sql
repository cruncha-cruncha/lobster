INSERT INTO fixed.roles (name)
VALUES ('library_admin'), ('user_admin'), ('store_admin'), ('store_manager'), ('tool_manager');

INSERT INTO fixed.user_statuses (name)
VALUES ('active'), ('pending'), ('banned');

INSERT INTO fixed.permission_statuses (name)
VALUES ('active'), ('revoked');

INSERT INTO fixed.store_statuses (name)
VALUES ('active'), ('pending'), ('closed'), ('banned');

INSERT INTO fixed.tool_statuses (name)
VALUES ('available'), ('rented'), ('maintenance'), ('broken'), ('lost'), ('stolen'), ('retired'), ('unknown');

INSERT INTO fixed.grievance_statuses (name)
VALUES ('pending'), ('innocent'), ('guilty'), ('banned'), ('warned'), ('cautioned'), ('cheeky'), ('insulting'), ('time_served'), ('forgiven'), ('wrongly_convicted'), ('libelled'), ('at_large');


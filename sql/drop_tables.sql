DROP INDEX IF EXISTS idx_posts_author_id;
DROP INDEX IF EXISTS idx_sales_buyer_id;
DROP INDEX IF EXISTS idx_abuses_offender_id;
DROP INDEX IF EXISTS idx_abuses_reporter_id;
DROP INDEX IF EXISTS idx_comments_poster_id;
DROP INDEX IF EXISTS idx_comments_author_id;
DROP INDEX IF EXISTS idx_replies_comment_uuid;

DROP TABLE IF EXISTS replies;
DROP TABLE IF EXISTS comments;
DROP TABLE IF EXISTS abuses;
DROP TABLE IF EXISTS abuse_status;
DROP TABLE IF EXISTS resource_types;
DROP TABLE IF EXISTS sales;
DROP TABLE IF EXISTS posts;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS recovery_requests;
DROP TABLE IF EXISTS invitations;
DROP TABLE IF EXISTS currencies;
DROP TABLE IF EXISTS languages;
DROP TABLE IF EXISTS countries;


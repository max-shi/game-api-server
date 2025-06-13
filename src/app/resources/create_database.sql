-- SQLite scripts for dropping existing tables and recreating the database table structure

-- DROP EVERYTHING --
-- Tables/views must be dropped in reverse order due to referential constraints (foreign keys).
DROP TABLE IF EXISTS `game_review`;
DROP TABLE IF EXISTS `wishlist`;
DROP TABLE IF EXISTS `owned`;
DROP TABLE IF EXISTS `game_platforms`;
DROP TABLE IF EXISTS `platform`;
DROP TABLE IF EXISTS `game`;
DROP TABLE IF EXISTS `genre`;
DROP TABLE IF EXISTS `user`;

-- TABLES --
-- Tables must be created in a particular order due to referential constraints i.e. foreign keys.

CREATE TABLE `user` (
  `id`          INTEGER       PRIMARY KEY AUTOINCREMENT,
  `email`       TEXT          NOT NULL,
  `first_name`  TEXT          NOT NULL,
  `last_name`   TEXT          NOT NULL,
  `image_filename`  TEXT      DEFAULT NULL,
  `password`    TEXT          NOT NULL, -- Only store the hash here, not the actual password!
  `auth_token`  TEXT          DEFAULT NULL,
  UNIQUE (`email`)
);

CREATE TABLE `genre` (
  `id`         INTEGER     PRIMARY KEY AUTOINCREMENT,
  `name`       TEXT        NOT NULL,
  UNIQUE (`name`)
);

CREATE TABLE `platform` (
  `id`          INTEGER     PRIMARY KEY AUTOINCREMENT,
  `name`        TEXT        NOT NULL,
  UNIQUE (`name`)
);

CREATE TABLE `game` (
  `id`                          INTEGER         PRIMARY KEY AUTOINCREMENT,
  `title`                       TEXT            NOT NULL,
  `description`                 TEXT            NOT NULL,
  `creation_date`               DATETIME        NOT NULL,
  `image_filename`              TEXT            NULL,
  `creator_id`                  INTEGER         NOT NULL,
  `genre_id`                    INTEGER         NOT NULL,
  `price`                       INTEGER         NOT NULL,
  UNIQUE (`title`),
  FOREIGN KEY (`creator_id`) REFERENCES `user` (`id`),
  FOREIGN KEY (`genre_id`) REFERENCES `genre` (`id`)
);

CREATE TABLE `game_platforms` (
    `id`            INTEGER     PRIMARY KEY AUTOINCREMENT,
    `game_id`       INTEGER     NOT NULL,
    `platform_id`   INTEGER     NOT NULL,
    UNIQUE (`game_id`, `platform_id`),
    FOREIGN KEY (`game_id`) REFERENCES `game` (`id`),
    FOREIGN KEY (`platform_id`) REFERENCES `platform` (`id`)
);

CREATE TABLE `wishlist` (
  `id`                          INTEGER         PRIMARY KEY AUTOINCREMENT,
  `game_id`                     INTEGER         NOT NULL,
  `user_id`                     INTEGER         NOT NULL,
  UNIQUE (`game_id`, `user_id`),
  FOREIGN KEY (`game_id`) REFERENCES `game` (`id`),
  FOREIGN KEY (`user_id`) REFERENCES `user` (`id`)
);

CREATE TABLE `owned` (
  `id`                          INTEGER         PRIMARY KEY AUTOINCREMENT,
  `game_id`                     INTEGER         NOT NULL,
  `user_id`                     INTEGER         NOT NULL,
  UNIQUE (`game_id`, `user_id`),
  FOREIGN KEY (`game_id`) REFERENCES `game` (`id`),
  FOREIGN KEY (`user_id`) REFERENCES `user` (`id`)
);


CREATE TABLE `game_review` (
  `id`                          INTEGER         PRIMARY KEY AUTOINCREMENT,
  `game_id`                     INTEGER         NOT NULL,
  `user_id`                     INTEGER         NOT NULL,
  `rating`                      INTEGER         NOT NULL,
  `review`                      TEXT            NULL,
  `timestamp`                   DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (`game_id`, `user_id`),
  FOREIGN KEY (`game_id`) REFERENCES `game` (`id`),
  FOREIGN KEY (`user_id`) REFERENCES `user` (`id`)
);

INSERT INTO `platform` (`name`) VALUES
  ('PC'),
  ('Xbox'),
  ('Playstation 5'),
  ('Nintendo Switch'),
  ('Mobile');

INSERT INTO `genre` (`name`) VALUES
  ('Action'),
  ('Adventure'),
  ('RPG'),
  ('Puzzle'),
  ('Simulation'),
  ('Strategy'),
  ('Sports'),
  ('Horror'),
  ('Racing'),
  ('Fighting');


INSERT INTO `game` (`title`, `description`, `creation_date`, `image_filename`, `creator_id`, `genre_id`, `price`) VALUES
  ('Battle Quest', 'A high-stakes action game set in a mythical world.', '2024-10-15 14:30:00', 'battle_quest.jpg', 1, 1, 0),
  ('Mystic Realms', 'Explore ancient ruins and uncover hidden secrets in this adventure game.', '2024-10-16 09:15:00', 'mystic_realms.jpg', 2, 2, 3999),
  ('Dragon Slayer', 'An epic RPG journey filled with dragons, magic, and choices that matter.', '2024-11-01 16:45:00', 'dragon_slayer.jpg', 3, 3, 5999),
  ('Mind Bender', 'Challenge yourself with puzzles that get increasingly difficult.', '2024-09-05 11:20:00', 'mind_bender.jpg', 4, 4, 999),
  ('Farm Life', 'A relaxing simulation game where you build your own farm.', '2024-08-22 10:00:00', 'farm_life.jpg', 5, 5, 1999),
  ('Empire Conquest', 'Lead your armies to victory in this strategy game.', '2024-07-10 13:00:00', 'empire_conquest.jpg', 6, 6, 2999),
  ('Goal Masters', 'A sports game focused on realistic soccer gameplay.', '2024-06-15 15:30:00', 'goal_masters.jpg', 7, 7, 0),
  ('Nightmare Escape', 'Survive the horrors of an abandoned asylum.', '2024-05-20 20:00:00', 'nightmare_escape.jpg', 8, 8, 3999),
  ('Speed Racer', 'An intense racing game on challenging tracks.', '2024-04-12 17:45:00', 'speed_racer.jpg', 9, 9, 2999),
  ('Martial Fury', 'A fighting game with martial arts and combos.', '2024-03-29 18:30:00', 'martial_fury.jpg', 10, 10, 4499),
  ('Warrior Legends', 'Step into the shoes of a hero in an action-filled world.', '2024-01-20 15:00:00', 'warrior_legends.jpg', 11, 1, 0),
  ('Cave Explorer', 'Adventure deep into a mysterious cave system.', '2024-02-02 09:30:00', 'cave_explorer.jpg', 12, 2, 3499),
  ('Fantasy Quest', 'A classic RPG with magic, quests, and exploration.', '2024-07-25 13:45:00', 'fantasy_quest.jpg', 13, 3, 5999),
  ('Puzzle Escape', 'A unique puzzle game that challenges your mind.', '2024-03-17 14:00:00', 'puzzle_escape.jpg', 14, 4, 1499),
  ('City Builder', 'Build and manage your own city.', '2024-06-10 11:15:00', 'city_builder.jpg', 15, 5, 2499),
  ('Galactic War', 'Strategize and conquer the galaxy.', '2024-04-22 12:45:00', 'galactic_war.jpg', 16, 6, 5499),
  ('Street Soccer', 'Experience the thrill of street soccer.', '2024-07-10 10:30:00', 'street_soccer.jpg', 17, 7, 2999),
  ('Haunted Manor', 'A horror game set in a haunted mansion.', '2024-05-28 19:45:00', 'haunted_manor.jpg', 18, 8, 0),
  ('Turbo Drift', 'Race through various environments in fast cars.', '2024-04-10 17:15:00', 'turbo_drift.jpg', 19, 9, 3799),
  ('Samurai Duel', 'Fight against enemies in samurai battles.', '2024-02-12 16:00:00', 'samurai_duel.jpg', 20, 10, 4499),
  ('Alien Invasion', 'Protect Earth from alien threats in this action game.', '2024-01-14 10:20:00', 'alien_invasion.jpg', 1, 1, 5299),
  ('Mystery Island', 'Adventure across a deserted island with hidden secrets.', '2024-09-15 14:50:00', 'mystery_island.jpg', 2, 2, 4399);


INSERT INTO `game_platforms` (`game_id`, `platform_id`) VALUES
  (1, 1),
  (1, 2),
  (1, 3),
  (2, 1),
  (2, 3),
  (3, 1),
  (4, 5),
  (5, 1),
  (5, 5),
  (6, 1),
  (6, 2),
  (7, 3),
  (7, 2),
  (8, 3),
  (9, 1),
  (9, 4),
  (10, 3),
  (10, 2),
  (11, 1),
  (11, 2),
  (12, 4),
  (13, 1),
  (14, 5),
  (15, 1),
  (15, 4),
  (16, 1),
  (16, 2),
  (16, 3),
  (17, 3),
  (18, 3),
  (18, 4),
  (19, 1),
  (19, 4),
  (20, 2),
  (21, 1),
  (21, 3),
  (22, 4),
  (22, 5); -- Mystery Island: Nintendo Switch, Mobile


INSERT INTO `wishlist` (`game_id`, `user_id`) VALUES
  (1, 2),  -- User 2 wishes for Battle Quest
  (2, 3),  -- User 3 wishes for Mystic Realms
  (3, 4),  -- User 4 wishes for Dragon Slayer
  (4, 5),  -- User 5 wishes for Mind Bender
  (5, 6),  -- User 6 wishes for Farm Life
  (6, 7),  -- User 7 wishes for Empire Conquest
  (7, 8),  -- User 8 wishes for Goal Masters
  (8, 9),  -- User 9 wishes for Nightmare Escape
  (9, 10), -- User 10 wishes for Speed Racer
  (10, 11), -- User 11 wishes for Martial Fury
  (11, 12), -- User 12 wishes for Warrior Legends
  (12, 13), -- User 13 wishes for Cave Explorer
  (13, 14), -- User 14 wishes for Fantasy Quest
  (14, 15), -- User 15 wishes for Puzzle Escape
  (15, 16), -- User 16 wishes for City Builder
  (17, 18), -- User 18 wishes for Street Soccer
  (18, 19), -- User 19 wishes for Haunted Manor
  (19, 20), -- User 20 wishes for Turbo Drift
  (20, 1),  -- User 1 wishes for Samurai Duel
  (21, 5),  -- User 5 wishes for Alien Invasion
  (22, 6),  -- User 6 wishes for Mystery Island
  (3, 2),   -- User 2 also wishes for Dragon Slayer
  (4, 2),   -- User 2 also wishes for Mind Bender
  (8, 3),   -- User 3 also wishes for Nightmare Escape
  (10, 4),  -- User 4 also wishes for Martial Fury
  (11, 5),  -- User 5 also wishes for Warrior Legends
  (13, 5),  -- User 5 also wishes for Fantasy Quest
  (14, 6),  -- User 6 also wishes for Puzzle Escape
  (15, 7),  -- User 7 also wishes for City Builder
  (16, 8),  -- User 8 also wishes for Galactic War
  (19, 9),  -- User 9 also wishes for Turbo Drift
  (20, 10), -- User 10 also wishes for Samurai Duel
  (21, 11), -- User 11 also wishes for Alien Invasion
  (6, 15),  -- User 15 also wishes for Empire Conquest
  (18, 16), -- User 16 also wishes for Haunted Manor
  (22, 17), -- User 17 also wishes for Mystery Island
  (4, 18),  -- User 18 also wishes for Mind Bender
  (10, 19), -- User 19 also wishes for Martial Fury
  (1, 20),  -- User 20 also wishes for Battle Quest
  (2, 13),  -- User 13 also wishes for Mystic Realms
  (5, 14);  -- User 14 also wishes for Farm Life



INSERT INTO `owned` (`game_id`, `user_id`) VALUES
  (2, 4),  -- User 4 owns Mystic Realms
  (3, 5),  -- User 5 owns Dragon Slayer
  (4, 6),  -- User 6 owns Mind Bender
  (5, 7),  -- User 7 owns Farm Life
  (6, 8),  -- User 8 owns Empire Conquest
  (7, 9),  -- User 9 owns Goal Masters
  (8, 10), -- User 10 owns Nightmare Escape
  (9, 11), -- User 11 owns Speed Racer
  (10, 12), -- User 12 owns Martial Fury
  (11, 3),  -- User 3 owns Warrior Legends
  (12, 2),  -- User 2 owns Cave Explorer
  (13, 20), -- User 20 owns Fantasy Quest
  (14, 19), -- User 19 owns Puzzle Escape
  (15, 18), -- User 18 owns City Builder
  (16, 17), -- User 17 owns Galactic War
  (17, 16), -- User 16 owns Street Soccer
  (18, 15), -- User 15 owns Haunted Manor
  (19, 14), -- User 14 owns Turbo Drift
  (20, 13), -- User 13 owns Samurai Duel
  (21, 12), -- User 12 owns Alien Invasion
  (22, 11), -- User 11 owns Mystery Island
  (7, 2),   -- User 2 also owns Goal Masters
  (9, 3),   -- User 3 also owns Speed Racer
  (12, 4),  -- User 4 also owns Cave Explorer
  (16, 5),  -- User 5 also owns Galactic War
  (17, 6),  -- User 6 also owns Street Soccer
  (18, 7),  -- User 7 also owns Haunted Manor
  (19, 8),  -- User 8 also owns Turbo Drift
  (20, 9),  -- User 9 also owns Samurai Duel
  (14, 10), -- User 10 also owns Puzzle Escape
  (1, 11),  -- User 11 also owns Battle Quest
  (6, 12),  -- User 12 also owns Empire Conquest
  (15, 13), -- User 13 also owns City Builder
  (22, 14), -- User 14 also owns Mystery Island
  (13, 15), -- User 15 also owns Fantasy Quest
  (5, 16),  -- User 16 also owns Farm Life
  (8, 17),  -- User 17 also owns Nightmare Escape
  (21, 18), -- User 18 also owns Alien Invasion
  (3, 19),  -- User 19 also owns Dragon Slayer
  (4, 20),  -- User 20 also owns Mind Bender
  (2, 12),  -- User 12 also owns Mystic Realms
  (2, 1),   -- User 1 also owns Mystic Realms
  (4, 1),   -- User 1 also owns Mind Bender
  (7, 1),   -- User 1 also owns Goal Masters
  (9, 1);   -- User 1 also owns Speed Racer

INSERT INTO `game_review` (`game_id`, `user_id`, `rating`, `review`, `timestamp`) VALUES
  (1, 3, 8, 'Exciting gameplay and well-designed quests.', '2024-11-01 10:15:30'),
  (1, 4, 7, 'A bit repetitive but overall a solid game.', '2024-11-02 14:22:10'),
  (2, 5, 9, 'Fantastic world-building and story!', '2024-11-03 16:45:00'),
  (2, 6, 6, 'Graphics are great but mechanics need improvement.', '2024-11-04 18:12:20'),
  (3, 7, 10, 'An absolute masterpiece!', '2024-11-05 12:30:45'),
  (3, 8, 7, 'Loved the combat system but the story felt short.', '2024-11-06 13:45:15'),
  (4, 9, 8, 'A great puzzle game with a unique twist.', '2024-11-07 15:00:00'),
  (4, 10, 6, 'Decent, but not very engaging.', '2024-11-08 19:15:30'),
  (5, 11, 9, 'Relaxing and fun for all ages!', '2024-11-09 17:45:30'),
  (5, 12, 8, 'Simple yet addictively fun.', '2024-11-10 20:30:00'),
  (6, 13, 7, 'Challenging and rewarding.', '2024-11-11 09:30:00'),
  (6, 14, 9, 'A great strategy game for fans of the genre.', '2024-11-11 10:15:00'),
  (7, 15, 8, 'Perfect for sports fans!', '2024-11-01 11:00:00'),
  (7, 16, 7, 'Good graphics but lacks innovation.', '2024-11-02 12:15:30'),
  (8, 17, 6, 'Creepy atmosphere but clunky controls.', '2024-11-03 13:30:00'),
  (8, 18, 8, 'Scary and thrilling from start to finish.', '2024-11-04 15:15:30'),
  (9, 19, 10, 'The racing mechanics are flawless!', '2024-11-05 16:45:30'),
  (9, 20, 9, 'Fast-paced and super fun!', '2024-11-06 18:00:00'),
  (10, 1, 8, 'Great fighting game with excellent character design.', '2024-11-07 19:30:00'),
  (10, 2, 7, 'Good but feels unbalanced at times.', '2024-11-08 21:15:00'),
  (11, 3, 6, 'Fun but lacks depth in the gameplay.', '2024-11-09 22:30:00'),
  (11, 4, 8, 'Solid mechanics and a lot of replay value.', '2024-11-10 23:45:30'),
  (12, 5, 9, 'Exploration feels amazing in this game!', '2024-11-11 08:15:30'),
  (12, 6, 7, 'Could use more content but a good start.', '2024-11-01 09:30:00'),
  (13, 7, 8, 'A magical journey for all ages.', '2024-11-02 10:15:30'),
  (13, 8, 10, 'Simply incredible storytelling.', '2024-11-03 11:00:00'),
  (14, 9, 7, 'Challenging puzzles but sometimes too obscure.', '2024-11-04 12:15:30'),
  (14, 10, 8, 'A very satisfying puzzle experience.', '2024-11-05 13:30:00'),
  (15, 11, 9, 'Great builder game with lots of options.', '2024-11-06 15:15:30'),
  (15, 12, 8, 'Creative and engaging gameplay.', '2024-11-07 16:45:30'),
  (16, 13, 10, 'A sci-fi war epic!', '2024-11-08 18:00:00'),
  (16, 14, 9, 'Deep strategy with endless possibilities.', '2024-11-09 19:30:00'),
  (17, 15, 7, 'Fun soccer mechanics but a bit buggy.', '2024-11-10 21:15:00'),
  (17, 16, 8, 'Great multiplayer experience.', '2024-11-11 22:30:00'),
  (18, 17, 6, 'Haunting visuals but lacks polish.', '2024-11-01 23:45:30'),
  (18, 18, 8, 'A spooky and entertaining adventure.', '2024-11-02 08:15:30'),
  (19, 19, 9, 'High-speed action with great tracks.', '2024-11-03 09:30:00'),
  (19, 20, 7, 'Good fun, but could use more variety.', '2024-11-04 10:15:30'),
  (20, 1, 8, 'Great sword combat with deep mechanics.', '2024-11-05 11:00:00'),
  (20, 2, 9, 'An excellent action game.', '2024-11-06 12:15:30');
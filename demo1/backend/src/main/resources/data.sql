INSERT INTO room (name, floor, capacity) VALUES ('Fjorden', 2, 8);
INSERT INTO room (name, floor, capacity) VALUES ('Vidda', 2, 4);
INSERT INTO room (name, floor, capacity) VALUES ('Skogen', 3, 12);
INSERT INTO room (name, floor, capacity) VALUES ('Telefonboksen', 3, 1);

-- Seed bookings relative to Monday of the current week, so the calendar is never empty.
-- DATEADD('DAY', 1 - ISO_DAY_OF_WEEK(CURRENT_DATE), CURRENT_DATE) = this week's Monday.
INSERT INTO booking (room_id, title, booked_by, start_time, end_time) VALUES
    (1, 'Sprint planning', 'Kari',
        DATEADD('HOUR', 9,  CAST(DATEADD('DAY', 1 - ISO_DAY_OF_WEEK(CURRENT_DATE), CURRENT_DATE) AS TIMESTAMP)),
        DATEADD('HOUR', 10, CAST(DATEADD('DAY', 1 - ISO_DAY_OF_WEEK(CURRENT_DATE), CURRENT_DATE) AS TIMESTAMP))),
    (1, 'Arkitekturmøte', 'Ola',
        DATEADD('HOUR', 13, CAST(DATEADD('DAY', 2 - ISO_DAY_OF_WEEK(CURRENT_DATE), CURRENT_DATE) AS TIMESTAMP)),
        DATEADD('HOUR', 15, CAST(DATEADD('DAY', 2 - ISO_DAY_OF_WEEK(CURRENT_DATE), CURRENT_DATE) AS TIMESTAMP))),
    (2, '1:1 Kari/Per', 'Per',
        DATEADD('HOUR', 10, CAST(DATEADD('DAY', 3 - ISO_DAY_OF_WEEK(CURRENT_DATE), CURRENT_DATE) AS TIMESTAMP)),
        DATEADD('HOUR', 11, CAST(DATEADD('DAY', 3 - ISO_DAY_OF_WEEK(CURRENT_DATE), CURRENT_DATE) AS TIMESTAMP))),
    (3, 'Demo for kunde', 'Lise',
        DATEADD('HOUR', 9,  CAST(DATEADD('DAY', 4 - ISO_DAY_OF_WEEK(CURRENT_DATE), CURRENT_DATE) AS TIMESTAMP)),
        DATEADD('HOUR', 12, CAST(DATEADD('DAY', 4 - ISO_DAY_OF_WEEK(CURRENT_DATE), CURRENT_DATE) AS TIMESTAMP))),
    (3, 'Fredagslunsj', 'Ola',
        DATEADD('HOUR', 11, CAST(DATEADD('DAY', 5 - ISO_DAY_OF_WEEK(CURRENT_DATE), CURRENT_DATE) AS TIMESTAMP)),
        DATEADD('HOUR', 12, CAST(DATEADD('DAY', 5 - ISO_DAY_OF_WEEK(CURRENT_DATE), CURRENT_DATE) AS TIMESTAMP)));

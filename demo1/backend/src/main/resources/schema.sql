CREATE TABLE room (
    id       BIGINT AUTO_INCREMENT PRIMARY KEY,
    name     VARCHAR(100) NOT NULL,
    floor    INT          NOT NULL,
    capacity INT          NOT NULL
);

CREATE TABLE booking (
    id         BIGINT AUTO_INCREMENT PRIMARY KEY,
    room_id    BIGINT       NOT NULL REFERENCES room (id),
    title      VARCHAR(200) NOT NULL,
    booked_by  VARCHAR(100) NOT NULL,
    -- "start"/"end" are reserved words in SQL, hence the _time suffix.
    start_time TIMESTAMP    NOT NULL,
    end_time   TIMESTAMP    NOT NULL
);

CREATE TABLE IF NOT EXISTS card (
    id         BIGINT AUTO_INCREMENT PRIMARY KEY,
    title      VARCHAR(100) NOT NULL,
    assignee   VARCHAR(50),
    priority   VARCHAR(10)  NOT NULL,
    status     VARCHAR(20)  NOT NULL,
    created_at TIMESTAMP    NOT NULL
);

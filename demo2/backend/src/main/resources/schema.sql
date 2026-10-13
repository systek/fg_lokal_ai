CREATE TABLE claim (
    id               BIGINT AUTO_INCREMENT PRIMARY KEY,
    employee         VARCHAR(100)  NOT NULL,
    purpose          VARCHAR(200)  NOT NULL,
    status           VARCHAR(20)   NOT NULL,
    created_at       TIMESTAMP WITH TIME ZONE NOT NULL,
    submitted_at     TIMESTAMP WITH TIME ZONE,
    decided_by       VARCHAR(100),
    decided_at       TIMESTAMP WITH TIME ZONE,
    rejection_reason VARCHAR(500)
);

CREATE TABLE claim_line (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    claim_id    BIGINT        NOT NULL REFERENCES claim (id),
    -- Stored as the enum name, e.g. 'MILEAGE'. Spring Data R2DBC maps enums to strings by default.
    category    VARCHAR(20)   NOT NULL,
    description VARCHAR(200)  NOT NULL,
    -- NOK incl. VAT for receipts, km for mileage, days for per diem.
    amount      DECIMAL(12, 2) NOT NULL
);

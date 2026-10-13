-- Claim 1: approved trip to a customer in Bergen.
INSERT INTO claim (employee, purpose, status, created_at, submitted_at, decided_by, decided_at)
VALUES ('Kari Nordmann', 'Kundemøte hos Bergen Energi', 'APPROVED',
        TIMESTAMP WITH TIME ZONE '2026-09-02 08:15:00+02', TIMESTAMP WITH TIME ZONE '2026-09-05 16:40:00+02',
        'Ola Leder', TIMESTAMP WITH TIME ZONE '2026-09-07 09:12:00+02');

INSERT INTO claim_line (claim_id, category, description, amount) VALUES
    (1, 'MILEAGE', 'Hjemme - Gardermoen t/r', 120),
    (1, 'HOTEL', 'Clarion Hotel Admiral, 1 natt', 1450.00),
    (1, 'MEALS', 'Middag med kunde', 389.00);

-- Claim 2: conference trip, waiting for approval.
INSERT INTO claim (employee, purpose, status, created_at, submitted_at)
VALUES ('Per Hansen', 'JavaZone 2026, Oslo', 'SUBMITTED',
        TIMESTAMP WITH TIME ZONE '2026-09-20 10:00:00+02', TIMESTAMP WITH TIME ZONE '2026-09-21 14:30:00+02');

INSERT INTO claim_line (claim_id, category, description, amount) VALUES
    (2, 'TRANSPORT', 'Fly Trondheim - Oslo t/r', 1207.50),
    (2, 'HOTEL', 'Thon Hotel Opera, 2 netter', 2689.00),
    (2, 'MEALS', 'Middag, konferansekveld', 380.00),
    (2, 'MILEAGE', 'Hjemme - Værnes t/r', 42);

-- Claim 3: draft, still being filled in.
INSERT INTO claim (employee, purpose, status, created_at)
VALUES ('Kari Nordmann', 'Workshop i Trondheim', 'DRAFT', TIMESTAMP WITH TIME ZONE '2026-10-08 12:00:00+02');

INSERT INTO claim_line (claim_id, category, description, amount) VALUES
    (3, 'PER_DIEM', 'Diett, 2,5 døgn', 2.5),
    (3, 'TRANSPORT', 'Tog Oslo - Trondheim t/r', 1895.00);

-- Seed data: 30 cards. Cards created in the same planning session share a timestamp.
INSERT INTO card (title, assignee, priority, status, created_at) VALUES
-- Sprint planning 1
('Set up CI pipeline',                     'Kari',   'HIGH',   'DONE',        TIMESTAMP '2026-09-01 09:00:00'),
('Create Spring Boot skeleton',            'Ola',    'HIGH',   'DONE',        TIMESTAMP '2026-09-01 09:00:00'),
('Choose database for prod',               'Ingrid', 'MEDIUM', 'DONE',        TIMESTAMP '2026-09-01 09:00:00'),
('Define REST naming conventions',         'Lars',   'LOW',    'DONE',        TIMESTAMP '2026-09-01 09:00:00'),
('Add health endpoint',                    'Kari',   'MEDIUM', 'DONE',        TIMESTAMP '2026-09-01 09:00:00'),
('Write onboarding guide',                 NULL,     'LOW',    'TODO',        TIMESTAMP '2026-09-01 09:00:00'),
-- Ad hoc
('Fix flaky login test',                   'Ola',    'HIGH',   'DONE',        TIMESTAMP '2026-09-03 14:12:00'),
('Bump Kotlin to 2.x',                     'Lars',   'MEDIUM', 'DONE',        TIMESTAMP '2026-09-04 10:30:00'),
-- Sprint planning 2
('Card drag-and-drop on board',            'Ingrid', 'HIGH',   'IN_PROGRESS', TIMESTAMP '2026-09-15 09:00:00'),
('Live updates with SSE',                  'Ola',    'HIGH',   'IN_PROGRESS', TIMESTAMP '2026-09-15 09:00:00'),
('Backlog page with filtering',            'Kari',   'MEDIUM', 'IN_PROGRESS', TIMESTAMP '2026-09-15 09:00:00'),
('Edit card dialog',                       NULL,     'MEDIUM', 'TODO',        TIMESTAMP '2026-09-15 09:00:00'),
('Delete card with confirmation',          NULL,     'LOW',    'TODO',        TIMESTAMP '2026-09-15 09:00:00'),
('Show assignee avatars',                  'Lars',   'LOW',    'TODO',        TIMESTAMP '2026-09-15 09:00:00'),
('Keyboard shortcuts for moving cards',    NULL,     'LOW',    'TODO',        TIMESTAMP '2026-09-15 09:00:00'),
('Audit log of card moves',                'Ingrid', 'MEDIUM', 'TODO',        TIMESTAMP '2026-09-15 09:00:00'),
-- Ad hoc
('Investigate slow board load',            'Ola',    'HIGH',   'TODO',        TIMESTAMP '2026-09-18 11:45:00'),
('Add WIP limit to In Progress',           'Kari',   'MEDIUM', 'TODO',        TIMESTAMP '2026-09-19 13:20:00'),
('Dark mode',                              NULL,     'LOW',    'TODO',        TIMESTAMP '2026-09-19 13:20:00'),
-- Sprint planning 3
('Service layer for cards',                'Lars',   'MEDIUM', 'TODO',        TIMESTAMP '2026-09-29 09:00:00'),
('Integration tests for card API',         'Ingrid', 'HIGH',   'TODO',        TIMESTAMP '2026-09-29 09:00:00'),
('Validate title length in UI',            'Kari',   'LOW',    'TODO',        TIMESTAMP '2026-09-29 09:00:00'),
('Due dates on cards',                     NULL,     'MEDIUM', 'TODO',        TIMESTAMP '2026-09-29 09:00:00'),
('Labels / tags on cards',                 NULL,     'LOW',    'TODO',        TIMESTAMP '2026-09-29 09:00:00'),
('Export backlog to CSV',                  'Ola',    'LOW',    'TODO',        TIMESTAMP '2026-09-29 09:00:00'),
('Archive old DONE cards',                 'Lars',   'MEDIUM', 'TODO',        TIMESTAMP '2026-09-29 09:00:00'),
-- Ad hoc
('Prod incident: SSE disconnects',         'Ola',    'HIGH',   'IN_PROGRESS', TIMESTAMP '2026-10-02 08:05:00'),
('Postmortem for SSE incident',            'Kari',   'MEDIUM', 'TODO',        TIMESTAMP '2026-10-05 15:00:00'),
('Upgrade Spring Boot patch version',      'Lars',   'LOW',    'TODO',        TIMESTAMP '2026-10-06 10:00:00'),
('Demo for stakeholders',                  'Ingrid', 'HIGH',   'TODO',        TIMESTAMP '2026-10-06 10:00:00');

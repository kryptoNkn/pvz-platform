INSERT INTO users (id, username, email, password_hash, role)
VALUES
    (
        '11111111-1111-1111-1111-111111111111',
        'Operator Test',
        '90000000001',
        '$argon2id$v=19$m=4096,t=3,p=1$hawjkAuZOR9+s12QtlQvuA$rMixsE7Q37THJ+udIWi/D3HZZJkfw8nGsn1RKDBSJdo',
        'operator'
    ),
    (
        '22222222-2222-2222-2222-222222222222',
        'Admin Test',
        '90000000002',
        '$argon2id$v=19$m=4096,t=3,p=1$EPlaDY0bgUWqwOKgB+3BvQ$Wz4NgLLsJgZrSYA9GgKqrg4TrPfmDg2xmn8ZjiFTUKE',
        'admin'
    ),
    (
        '33333333-3333-3333-3333-333333333333',
        'Owner Test',
        '90000000003',
        '$argon2id$v=19$m=4096,t=3,p=1$ZqpZsOXdWDHWGJV+scRlXA$teIc/slDbax3GC0vv4NUzH6FSfjhxbGFrYX01Nq2RNo',
        'owner'
    )
ON CONFLICT (email) DO NOTHING;

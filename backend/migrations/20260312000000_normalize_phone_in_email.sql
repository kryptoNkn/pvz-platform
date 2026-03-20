DELETE FROM users
WHERE id IN (
    SELECT id FROM (
        SELECT id,
               ROW_NUMBER() OVER (
                   PARTITION BY regexp_replace(email, '[^0-9]', '', 'g')
                   ORDER BY created_at ASC
               ) AS rn
        FROM users
        WHERE email ~ '^\+?[0-9]+$'
    ) sub
    WHERE rn > 1
);

UPDATE users
SET email = regexp_replace(email, '[^0-9]', '', 'g')
WHERE email ~ '^\+?[0-9]+$';

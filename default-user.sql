INSERT INTO users (id, username, password) 
VALUES (1, 'default', 'password')
ON CONFLICT (id) DO NOTHING;

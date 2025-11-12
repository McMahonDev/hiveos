-- Debug script to check shared list issues
-- Run this to see what's happening with shared lists

-- 1. Check all user group memberships
SELECT 
    ugm.id,
    ugm.user_id,
    ugm.user_group_id,
    u.email as user_email,
    u.name as user_name,
    ug.name as group_name
FROM user_group_members ugm
JOIN "user" u ON ugm.user_id = u.id
JOIN user_groups ug ON ugm.user_group_id = ug.id
ORDER BY ugm.user_group_id, u.email;

-- 2. Check shopping list items and their assignments
SELECT 
    sl.id,
    sl.name as item_name,
    sl.assigned_to_id,
    sl.view_mode,
    sl.store,
    creator.email as created_by_email,
    sl.created_at
FROM shopping_list sl
JOIN "user" creator ON sl.created_by_id = creator.id
WHERE sl.view_mode = 'shared'
ORDER BY sl.created_at DESC
LIMIT 20;

-- 3. Check if assigned_to_id matches any group IDs
SELECT 
    sl.id,
    sl.name as item_name,
    sl.assigned_to_id,
    sl.view_mode,
    CASE 
        WHEN EXISTS (SELECT 1 FROM user_groups WHERE id = sl.assigned_to_id) THEN 'Is Group ID'
        WHEN EXISTS (SELECT 1 FROM "user" WHERE id = sl.assigned_to_id) THEN 'Is User ID'
        ELSE 'Unknown ID'
    END as id_type
FROM shopping_list sl
WHERE sl.view_mode = 'shared';

-- 4. Check events with the same issue
SELECT 
    e.id,
    e.name as event_name,
    e.assigned_to_id,
    e.view_mode,
    creator.email as created_by_email,
    e.created_at
FROM events e
JOIN "user" creator ON e.created_by_id = creator.id
WHERE e.view_mode = 'shared'
ORDER BY e.created_at DESC
LIMIT 20;

-- 5. Show group membership with actual shopping list items
SELECT 
    ug.name as group_name,
    ug.id as group_id,
    u.email as member_email,
    COUNT(DISTINCT sl.id) as shopping_items_count
FROM user_groups ug
JOIN user_group_members ugm ON ug.id = ugm.user_group_id
JOIN "user" u ON ugm.user_id = u.id
LEFT JOIN shopping_list sl ON sl.assigned_to_id = ug.id AND sl.view_mode = 'shared'
GROUP BY ug.id, ug.name, u.email
ORDER BY ug.name, u.email;

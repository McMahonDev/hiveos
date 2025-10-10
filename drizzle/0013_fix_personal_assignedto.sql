-- Corrective migration to fix assignedToId for personal items
-- Items in personal mode should be assigned to their creator, not to a group

-- Update events: set assignedToId to createdById for personal items
UPDATE events 
SET "assignedToId" = "createdById" 
WHERE "viewMode" = 'personal' 
  AND "assignedToId" != "createdById";

-- Update shopping list: set assignedToId to createdById for personal items  
UPDATE "shoppingList" 
SET "assignedToId" = "createdById" 
WHERE "viewMode" = 'personal' 
  AND "assignedToId" != "createdById";

-- Update custom lists: set assignedToId to createdById for personal items
-- Note: customLists might not have assignedToId, only createdById

-- Update custom list items: set assignedToId to createdById for personal items
-- Note: customListItems might not have assignedToId, only createdById

-- Verify the changes
SELECT 'Events fixed:' as message, COUNT(*) as count 
FROM events 
WHERE "viewMode" = 'personal' AND "assignedToId" = "createdById";

SELECT 'Shopping items fixed:' as message, COUNT(*) as count 
FROM "shoppingList" 
WHERE "viewMode" = 'personal' AND "assignedToId" = "createdById";

-- Migration to set default viewMode values for existing data
-- Run this after adding the viewMode column

-- Set all existing events to 'personal' mode
UPDATE events SET "viewMode" = 'personal' WHERE "viewMode" IS NULL;

-- Set all existing shopping list items to 'personal' mode  
UPDATE "shoppingList" SET "viewMode" = 'personal' WHERE "viewMode" IS NULL;

-- Set all existing custom lists to 'personal' mode
UPDATE "customLists" SET "viewMode" = 'personal' WHERE "viewMode" IS NULL;

-- Set all existing custom list items to 'personal' mode
UPDATE "customListItems" SET "viewMode" = 'personal' WHERE "viewMode" IS NULL;

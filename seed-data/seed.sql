CREATE DATABASE zstart;
CREATE DATABASE zstart_cvr;
CREATE DATABASE zstart_cdb;

\c zstart;

CREATE TABLE "users" (
  "id" TEXT PRIMARY KEY, -- Auto-increment primary key
  "name" TEXT NOT NULL, -- User's name
  "email" TEXT NOT NULL UNIQUE -- User's email with UNIQUE constraint
);

CREATE TABLE "tasks" (
  "id" TEXT PRIMARY KEY, -- Auto-increment primary key
  "name" TEXT NOT NULL, -- Task name
  "status" BOOLEAN NOT NULL, -- Task status (true/false)
  "createdById" TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE, -- Foreign key to users
  "assignedToId" TEXT NOT NULL REFERENCES "users"("id") ON DELETE CASCADE -- Foreign key to users
);


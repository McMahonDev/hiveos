CREATE DATABASE zstart;
CREATE DATABASE zstart_cvr;
CREATE DATABASE zstart_cdb;

\c zstart;

CREATE TABLE "user" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT,
    "email" TEXT,
);

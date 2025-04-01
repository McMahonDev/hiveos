import { createZeroSchema } from "drizzle-zero";
import { definePermissions } from "@rocicorp/zero"
import type { Row } from "@rocicorp/zero";
import * as drizzleSchema from "$lib/zero/schema";

// Convert to Zero schema
export const schema = createZeroSchema(drizzleSchema, {

  tables: {
    users: {
      id: true,
      name: true,
      email: true,
    },
    tasks: {
      id: true,
      title: true,
      description: true,
      createdAt: true,
      updatedAt: true,
      userId: true,
      status: true,
    },
  }
});

// Define permissions with the inferred types from Drizzle
export type Schema = typeof schema;
export type User = Row<typeof schema.tables.users>;
export type Task = Row<typeof schema.tables.tasks>;

export const permissions = definePermissions(schema, () => ({}));
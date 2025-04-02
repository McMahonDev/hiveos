import {
  createSchema,
  definePermissions,
  type Row,
  table,
  string,
  relationships,
  number,
  boolean,
  ANYONE_CAN
} from "@rocicorp/zero";

const users = table("users")
  .columns({
    id: string(),
    name: string(),
    email: string(),
  })
  .primaryKey("id");

const tasks = table("tasks")
  .columns({
    id: string(),
    name: string(),
    status: boolean(),
    createdById: string(),
    assignedToId: string(),
  })
  .primaryKey("id");

const taskRelationships = relationships(tasks, ({ one }) => ({
  createdBy: one({
    sourceField: ["createdById"],
    destSchema: users,
    destField: ["id"],
  }),
  assignedTo: one({
    sourceField: ["assignedToId"],
    destSchema: users,
    destField: ["id"],
  }),
}));

export const schema = createSchema({
  tables: [users, tasks],
  relationships: [taskRelationships],
});

export type Schema = typeof schema;
export type User = Row<typeof schema.tables.users>;
export type Task = Row<typeof schema.tables.tasks>;

export const permissions = definePermissions(schema, () => {
return{
  tasks:{
    row: {
      select: ANYONE_CAN,
      insert: ANYONE_CAN,
      update:{
        preMutation: ANYONE_CAN,
        postMutation: ANYONE_CAN,
      }
    }
  }
}
});
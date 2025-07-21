import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../server/db/index.ts";
import { schema } from "../combinedSchema.ts";
 
export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg", // or "pg" or "mysql"
    schema: schema
  }), 
 
  emailAndPassword: { 
    enabled: true, 
  },
  advanced:{
    cookiePrefix: "hiveos", // Prefix for cookies
  },
  trustedOrigins: ["http://localhost:5173", "http://localhost:5174"]
  
});
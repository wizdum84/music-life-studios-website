import "dotenv/config";

import { promisify } from "node:util";
import { randomBytes, scrypt } from "node:crypto";
import { storage } from "../server/storage";

const chunks: Buffer[] = [];
for await (const chunk of process.stdin) chunks.push(Buffer.from(chunk));
const password = Buffer.concat(chunks).toString("utf8").replace(/[\r\n]+$/, "");
if (password.length < 8) throw new Error("Password must be at least 8 characters");

const admin = await storage.getAdminUser();
if (!admin) throw new Error("No administrator account was found");

const salt = randomBytes(16).toString("hex");
const derived = await promisify(scrypt)(password, salt, 64) as Buffer;
await storage.updateUser(admin.id, { password: `${derived.toString("hex")}.${salt}` });
console.log(`Administrator password updated. Login username: ${admin.username}`);

import "dotenv/config";

import { promisify } from "node:util";
import { randomBytes, scrypt } from "node:crypto";
import { storage } from "../server/storage";

const chunks: Buffer[] = [];
for await (const chunk of process.stdin) chunks.push(Buffer.from(chunk));
const password = Buffer.concat(chunks).toString("utf8").replace(/[\r\n]+$/, "");
if (password.length < 8) throw new Error("Password must be at least 8 characters");

const beat = (await storage.getAllBeats()).find((item) => item.title.trim().toLowerCase() === "rokit");
if (!beat) throw new Error("ROKIT beat was not found");
const purchase = (await storage.getBeatPurchasesByBeat(beat.id))
  .filter((item) => item.licenseStatus === "active" && item.userId)
  .sort((a, b) => b.id - a.id)[0];
if (!purchase?.userId) throw new Error("An active ROKIT customer account was not found");
const user = await storage.getUser(purchase.userId);
if (!user) throw new Error("The ROKIT customer account was not found");

const salt = randomBytes(16).toString("hex");
const derived = await promisify(scrypt)(password, salt, 64) as Buffer;
await storage.updateUser(user.id, { password: `${derived.toString("hex")}.${salt}` });
console.log(`Password updated. Login username: ${user.username}`);

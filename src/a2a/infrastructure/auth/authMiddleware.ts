import type { Context, Next } from "hono";
import type { AppEnv } from "./types.js";
import { verifyToken } from "./JwtValidator.js";

export async function authMiddleware(c: Context<AppEnv>, next: Next) {
  const header = c.req.header("Authorization");
  if (!header || !header.startsWith("Bearer ")) {
    return c.json({ error: "Missing or invalid Authorization header" }, 401);
  }

  const token = header.slice(7);

  try {
    const payload = verifyToken(token);
    c.set("callerSub", payload.sub);
    c.set("callerRole", payload.role);
    await next();
  } catch {
    return c.json({ error: "Invalid or expired token" }, 401);
  }
}
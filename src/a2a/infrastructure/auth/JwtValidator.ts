import jwt from "jsonwebtoken";

export interface JwtPayload {
  sub: string;
  role: string;
}

export function verifyToken(token: string): JwtPayload {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not configured");
  }

  const decoded = jwt.verify(token, secret, { algorithms: ["HS256"] }) as JwtPayload;

  if (typeof decoded.sub !== "string" || !decoded.sub) {
    throw new Error("Token missing or invalid sub claim");
  }
  if (typeof decoded.role !== "string" || !decoded.role) {
    throw new Error("Token missing or invalid role claim");
  }

  return decoded;
}
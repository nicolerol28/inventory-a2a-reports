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

  const decoded = jwt.verify(token, secret) as JwtPayload;
  return decoded;
}
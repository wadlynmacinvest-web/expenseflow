import { type Request, type Response, type NextFunction } from "express";
import jwt from "jsonwebtoken";
import type { User } from "@workspace/db";
import { getUserById, hasDatabase } from "../lib/devStore";

export interface AuthRequest extends Request {
  user?: Omit<User, "password">;
}

const authMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  let token: string | undefined;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
        id: number;
      };

      if (!hasDatabase()) {
        const found = getUserById(decoded.id);
        if (!found) {
          res.status(401).json({ message: "Not Authorized" });
          return;
        }

        req.user = found;
        next();
        return;
      }

      res.status(500).json({ message: "Database-backed auth requires a configured database" });
      return;
    } catch {
      req.log.warn("Auth token invalid or expired");
      res.status(401).json({ message: "Not Authorized" });
      return;
    }
  }

  if (!token) {
    res.status(401).json({ message: "No Token Found" });
    return;
  }
};

export default authMiddleware;

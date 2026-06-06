import { type Request, type Response, type NextFunction } from "express";
import jwt from "jsonwebtoken";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import type { User } from "@workspace/db";

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

      const [found] = await db
        .select({
          id: usersTable.id,
          fullName: usersTable.fullName,
          email: usersTable.email,
          monthlyBudget: usersTable.monthlyBudget,
          createdAt: usersTable.createdAt,
          updatedAt: usersTable.updatedAt,
        })
        .from(usersTable)
        .where(eq(usersTable.id, decoded.id));

      if (!found) {
        res.status(401).json({ message: "Not Authorized" });
        return;
      }

      req.user = found;
      next();
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

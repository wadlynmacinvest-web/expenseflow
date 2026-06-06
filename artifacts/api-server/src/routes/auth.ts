import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import authMiddleware, { type AuthRequest } from "../middlewares/auth";

const router: IRouter = Router();

const generateToken = (id: number): string =>
  jwt.sign({ id }, process.env.JWT_SECRET as string, { expiresIn: "30d" });

router.post("/auth/register", async (req, res): Promise<void> => {
  const { fullName, email, password } = req.body as {
    fullName: string;
    email: string;
    password: string;
  };

  if (!fullName || !email || !password) {
    res.status(400).json({ message: "fullName, email and password are required" });
    return;
  }

  const [existing] = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.email, email));

  if (existing) {
    res.status(400).json({ message: "User already exists" });
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const [user] = await db
    .insert(usersTable)
    .values({ fullName, email, password: hashedPassword })
    .returning({
      id: usersTable.id,
      fullName: usersTable.fullName,
      email: usersTable.email,
      monthlyBudget: usersTable.monthlyBudget,
    });

  res.status(201).json({ ...user, token: generateToken(user.id) });
});

router.post("/auth/login", async (req, res): Promise<void> => {
  const { email, password } = req.body as { email: string; password: string };

  if (!email || !password) {
    res.status(400).json({ message: "email and password are required" });
    return;
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email));

  if (!user || !(await bcrypt.compare(password, user.password))) {
    res.status(401).json({ message: "Invalid Credentials" });
    return;
  }

  res.json({
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    monthlyBudget: user.monthlyBudget,
    token: generateToken(user.id),
  });
});

router.get(
  "/auth/profile",
  authMiddleware,
  async (req: AuthRequest, res): Promise<void> => {
    res.json(req.user);
  }
);

router.put(
  "/auth/profile",
  authMiddleware,
  async (req: AuthRequest, res): Promise<void> => {
    const { fullName, monthlyBudget } = req.body as {
      fullName?: string;
      monthlyBudget?: number;
    };

    if (fullName == null && monthlyBudget == null) {
      res.status(400).json({ message: "Provide fullName or monthlyBudget to update" });
      return;
    }

    const [updated] = await db
      .update(usersTable)
      .set({
        ...(fullName !== undefined && { fullName }),
        ...(monthlyBudget !== undefined && { monthlyBudget }),
      })
      .where(eq(usersTable.id, req.user!.id))
      .returning({
        id: usersTable.id,
        fullName: usersTable.fullName,
        email: usersTable.email,
        monthlyBudget: usersTable.monthlyBudget,
        createdAt: usersTable.createdAt,
        updatedAt: usersTable.updatedAt,
      });

    res.json(updated);
  }
);

export default router;

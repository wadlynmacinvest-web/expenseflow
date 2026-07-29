import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import authMiddleware, { type AuthRequest } from "../middlewares/auth";
import { createUser, findUserByEmail, hasDatabase, updateUser } from "../lib/devStore";

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

  if (!hasDatabase()) {
    if (findUserByEmail(email)) {
      res.status(400).json({ message: "User already exists" });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = createUser({
      fullName,
      email,
      password: hashedPassword,
      monthlyBudget: 0,
    });

    res.status(201).json({ ...user, token: generateToken(user.id) });
    return;
  }

  res.status(500).json({ message: "Database-backed auth requires a configured database" });
});

router.post("/auth/login", async (req, res): Promise<void> => {
  const { email, password } = req.body as { email: string; password: string };

  if (!email || !password) {
    res.status(400).json({ message: "email and password are required" });
    return;
  }

  if (!hasDatabase()) {
    const user = findUserByEmail(email);

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
    return;
  }

  res.status(500).json({ message: "Database-backed auth requires a configured database" });
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

    if (!hasDatabase()) {
      const updated = updateUser(req.user!.id, {
        fullName,
        monthlyBudget,
      });
      res.json(updated);
      return;
    }

    res.status(500).json({ message: "Database-backed auth requires a configured database" });
  }
);

export default router;

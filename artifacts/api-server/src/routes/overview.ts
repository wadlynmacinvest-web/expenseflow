import { Router, type IRouter } from "express";
import authMiddleware, { type AuthRequest } from "../middlewares/auth";
import { getOverviewSummaryForUser, hasDatabase } from "../lib/devStore";

const router: IRouter = Router();

router.use(authMiddleware);

router.get("/overview", async (req: AuthRequest, res): Promise<void> => {
  const period = typeof req.query.period === "string" ? req.query.period : "month";

  if (!hasDatabase()) {
    res.json(getOverviewSummaryForUser(req.user!.id, period));
    return;
  }

  res.status(500).json({ message: "Database-backed overview requires a configured database" });
});

export default router;

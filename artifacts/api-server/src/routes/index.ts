import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import expensesRouter from "./expenses";
import transactionsRouter from "./transactions";
import ledgerRouter from "./ledger";
import overviewRouter from "./overview";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(expensesRouter);
router.use(transactionsRouter);
router.use(ledgerRouter);
router.use(overviewRouter);

export default router;

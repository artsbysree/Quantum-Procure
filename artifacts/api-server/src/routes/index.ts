import { Router, type IRouter } from "express";
import healthRouter from "./health";
import suppliersRouter from "./suppliers";
import inventoryRouter from "./inventory";
import salesRouter from "./sales";
import quantumRouter from "./quantum";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use(suppliersRouter);
router.use(inventoryRouter);
router.use(salesRouter);
router.use(quantumRouter);
router.use(dashboardRouter);

export default router;

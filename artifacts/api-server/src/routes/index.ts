import { Router, type IRouter } from "express";
import healthRouter from "./health";
import employeesRouter from "./employees";
import departmentsRouter from "./departments";
import payrollRouter from "./payroll";
import timeTrackingRouter from "./timeTracking";
import leaveRouter from "./leave";
import benefitsRouter from "./benefits";
import analyticsRouter from "./analytics";
import onboardingRouter from "./onboarding";

const router: IRouter = Router();

router.use(healthRouter);
router.use(employeesRouter);
router.use(departmentsRouter);
router.use(payrollRouter);
router.use(timeTrackingRouter);
router.use(leaveRouter);
router.use(benefitsRouter);
router.use(analyticsRouter);
router.use(onboardingRouter);

export default router;

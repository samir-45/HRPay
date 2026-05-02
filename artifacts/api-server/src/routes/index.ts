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
import authRouter from "./auth";
import recruitmentRouter from "./recruitment";
import performanceRouter from "./performance";
import announcementsRouter from "./announcements";
import reportsRouter from "./reports";
import settingsRouter from "./settings";
import aiRouter from "./ai";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(employeesRouter);
router.use(departmentsRouter);
router.use(payrollRouter);
router.use(timeTrackingRouter);
router.use(leaveRouter);
router.use(benefitsRouter);
router.use(analyticsRouter);
router.use(onboardingRouter);
router.use(recruitmentRouter);
router.use(performanceRouter);
router.use(announcementsRouter);
router.use(reportsRouter);
router.use(settingsRouter);
router.use(aiRouter);

export default router;

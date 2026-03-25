import actionItemController from "./modules/action-item";
import adminController from "./modules/admin";
import authController from "./modules/auth";
import billingController from "./modules/billing";
import healthController from "./modules/health";
import meetingController from "./modules/meeting";
import userController from "./modules/user";

export const appRouter = {
  actionItem: actionItemController,
  admin: adminController,
  auth: authController,
  billing: billingController,
  health: healthController,
  meeting: meetingController,
  user: userController,
};

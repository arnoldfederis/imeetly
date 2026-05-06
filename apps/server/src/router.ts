import { accountController } from "./modules/account";
import { actionItemController } from "./modules/action-item";
import { adminController } from "./modules/admin";
import { authController } from "./modules/auth";
import { billingController } from "./modules/billing";
import { feedbackController } from "./modules/feedback";
import { healthController } from "./modules/health";
import { integrationController } from "./modules/integration";
import { meetingController } from "./modules/meeting";
import { userController } from "./modules/user";

export const appRouter = {
  account: accountController,
  actionItem: actionItemController,
  admin: adminController,
  auth: authController,
  billing: billingController,
  feedback: feedbackController,
  health: healthController,
  integration: integrationController,
  meeting: meetingController,
  user: userController,
};

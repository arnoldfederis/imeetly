import { authRelations } from "@shared/rpc/db/relations/auth";
import { appSchema } from "@shared/rpc/db/schemas/app";
import { authSchema } from "@shared/rpc/db/schemas/auth";

export const schema = {
  ...appSchema,
  ...authSchema,
  ...authRelations,
};

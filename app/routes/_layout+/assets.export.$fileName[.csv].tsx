import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { assertUserCanExportAssets } from "~/modules/tier/service.server";
import { error } from "~/utils/http.server";
import { exportAssetsToCsv } from "~/utils/csv.server";
import {
  PermissionAction,
  PermissionEntity,
} from "~/utils/permissions/permission.validator.server";
import { requirePermission } from "~/utils/roles.server";
import { makeShelfError } from "~/utils/error";

export const loader = async ({ context, request }: LoaderFunctionArgs) => {
  const authSession = context.getSession();
  const { userId } = authSession;

  try {
    const { organizationId, organizations } = await requirePermission({
      userId: authSession.userId,
      request,
      entity: PermissionEntity.asset,
      action: PermissionAction.export,
    });

    await assertUserCanExportAssets({ organizationId, organizations });

    /** Join the rows with a new line */
    const csvString = await exportAssetsToCsv({ organizationId });

    return new Response(csvString, {
      status: 200,
      headers: {
        "content-type": "text/csv",
      },
    });
  } catch (cause) {
    const reason = makeShelfError(cause, { userId });
    return json(error(reason), { status: reason.status });
  }
};

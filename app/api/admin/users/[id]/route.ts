import { NextResponse } from "next/server";
import { requireApiRole } from "@/lib/auth/api-guards";
import { getCustomerDetail, updateCustomer } from "@/services/admin/customers";
import type { Role } from "@/types";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const authResult = await requireApiRole(["ADMIN", "MODERATOR"]);
  if ("error" in authResult) return authResult.error;

  const { id } = await context.params;
  const customer = await getCustomerDetail(id);

  if (!customer) {
    return NextResponse.json({ error: "Customer not found." }, { status: 404 });
  }

  return NextResponse.json({ customer });
}

export async function PATCH(request: Request, context: RouteContext) {
  const authResult = await requireApiRole(["ADMIN", "MODERATOR"]);
  if ("error" in authResult) return authResult.error;

  const { id } = await context.params;
  const body = await request.json().catch(() => null);

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const role = "role" in body ? (body.role as Role) : undefined;
  const suspend = "suspend" in body ? Boolean(body.suspend) : undefined;
  const suspensionReason =
    "suspensionReason" in body && typeof body.suspensionReason === "string"
      ? body.suspensionReason
      : undefined;

  const result = await updateCustomer(
    id,
    { role, suspend, suspensionReason },
    authResult.role as Role,
  );

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  const customer = await getCustomerDetail(id);
  return NextResponse.json({ customer });
}

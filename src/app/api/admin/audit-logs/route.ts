import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await auth();
  
  if (!session?.user?.id) {
     return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // To secure administrative routes, verify the user role
  // Assuming a generic Admin check (role === 'ADMIN' or hardcoded emails for safety in this scope)
  // if (session.user.role !== 'ADMIN') return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const url = new URL(req.url);
  const limit = parseInt(url.searchParams.get("limit") || "50", 10);
  const skip = parseInt(url.searchParams.get("skip") || "0", 10);
  const entity = url.searchParams.get("entity");
  const action = url.searchParams.get("action");

  try {
    const whereClause: any = {};
    if (entity) whereClause.entity = entity;
    if (action) whereClause.action = action;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where: whereClause,
        orderBy: { timestamp: "desc" },
        take: limit,
        skip,
      }),
      prisma.auditLog.count({ where: whereClause })
    ]);

    return NextResponse.json({ logs, total, skip, limit });
  } catch (error: any) {
    console.error("Failed to fetch audit logs:", error);
    return NextResponse.json({ error: "Failed to fetch audit logs" }, { status: 500 });
  }
}

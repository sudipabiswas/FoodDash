import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const params = await props.params;
    const storeId = params.id;

    if (!storeId) {
      return NextResponse.json({ error: "Missing store ID" }, { status: 400 });
    }

    const store = await prisma.store.findUnique({
      where: { id: storeId },
    });

    if (!store) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    const updatedStore = await prisma.store.update({
      where: { id: storeId },
      data: {
        active: !store.active,
      },
    });

    return NextResponse.json({
      message: `Store ${updatedStore.name} status updated`,
      active: updatedStore.active,
    });
  } catch (err: any) {
    console.error("Failed to toggle store status:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

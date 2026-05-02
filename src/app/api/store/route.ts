import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  const session = await auth();

  if (!session || (session.user as any).role !== "STORE_OWNER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const store = await prisma.store.findFirst({
    where: { ownerId: session.user?.id },
  });

  if (!store) {
    return NextResponse.json({ error: "Store not found" }, { status: 404 });
  }

  return NextResponse.json(store);
}

export async function PATCH(req: Request) {
  const session = await auth();

  if (!session || (session.user as any).role !== "STORE_OWNER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { name, description, active, deliveryZone, deliveryCharge } = await req.json();

    const store = await prisma.store.findFirst({
      where: { ownerId: session.user?.id },
    });

    if (!store) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    const updatedStore = await prisma.store.update({
      where: { id: store.id },
      data: {
        name,
        description,
        active,
        deliveryZone,
        deliveryCharge: parseFloat(deliveryCharge),
      },
    });

    return NextResponse.json(updatedStore);
  } catch (error) {
    console.error("Store update error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

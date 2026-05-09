import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

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
    const data = await req.json();
    const updateData: any = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.active !== undefined) updateData.active = data.active;
    if (data.deliveryZone !== undefined) updateData.deliveryZone = data.deliveryZone;
    if (data.image !== undefined) updateData.image = data.image;
    if (data.deliveryCharge !== undefined && data.deliveryCharge !== "") {
      const charge = parseFloat(data.deliveryCharge);
      if (!isNaN(charge)) {
        updateData.deliveryCharge = charge;
      }
    }

    const store = await prisma.store.findFirst({
      where: { ownerId: session.user?.id },
    });

    if (!store) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    const updatedStore = await prisma.store.update({
      where: { id: store.id },
      data: updateData,
    });

    // If a logo was uploaded, also update the owner's profile picture for consistency
    if (updateData.image) {
      await prisma.user.update({
        where: { id: session.user?.id },
        data: { image: updateData.image },
      });
    }

    return NextResponse.json(updatedStore);
  } catch (error) {
    console.error("Store update error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { r2, R2_BUCKET } from "@/lib/r2";
import { randomUUID } from "crypto";

export async function GET(req: Request) {
  const session = await auth();
  if (!session || (session.user as any).role !== "STORE_OWNER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const filename = searchParams.get("filename");
  const contentType = searchParams.get("contentType") ?? "image/jpeg";

  if (!filename) {
    return NextResponse.json({ error: "filename is required" }, { status: 400 });
  }

  const ext = filename.split(".").pop();
  const key = `products/${randomUUID()}.${ext}`;

  const command = new PutObjectCommand({
    Bucket: R2_BUCKET,
    Key: key,
    ContentType: contentType,
  });

  const signedUrl = await getSignedUrl(r2, command, { expiresIn: 60 * 5 }); // 5 minutes

  const publicUrl = `${process.env.R2_PUBLIC_URL}/${key}`;

  return NextResponse.json({ signedUrl, publicUrl, key });
}

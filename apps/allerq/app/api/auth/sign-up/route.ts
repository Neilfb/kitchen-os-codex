import { createUser } from "@/lib/ncb/createUser";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  console.log("[sign-up API] ENV CHECK:", {
    NCDB_API_KEY: process.env.NCDB_API_KEY,
    NCDB_SECRET: process.env.NCDB_SECRET,
    NCDB_SECRET_KEY: process.env.NCDB_SECRET_KEY,
    NCDB_INSTANCE: process.env.NCDB_INSTANCE,
  });

  try {
    const data = await req.json();
    const result = await createUser(data);
    return NextResponse.json({ status: "success", data: result });
  } catch (error: any) {
    console.error("[sign-up API] error", error);
    return NextResponse.json(
      { status: "error", message: error?.message || "Unexpected error" },
      { status: 500 }
    );
  }
}

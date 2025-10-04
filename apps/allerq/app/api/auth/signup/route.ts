import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";

import { createUser } from "@/lib/ncb/createUser";

const ALLOWED_ROLES = ["superadmin", "admin", "manager", "staff", "auditor"] as const;

type AllowedRole = (typeof ALLOWED_ROLES)[number];

type SignupPayload = {
  email: unknown;
  password: unknown;
  fullName: unknown;
  role?: unknown;
  assignedRestaurants?: unknown;
};

type NormalizedSignupPayload = {
  email: string;
  password: string;
  fullName: string;
  role?: AllowedRole;
  assignedRestaurants?: string | string[];
};

function validatePayload(input: SignupPayload): NormalizedSignupPayload {
  if (typeof input.email !== "string" || !input.email.trim()) {
    throw new Error("Email is required");
  }

  if (typeof input.password !== "string" || !input.password.trim()) {
    throw new Error("Password is required");
  }

  if (typeof input.fullName !== "string" || !input.fullName.trim()) {
    throw new Error("Full name is required");
  }

  const normalized: NormalizedSignupPayload = {
    email: input.email.trim().toLowerCase(),
    password: input.password,
    fullName: input.fullName.trim(),
  };

  if (input.role !== undefined) {
    if (typeof input.role !== "string") {
      throw new Error("Role must be a string if provided");
    }
    const role = input.role.trim().toLowerCase();
    if (!ALLOWED_ROLES.includes(role as AllowedRole)) {
      throw new Error(`Invalid role \"${input.role}\". Allowed roles: ${ALLOWED_ROLES.join(", ")}`);
    }
    normalized.role = role as AllowedRole;
  }

  if (Array.isArray(input.assignedRestaurants)) {
    const allStrings = input.assignedRestaurants.every((item) => typeof item === "string");
    if (!allStrings) {
      throw new Error("assignedRestaurants array must contain only strings");
    }
    normalized.assignedRestaurants = input.assignedRestaurants as string[];
  } else if (typeof input.assignedRestaurants === "string") {
    normalized.assignedRestaurants = input.assignedRestaurants;
  } else if (input.assignedRestaurants !== undefined && input.assignedRestaurants !== null) {
    throw new Error("assignedRestaurants must be a string, string[] or undefined");
  }

  return normalized;
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = (await req.json()) as SignupPayload;
    const { email, password, fullName, role, assignedRestaurants } = validatePayload(rawBody);

    console.log("[sign-up API] payload received", {
      email,
      hasPassword: Boolean(password),
      fullName,
      role,
      hasAssignedRestaurants: assignedRestaurants !== undefined,
    });

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await createUser({
      email,
      fullName,
      role,
      assignedRestaurants,
      password: hashedPassword,
    });

    return NextResponse.json({ status: "success", data: result }, { status: 200 });
  } catch (error: any) {
    const status = typeof error?.status === "number" ? error.status : 500;
    const message = error?.message || "Unexpected error";

    console.error("[sign-up API] error", {
      message,
      status,
      data: error?.response?.data,
      stack: error?.stack,
    });

    return NextResponse.json({ status: "error", message }, { status });
  }
}

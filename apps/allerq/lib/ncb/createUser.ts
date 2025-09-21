import axios from "axios";
import bcrypt from "bcryptjs";

import { validatePassword } from "@/lib/utils/validatePassword";

const API_KEY = "06b2330b6d80051a63bb878f9709e7aa91b9fc5e11aaf519037841d50dc7";
const INSTANCE = "48346_allerq";
const BASE_URL = "https://api.nocodebackend.com";

export interface CreateUserPayload {
  email: string;
  password: string;
  displayName: string;
  role?: "admin" | "manager" | "staff";
}

export async function createUser({
  email,
  password,
  displayName,
  role = "admin",
}: CreateUserPayload) {
  const passwordError = validatePassword(password);
  if (passwordError) {
    throw new Error(passwordError);
  }

  try {
    const uid = await bcrypt.hash(password, 10);
    const timestamp = Date.now();
    const external_id = `user_${timestamp}`;

    const response = await axios.post(
      `${BASE_URL}/create/users?Instance=${INSTANCE}`,
      {
        secret_key: API_KEY,
        email: email.toLowerCase(),
        display_name: displayName,
        uid,
        role,
        assigned_restaurants: "",
        created_at: timestamp,
        updated_at: timestamp,
        external_id,
      },
      {
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (response.data?.status === "success") {
      return response.data.data; // return created user record
    } else {
      throw new Error("User creation failed: Unexpected response format.");
    }
  } catch (error: any) {
    console.error("Failed to create user:", error.response?.data || error.message);
    throw new Error("User creation failed.");
  }
}

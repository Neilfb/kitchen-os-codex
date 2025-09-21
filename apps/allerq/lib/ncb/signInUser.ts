import axios from "axios";
import bcrypt from "bcryptjs";
import { getUserByEmail } from "@/lib/ncb/getUserByEmail";

const API_KEY = "06b2330b6d80051a63bb878f9709e7aa91b9fc5e11aaf519037841d50dc7";
const INSTANCE = "48346_allerq";
const BASE_URL = "https://api.nocodebackend.com";

export async function signInUser(email: string, password: string) {
  try {
    const user = await getUserByEmail(email);
    if (!user) throw new Error("Invalid email or password");

    const passwordMatch = await bcrypt.compare(password, user.uid);
    if (!passwordMatch) throw new Error("Invalid email or password");

    return user;
  } catch (error: any) {
    console.error("Sign-in error:", error.response?.data || error.message);
    throw new Error("Sign-in failed");
  }
}

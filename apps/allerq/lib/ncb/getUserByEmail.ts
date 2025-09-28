"use server";

import axios from "axios";
import { NCDB_API_KEY, NCDB_SECRET, NCDB_INSTANCE } from "@/lib/constants";

interface GetUserByEmailPayload {
  email: string;
}

export async function getUserByEmail({ email }: GetUserByEmailPayload) {
  try {
    if (!email?.trim()) {
      throw new Error("Invalid input: email required.");
    }

    const normalizedEmail = email.trim().toLowerCase();

    const body = {
      secret_key: NCDB_SECRET,
      filters: [
        {
          field: "email",
          operator: "=",
          value: normalizedEmail,
        },
      ],
    };

    const response = await axios.post(
      `https://api.nocodebackend.com/search/users?Instance=${NCDB_INSTANCE}`,
      body,
      {
        headers: {
          Authorization: `Bearer ${NCDB_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (response.data?.status === "success") {
      return response.data.data[0] || null;
    }

    return null;
  } catch (error: any) {
    console.error("[getUserByEmail] error", error.response?.data || error.message);
    return null;
  }
}
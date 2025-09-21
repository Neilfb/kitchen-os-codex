import axios from "axios";

const API_KEY = "06b2330b6d80051a63bb878f9709e7aa91b9fc5e11aaf519037841d50dc7";
const INSTANCE = "48346_allerq";
const BASE_URL = "https://api.nocodebackend.com";

export interface CreateRestaurantPayload {
  name: string;
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  cuisine_type?: string;
  owner_id: string;
  logo?: string;
  cover_image?: string;
}

export async function createRestaurant({
  name,
  description = "",
  address = "",
  phone = "",
  email = "",
  website = "",
  cuisine_type = "",
  owner_id,
  logo = "",
  cover_image = "",
}: CreateRestaurantPayload) {
  try {
    const timestamp = Date.now();

    const response = await axios.post(
      `${BASE_URL}/create/restaurants?Instance=${INSTANCE}`,
      {
        secret_key: API_KEY,
        name,
        description,
        address,
        phone,
        email,
        website,
        cuisine_type,
        owner_id,
        logo,
        cover_image,
        is_active: 1,
        created_at: timestamp,
        updated_at: timestamp,
      },
      {
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (response.data?.status === "success") {
      return response.data.data; // return created restaurant record
    } else {
      throw new Error("Restaurant creation failed: Unexpected response format.");
    }
  } catch (error: any) {
    console.error("Failed to create restaurant:", error.response?.data || error.message);
    throw new Error("Restaurant creation failed.");
  }
}
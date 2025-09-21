import axios, { AxiosError } from 'axios';

const API_KEY = '06b2330b6d80051a63bb878f9709e7aa91b9fc5e11aaf519037841d50dc7';
const INSTANCE = '48346_allerq';
const BASE_URL = 'https://api.nocodebackend.com';

export interface UserRecord {
  id: number;
  uid: string;
  email: string;
  display_name: string;
  role: 'admin' | 'manager' | 'staff';
  assigned_restaurants: string;
  created_at: number;
  updated_at: number;
  external_id: string;
}

interface NoCodeBackendResponse<T> {
  status: 'success' | 'error';
  data?: T;
  message?: string;
}

export async function getUserByEmail(email: string): Promise<UserRecord | null> {
  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedEmail) {
    throw new Error('Email is required');
  }

  try {
    const url = `${BASE_URL}/read/users`;
    const body = {
      secret_key: API_KEY,
      filters: [
        {
          field: 'email',
          operator: 'is',
          value: normalizedEmail,
        },
      ],
    };
    const headers = {
      Authorization: `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    } as const;

    console.log('[getUserByEmail] request', {
      url: `${url}?Instance=${INSTANCE}`,
      body,
      headers: { ...headers, Authorization: 'Bearer ********' },
    });

    const response = await axios.post<NoCodeBackendResponse<UserRecord[] | UserRecord>>(
      url,
      body,
      {
        params: { Instance: INSTANCE },
        headers,
      }
    );

    console.log('[getUserByEmail] response', response.data);

    if (response.data.status !== 'success' || !response.data.data) {
      const fallbackMessage = response.data.message ?? 'Failed to fetch user';
      throw new Error(fallbackMessage);
    }

    const records = Array.isArray(response.data.data)
      ? response.data.data
      : [response.data.data];
    const user = records[0] ?? null;
    return user;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('[getUserByEmail] axios error', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
    } else {
      console.error('[getUserByEmail] unexpected error', error);
    }
    throw new Error('Unable to retrieve user.');
  }
}

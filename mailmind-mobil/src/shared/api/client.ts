import { Platform } from 'react-native';

const envUrl = process.env.EXPO_PUBLIC_API_URL;
/**
 * Android emülatöründe host makineye `10.0.2.2`, diğer durumlarda `localhost` kullanılır.
 * Gerçek cihazda test için `.env` ya da app config üzerinden EXPO_PUBLIC_API_URL geç.
 */
const defaultUrl = Platform.OS === 'android' ? 'http://10.0.2.2:4000' : 'http://localhost:4000';

export const API_URL = (envUrl && envUrl.length > 0 ? envUrl : defaultUrl).replace(/\/+$/, '');

export class ApiError extends Error {
  status: number;
  payload: unknown;
  constructor(status: number, message: string, payload: unknown) {
    super(message);
    this.status = status;
    this.payload = payload;
  }
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  token?: string | null;
  signal?: AbortSignal;
};

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, token, signal } = options;

  const headers: Record<string, string> = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    signal,
  });

  const text = await res.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!res.ok) {
    const message =
      data && typeof data === 'object' && 'message' in data && typeof (data as { message: unknown }).message === 'string'
        ? (data as { message: string }).message
        : `Request failed with status ${res.status}`;
    throw new ApiError(res.status, message, data);
  }

  return data as T;
}

import { AxiosError } from "axios";
import { request } from "@/services/http.service";
import type { endpointType } from "@/utils/endpoints";

export async function fetchHelper<T = any>({
  endPoint,
  method = "GET",
  body,
  headers,
  params,
  isLocalized,
  redirectOnUnauthorized = true,
  silent
}: {
  isLocalized?: boolean;
  headers?: Record<string, string>;
  locale?: locales;
  endPoint: endpointType;
  tags?: endpointType;
  revalidate?: number;
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  cache?: "no-store" | "no-cache" | "default" | "reload" | "force-cache" | "only-if-cached";
  params?: any;
  refreshToken?: boolean;
  redirectOnUnauthorized?: boolean;
  silent?: boolean;
}): Promise<ApiResponse<T>> {
  try {
    const result = await request<ApiResponse<T>>({
      endPoint,
      method,
      body,
      headers,
      params,
      isLocalized,
      redirectOnUnauthorized,
      silent
    });

    return {
      ...result,
      success: result?.success ?? true
    };
  } catch (error) {
    const axiosError = error as AxiosError<any>;
    const result = axiosError.response?.data;

    return {
      success: false,
      message: result?.message ?? axiosError.message ?? "Network request failed",
      data: result?.data ?? null,
      total: result?.total ?? 0,
      code: axiosError.response?.status,
      result: result ?? { message: axiosError.message }
    } as ApiResponse<T>;
  }
}

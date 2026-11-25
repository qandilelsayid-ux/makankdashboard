import { apiClient } from "@/lib/axios";
import { endpointName, endpoints, endpointType } from "@/utils/endpoints";
import { extractSearchParams } from "@/utils/extractSearchParams";
import type { AxiosRequestConfig } from "axios";

type DashboardAxiosRequestConfig = AxiosRequestConfig & {
  skipAuthRedirect?: boolean;
  skipErrorToast?: boolean;
};

// The Mart and Kiosk pages pass a plain path string ("kiosk/admin/list",
// `mart/admin/products/${id}`) instead of a key array. `.map` on a string threw
// before any request was sent, so those pages loaded nothing and saved nothing.
function stringEndpointPath(endPoint: string): string {
  const trimmed = endPoint.trim().replace(/^\/+/, "");
  const known = endpoints[trimmed as endpointName];
  if (known) return known.startsWith("/") ? known : `/${known}`;
  return `/api/${trimmed.replace(/^api\//, "")}`;
}

export function buildEndpointUrl(endPoint: endpointType | string, params?: unknown) {
  const path = typeof endPoint === "string"
    ? stringEndpointPath(endPoint)
    : endPoint
    .map((item: endpointName | number | string, index: number) => {
      if (typeof item === "number" || (!isNaN(Number(item)) && item !== "")) return `/${item}`;
      let val = String(endpoints[item as endpointName] ?? item);
      if (index > 0 && val.startsWith("/api/")) {
        val = val.replace(/^\/api/, "");
      }
      return val.startsWith("/") ? val : `/${val}`;
    })
    .join("");

  const query = params && typeof params === "object"
    ? extractSearchParams(params as Record<string, unknown>)
    : "";
  return `${path}${query ? (query.startsWith("?") ? query : `?${query}`) : ""}`;
}

export async function request<T = unknown>({
  endPoint,
  method = "GET",
  body,
  params,
  headers,
  isLocalized,
  redirectOnUnauthorized,
  silent
}: {
  endPoint: endpointType;
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  params?: unknown;
  headers?: Record<string, string>;
  isLocalized?: boolean;
  redirectOnUnauthorized?: boolean;
  // Background requests (sidebar counters): no error toast on failure.
  silent?: boolean;
}) {
  if (!apiClient.defaults.baseURL) {
    throw new Error(
      `Missing VITE_API_URL. Set it in dashboard-react/.env.local (copy from .env.example).`
    );
  }

  const isFormData = body instanceof FormData;
  const config: DashboardAxiosRequestConfig = {
    url: buildEndpointUrl(endPoint, params),
    method,
    data: body,
    skipAuthRedirect: redirectOnUnauthorized === false,
    skipErrorToast: silent === true,
    headers: {
      ...(isFormData ? { "Content-Type": undefined } : {}),
      isLocalized: isLocalized ? "true" : "false",
      ...headers
    }
  };

  const response = await apiClient.request<T>(config);

  return response.data;
}

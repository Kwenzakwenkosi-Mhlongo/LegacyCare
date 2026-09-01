// services/api.ts

import {
    clearAuth,
    requireToken,
} from "./auth";

export const API_URL = (
  process.env.EXPO_PUBLIC_API_URL ||
  "https://legacycare-api-2026-dackfxd3g9e0f8hw.southafricanorth-01.azurewebsites.net/api"
)
  .trim()
  .replace(/^["']|["']$/g, "")
  .replace(/;$/, "")
  .replace(/\/+$/, "");

type ApiRequestOptions =
  RequestInit & {
    authenticated?: boolean;
  };

function getErrorMessage(
  data: unknown,
  status: number
): string {
  if (
    typeof data === "object" &&
    data !== null
  ) {
    if (
      "message" in data &&
      typeof (
        data as {
          message?: unknown;
        }
      ).message === "string"
    ) {
      const message = (
        data as {
          message: string;
        }
      ).message.trim();

      if (message) {
        return message;
      }
    }

    if (
      "title" in data &&
      typeof (
        data as {
          title?: unknown;
        }
      ).title === "string"
    ) {
      const title = (
        data as {
          title: string;
        }
      ).title.trim();

      if (title) {
        return title;
      }
    }
  }

  if (
    typeof data === "string" &&
    data.trim()
  ) {
    return data.trim();
  }

  return `Request failed (${status}).`;
}

export async function apiRequest<T>(
  endpoint: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  const {
    authenticated = true,
    headers,
    ...requestOptions
  } = options;

  const requestHeaders: Record<
    string,
    string
  > = {
    Accept: "application/json",
  };

  if (
    requestOptions.body &&
    !(
      requestOptions.body instanceof
      FormData
    )
  ) {
    requestHeaders[
      "Content-Type"
    ] = "application/json";
  }

  if (authenticated) {
    const token =
      await requireToken();

    requestHeaders.Authorization =
      `Bearer ${token}`;
  }

  if (headers) {
    Object.assign(
      requestHeaders,
      headers
    );
  }

  const cleanEndpoint =
    endpoint.startsWith("/")
      ? endpoint
      : `/${endpoint}`;

  const url =
    `${API_URL}${cleanEndpoint}`;

  console.log(
    "[API]",
    requestOptions.method ||
      "GET",
    url
  );

  const response =
    await fetch(url, {
      ...requestOptions,
      headers:
        requestHeaders,
    });

  const contentType =
    response.headers.get(
      "content-type"
    ) || "";

  let data: unknown = null;

  if (
    contentType.includes(
      "application/json"
    )
  ) {
    data =
      await response
        .json()
        .catch(
          () => null
        );
  } else {
    data =
      await response
        .text()
        .catch(
          () => null
        );
  }

  if (
    response.status === 401 &&
    authenticated
  ) {
    await clearAuth();

    throw new Error(
      "Your session has expired. Please sign in again."
    );
  }

  if (!response.ok) {
    throw new Error(
      getErrorMessage(
        data,
        response.status
      )
    );
  }

  return data as T;
}
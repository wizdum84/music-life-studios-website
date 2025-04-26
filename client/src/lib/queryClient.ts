import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

/**
 * Specialized API function to check a booking's payment status
 * Used when customers return to complete payment after a session
 */
export async function getBookingPaymentStatus(bookingId: string, email: string) {
  const response = await apiRequest(
    "GET", 
    `/api/bookings/${bookingId}/payment-status?email=${encodeURIComponent(email)}`
  );
  return await response.json();
}

type UnauthorizedBehavior = "returnNull" | "returnEmptyArray" | "returnEmptyObject" | "throw";
export function getQueryFn<T>(options?: {
  on401?: UnauthorizedBehavior;
}): QueryFunction<T> {
  return async ({ queryKey }) => {
    const unauthorizedBehavior = options?.on401 || "throw";
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
    });

    if (res.status === 401) {
      if (unauthorizedBehavior === "returnNull") {
        return null as unknown as T;
      } else if (unauthorizedBehavior === "returnEmptyArray") {
        return [] as unknown as T;
      } else if (unauthorizedBehavior === "returnEmptyObject") {
        return {} as unknown as T;
      } else if (unauthorizedBehavior === "throw") {
        await throwIfResNotOk(res);
      }
    }

    await throwIfResNotOk(res);
    return await res.json() as T;
  };
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});

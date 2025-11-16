import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { getMockData } from "./mockData";

// Check if mock mode is enabled
const USE_MOCK_DATA = import.meta.env.VITE_USE_MOCK_DATA === 'true';

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest<T = any>(
  method: string,
  url: string,
  body?: unknown
): Promise<T> {
  console.log(`Making API request: ${method} ${url}`, body);

  // Return mock data if enabled
  if (USE_MOCK_DATA) {
    console.log('🎭 Using mock data for:', url);
    await new Promise(resolve => setTimeout(resolve, 300)); // Simulate network delay
    const mockData = getMockData(url);
    if (mockData) return mockData;
  }

  const res = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : {},
    body: body ? JSON.stringify(body) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return await res.json();
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const url = queryKey[0] as string;

    // Return mock data if enabled
    if (USE_MOCK_DATA) {
      console.log('🎭 Using mock data for:', url);
      await new Promise(resolve => setTimeout(resolve, 300)); // Simulate network delay
      const mockData = getMockData(url);
      if (mockData) return mockData;
    }

    const res = await fetch(url, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

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

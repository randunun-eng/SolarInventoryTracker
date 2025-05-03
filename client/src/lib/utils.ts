import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDateTime(date: Date | string | undefined | null): string {
  if (!date) return "N/A";
  return format(new Date(date), "MMM dd, yyyy");
}

export function formatCurrency(amount: number | undefined | null): string {
  if (amount === undefined || amount === null) return "$0.00";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

export function getStatusColor(status: string): {
  bg: string;
  text: string;
} {
  switch (status) {
    case "Received":
      return { bg: "bg-blue-100", text: "text-blue-800" };
    case "In Progress":
      return { bg: "bg-yellow-100", text: "text-yellow-800" };
    case "Waiting for Parts":
      return { bg: "bg-purple-100", text: "text-purple-800" };
    case "Ready for Pickup":
      return { bg: "bg-green-100", text: "text-green-800" };
    case "Completed":
      return { bg: "bg-green-100", text: "text-green-800" };
    case "Cancelled":
      return { bg: "bg-red-100", text: "text-red-800" };
    default:
      return { bg: "bg-gray-100", text: "text-gray-800" };
  }
}

export function truncateText(text: string | undefined | null, maxLength: number): string {
  if (!text) return "";
  return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
}

export function getStockLevelColor(current: number, minimum: number): {
  bg: string;
  text: string;
} {
  if (current <= 0) {
    return { bg: "bg-red-100", text: "text-red-800" };
  } else if (current <= minimum) {
    return { bg: "bg-orange-100", text: "text-orange-800" };
  } else if (current <= minimum * 2) {
    return { bg: "bg-yellow-100", text: "text-yellow-800" };
  } else {
    return { bg: "bg-green-100", text: "text-green-800" };
  }
}

export function calculateTotalCost(
  laborHours: number,
  laborRate: number,
  partsCost: number
): number {
  return laborHours * laborRate + partsCost;
}

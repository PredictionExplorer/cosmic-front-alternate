/**
 * Lightweight runtime shape validators for critical API DTOs.
 *
 * These guard functions check the fields the UI actually reads so that a
 * broken or changed backend response fails early with a clear message
 * instead of rendering "NaN", blank values, or crashing in a component.
 *
 * We intentionally keep these manual (no Zod/io-ts) to avoid extra deps.
 */

import { ApiError } from "./api";
import type {
  ApiDashboardData,
  ApiBidResponse,
  ApiCSTToken,
  ApiUserInfo,
  ApiRoundInfo,
} from "./apiTypes";

// ── Helpers ─────────────────────────────────────────────────────────────

function isObject(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}

function assertField(
  obj: Record<string, unknown>,
  field: string,
  expectedType: string,
  context: string,
): void {
  const val = obj[field];
  if (val === undefined || val === null) {
    throw new ApiError(
      `Missing required field "${field}" in ${context}`,
      0,
    );
  }
  if (expectedType === "number" && typeof val !== "number") {
    throw new ApiError(
      `Field "${field}" in ${context} expected number, got ${typeof val}`,
      0,
    );
  }
  if (expectedType === "string" && typeof val !== "string") {
    throw new ApiError(
      `Field "${field}" in ${context} expected string, got ${typeof val}`,
      0,
    );
  }
}

// ── Dashboard ───────────────────────────────────────────────────────────

export function validateDashboard(data: unknown): ApiDashboardData {
  if (!isObject(data)) {
    throw new ApiError("Dashboard response is not an object", 0);
  }

  assertField(data, "CurRoundNum", "number", "dashboard");
  assertField(data, "BidPriceEth", "number", "dashboard");
  assertField(data, "PrizeAmountEth", "number", "dashboard");

  if (!isObject(data.CurRoundStats)) {
    throw new ApiError("Dashboard missing CurRoundStats object", 0);
  }

  return data as unknown as ApiDashboardData;
}

// ── Bids ────────────────────────────────────────────────────────────────

export function validateBid(data: unknown): ApiBidResponse {
  if (!isObject(data)) {
    throw new ApiError("Bid response is not an object", 0);
  }
  return data as ApiBidResponse;
}

export function validateBidList(data: unknown): ApiBidResponse[] {
  if (!Array.isArray(data)) {
    throw new ApiError("Bid list response is not an array", 0);
  }
  return data as ApiBidResponse[];
}

// ── CST Tokens ──────────────────────────────────────────────────────────

export function validateCSTToken(data: unknown): ApiCSTToken {
  if (!isObject(data)) {
    throw new ApiError("CST token response is not an object", 0);
  }

  if (typeof data.TokenId !== "number") {
    throw new ApiError(
      `CST token missing or invalid TokenId: ${data.TokenId}`,
      0,
    );
  }

  return data as unknown as ApiCSTToken;
}

// ── User Info ───────────────────────────────────────────────────────────

export function validateUserInfo(data: unknown): ApiUserInfo {
  if (!isObject(data)) {
    throw new ApiError("UserInfo response is not an object", 0);
  }

  assertField(data, "NumBids", "number", "UserInfo");
  assertField(data, "NumPrizes", "number", "UserInfo");

  return data as unknown as ApiUserInfo;
}

// ── Rounds ──────────────────────────────────────────────────────────────

export function validateRoundInfo(data: unknown): ApiRoundInfo {
  if (!isObject(data)) {
    throw new ApiError("RoundInfo response is not an object", 0);
  }

  assertField(data, "RoundNum", "number", "RoundInfo");

  return data as unknown as ApiRoundInfo;
}

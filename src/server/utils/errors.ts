import { TRPCError } from "@trpc/server";
import { HttpStatusCodes } from "@/constants/http";
import { StandardErrorCodes, type StandardErrorCode } from "@/constants/errors";

function classifyError(error: Error | unknown): {
  code: StandardErrorCode;
  message: string;
} {
  const message = error instanceof Error ? error.message : "Unknown error";
  const lower = message.toLowerCase();
  if (lower.includes("not authorized") || lower.includes("unauthorized")) {
    return { code: StandardErrorCodes.FORBIDDEN, message };
  }
  if (lower.includes("not found")) {
    return { code: StandardErrorCodes.NOT_FOUND, message };
  }
  if (
    lower.includes("invalid") ||
    lower.includes("required") ||
    lower.includes("no fields to update")
  ) {
    return { code: StandardErrorCodes.BAD_REQUEST, message };
  }
  return { code: StandardErrorCodes.INTERNAL, message };
}

export function mapErrorToHttp(error: Error | unknown): {
  status: number;
  message: string;
} {
  const { code, message } = classifyError(error);
  switch (code) {
    case StandardErrorCodes.BAD_REQUEST:
      return { status: HttpStatusCodes.BAD_REQUEST, message };
    case StandardErrorCodes.FORBIDDEN:
      return { status: HttpStatusCodes.FORBIDDEN, message };
    case StandardErrorCodes.NOT_FOUND:
      return { status: HttpStatusCodes.NOT_FOUND, message };
    default:
      return { status: HttpStatusCodes.INTERNAL, message };
  }
}

export function mapErrorToTRPC(error: Error | unknown): TRPCError {
  const { code, message } = classifyError(error);
  switch (code) {
    case StandardErrorCodes.BAD_REQUEST:
      return new TRPCError({ code: StandardErrorCodes.BAD_REQUEST, message });
    case StandardErrorCodes.FORBIDDEN:
      return new TRPCError({ code: StandardErrorCodes.FORBIDDEN, message });
    case StandardErrorCodes.NOT_FOUND:
      return new TRPCError({ code: StandardErrorCodes.NOT_FOUND, message });
    default:
      return new TRPCError({
        code: StandardErrorCodes.INTERNAL,
        message,
      });
  }
}

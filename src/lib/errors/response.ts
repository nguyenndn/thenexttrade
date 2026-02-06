
import { ErrorCode } from "./ea-license";
import { ErrorMessages } from "./messages";

export function createErrorResponse(code: ErrorCode) {
    return {
        success: false,
        error: ErrorMessages[code],
        errorCode: code,
    };
}

export function createSuccessResponse<T>(data?: T) {
    return {
        success: true,
        data,
    };
}

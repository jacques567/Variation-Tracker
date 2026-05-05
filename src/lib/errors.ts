export interface ApiError {
  code: string
  message: string
  retryable: boolean
  details?: Record<string, unknown>
}

export class ApiErrorResponse extends Error implements ApiError {
  code: string
  message: string
  retryable: boolean
  details?: Record<string, unknown>
  statusCode: number

  constructor(
    code: string,
    message: string,
    statusCode: number = 400,
    retryable: boolean = false,
    details?: Record<string, unknown>
  ) {
    super(message)
    this.code = code
    this.message = message
    this.statusCode = statusCode
    this.retryable = retryable
    this.details = details
    Object.setPrototypeOf(this, ApiErrorResponse.prototype)
  }

  toJSON(): ApiError {
    return {
      code: this.code,
      message: this.message,
      retryable: this.retryable,
      ...(this.details && { details: this.details }),
    }
  }
}

export const ErrorCodes = {
  INVALID_INPUT: 'invalid_input',
  UNAUTHORIZED: 'unauthorized',
  FORBIDDEN: 'forbidden',
  NOT_FOUND: 'not_found',
  CONFLICT: 'conflict',
  INTERNAL_ERROR: 'internal_error',
  SERVICE_UNAVAILABLE: 'service_unavailable',
  RATE_LIMITED: 'rate_limited',
  MISSING_FIELDS: 'missing_fields',
  INVALID_TOKEN: 'invalid_token',
  EXPIRED_TOKEN: 'expired_token',
  DATABASE_ERROR: 'database_error',
  STRIPE_ERROR: 'stripe_error',
} as const

// Error factory functions for common cases
export const Errors = {
  invalidInput: (message: string, details?: Record<string, unknown>) =>
    new ApiErrorResponse(ErrorCodes.INVALID_INPUT, message, 400, false, details),

  missingFields: (fields: string[]) =>
    new ApiErrorResponse(
      ErrorCodes.MISSING_FIELDS,
      `Missing required fields: ${fields.join(', ')}`,
      400,
      false,
      { fields }
    ),

  unauthorized: () =>
    new ApiErrorResponse(ErrorCodes.UNAUTHORIZED, 'Authentication required', 401),

  forbidden: (message = 'Access denied') =>
    new ApiErrorResponse(ErrorCodes.FORBIDDEN, message, 403),

  notFound: (resource: string) =>
    new ApiErrorResponse(ErrorCodes.NOT_FOUND, `${resource} not found`, 404),

  invalidToken: (message = 'Invalid security token') =>
    new ApiErrorResponse(ErrorCodes.INVALID_TOKEN, message, 403),

  expiredToken: (message = 'Token has expired') =>
    new ApiErrorResponse(ErrorCodes.EXPIRED_TOKEN, message, 403),

  conflict: (message: string) =>
    new ApiErrorResponse(ErrorCodes.CONFLICT, message, 409),

  internalError: (message = 'An unexpected error occurred', retryable = true) =>
    new ApiErrorResponse(
      ErrorCodes.INTERNAL_ERROR,
      message,
      500,
      retryable
    ),

  databaseError: (retryable = true) =>
    new ApiErrorResponse(
      ErrorCodes.DATABASE_ERROR,
      'Database operation failed',
      500,
      retryable
    ),

  stripeError: (message: string, retryable = true) =>
    new ApiErrorResponse(ErrorCodes.STRIPE_ERROR, message, 502, retryable),

  serviceUnavailable: () =>
    new ApiErrorResponse(
      ErrorCodes.SERVICE_UNAVAILABLE,
      'Service temporarily unavailable',
      503,
      true
    ),

  rateLimited: () =>
    new ApiErrorResponse(
      ErrorCodes.RATE_LIMITED,
      'Too many requests. Please try again later.',
      429,
      true
    ),
}

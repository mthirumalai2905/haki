export class AppError extends Error {
  code: string;
  status: number;

  constructor(code: string, message: string, status = 400) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

export function errorResponse(error: unknown) {
  if (error instanceof AppError) {
    return {
      success: false as const,
      error: { code: error.code, message: error.message },
    };
  }

  console.error(error);
  return {
    success: false as const,
    error: {
      code: "INTERNAL_ERROR",
      message: "Something went wrong. Please try again.",
    },
  };
}

export function ok<T>(data: T) {
  return { success: true as const, data };
}

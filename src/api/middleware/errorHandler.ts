import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { IErrorResponse } from "../../types/api.types";

/**
 * Clase base para errores de la aplicación
 * Permite control del status code y detalles
 */
export class ApplicationError extends Error {
  constructor(
    public message: string,
    public code: string,
    public statusCode: number = 500,
    public details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "ApplicationError";
  }
}

/**
 * Middleware de manejo centralizado de errores
 * Intercepta todos los errores y los formatea consistentemente
 */
export function errorHandler(
  error: Error | ZodError | ApplicationError,
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const timestamp = new Date().toISOString();

  // Error de validación de Zod
  if (error instanceof ZodError) {
    const errorResponse: IErrorResponse = {
      code: "VALIDATION_ERROR" as any,
      message: "Validación de datos fallida",
      details: {
        errors: error.errors.map((err) => ({
          path: err.path.join("."),
          message: err.message,
          code: err.code,
        })),
      },
    };

    res.status(400).json({
      success: false,
      error: errorResponse,
      timestamp,
    });
    return;
  }

  // Error conocido de la aplicación
  if (error instanceof ApplicationError) {
    const errorResponse: IErrorResponse = {
      code: error.code as any,
      message: error.message,
      details: error.details,
    };

    res.status(error.statusCode).json({
      success: false,
      error: errorResponse,
      timestamp,
    });
    return;
  }

  // Error inesperado (no tipado)
  console.error("Error inesperado:", error);

  const errorResponse: IErrorResponse = {
    code: "INTERNAL_ERROR" as any,
    message: "Error interno del servidor",
    details: {
      originalError: error instanceof Error ? error.message : String(error),
    },
  };

  res.status(500).json({
    success: false,
    error: errorResponse,
    timestamp,
  });
}

/**
 * Wrapper para convertir funciones async en manejadores Express
 * Captura errores no manejados y los pasa al middleware de errores
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

import { Request, Response, NextFunction } from 'express'

export interface AppError extends Error {
  statusCode?: number
  code?:       string
}

export function errorHandler(
  err:  AppError,
  _req: Request,
  res:  Response,
  _next: NextFunction
) {
  const statusCode = err.statusCode || 500
  const message    = err.message    || 'Internal Server Error'

  if (process.env.NODE_ENV !== 'production') {
    console.error(`[${new Date().toISOString()}] ${statusCode} — ${message}`)
    if (err.stack) console.error(err.stack)
  }

  res.status(statusCode).json({
    error:   message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  })
}

export function createError(message: string, statusCode: number): AppError {
  const err = new Error(message) as AppError
  err.statusCode = statusCode
  return err
}

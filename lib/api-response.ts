import { NextResponse } from 'next/server';

export class AppError extends Error {
  status: number;
  constructor(message: string, status: number = 400) {
    super(message);
    this.status = status;
    this.name = 'AppError';
  }
}

export function apiSuccess<T = any>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function apiError(message: string, status = 400, details: any = null) {
  return NextResponse.json(
    { error: message, ...(details ? { details } : {}) },
    { status }
  );
}

export function apiUnauthorized(message = 'Non autenticato') {
  return apiError(message, 401);
}

export function apiForbidden(message = 'Permesso negato') {
  return apiError(message, 403);
}

export function apiNotFound(message = 'Risorsa non trovata') {
  return apiError(message, 404);
}

export function apiInternalError(error: unknown, customMessage = 'Errore interno del server') {
  const errMsg = error instanceof Error ? error.message : String(error);
  console.error('[API Error]:', error);
  return apiError(
    customMessage || errMsg,
    500,
    process.env.NODE_ENV === 'development' ? { debug: errMsg } : null
  );
}

export function handleApiError(error: unknown) {
  if (error && typeof error === 'object' && 'status' in error && typeof (error as any).status === 'number') {
    const err = error as { message?: string; status: number };
    return apiError(err.message || 'Errore richiesta', err.status);
  }
  return apiInternalError(error);
}

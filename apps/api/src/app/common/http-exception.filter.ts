import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

interface ErrorEnvelope {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      response
        .status(status)
        .json(this.normalizeException(exceptionResponse, status));

      return;
    }

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred',
      },
    } satisfies ErrorEnvelope);
  }

  private normalizeException(
    exceptionResponse: string | object,
    status: number,
  ): ErrorEnvelope {
    if (typeof exceptionResponse === 'string') {
      return {
        error: {
          code: this.getDefaultCode(status),
          message: exceptionResponse,
        },
      };
    }

    const response = exceptionResponse as Record<string, unknown>;
    const nestedError = response.error;

    if (
      nestedError !== null &&
      typeof nestedError === 'object' &&
      !Array.isArray(nestedError)
    ) {
      const error = nestedError as Record<string, unknown>;

      return {
        error: {
          code:
            typeof error.code === 'string'
              ? error.code
              : this.getDefaultCode(status),

          message:
            typeof error.message === 'string'
              ? error.message
              : 'Request failed',

          ...(error.details !== undefined ? { details: error.details } : {}),
        },
      };
    }

    const message = response.message;

    if (Array.isArray(message)) {
      return {
        error: {
          code: this.getDefaultCode(status),
          message: 'Validation failed',
          details: {
            validationErrors: message,
          },
        },
      };
    }

    return {
      error: {
        code:
          typeof response.code === 'string'
            ? response.code
            : this.getDefaultCode(status),

        message: typeof message === 'string' ? message : 'Request failed',

        ...(response.details !== undefined
          ? { details: response.details }
          : {}),
      },
    };
  }

  private getDefaultCode(status: number): string {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return 'BAD_REQUEST';

      case HttpStatus.NOT_FOUND:
        return 'NOT_FOUND';

      case HttpStatus.CONFLICT:
        return 'CONFLICT';

      case HttpStatus.UNAUTHORIZED:
        return 'UNAUTHORIZED';

      case HttpStatus.FORBIDDEN:
        return 'FORBIDDEN';

      default:
        return 'HTTP_ERROR';
    }
  }
}

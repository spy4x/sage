import type { RequestHelperError } from '@stores/helpers';
import type { ZodTypeAny, z } from 'zod';
import {
	SERVER_ERROR,
	UNKNOWN_ERROR,
	VALIDATION_ERROR_CODE,
	type RequestError,
	type ValidationError
} from './types';

/**
 * Returns random string of given length
 * @param length length of string, default is 5, max is 9
 * @returns random string
 */
export function getRandomString(length = 5): string {
	return Math.random().toString(36).substring(length);
}

export function handleValidationError<T extends ZodTypeAny>(
	error: z.ZodError<T>
): ValidationError<T> {
	return {
		code: VALIDATION_ERROR_CODE,
		message: 'Please check correctness of fields',
		errors: error.flatten().fieldErrors
	};
}

export function handleRequestError<T extends ZodTypeAny>(
	error: RequestHelperError
): RequestError | ValidationError<T> {
	if (error.status === 400 && error.body.code === VALIDATION_ERROR_CODE) {
		return error.body as ValidationError<T>;
	}
	return {
		code: error.status === 500 ? SERVER_ERROR : UNKNOWN_ERROR,
		message: error.body.message || 'Unknown error',
		body: error.body
	};
}

import type { Writable } from 'svelte/store';

export function createStoreMutator<T>(store: Writable<T>) {
	return (mutation: Partial<T>) => {
		store.update((state) => ({ ...state, ...mutation }));
	};
}

export interface RequestHelperError {
	status: number;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	body: { message?: string; [key: string]: any };
}

export async function request<T>(
	url: string,
	method: 'GET' | 'POST' | 'PATCH' | 'DELETE' = 'GET',
	payload?: unknown
): Promise<[null, T] | [RequestHelperError, null]> {
	try {
		const extraParams: { body?: string; headers?: { [key: string]: string } } = {};

		if (payload) {
			if (method === 'GET') {
				// put payload into query string
				const params = new URLSearchParams(payload as Record<string, string>);
				url += `?${params.toString()}`;
				extraParams.body = undefined;
			} else {
				extraParams.body = JSON.stringify(payload);
				extraParams.headers = {
					'Content-Type': 'application/json'
				};
			}
		}

		const response = await fetch(url, {
			method,
			...extraParams
		});
		const json = await response.json();
		if (response.ok) {
			return [null, json];
		} else {
			return [{ status: response.status, body: json }, null];
		}
	} catch (error: unknown) {
		console.error(error);
		if (error instanceof Error) {
			return [{ status: 501, body: error }, null];
		}
		return [{ status: 501, body: { message: 'Unknown error' } }, null];
	}
}

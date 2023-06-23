<script lang="ts">
	import { VALIDATION_ERROR_CODE, type RequestError, type ValidationError } from '@shared';
	import type { ZodTypeAny } from 'zod';
	import Debug from './debug.svelte';
	export let message: undefined | null | string = undefined;
	export let error: undefined | null | RequestError | ValidationError<ZodTypeAny> = undefined;
	export let field: undefined | null | string = undefined;
	export let background = 'variant-soft-error';
	export let text = 'text-error-500';

	$: validationError =
		error && error.code === VALIDATION_ERROR_CODE && field && error.errors[field];
</script>

{#if message}
	<aside class="alert {background}">
		<div class="alert-message">
			{message}
		</div>
	</aside>
{:else if validationError}
	{#if validationError instanceof Array}
		{#each validationError as e}
			<p class={text}>{e}</p>
		{/each}
	{:else}
		<div class={text}><Debug data={error} /></div>
	{/if}
{/if}

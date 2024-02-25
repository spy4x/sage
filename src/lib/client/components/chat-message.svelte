<script lang="ts">
  import { markdown } from '@client/services';
  import { Debug } from '@components';
  import { Role, type Message } from '@shared';

  export let message: Message;
  export let index: number;
  export let deleteMessage: (index: number) => void;

  let showDetails = false;

  function copyToClipboard(text: string): void {
    navigator.clipboard.writeText(text);
  }
</script>

{#if message.role === Role.USER}
  <div class="card rounded-md space-y-2 variant-ghost-surface">
    <header class="flex justify-between items-center gap-3">
      <div class="flex gap-3 items-center">
        <img
          src="https://i.pravatar.cc/?img={message.role}"
          class="w-8 h-8 rounded-full"
          alt="You"
        />
        <p class="font-bold text-lg">You</p>
      </div>
      <button
        on:click={() => deleteMessage(index)}
        class="btn btn-icon btn-icon-sm text-surface-400"
        title="Delete message"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          stroke-width="2"
        >
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </header>
    <div class="message whitespace-pre-wrap">
      {message.content}
    </div>
  </div>
{/if}

{#if message.role === Role.ASSISTANT && message.content}
  <div class="card rounded-md space-y-2 variant-soft-tertiary max-w-full">
    <header class="flex justify-between items-center">
      <div class="flex items-center gap-3">
        <img src="/favicon.webp" class="w-8 h-8 rounded-full" alt="Sage" />
        <p class="font-bold text-lg">Sage</p>
        <!-- duration in seconds -->
        <small class="opacity-50">{Math.floor((message.durationMs || 0) / 1000)}s</small>
      </div>
      <div class="flex gap-3">
        <!-- Copy to clipboard button -->
        <button
          on:click={() => copyToClipboard(message.content)}
          class="btn btn-icon btn-icon-sm text-surface-400"
          title="Copy to clipboard"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="2"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
            />
          </svg>
        </button>
        <button
          on:click={() => deleteMessage(index)}
          class="btn btn-icon btn-icon-sm text-surface-400"
          title="Delete message"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="2"
          >
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </header>
    <div class="message overflow-auto">
      {@html markdown(message.content)}
    </div>
  </div>
{/if}

{#if message.role === Role.ASSISTANT && message.function_call}
  <div class="card px-4 py-1 rounded-md space-y-2 variant-ringed-tertiary max-w-full">
    <header class="flex justify-between items-center">
      <div class="flex items-center gap-3">
        <img src="/favicon.webp" class="w-6 h-6 rounded-full" alt="Sage" />
        <p class="font-bold text-lg">Calling function...</p>
        <small class="opacity-50">{Math.floor((message.durationMs || 0) / 1000)}s</small>
      </div>
      <div class="flex items-center gap-2">
        <button
          on:click={() => (showDetails = !showDetails)}
          class="btn btn-sm text-surface-400"
          title="Show/hide details"
        >
          toggle
        </button>
        <button
          on:click={() => deleteMessage(index)}
          class="btn btn-icon btn-icon-sm text-surface-400"
          title="Delete message"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="2"
          >
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </header>
    {#if showDetails}
      <div class="message overflow-auto">
        <Debug data={message.function_call} />
      </div>
    {/if}
  </div>
{/if}

{#if message.role === Role.FUNCTION}
  <div class="card px-4 py-1 rounded-md space-y-2 variant-ringed-tertiary max-w-full">
    <header class="flex justify-between items-center">
      <div class="flex items-center gap-3">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          stroke-width="2"
        >
          <path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        <p class="font-bold text-lg">{message.name}</p>
        <small class="opacity-50">{Math.floor((message.durationMs || 0) / 1000)}s</small>
      </div>
      <div class="flex items-center gap-2">
        <button
          on:click={() => (showDetails = !showDetails)}
          class="btn btn-sm text-surface-400"
          title="Show/hide details"
        >
          toggle
        </button>
        <button
          on:click={() => deleteMessage(index)}
          class="btn btn-icon btn-icon-sm text-surface-400"
          title="Delete message"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="2"
          >
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </header>
    {#if showDetails}
      <div class="message overflow-auto">
        {#if message.fnArgs}
          {@html markdown(
            `\`\`\`json
${JSON.stringify(JSON.parse(message.fnArgs), null, 4)}
\`\`\``,
          )}
        {/if}
        {#if message.content}
          {@html markdown(
            `\`\`\`json
${JSON.stringify(JSON.parse(message.content), null, 4)}
\`\`\``,
          )}
        {/if}
      </div>
    {/if}
  </div>
{/if}

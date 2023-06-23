<script lang="ts">
  import Debug from '@components/debug.svelte';
  import Loading from '@components/loading.svelte';
  import {
    MessageSchema,
    Role,
    type Message,
    EntityOperationType,
    AsyncOperationStatus,
  } from '@shared';
  import { Avatar } from '@skeletonlabs/skeleton';
  import { chats } from '@stores';
  import { onMount } from 'svelte';
  import { marked } from 'marked';
  import hljs from 'highlight.js';

  const displayMessageDetails: Record<string, boolean> = {};
  let elemChat: HTMLElement;
  let currentMessage = '';
  $: updateOperation = $chats.getOperation($chats.chat.id, EntityOperationType.UPDATE);

  function scrollChatBottom(behavior?: ScrollBehavior): void {
    setTimeout(() => elemChat.scrollTo({ top: elemChat.scrollHeight, behavior }), 10);
  }

  function addMessage(): void {
    const content = currentMessage.trim();
    if (!content) {
      return;
    }
    const message = MessageSchema.parse({ content } satisfies Partial<Message>);
    chats.message({
      ...$chats.chat,
      messages: [...$chats.chat.messages, message],
    });
    currentMessage = '';
    scrollChatBottom('smooth');
  }

  function onPromptKeydown(event: KeyboardEvent): void {
    if (['Enter'].includes(event.code)) {
      event.preventDefault();
      addMessage();
    }
  }

  // When DOM mounted, scroll to bottom
  onMount(() => {
    // #region Code highlighting
    marked.setOptions({
      highlight: function (code: string, language: string) {
        if (!language) {
          return hljs.highlightAuto(code).value;
        }
        try {
          return hljs.highlight(code, { language }).value;
        } catch (e) {
          return hljs.highlightAuto(code).value;
        }
      },
    });
    // #endregion
    scrollChatBottom();
    const unsubscribe = chats.onNewMessage($chats.chat.id, () => scrollChatBottom('smooth'));
    return unsubscribe;
  });

  function deleteMessage(index: number): void {
    chats.update({
      ...$chats.chat,
      messages: $chats.chat.messages.filter((_, i) => i !== index),
    });
  }

  function markdown(text: string): string {
    return marked(text);
  }

  function toggleDetails(message: Message): void {
    displayMessageDetails[message.id] = !displayMessageDetails[message.id];
  }
</script>

<section class="container mx-auto max-w-[800px] h-full pt-4">
  <div class="card chat w-full h-full grid grid-rows-[auto_75px]">
    <!-- Chat -->
    <!-- Conversation -->
    <section bind:this={elemChat} class="p-4 overflow-y-auto space-y-4 max-w-full">
      {#if $chats.chat.messages.length}
        {#each $chats.chat.messages as message, index}
          {#if message.role === Role.USER}
            <div class="card p-4 rounded-md space-y-2 variant-ghost-surface">
              <header class="flex justify-between items-center gap-3">
                <div class="flex gap-3 items-center">
                  <Avatar src="https://i.pravatar.cc/?img={message.role}" width="w-8" />
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
              <div class="message overflow-auto">{message.content}</div>
            </div>
          {/if}
          {#if message.role === Role.ASSISTANT && message.content}
            <div class="card p-4 rounded-md space-y-2 variant-soft-tertiary max-w-full">
              <header class="flex justify-between items-center">
                <div class="flex items-center gap-3">
                  <Avatar src="/favicon.webp" width="w-8" />
                  <p class="font-bold text-lg">Sage</p>
                  <small class="opacity-50">{message.durationMs} ms</small>
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
              <div class="message overflow-auto">
                {@html markdown(message.content)}
              </div>
            </div>
          {/if}
          {#if message.role === Role.ASSISTANT && message.function_call}
            <div class="card px-4 py-1 rounded-md space-y-2 variant-ringed-tertiary max-w-full">
              <header class="flex justify-between items-center">
                <div class="flex items-center gap-3">
                  <Avatar src="/favicon.webp" width="w-6" />
                  <p class="font-bold text-lg">Calling function...</p>
                  <small class="opacity-50">{message.durationMs} ms</small>
                </div>
                <div class="flex items-center gap-2">
                  <button
                    on:click={() => toggleDetails(message)}
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
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              </header>
              {#if displayMessageDetails[message.id]}
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
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                  <p class="font-bold text-lg">{message.name}</p>
                  <small class="opacity-50">{message.durationMs} ms</small>
                </div>
                <div class="flex items-center gap-2">
                  <button
                    on:click={() => toggleDetails(message)}
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
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              </header>
              {#if displayMessageDetails[message.id]}
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
        {/each}
      {:else}
        <div class="w-full h-full grid items-center">
          <div>
            <h3 class="h3 text-center opacity-50 mb-3">No messages yet.</h3>
            <p class="text-center opacity-50">Start a conversation using input below.</p>
          </div>
        </div>
      {/if}
      {#if updateOperation?.status === AsyncOperationStatus.IN_PROGRESS}
        <div class="grid justify-end">
          <Loading size="h-8 w-8" isIcon={true} />
        </div>
      {/if}

      {#if updateOperation?.status === AsyncOperationStatus.ERROR}
        <div class="alert variant-filled-warning">
          <Debug data={updateOperation?.error} />
        </div>
      {/if}
    </section>
    <!-- Prompt -->
    <section class="border-t border-surface-500/30 p-4">
      <div class="input-group input-group-divider grid-cols-[auto_80px] rounded-container-token">
        <textarea
          bind:value={currentMessage}
          class="bg-transparent border-0 ring-0 min-h-[40px]"
          name="prompt"
          id="prompt"
          placeholder="Write a message..."
          rows="1"
          on:keydown={onPromptKeydown}
        />
        <button
          class="text-center {currentMessage ? 'variant-filled-primary' : 'input-group-shim'}"
          on:click={addMessage}
        >
          Send
        </button>
      </div>
    </section>
  </div>
</section>

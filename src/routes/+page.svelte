<script lang="ts">
  import { AsyncOperationStatus, EntityOperationType, MessageSchema, type Message } from '@shared';
  import { chats } from '@stores';
  import { onMount } from 'svelte';
  import { ChatMessage, Debug, Loading, ModelSelector } from '@components';

  let elemChat: HTMLElement;
  let currentMessage = '';
  let messageInput: HTMLTextAreaElement;
  $: updateOperation = chats.getOperation($chats.chat.id, EntityOperationType.UPDATE);

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
    resizeTextarea(null, true);
    scrollChatBottom('smooth');
  }

  function submitOnEnter(e: KeyboardEvent): void {
    const specialKey = e.metaKey || e.ctrlKey || e.shiftKey || e.altKey;
    // if Special key + Enter = new line
    if (e.key === 'Enter' && !specialKey) {
      e.preventDefault();
      addMessage();
    }
  }
  function resizeTextarea(_event: null | Event = null, setZeroFirst = false): void {
    if (setZeroFirst) {
      console.log('setZeroFirst');
      messageInput.style.height = '0px'; // Set to 0 to get the scroll height
      setTimeout(() => {
        messageInput.style.height = 'auto'; // Reset the height to auto
        messageInput.style.height = `${messageInput.scrollHeight}px`; // Set the new height based on the scroll height
      });
    } else {
      messageInput.style.height = 'auto'; // Reset the height to auto
      messageInput.style.height = `${messageInput.scrollHeight}px`; // Set the new height based on the scroll height
    }
  }

  function deleteMessage(index: number): void {
    chats.update({
      ...$chats.chat,
      messages: $chats.chat.messages.filter((_, i) => i !== index),
    });
  }

  // When DOM mounted, scroll to bottom
  onMount(() => {
    scrollChatBottom();
    return chats.onNewMessage($chats.chat.id, () => scrollChatBottom('smooth'));
  });
</script>

<section class="container mx-auto max-w-[800px] h-full">
  <div class="card chat w-full h-full grid grid-rows-[1fr_auto] gap-4">
    <!-- #region Chat -->
    <section bind:this={elemChat} class="overflow-y-auto space-y-6 max-w-full">
      {#if $chats.chat.messages.length}
        {#each $chats.chat.messages as message, index}
          <ChatMessage {message} {index} {deleteMessage} />
        {/each}
      {:else}
        <div class="w-full h-full grid items-center">
          <div class="text-center">
            <h3 class="h3 opacity-50 mb-3">No messages yet.</h3>
            <p class="opacity-50 mb-3">Start a conversation using input below.</p>
          </div>
        </div>
      {/if}
      {#if updateOperation?.status === AsyncOperationStatus.IN_PROGRESS}
        <div class="flex items-center gap-3">
          <Loading size="h-5 w-5" />
        </div>
      {/if}

      {#if updateOperation?.status === AsyncOperationStatus.ERROR}
        <div class="alert variant-filled-warning">
          <Debug data={updateOperation?.error} />
        </div>
      {/if}
    </section>
    <!-- #endregion -->

    <!-- #region Prompt -->
    <div class="w-full text-right">
      <div class="mb-2">
        <ModelSelector model={$chats.chat.model} on:change={e => chats.setModel(e.detail)} />
      </div>
      <textarea
        bind:value={currentMessage}
        bind:this={messageInput}
        class="block w-full rounded-md border-0 py-1.5 bg-slate-100 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 min-h-[20px]"
        name="prompt"
        id="prompt"
        placeholder="Write a message..."
        rows="1"
        on:keydown={submitOnEnter}
        on:input={resizeTextarea}
      />
    </div>
    <!-- #endregion -->
  </div>
</section>

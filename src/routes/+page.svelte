<script lang="ts">
  import {
    AsyncOperationStatus,
    EntityOperationType,
    MessageContentType,
    MessageSchema,
    type Message,
  } from '@shared';
  import { chats } from '@stores';
  import { onMount } from 'svelte';
  import { ChatMessage, Debug, IconSend, IconTrash, Loading, PersonaSelector } from '@components';
  import { isMobile } from '@client/helpers';

  let elemChat: HTMLElement;
  let imageInput: HTMLInputElement;
  let currentMessage = '';
  let messageInput: HTMLTextAreaElement;
  let imageURL = '';
  let file: File | null = null;
  $: updateOperation = chats.getOperation($chats.chat.id, EntityOperationType.UPDATE);

  function scrollChatBottom(behavior?: ScrollBehavior): void {
    setTimeout(() => elemChat.scrollTo({ top: elemChat.scrollHeight, behavior }), 10);
  }

  async function addMessage(): void {
    const text = currentMessage.trim();
    if (!text) {
      return;
    }
    const content: Message['content'] = [{ type: MessageContentType.TEXT, text }];
    // if (imageURL) {
    //   content.push({
    //     type: MessageContentType.IMAGE,
    //     image_url: {
    //       url: imageURL,
    //     },
    //   });
    // }
    if (file) {
      // get base64 of the image

      const reader = new FileReader();
      const promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          resolve(reader.result as string);
        };
        reader.onerror = error => {
          reject(error);
        };
      });
      reader.readAsDataURL(file);
      const result = await promise;
      content.push({
        type: MessageContentType.IMAGE,
        image_url: {
          url: result,
        },
      });
    }
    const message = MessageSchema.parse({
      content,
    } satisfies Partial<Message>);
    chats.message({
      ...$chats.chat,
      messages: [...$chats.chat.messages, message],
    });
    imageURL = '';
    file = null;
    currentMessage = '';
    resizeTextarea(null, true);
    scrollChatBottom('smooth');
  }

  function submitOnEnter(e: KeyboardEvent): void {
    if (e.key !== 'Enter') {
      return;
    }
    const isSpecialKey = e.metaKey || e.ctrlKey || e.shiftKey || e.altKey;
    if (!isMobile && !isSpecialKey) {
      // on desktop special key allows to make new line
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

  function clearChat(): void {
    if (confirm('Are you sure want to clear chat? All messages will be deleted.')) {
      chats.clear();
    }
  }

  function deleteMessage(index: number): void {
    chats.update({
      ...$chats.chat,
      messages: $chats.chat.messages.filter((_, i) => i !== index),
    });
  }

  async function uploadImage() {
    const files = imageInput.files;
    const formData = new FormData();

    // Append the file to the FormData object
    if (!files || !files.length) return;
    file = files[0];
    formData.append('file', files[0]);
    try {
      const response = await fetch('/api/uploads', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('File upload failed');
      }

      const result = await response.json();
      console.log('File upload successful:', result);
      const { path } = result;
      imageURL = location.href + path;
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  }

  // When DOM mounted, scroll to bottom
  onMount(() => {
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
        {#if updateOperation?.status === AsyncOperationStatus.IN_PROGRESS}
          <div class="flex items-center gap-3">
            <Loading size="h-5 w-5" />
          </div>
        {/if}
        <div data-e2e="bottom-margin" class="pt-[150px]"></div>
      {:else}
        <div class="w-full h-full grid items-center">
          <div class="text-center">
            <h3 class="h3 opacity-50 mb-3">No messages yet.</h3>
            <p class="opacity-50 mb-3">Start a conversation using input below.</p>
          </div>
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
    <div class="w-full">
      <div class="flex gap-1 mb-2 items-stretch">
        <!--        <ModelSelector model={$chats.chat.model} on:change={e => chats.setModel(e.detail)} />-->
        <PersonaSelector
          personaId={$chats.chat.personaId}
          on:change={e => chats.setPersona(e.detail)}
        />
        {#if $chats.chat.messages.length}
          <button on:click={clearChat} class="btn flex gap-1 items-center">
            <IconTrash />
            <span>Clear chat</span>
          </button>
        {/if}
      </div>
      <div class="flex gap-1 items-start">
        <button
          on:click={() => imageInput.click()}
          class="btn variant-primary min-h-[36px]"
          title="Upload image"
        >
          <IconSend />
          <input
            bind:this={imageInput}
            type="file"
            on:change={uploadImage}
            name="image"
            accept="image/*"
            class="hidden"
          />
        </button>
        <textarea
          bind:value={currentMessage}
          bind:this={messageInput}
          class="block w-full rounded-md border-0 py-1.5 bg-slate-100 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 min-h-[36px] max-h-[200px]"
          name="prompt"
          id="prompt"
          placeholder="Write a message..."
          rows="1"
          on:keydown={submitOnEnter}
          on:input={resizeTextarea}
        />
        <button
          class="btn variant-primary min-h-[36px]"
          on:click={addMessage}
          title="Hotkey: Enter"
        >
          <IconSend />
        </button>
      </div>
    </div>
    <!-- #endregion -->
  </div>
</section>

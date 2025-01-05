<script lang="ts">
  import '../app.css';
  import { browser } from '$app/environment';
  import { env } from '$env/dynamic/public';
  let password = browser ? localStorage.getItem('password') ?? '' : '';
  let isSignedIn = password === env.PUBLIC_PASSWORD;
  let isButtonClicked = false;

  function submitPassword() {
    isButtonClicked = true;
    if (password === env.PUBLIC_PASSWORD) {
      localStorage.setItem('password', password);
      isSignedIn = true;
    }
  }
</script>

<div class="p-4 lg:p-6 hd-full">
  <!-- If isSignedIn - slow <slot/>, otherwise - password input -->
  {#if isSignedIn}
    <slot />
  {:else}
    <form on:submit={submitPassword} class="flex flex-col gap-4 items-center">
      <!-- Add keydown:enter event -->
      <input
        type="password"
        bind:value={password}
        placeholder="Password"
        class="block rounded-md border-0 py-1.5 bg-slate-100 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
      />
      <button class="btn variant-primary"> Sign in </button>

      {#if password}
        {#if isButtonClicked}
          <p class="text-sm text-center opacity-50">Incorrect password. Please try again.</p>
        {/if}
      {:else}
        <p class="text-sm text-center opacity-50">
          This page is password protected. Please enter the password to continue.
        </p>
      {/if}
    </form>
  {/if}
</div>

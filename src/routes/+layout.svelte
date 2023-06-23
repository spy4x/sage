<script lang="ts">
  // The ordering of these imports is critical to your app working properly
  import '@skeletonlabs/skeleton/themes/theme-crimson.css';
  // If you have source.organizeImports set to true in VSCode, then it will auto change this ordering
  import '@skeletonlabs/skeleton/styles/skeleton.css';
  // Most of your app wide CSS should be put in this file
  import '../app.postcss';

  import { AppBar, AppShell, Toast, type PopupSettings } from '@skeletonlabs/skeleton';
  // import { AuthOperation, auth } from '@stores';
  // import { Loading } from '@components';
  // import { AsyncOperationStatus } from '@shared';
  import { initPopups } from '@client/services';
  initPopups();

  // async function signOut() {
  // 	await auth.signOut();
  // }

  const userProfileDropdown: PopupSettings = {
    event: 'click',
    target: 'userProfileDropdown',
    placement: 'bottom',
    closeQuery: 'li',
  };

  // onMount(() => {
  // 	const unsubscribe = auth.onAuthStateChange((user) => {
  // 		if (!user) {
  // 			goto('/auth');
  // 		}
  // 	});
  // 	return unsubscribe;
  // });
</script>

<!-- App Shell -->
<AppShell slotSidebarLeft="bg-surface-500/5 w-56 p-4" slotPageContent="h-full">
  <svelte:fragment slot="header">
    <!-- App Bar -->
    <AppBar>
      <svelte:fragment slot="lead">
        <a href="/">
          <strong class="text-xl uppercase tracking-wide"> Sage </strong>
        </a>
      </svelte:fragment>
      <svelte:fragment slot="trail">
        <!-- {#if $auth.user}
          <div class="flex items-center gap-8 text-sm">
            <a
              class="hover:underline underline-offset-2"
              class:underline={$page.url.pathname.startsWith('/scenarios')}
              href="/scenarios"
            >
              {#if $auth.user.role === 'ADMIN'}
                Global
              {/if}
              Scenarios
            </a>
            <a
              class="hover:underline underline-offset-2"
              class:underline={$page.url.pathname.startsWith('/movies')}
              href="/movies"
            >
              Movies
            </a>
            <button
              class="btn-icon btn-sm variant-ghost-secondary"
              use:popup={userProfileDropdown}
              type="button"
            >
              {#if $auth.status === AsyncOperationStatus.IN_PROGRESS && ($auth.operation === AuthOperation.SIGN_OUT || $auth.operation === AuthOperation.FETCH_ME)}
                <Loading isIcon={true} />
              {:else if $auth.user.photoURL}
                <img src={$auth.user.photoURL} class="w-6 h-6 rounded-full" alt="avatar" />
              {:else}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke-width="1.5"
                  stroke="currentColor"
                  class="w-6 h-6"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                  />
                </svg>
              {/if}
            </button>
            <nav class="list-nav card shadow-xl p-4" data-popup="userProfileDropdown">
              <ul>
                <li class="listbox-item">
                  <a href="/profile"> Profile </a>
                </li>
                <hr class="opacity-50" />
                <li class="listbox-item">
                  <button on:click={signOut} type="button">
                    {#if $auth.status === AsyncOperationStatus.IN_PROGRESS && ($auth.operation === AuthOperation.SIGN_OUT || $auth.operation === AuthOperation.FETCH_ME)}
                      <Loading /> Processing...
                    {:else}
                      Sign out
                    {/if}
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        {:else}
          <a class="btn btn-sm variant-ghost-primary" href="/auth"> Sign in / up </a>
        {/if} -->
      </svelte:fragment>
    </AppBar>
  </svelte:fragment>

  <!-- Page Route Content -->
  <div class="px-4 lg:px-6 pb-6 h-full">
    <slot />
  </div>
</AppShell>

<Toast />

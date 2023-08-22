<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { Model } from '@shared';

  export let model: Model;
  const dispatch = createEventDispatcher();

  function set(model: Model): void {
    dispatch('change', model);
  }
</script>

<span class="isolate inline-flex rounded-md shadow-sm">
  <button
    on:click={() => set(Model.GPT3)}
    type="button"
    class="{model === Model.GPT3
      ? 'bg-slate-50'
      : 'bg-slate-300'} relative inline-flex items-center rounded-l-md px-3 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-10"
  >
    ⚡ GPT-3.5
  </button>
  <button
    on:click={() => set(Model.GPT4)}
    type="button"
    class="{model === Model.GPT4
      ? 'bg-slate-50'
      : 'bg-slate-300'} relative -ml-px inline-flex items-center rounded-r-md px-3 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-10"
  >
    🧠 GPT-4
  </button>
</span>

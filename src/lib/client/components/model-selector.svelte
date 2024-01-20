<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { Model } from '@shared';

  export let model: Model;
  const dispatch = createEventDispatcher();

  function set(model: Model): void {
    dispatch('change', model);
  }
</script>

<span class="isolate inline-flex shadow-sm">
  <select
    aria-label="AI Model"
    class="relative inline-flex items-center pl-4 pr-8 py-2 text-sm font-semibold text-gray-900 bg-slate-300 border border-gray-300 rounded-md hover:bg-gray-50 focus:z-10 focus:outline-none focus:ring-1 focus:ring-slate-300 focus:border-slate-300"
    bind:value={model}
    on:change={() => set(model)}
  >
    <option value={Model.GPT4}>🧠 GPT-4</option>
    <option value={Model.GPT3}>⚡ GPT-3.5</option>
  </select>
</span>

<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { defaultPersona, PERSONAS } from '@shared';
  import { IconQuestion } from '@components';

  export let personaId: number;
  let persona = defaultPersona;
  const dispatch = createEventDispatcher();

  function set(personaId: number): void {
    persona = PERSONAS.find(p => p.id === personaId) || defaultPersona;
    dispatch('change', personaId);
  }
</script>

<span class="isolate inline-flex shadow-sm">
  <select
    aria-label="AI Persona"
    class="relative inline-flex items-center pl-4 pr-8 py-2 text-sm font-semibold text-gray-900 bg-slate-300 border border-gray-300 rounded-md hover:bg-gray-50 focus:z-10 focus:outline-none focus:ring-1 focus:ring-slate-300 focus:border-slate-300"
    bind:value={personaId}
    on:change={() => set(personaId)}
  >
    <option disabled>Persona:</option>
    {#each PERSONAS as persona}
      <option value={persona.id}>{persona.title}</option>
    {/each}
  </select>
</span>
<button
  on:click={() => alert(`Persona "${persona.title}":\n${persona.description}`)}
  class="btn btn-icon"
>
  <IconQuestion />
</button>

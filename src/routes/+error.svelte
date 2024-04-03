<script lang="ts">
    import { page } from '$app/stores';
    import swStore from'$lib/stores/sw';
    import Offline from './offline/+page.svelte'

    console.log('isOnline: ', $swStore.isOnline)
</script>

{#if $swStore.isOnline}
    <Offline status={$page.status} message={$page.error?.message} />
{:else}
    <Offline />
{/if}

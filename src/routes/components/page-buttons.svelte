<script lang="ts">
    import { createEventDispatcher } from 'svelte';

    const dispatch = createEventDispatcher();

    const createPostOpen = () => {
        dispatch('openClosePostModal', {
			what: true
		});
    }
</script>

<div class="floating-button">
    <button 
        class="mdl-button mdl-js-button mdl-button--fab mdl-button--colored"
        id="share-image-button"
        on:click={createPostOpen}
    >
        <i class="material-icons">add</i>
    </button>
</div>

<style lang="scss">
    .floating-button {
        z-index: 1000;
        position: fixed;
        bottom: 0;
        right: 0;
        padding: 30px;
    }
</style>

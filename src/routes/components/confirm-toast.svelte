<script lang='ts'>
    import { createEventDispatcher } from 'svelte';

    export let message = '';
    export let isOpen = false;

    const dispatch = createEventDispatcher();

    const closeSnackbar = () => {
        dispatch('closeSnackbar');
    }
</script>

<div class="snackbar" class:open={isOpen}>
    <p>{message}</p>
    <button on:click={closeSnackbar}>Close</button>
</div>

  <style lang='scss'>
    .snackbar {
        position: fixed;
        bottom: 10px;
        left: 50%;
        transform: translateX(-50%);
        padding: 10px 20px;
        background-color: #333;
        color: #fff;
        border-radius: 4px;
        opacity: 0;
        transition: opacity 0.3s ease-in-out;
        z-index: 100;
        text-align: center;
  
    &.open {
        opacity: 1;
    }
    
    .snackbar button {
        margin: 10px auto;
    }
}
</style>

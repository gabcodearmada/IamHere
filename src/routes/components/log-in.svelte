<script lang="ts">
    import { enhance } from '$app/forms';
    import type { ActionData } from '../$types';

    export let username: string;
    export let form: ActionData;

    let password = '';
</script>

<div>
    <h4>Login to app</h4>

    {#if form?.from==='login' && form?.error}
      <p class="error">{form.error}</p>
    {/if}

    <form method="POST" action="?/login" use:enhance>

        <div class="input-section mdl-textfield mdl-js-textfield mdl-textfield--floating-label">
            <input 
                class="mdl-textfield__input"
                type="text" 
                bind:value={username}
                name="username" 
                autocomplete="off" 
                required
            >
            <label class="mdl-textfield__label" for="username">Username</label>
        </div>

        <div class="input-section mdl-textfield mdl-js-textfield mdl-textfield--floating-label">
            <input 
                class="mdl-textfield__input"
                type="password" 
                bind:value={password}
                name="password" 
                autocomplete="off" 
                required
            >
            <label class="mdl-textfield__label" for="password">Password</label>
        </div>
        <br>
      
        <div class="login-div">
            <button 
                class="mdl-button mdl-js-button mdl-button--raised mdl-button--colored mdl-color--accent"
                type="submit" 
                id="post-btn"
            >
            Submit
            </button>
        </div>

    </form>
</div>

<style lang="scss">
    h4 {
        text-align: center;
    }

    .error {
        color: tomato;
        max-width: 320px;
        margin: 10px auto;
    }

    .input-section {
        display: block;
        margin: 10px auto;
    }

    .login-div {
        text-align: center;
    }
</style>

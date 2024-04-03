<script lang='ts'>
    import swStore from'$lib/stores/sw';

    export let beForw: boolean;
    export let divHide: boolean;
    export let mainImage: HTMLDivElement;
    export let forwnames: string[];

    let ownerP: HTMLParagraphElement | null = null;

    $: mainImage ? setOwnerParagraph() : null;
    $: beForw ? forwnames = [] : null;

    const setOwnerParagraph = () => {
        const children = mainImage.children;
        ownerP = children[3] as HTMLParagraphElement;
    }
</script>

<div class="forward-div" class:forw-div={beForw && !divHide}>

    <h4>Forward to</h4>

    <div class="forward-to">
        {#if $swStore.userFriends && ownerP}
            {#each $swStore.userFriends as frn (frn.id)}
                {#if ownerP.textContent !== frn.id}
                    <label for="forwardto">
                        <input type="checkbox" bind:group={forwnames} value={frn.id} name="forwardto" />
                        {frn.pubname}
                    </label>
                {/if}
            {/each}
        {/if}
    </div>

</div>

<style lang="scss">
    .forward-div {
        position: absolute;
        left: 50%;
        top: 45%;
        text-align: center;
        opacity: 0.1;
        transform: translate(220%, -50%);
        transition: opacity 0.6s ease-in-out, transform 0.75s ease-in-out;
        background-color: #eeeeeeb5;
        color: #333;
        border-radius: 5px;
        box-shadow: rgba(0, 0, 0, 0.17) 0px -23px 25px 0px inset, rgba(0, 0, 0, 0.15) 0px -36px 30px 0px inset, rgba(0, 0, 0, 0.1) 0px -79px 40px 0px inset, rgba(0, 0, 0, 0.06) 0px 2px 1px, rgba(0, 0, 0, 0.09) 0px 4px 2px, rgba(0, 0, 0, 0.09) 0px 8px 4px, rgba(0, 0, 0, 0.09) 0px 16px 8px, rgba(0, 0, 0, 0.09) 0px 32px 16px;
        &.forw-div {
            opacity: 1;
            transform: translate(-70%, -50%);
        }
        
        h4 {
            margin: 0.25em 0.6em;
            font-size: 22px;
            text-decoration: underline;
        }

        label {
            display: block;
            text-align: left;
            margin-bottom: 10px;
            font-size: 18px;
            margin: 1em;
        }
    }
</style>

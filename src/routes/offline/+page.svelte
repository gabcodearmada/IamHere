<script lang='ts'>
    export let status: number | null = null;
    export let message: string = '';
</script>

<div class="page">
    <div class="pagewrap">

        <img src="./images/offline.jpg" alt="OffLine">

        <div class="offline_text">
            <p>Λυπούμαστε. Αυτή η σελίδα δεν έχει αποθηκευτεί ακόμα στην προσωρινή μνήμη.</p>
            {#if status && status===404}
                <p>Μπορεί η σελίδα να μην υπάρχει!</p>
                <code>{message}</code>
            {:else if status}
                <code>Status: {status}</code>
                <hr />
                <code>Message: {message}</code>
            {/if}
        </div>
    </div>
</div>

<style lang="scss">

    .page {
        position: relative;
        max-width: 2400px;
        margin-left: auto;
        margin-right: auto;

        .pagewrap {
            position: relative;
            width: 100%;
            padding-left: 45px;
            padding-right: 45px;
            text-align: center;

            img {
                display: inline-block;
                margin: 2em auto;
                max-width: calc(100% - 90px);
            }

            .offline_text {
                margin: 0 auto;
                max-width: 50%
            }
        }
    }

/*
@media (max-width: 860px) {
    .page {
        .pagewrap {
            padding-left: 0;
            padding-right: 0;
        }
    }
}
*/
</style>
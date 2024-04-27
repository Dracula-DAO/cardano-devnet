<script>
  import UtxoDetail from "$lib/UtxoDetail.svelte"
  export let data
  let bgcolor = data.spentBy === "unspent" ? "color-unspent-utxo" : "color-spent-utxo"
</script>
<div class="flex grow">
  <div class="grow card {bgcolor} shadow-xl p-8">
    <div class="card-title justify-center mb-4">
      {#if data.spentBy === "unspent"}Unspent{:else}Spent{/if} UTxO
    </div>
    <UtxoDetail utxo={data}/>
  </div>
</div>
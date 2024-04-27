<script>
  import TokenDetail from "$lib/TokenDetail.svelte"
  export let data
</script>
<div class="flex grow">
  <div class="card color-token shadow-xl p-8 grow">
    <div class="card-title justify-center mb-4">Token Ledger Detail</div>
    <TokenDetail token={data}/>
  </div>
</div>
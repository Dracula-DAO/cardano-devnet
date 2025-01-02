<script>
  import TransactionDetail from "$lib/TransactionDetail.svelte"
  export let data
</script>
<div class="flex grow">
  <div class="grow card color-transaction shadow-xl p-8">
    <div class="card-title justify-center mb-4">Transaction {data.hash[1]}</div>
    <TransactionDetail tx={data}/>
  </div>
</div>
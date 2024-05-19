<script>
  export let data 
</script>
<div class="card-title">Transactions page {data.pageIndex}</div>
<div class="flex justify-center mb-8">
  {#if data.pageIndex > 0}
    <a class="btn mr-2 shadow-xl" href="/pages/blocks/{data.pageIndex-1}">Prev Page</a>
  {/if}
  {#if data.pageIndex < data.lastPage}
    <a class="btn shadow-xl" href="/pages/blocks/{data.pageIndex+1}">Next Page</a>
  {/if}
</div>
<div>
  <div class="flex flex-wrap grow">
    {#each data.pageData as tx}
      <a href="/transaction/{tx.id[0]}">
        <div class="rounded-lg color-transaction shadow-xl flex flex-col p-4 mr-2 mb-2">
          <div>Tx {tx.index}</div>
          <div>ID {tx.id[1]}</div>
          {#if tx.spentCount > 0}
            <div class="btn-active rounded-lg mt-2 p-2 color-spent-utxo">{tx.spentCount} spent utxo{#if tx.spentCount != 1}s{/if}</div>
          {/if}
          {#if tx.unspentCount > 0}
            <div class="btn-active rounded-lg mt-2 p-2 color-unspent-utxo">{tx.unspentCount} unspent utxo{#if tx.unspentCount != 1}s{/if}</div>
          {/if}
        </div>
      </a>
    {/each}
  </div>
</div>
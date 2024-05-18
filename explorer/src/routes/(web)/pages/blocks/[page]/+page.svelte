<script>
  export let data 
</script>
<div class="card-title">Blocks page {data.pageIndex}</div>
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
    {#each data.pageData as blk}
      <a href="/chain/{blk.height}">
        <div class="rounded-lg color-block shadow-xl flex flex-col p-4 mr-2 mb-2">
          <div>Block {blk.height}</div>
          <div>Hash {blk.id}</div>
          {#if blk.txCount > 0}
            <div class="btn-active rounded-lg mt-2 p-2 color-transaction">{blk.txCount} Tx{#if blk.txCount != 1}s{/if}</div>
          {/if}
        </div>
      </a>
    {/each}
  </div>
</div>
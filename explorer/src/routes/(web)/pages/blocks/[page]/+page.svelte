<script>
  export let data 
</script>
<div class="card-title">Block page {data.pageIndex}</div>
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
        <div class="color-block shadow-xl flex flex-col p-4 mr-2 mb-2">
          <div>Block {blk.height}</div>
          <div>Hash {blk.id}</div>
        </div>
      </a>
    {/each}
  </div>
</div>
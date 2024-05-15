<script>
  export let data 
</script>
<div class="card-title">Block page {data.pageIndex}</div>
<div class="flex flex-wrap grow">
  {#each data.pageData as blk}
    <a href="/chain/{blk.height}">
      <div class="color-block shadow-xl flex flex-col p-4 mr-2">
        <div>Block {blk.height}</div>
        <div>Hash {blk.id}</div>
      </div>
    </a>
  {/each}
</div>
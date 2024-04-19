<script>
  import BlockDetail from "$lib/BlockDetail.svelte"
  export let data
</script>
<div class="flex grow">
  <div class="grow card color-block shadow-xl p-8">
    <BlockDetail block={data}/>
  </div>
</div>
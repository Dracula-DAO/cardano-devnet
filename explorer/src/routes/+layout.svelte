<script>
  import "../app.css"
  import Legend from "$lib/Legend.svelte"
  import SearchBar from "$lib/SearchBar.svelte"
  export let data
</script>
<div class="flex flex-col">
  <div class="flex justify-center pb-4">
    <h1 class="text-3xl font-bold">Cardano Devnet Explorer</h1>
  </div>
  <div class="flex justify-between">
    <a class="btn" href="/chain/0">Genesis Block</a>
    <a class="btn" href="/chain/{data.height}">Latest Block {data.height}</a>
  </div>
  <div class="mt-4 mb-4">
    <SearchBar/>
  </div>
  <div class="self-center flex flex-row">
    <div class="bg-gray-200 card shadow-xl p-4">
      <Legend/>
    </div>
    <div class="ml-4 mr-4">
      <slot/>
    </div>
    <div class="flex flex-col w-64 bg-gray-200 card shadow-xl p-4">
      <div class="self-center font-bold pb-4">Token Totals</div>
      {#each Object.entries(data.tokens) as [name, token]}
        <img class="self-center token" src="/{token.logo}" alt="{name}"/>
        <div class="self-center pb-4">{token.amount}</div>
      {/each}
    </div>
  </div>
</div>
<script>
  import AddressDetail from "$lib/AddressDetail.svelte"
  export let data
</script>
<div class="flex grow">
  <div class="grow card color-address shadow-xl p-8">
    <div class="card-title justify-center mb-4">Address {data.address[1]}</div>
    <AddressDetail addr={data}/>
  </div>
</div>
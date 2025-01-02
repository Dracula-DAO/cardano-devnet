<script>
  export let token
</script>
<table class="card border-separate border-spacing-4 shadow-lg">
  <tbody>
    <tr>
      <td>Policy ID</td>
      <td>{ token.policy }</td>
    </tr>
    <tr>
      <td>Token Name</td>
      <td>{ token.token }</td>
    </tr>
    <tr>
      <td>Addresses</td>
      <td>
        <table class="table-header-group border-separate border-spacing-4">
          <thead>
            <tr>
              <td>Address</td>
              <td>Alias</td>
              <td>Amount</td>
            </tr>
          </thead>
          <tbody>
            {#each token.ledger as addr}
              <tr>
                <td><a class="btn color-address shadow-xl" href="/address/{addr.address[0]}">{ addr.address[1] }</a></td>
                <td>{#if addr.alias !== undefined}<a href="/address/{addr.address[0]}">{addr.alias}</a>{:else}--{/if}</td>
                <td>{ addr.amount }</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </td>
    </tr>
  </tbody>
</table>
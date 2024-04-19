<script>
  export let addr
</script>
<table class="border-separate border-spacing-4">
  <tbody>
    <tr>
      <td>Address</td>
      <td>{ addr.address[0] }</td>
    </tr>
    {#if addr.alias !== undefined}
      <tr>
        <td>Alias</td>
        <td>{ addr.alias }</td>
      </tr>
    {/if}
    <tr>
      <td>Tokens</td>
      <td>
        <table class="w-full border-separate border-spacing-4">
          <thead>
            <tr>
              <th class="w-3/4">Policy ID : Token Name</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <a class="flex btn color-token shadow-xl" href="/token/ada/lovelace">
                  <img class="token" src="/cardano-ada-logo.svg" alt="ada"/>
                  <div>ada : lovelace</div>
                </a>
              <td class="text-center">&#x20B3; {addr.ada}</td>
            </tr>
            {#if addr.hasNativeTokens }
              {#each Object.entries(addr.ledger) as [unit, data] }
                <tr>
                  <td>
                    <a class="flex btn color-token shadow-xl" href="/token/{ data.policy[0] }/{ data.token }">
                      <img class="token" src="/{data.logo}" alt="{data.kpolicy}"/>
                      <div>{data.policy[1]} : {data.token}</div>
                    </a>
                  </td>
                  <td class="text-center">{ data.amount }</td>
                </tr>
              {/each}
            {/if}
          </tbody>
        </table>
      </td>
    </tr>
    <tr>
      <td>Transaction History</td>
      <td>
        <table class="w-full border-separate border-spacing-4">
          <thead>
            <tr>
              <th>Block</th>
              <th>Transaction</th>
            </tr>
          </thead>
          <tbody>
            {#each addr.history as tx}
              <tr>
                <td>
                  <a class="btn color-block shadow-xl" href="/chain/{tx.block}">Block {tx.block}</a>
                </td>
                <td>
                  <a class="btn color-transaction shadow-xl" href="/transaction/{tx.id[0]}">Tx {tx.id[1]}</a>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </td>
    </tr>
  </tbody>
</table>
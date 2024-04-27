<script>
  export let utxo
</script>
<table class="card border-separate border-spacing-4 shadow-lg">
  <tbody>
    <tr>
      <td>ID</td>
      <td>
        <div class="flex gap-4">
          <div>Tx {utxo.hash[0]}</div>
          <div>Output #{utxo.ref}</div>
        </div>
      </td>
    </tr>
    <tr>
      <td>UTxO Address</td>
      <td>
        <button class="flex flex-col btn color-address shadow-xl">
          <a href="/address/{utxo.addr[0]}">
            <div>{utxo.addr[1]}</div>
            {#if utxo.alias !== undefined}
              <div class=pt-2>{utxo.alias}</div>
            {/if}
          </a>
        </button>
      </td>
    </tr>
    <tr>
      <td>Lifecycle</td>
      <td>
        <table class="table-header-group border-separaate border-spacing-4">
          <thead>
            <tr>
              <th>Producing Tx</th>
              {#if utxo.spentBy !== "unspent"}
                <th>Spending Tx</th>
              {/if}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <div class="flex justify-center p-4">
                  <a class="flex btn color-transaction shadow-xl mr-1" href="/transaction/{utxo.hash[0]}">
                    <div>Tx {utxo.hash[1]}</div>
                    <div>#{utxo.ref}</div>
                  </a>
                  <a class="btn color-block shadow-xl" href="/chain/{utxo.producedHeight}">Block {utxo.producedHeight}</a>
                </div>
              </td>
              {#if utxo.spentBy !== "unspent"}
                <td>
                  <div class="flex justify-center p-4">
                    <a class="flex btn color-transaction shadow-xl mr-1" href="/transaction/{utxo.spentBy[0]}">
                      <div>Tx {utxo.spentBy[1]}</div>
                      <div>#{utxo.ref}</div>
                    </a>
                    <a class="btn color-block shadow-xl" href="/chain/{utxo.spentHeight}">Block {utxo.spentHeight}</a>
                  </div>
                </td>
              {/if}
            </tr>
          </tbody>
        </table>
      </td>
    </tr>
    <tr>
      <td>Value</td>
      <td>
        <table class="table-header-group border-separate border-spacing-4">
          <thead>
            <tr>
              <th>Policy ID : Token Name</th>
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
              <td class="text-center">&#x20B3; {utxo.ada}</td>
            </tr>
            {#if utxo.hasNativeTokens }
              {#each Object.entries(utxo.value) as [unit, data] }
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
    {#if utxo.datum != undefined }
      <tr>
        <td>Datum</td>
        <td>{ utxo.datum }</td>
      </tr>
    {/if}
    {#if utxo.redeemer !== undefined }
      <tr>
        <td>Redeemer</td>
        <td class="flex flex-row gap-4">
          <div>{ utxo.redeemer.data }</div>
          <div>({ utxo.redeemer.type })</div>
        </td>
      </tr>
    {/if}
  </tbody>
</table>
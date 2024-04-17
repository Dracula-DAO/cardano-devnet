<script>
  export let utxo
</script>
<table class="border-separate border-spacing-4">
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
      <td>Address</td>
      <td>
        <button class="btn color-address">Addr {utxo.addr[1]}</button>
      </td>
    </tr>
    <tr>
      <td>Lifecycle</td>
      <td>
        <table class="w-full">
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
                <div class="flex justify-center">
                  <a class="flex btn color-transaction" href="/transaction/{utxo.hash[0]}">
                    <div>Tx {utxo.hash[1]}</div>
                    <div>#{utxo.ref}</div>
                  </a>
                  <a class="btn color-block" href="/chain/{utxo.producedHeight}">Block {utxo.producedHeight}</a>
                </div>
              </td>
              {#if utxo.spentBy !== "unspent"}
                <td>
                  <div class="flex justify-center">
                    <a class="flex btn color-transaction" href="/transaction/{utxo.spentBy[0]}">
                      <div>Tx {utxo.spentBy[1]}</div>
                      <div>#{utxo.ref}</div>
                    </a>
                    <a class="btn color-block" href="/chain/{utxo.spentHeight}">Block {utxo.spentHeight}</a>
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
        <table class="w-full">
          <thead>
            <tr>
              <th class="w-3/4">Policy ID : Token Name</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <a class="flex btn gap-2" href="/token/ada:lovelace">
                  <img class="token" src="/cardano-ada-logo.svg" alt="ada"/>
                  <div>ada</div>
                  <div>:</div>
                  <div>lovelace</div>
                </a>
              <td class="text-center">&#x20B3; {utxo.ada}</td>
            </tr>
            {#if utxo.hasNativeTokens }
              {#each Object.entries(utxo.value) as [unit, data] }
                <tr>
                  <td>
                    <a class="flex btn gap-2" href="/token/{ unit }">
                      <img class="token" src="/{data.logo}" alt="{data.kpolicy}"/>
                      <div>{data.policy[1]}</div>
                      <div>:</div>
                      <div>{data.token}</div>
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
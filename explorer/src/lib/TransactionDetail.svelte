<script>
    export let tx
</script>
<table class="border-separate border-spacing-4">
  <tbody>
    <tr>
      <td>ID</td>
      <td>{tx.id}</td>
    </tr>
    <tr>
      <td>Block {tx.blockHeight}</td>
      <td><a class="btn color-block p-4" href="/block/{tx.block[0]}">Hash {tx.block[1]}</a></td>
    </tr>
    <tr>
      <td>UTxOs</td>
      <td>
        <table class="w-full">
          <thead>
            <th>Spent Inputs</th>
            <th>Produced Outputs</th>
          </thead>
          <tbody>
            <td>
              <div class="flex flex-col">
                {#each tx.inputs as input}
                  <a class="self-center flex flex-col btn color-spent-utxo" href="/utxo/{input.hash[0]}/{input.ref}">
                    <div>Addr {input.addr[1]}</div>
                    <div>&#x20B3; {input.value["ada"]} {#if input.tokenCount > 0}+ token(s){/if}</div>
                  </a>
                {/each}
              </div>
            </td>
            <td>
              <div class="flex flex-col">
                {#each tx.outputs as output}
                  {#if output.spentBy === "unspent"}
                    <a class="self-center flex flex-col btn color-unspent-utxo" href="/utxo/{tx.id}/{output.ref}">
                      <div>Addr {output.addr[1]}</div>
                      <div>&#x20B3; {output.value["ada"]} {#if output.tokenCount > 0}+ token(s){/if}</div>
                    </a>
                  {:else}
                    <a class="self-center flex flex-col btn color-spent-utxo" href="/utxo/{tx.id}/{output.ref}">
                      <div>Addr {output.addr[1]}</div>
                      <div>&#x20B3; {output.value["ada"]} {#if output.tokenCount > 0}+ token(s){/if}</div>
                    </a>
                  {/if}
                {/each}
              </div>
            </td>
          </tbody>
        </table>
      </td>
    </tr>
    <tr>
      <td>Fee</td>
      <td>&#x20B3; {tx.fee}</td>
    </tr>
  </tbody>
</table>
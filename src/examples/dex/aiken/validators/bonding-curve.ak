use aiken/transaction.{ScriptContext, Spend, find_input, find_script_outputs}
use aiken/transaction/credential.{ScriptCredential}
use aiken/transaction/value.{quantity_of}

validator(
  // parameterized by (DEX token A, DEX token B)
  token_a_policy: ByteArray,
  token_a_name: ByteArray,
  token_b_policy: ByteArray,
  token_b_name: ByteArray,
) {
  fn swap(_datum: Void, _redeemer: Void, ctx: ScriptContext) -> Bool {
    // Grab our spending input and output to this script hash
    expect Spend(output_reference) = ctx.purpose
    expect Some(own_input) =
      ctx.transaction.inputs |> find_input(output_reference)
    expect ScriptCredential(own_hash) =
      own_input.output.address.payment_credential
    expect [own_output] = find_script_outputs(ctx.transaction.outputs, own_hash)

    // Check swap amounts, and swap happens with non-decreasing K 
    // (rounding error can cause K to slightly increase with each swap)
    let tokenAin =
      quantity_of(own_input.output.value, token_a_policy, token_a_name)
    let tokenBin =
      quantity_of(own_input.output.value, token_b_policy, token_b_name)
    let tokenAout = quantity_of(own_output.value, token_a_policy, token_a_name)
    let tokenBout = quantity_of(own_output.value, token_b_policy, token_b_name)
    let kIn = tokenAin * tokenBin
    let kOut = tokenAout * tokenBout
    let swapAforB = tokenBout < tokenBin && tokenAout > tokenAin
    let swapBforA = tokenAout < tokenAin && tokenBout > tokenBin
    let validSwap = swapAforB || swapBforA
    let constantK = kOut >= kIn
    validSwap && constantK
  }
}

use aiken/transaction.{
  InlineDatum, ScriptContext, Spend, find_input, find_script_outputs,
}
use aiken/transaction/credential.{ScriptCredential}

type CounterDatum {
  count: Int,
}

validator {
  fn increment(datum: CounterDatum, _redeemer: Void, ctx: ScriptContext) -> Bool {
    expect Spend(output_reference) = ctx.purpose
    expect Some(own_input) =
      ctx.transaction.inputs |> find_input(output_reference)
    expect ScriptCredential(own_hash) =
      own_input.output.address.payment_credential
    expect [output] = find_script_outputs(ctx.transaction.outputs, own_hash)
    expect InlineDatum(maybe_datum) = output.datum
    expect currentDatum: CounterDatum = maybe_datum
    datum.count == currentDatum.count + 1
  }
}

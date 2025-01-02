module Contracts.StateProgression where

import Jambhala.Plutus
import Jambhala.Utils
import Plutus.V2.Ledger.Contexts
import Plutus.V2.Ledger.Tx

newtype ContractState = ContractState
  { counter :: Integer
  }

unstableMakeIsData ''ContractState

-- Returns true as long as there exists exactly one output for this tx at our own
-- input address with the counter incremented by one.
stateLambda :: ContractState -> () -> ScriptContext -> Bool
stateLambda curState _ sc =
  case getContinuingOutputs sc of
    [o] -> case txOutDatum o of
      OutputDatum (Datum d) -> counter (unsafeFromBuiltinData d) #== counter curState #+ 1
      _ -> False
    _ -> False
{-# INLINEABLE stateLambda #-}

untypedLambda :: UntypedValidator
untypedLambda = mkUntypedValidator stateLambda
{-# INLINEABLE untypedLambda #-}

type StateValidator = ValidatorContract "state-progression"

compiledValidator :: StateValidator
compiledValidator = mkValidatorContract $$(compile [||untypedLambda||])

stateExports :: JambExports
stateExports =
  export
    (defExports compiledValidator)
      { dataExports =
          [ ContractState 0 `toJSONfile` "zero"
          ]
      }

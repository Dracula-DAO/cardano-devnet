module Contracts.BondingCurve where

import Jambhala.Plutus
import Jambhala.Utils
import Plutus.V1.Ledger.Value
import Plutus.V2.Ledger.Contexts
import Plutus.V2.Ledger.Tx

-- Value contains both the AssetClass (CurrencySymbol + TokenName) and
-- the total amount for each
data BondingCurveState = BondingCurveState
  { tokenA :: AssetClass,
    amountTokenA :: Integer,
    tokenB :: AssetClass,
    amountTokenB :: Integer
  }

unstableMakeIsData ''BondingCurveState

stateValid :: BondingCurveState -> BondingCurveState -> Value -> Bool
stateValid
  (BondingCurveState tokenA _ tokenB _)
  (BondingCurveState nTokenA amountTokenA nTokenB amountTokenB)
  value =
    tokenA #== nTokenA && tokenB #== nTokenB
      && assetClassValueOf value tokenA #== amountTokenA
      && assetClassValueOf value tokenB #== amountTokenB
{-# INLINEABLE stateValid #-}

validSwap :: BondingCurveState -> BondingCurveState -> Bool
validSwap (BondingCurveState _ curA _ curB) (BondingCurveState _ newA _ newB) =
  let dA = newA #- curA
      dB = newB #- curB
   in not ((dA #> 0 && dB #< 0) || (dA #< 0 && dB #> 0)) || (newA #* newB #>= curA #* curB)
{-# INLINEABLE validSwap #-}

bondingCurveLambda :: BondingCurveState -> () -> ScriptContext -> Bool
bondingCurveLambda curState _ sc =
  case getContinuingOutputs sc of
    [o] -> case txOutDatum o of
      OutputDatum (Datum d) ->
        let nextState = unsafeFromBuiltinData d
         in stateValid curState nextState (txOutValue o)
              && validSwap curState nextState
      _ -> False
    _ -> False
{-# INLINEABLE bondingCurveLambda #-}

untypedLambda :: UntypedValidator
untypedLambda = mkUntypedValidator bondingCurveLambda
{-# INLINEABLE untypedLambda #-}

type BondingCurveValidator = ValidatorContract "bonding-curve"

compiledValidator :: BondingCurveValidator
compiledValidator = mkValidatorContract $$(compile [||untypedLambda||])

testCurrencySymbol :: CurrencySymbol
testCurrencySymbol = CurrencySymbol "04647e0c21396983aaf77a1b32916905658c1ec4d0015315271c2c8e"

testTokenA :: AssetClass
testTokenA = AssetClass (testCurrencySymbol, TokenName "TokenA")

testTokenB :: AssetClass
testTokenB = AssetClass (testCurrencySymbol, TokenName "TokenB")

stateExports :: JambExports
stateExports =
  export
    (defExports compiledValidator)
      { dataExports =
          [ BondingCurveState testTokenA 0 testTokenB 0 `toJSONfile` "initial-bonding-curve"
          ]
      }

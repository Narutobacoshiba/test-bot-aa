import {Secp256k1, sha256, EnglishMnemonic, Bip39, Slip10, Slip10Curve, stringToPath} from "@cosmjs/crypto"
import {encodeSecp256k1Signature} from "@cosmjs/amino"
import {makeAuthInfoBytes, makeSignBytes, makeSignDoc, Registry} from "@cosmjs/proto-signing"
import { Int53} from "@cosmjs/math"
import { fromBase64, toUtf8 } from "@cosmjs/encoding"
import { TxRaw } from "cosmjs-types/cosmos/tx/v1beta1/tx.js"
import { CosmWasmClient } from "cosmwasm"
import { coins } from '@cosmjs/stargate';
import {
  MsgExecuteContract
} from "cosmjs-types/cosmwasm/wasm/v1/tx.js";
import {
  MsgDelegate
} from "cosmjs-types/cosmos/staking/v1beta1/tx.js"

const mnemonic = "deputy cousin control dentist cost rich mention stomach rabbit amazing glove gain lend sign bronze mushroom task wedding captain add script wrestle repair camp"
const hdPath = stringToPath("m/44'/118'/0'/0/0")
const mnemonicChecked = new EnglishMnemonic(mnemonic)
const seed = await Bip39.mnemonicToSeed(mnemonicChecked, "");
const { privkey } = Slip10.derivePath(Slip10Curve.Secp256k1, seed, hdPath);
let { pubkey } = await Secp256k1.makeKeypair(privkey);
pubkey = Secp256k1.compressPubkey(pubkey)

// privkey = f9b49d0f2454e1dcaadf412b3befd05373c984b1ca47502e755227da3068d69c
// pubkey = 02765f7575402df21c363a6a8331ffe275ac4a93fb9793e20b2640b80590441533


const sendMsg1 = {
    typeUrl: "/cosmos.bank.v1beta1.MsgSend",
    value: {
      fromAddress: "aura14hj2tavq8fpesdwxxcu44rty3hh90vhujrvcmstl4zr3txmfvw9swserkw",
      toAddress: "aura15tf4rd958stktdsslts7cshs7pt3nhntslnsmc",
      amount: [{denom:"uaura",amount:"500"}],
    }
}

const sendMsg2 = {
  typeUrl: "/cosmos.bank.v1beta1.MsgSend",
  value: {
    fromAddress: "aura14hj2tavq8fpesdwxxcu44rty3hh90vhujrvcmstl4zr3txmfvw9swserkw",
    toAddress: "aura15tf4rd958stktdsslts7cshs7pt3nhntslnsmc",
    amount: [{denom:"uaura",amount:"400"}],
  }
}



const validateMsg = {
  typeUrl: "/cosmwasm.wasm.v1.MsgExecuteContract",
  value: {
    sender: "aura14hj2tavq8fpesdwxxcu44rty3hh90vhujrvcmstl4zr3txmfvw9swserkw",
    contract: "aura14hj2tavq8fpesdwxxcu44rty3hh90vhujrvcmstl4zr3txmfvw9swserkw",
    msg: toUtf8(JSON.stringify(
      {pre_execute: 
        {
          messages: JSON.stringify([{
            type: "MsgSend",
            data: JSON.stringify({
              from_address: "aura14hj2tavq8fpesdwxxcu44rty3hh90vhujrvcmstl4zr3txmfvw9swserkw",
              to_address: "aura15tf4rd958stktdsslts7cshs7pt3nhntslnsmc",
              amount: [{denom:"uaura",amount:"500"}] 
            })
          },{
            type: "MsgSend",
            data: JSON.stringify({
              from_address: "aura14hj2tavq8fpesdwxxcu44rty3hh90vhujrvcmstl4zr3txmfvw9swserkw",
              to_address: "aura15tf4rd958stktdsslts7cshs7pt3nhntslnsmc",
              amount: [{denom:"uaura",amount:"400"}] 
            })
          }])
        }
      })),
    "funds": []
  }
}

const txBody = {
    typeUrl: "/cosmos.tx.v1beta1.TxBody",
    value: {
      messages: [validateMsg, sendMsg1, sendMsg2],
      memo: "",
    },
}

const registry = new Registry()
registry.register("/cosmwasm.wasm.v1.MsgExecuteContract", MsgExecuteContract)
registry.register("/cosmos.staking.v1beta1.MsgDelegate", MsgDelegate)

const sequence = 0
const txBodyBytes = registry.encode(txBody)

const gasLimit = Int53.fromString("400000").toNumber()
const authInfoBytes = makeAuthInfoBytes(
    [{  pubkey: null , sequence: sequence }],
    coins(400, "uaura"),
    gasLimit,
    undefined,
    undefined,
)

const signDoc = makeSignDoc(txBodyBytes, authInfoBytes, "aura-testnet", 10)

const signBytes = makeSignBytes(signDoc)
const hashedMessage = sha256(signBytes)
const signature = await Secp256k1.createSignature(hashedMessage, privkey)
const signatureBytes = new Uint8Array([...signature.r(32), ...signature.s(32)])
const stdSignature = encodeSecp256k1Signature(pubkey, signatureBytes)

let signed = TxRaw.fromPartial({
    bodyBytes: signDoc.bodyBytes,
    authInfoBytes: signDoc.authInfoBytes,
    signatures: [fromBase64(stdSignature.signature)],
})


let client = await CosmWasmClient.connect("http://localhost:26657")

const tx = Uint8Array.from(TxRaw.encode(signed).finish())
const res = await client.broadcastTx(tx)

console.log(res)

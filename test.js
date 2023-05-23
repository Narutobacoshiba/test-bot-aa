import {Secp256k1, sha256} from "@cosmjs/crypto"
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


let pri = [228,173,7,156,156,223,107,188,171,92,234,85,6,10,74,127,24,139,50,92,6,197,121,52,184,97,134,71,243,88,76,51]
let priBytes = Uint8Array.from(pri)
let pub = "035730D5F16656EE837D3DADF3C9FE6DB9A97C4F13EB4E3C10973A523DBB39B18B"
let pubBytes = Uint8Array.from(Buffer.from(pub, 'hex'))


const sendMsg1 = {
    typeUrl: "/cosmos.bank.v1beta1.MsgSend",
    value: {
      fromAddress: "aura14hj2tavq8fpesdwxxcu44rty3hh90vhujrvcmstl4zr3txmfvw9swserkw",
      toAddress: "aura19ecqv8ga40jrpsltetnafj7lazll0mwtk2q5h3",
      amount: [{denom:"uaura",amount:"500"}],
    }
}

const sendMsg2 = {
  typeUrl: "/cosmos.bank.v1beta1.MsgSend",
  value: {
    fromAddress: "aura14hj2tavq8fpesdwxxcu44rty3hh90vhujrvcmstl4zr3txmfvw9swserkw",
    toAddress: "aura19ecqv8ga40jrpsltetnafj7lazll0mwtk2q5h3",
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
            type: "bank",
            sub_type: "send",
            data: JSON.stringify({
              from_address: "aura14hj2tavq8fpesdwxxcu44rty3hh90vhujrvcmstl4zr3txmfvw9swserkw",
              to_address: "aura19ecqv8ga40jrpsltetnafj7lazll0mwtk2q5h3",
              amount: [{denom:"uaura",amount:"500"}] 
            })
          },{
            type: "bank",
            sub_type: "send",
            data: JSON.stringify({
              from_address: "aura14hj2tavq8fpesdwxxcu44rty3hh90vhujrvcmstl4zr3txmfvw9swserkw",
              to_address: "aura19ecqv8ga40jrpsltetnafj7lazll0mwtk2q5h3",
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
const signature = await Secp256k1.createSignature(hashedMessage, priBytes)
const signatureBytes = new Uint8Array([...signature.r(32), ...signature.s(32)])
const stdSignature = encodeSecp256k1Signature(pubBytes, signatureBytes)

let signed = TxRaw.fromPartial({
    bodyBytes: signDoc.bodyBytes,
    authInfoBytes: signDoc.authInfoBytes,
    signatures: [fromBase64(stdSignature.signature)],
})


let client = await CosmWasmClient.connect("http://localhost:26657")

const tx = Uint8Array.from(TxRaw.encode(signed).finish())
const res = await client.broadcastTx(tx)

console.log(res)

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


const sendMsg = {
    typeUrl: "/cosmos.bank.v1beta1.MsgSend",
    value: {
      fromAddress: "aura14hj2tavq8fpesdwxxcu44rty3hh90vhujrvcmstl4zr3txmfvw9swserkw",
      toAddress: "aura1haxn9anfm7ylalguluwprt4r7nkd8y2u73fsuc",
      amount: [{denom:"uaura",amount:"1000"}],
    }
}

const executeContractMsg1 = {
  typeUrl: "/cosmwasm.wasm.v1.MsgExecuteContract",
  value: {
    sender: "aura1mf6ptkssddfmxvhdx0ech0k03ktp6kf9yk59renau2gvht3nq2gqhq7xys",
    contract: "aura1mf6ptkssddfmxvhdx0ech0k03ktp6kf9yk59renau2gvht3nq2gqhq7xys",
    msg: toUtf8(JSON.stringify(
      {"execute": 
        {
          data: JSON.stringify({
            bank: {
              send: {
                to_address: "aura13zkmswesjpmg7lkjz9e0xzy3hkk4xywgfylc3j",
                amount: [{denom:"uaura",amount:"300"}] 
              }
            }
          })
        }
      })),
    "funds": []
  }
}

const executeContractMsg2 = {
  typeUrl: "/cosmwasm.wasm.v1.MsgExecuteContract",
  value: {
    sender: "aura1mf6ptkssddfmxvhdx0ech0k03ktp6kf9yk59renau2gvht3nq2gqhq7xys",
    contract: "aura1mf6ptkssddfmxvhdx0ech0k03ktp6kf9yk59renau2gvht3nq2gqhq7xys",
    msg: toUtf8(JSON.stringify(
      {"execute": 
        {
          data: JSON.stringify({
            bank: {
              send: {
                to_address: "aura1l9t09hvcspjq5eqnm0kpz9ugsapwf53d3zyzuw",
                amount: [{denom:"uaura",amount:"200"}] 
              }
            }
          })
        }
      })),
    "funds": []
  }
}


const txBody = {
    typeUrl: "/cosmos.tx.v1beta1.TxBody",
    value: {
      messages: [executeContractMsg1, executeContractMsg2],
      memo: "",
    },
}

const registry = new Registry()
registry.register("/cosmwasm.wasm.v1.MsgExecuteContract", MsgExecuteContract)

const sequence = 4
const txBodyBytes = registry.encode(txBody)

const gasLimit = Int53.fromString("400000").toNumber()
const authInfoBytes = makeAuthInfoBytes(
    [{  pubkey: null , sequence: sequence }],
    coins(400, "uaura"),
    gasLimit,
    undefined,
    undefined,
)

const signDoc = makeSignDoc(txBodyBytes, authInfoBytes, "aura-testnet", 14)

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

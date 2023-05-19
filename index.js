import * as dotenv from "dotenv"
import { SigningCosmWasmClient, Secp256k1HdWallet, CosmWasmClient } from "cosmwasm"
import { stringToPath } from "@cosmjs/crypto"
import { assertIsDeliverTxSuccess, calculateFee, GasPrice } from "@cosmjs/stargate"
import { MsgExecuteContract } from "cosmjs-types/cosmwasm/wasm/v1/tx.js"
import { TxRaw, Tx, TxBody } from "cosmjs-types/cosmos/tx/v1beta1/tx.js"
import { assert, sleep } from "@cosmjs/utils"
import { fromBase64, toBase64, toUtf8, fromUtf8, fromAscii } from "@cosmjs/encoding"
import crypto from "crypto";
import chalk from "chalk"
import internal from "stream"
import pkg from '@tendermint/amino-js';
const { marshalTx, unmarshalTx } = pkg;

dotenv.config();


// Required env vars
assert(process.env.MNEMONIC, "MNEMONIC must be set");
const mnemonic = process.env.MNEMONIC;
assert(process.env.PREFIX, "PREFIX must be set");
const prefix = process.env.PREFIX;
assert(process.env.DENOM, "DENOM must be set");
// The fee denom
const denom = process.env.DENOM;
assert(process.env.ENDPOINT, "ENDPOINT must be set");
const endpoint = process.env.ENDPOINT;
assert(process.env.GAS_PRICE, "GAS_PRICE must be set. E.g. '0.025ueaura'");
const gasPrice = GasPrice.fromString(process.env.GAS_PRICE);
const gasWanted = parseInt(process.env.GAS_WANTED)

// Optional env vars
const endpoint2 = process.env.ENDPOINT2 || null;
const endpoint3 = process.env.ENDPOINT3 || null;


const errorColor = chalk.red;
const warningColor = chalk.hex("#FFA500");
const successColor = chalk.green;
const infoColor = chalk.gray;



export async function connectWallet() {
    // Create a wallet
    const path = stringToPath("m/44'/118'/0'/0/0");
    const wallet = await Secp256k1HdWallet.fromMnemonic(mnemonic, 
            {hdPaths:[path], "prefix":prefix});
    const [firstAccount] = await wallet.getAccounts();
    const client = await SigningCosmWasmClient.connectWithSigner(endpoint, wallet, {
    prefix,
    gasPrice,
    });
    const botAddress = firstAccount.address;

    const balance = await client.getBalance(botAddress,denom)
    console.log("\n------------------------------------------------------------------------------------")
    console.log(successColor("SigningCosmWasmClient CONNECTION Success"))
    console.info(infoColor("account:",botAddress));
    console.info(infoColor("balance:"),balance); 

    return {client, botAddress}
}

let nextSignData = {
    chainId: "aura-testnet",
    accountNumber: 0,
    sequence: 1,
};

function getCurrentSignData() {
  let out = { ...nextSignData }; // copy values
  return out;
}


var JsonToArray = function(json)
{
	var str = JSON.stringify(json, null, 0)
	var ret = new Uint8Array(str.length);
	for (var i = 0; i < str.length; i++) {
		ret[i] = str.charCodeAt(i);
	}
	return ret
};

function base64ToJson(base64String) {
  const json = Buffer.from(base64String, "base64").toString();
  return JSON.parse(json);
}

async function main() {
    const {client, botAddress} = await connectWallet() // connect to wallet with mnemonic 

    const txs = { 
        "body": {
            "messages": [
              {
                "@type": "/cosmos.aa.v1beta1.MsgMsgNormal",
                "delegator_address": "aura1nynpwwc2x5g4fdve7ldxw4xvu9ygchd8u3c425",
                "validator_address": "auravaloper1nynpwwc2x5g4fdve7ldxw4xvu9ygchd88rfaj2",
                "amount": {
                  "denom": "ueaura",
                  "amount": "16768623"
                }
              }
            ],
            "memo": "",
            "timeoutHeight": "0",
            "extensionOptions": [],
            "nonCriticalExtensionOptions": []
          },
          "authInfo": {
            "signerInfos": [
              {
                "publicKey": {
                  "@type": "/cosmos.crypto.secp256k1.PubKey",
                  "key": "A8YQuQtaZK1qZceVxNQdr+gggp+CNQ7iCYy3UF5m1Si8"
                },
                "modeInfo": {
                  "single": {
                    "mode": "SIGN_MODE_DIRECT"
                  }
                },
                "sequence": "306849"
              }
            ],
            "fee": {
              "amount": [],
              "gasLimit": "197667",
              "payer": "",
              "granter": ""
            }
          },
          "signatures": [
            "gxAjX9WcKIyGU8ZAt5p3hzVyUqwH7xfGR5DBRGILOmRQrGnbKBTE3JZQ2iFiqjFSwtpub5nLXEZZWEhBNyXFDg=="
          ]
    }

    const txRaw = TxRaw.fromJSON({
      bodyBytes: 'CpkBCiQvY29zbXdhc20ud2FzbS52MS5Nc2dFeGVjdXRlQ29udHJhY3QScQorYXVyYTFrNDczbmVzcHB0bWYzYWpwbHE5cXI4ZjgzcTdkNXJwdzBoZWpodxIrYXVyYTFrNDczbmVzcHB0bWYzYWpwbHE5cXI4ZjgzcTdkNXJwdzBoZWpodxoVeyJhZGRfcmFuZG9tbmVzcyI6e319EhJCb3QgYWRkIHJhbmRvbW5lc3M=',
      authInfoBytes: 'ClAKRgofL2Nvc21vcy5jcnlwdG8uc2VjcDI1NmsxLlB1YktleRIjCiECOprFoPXMPCk8U4TQudI5tezvkeMDVoKIdeDtBAfC/pgSBAoCCH8YARITCg0KBXVhdXJhEgQyNTAwEKCNBg==',
      signatures: [
        'gxAjX9WcKIyGU8ZAt5p3hzVyUqwH7xfGR5DBRGILOmRQrGnbKBTE3JZQ2iFiqjFSwtpub5nLXEZZWEhBNyXFDg=='
      ]
    })

    const test_tx = {
      'type':  'auth/StdTx',
      'value': {
          'msg':        [{
              'type':  'cosmos-sdk/MsgSend',
              'value': {
                  'from_address': 'cosmos1h806c7khnvmjlywdrkdgk2vrayy2mmvf9rxk2r',
                  'to_address':   'cosmos1z7g5w84ynmjyg0kqpahdjqpj7yq34v3suckp0e',
                  'amount':       [{
                      'denom':  'uatom',
                      'amount': '11657995'
                  }]
              }
          }],
          'fee':        {
              'amount': [{
                  'denom':  'uatom',
                  'amount': '5000'
              }],
              'gas':    '200000'
          },
          'signatures': [{
              'pub_key':   {
                  'type':  'tendermint/PubKeySecp256k1',
                  'value': 'AtQaCqFnshaZQp6rIkvAPyzThvCvXSDO+9AzbxVErqJP'
              },
              'signature': '1nUcIH0CLT0/nQ0mBTDrT6kMG20NY/PsH7P2gc4bpYNGLEYjBmdWevXUJouSE/9A/60QG9cYeqyTe5kFDeIPxQ=='
          }],
          'memo':       '1122672754'
      }
   };
   
   const encodedTx = marshalTx(test_tx);
   console.log(encodedTx)
   const decodedTx = unmarshalTx(encodedTx);
   console.log(decodedTx)

   /*
    const aminoTx = TxRaw.fromJSON{
      bodyBytes: marshalTx()
    }*/

    //const tx = Uint8Array.from(TxRaw.encode(txRaw).finish());

    const tx = marshalTx(txs)

    const p1 = await client.broadcastTx(tx);

    console.log(p1)
}

main().then(
    () => {
      console.info("Done");
      process.exit(0);
    },
    (error) => {
      console.error(error);
      process.exit(1);
    },
);

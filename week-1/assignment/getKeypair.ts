import * as bip39 from "bip39";
import { derivePath } from "ed25519-hd-key";
import { Keypair } from "@solana/web3.js";
import bs58 from "bs58";

// ✅ Nhập seed phrase của bạn
const mnemonic = "lunar grace cloud moon gift climb virus clap detect kit pistol bone";

const derivationPath = "m/44'/501'/0'/0'"; // chuẩn Solana

const seed = bip39.mnemonicToSeedSync(mnemonic);
const derived = derivePath(derivationPath, seed.toString("hex")).key;
const keypair = Keypair.fromSeed(derived);

console.log("Public Key:", keypair.publicKey.toBase58());
console.log("Private Key:", bs58.encode(keypair.secretKey));

import * as fs from 'fs';
fs.writeFileSync('solana-keypair.json', JSON.stringify(Array.from(keypair.secretKey)));

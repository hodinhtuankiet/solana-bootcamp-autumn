const { Keypair } = require("@solana/web3.js");

const bs58Module = require("bs58");

// Kiểm tra bs58Module có default không
const bs58 = bs58Module.default || bs58Module;

const keypair = Keypair.generate();

const base58SecretKey = bs58.encode(keypair.secretKey);

console.log("Base58 Private Key:", base58SecretKey);
console.log("Public Key:", keypair.publicKey.toBase58());

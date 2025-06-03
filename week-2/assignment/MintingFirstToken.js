import {
  Connection,
  Keypair,
  Transaction,
  sendAndConfirmTransaction,
  PublicKey,
  SystemProgram,
} from "@solana/web3.js";

import {
  createMint,
  getOrCreateAssociatedTokenAccount,
  createMintToInstruction,
  createInitializeMintInstruction,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";

import {
  Metaplex,
  keypairIdentity
} from "@metaplex-foundation/js";

import fs from "fs";

async function main() {
  // 1. Connect to devnet
  const connection = new Connection("https://api.devnet.solana.com", "confirmed");

  // 2. Load wallet
  const secretKey = Uint8Array.from(JSON.parse(fs.readFileSync("./my-keypair.json", "utf-8")));
  const payer = Keypair.fromSecretKey(secretKey);
  console.log("Your wallet address:", payer.publicKey.toBase58());

  // 3. Set up Metaplex
  const metaplex = Metaplex.make(connection).use(keypairIdentity(payer));

  const recipientAddress = new PublicKey("63EEC9FfGyksm7PkVC6z8uAmqozbQcTzbkWJNsgqjkFs");

  // 4. Create fungible token
  const ftMint = await createMint(
    connection,
    payer,
    payer.publicKey,
    null,
    6 // Decimals
  );

  const payerTokenAccount = await getOrCreateAssociatedTokenAccount(
    connection,
    payer,
    ftMint,
    payer.publicKey
  );

  const recipientTokenAccount = await getOrCreateAssociatedTokenAccount(
    connection,
    payer,
    ftMint,
    recipientAddress
  );

  const mint100Ix = createMintToInstruction(
    ftMint,
    payerTokenAccount.address,
    payer.publicKey,
    100 * 1e6
  );

  const mint10Ix = createMintToInstruction(
    ftMint,
    recipientTokenAccount.address,
    payer.publicKey,
    10 * 1e6
  );

  // 5. Create and initialize NFT mint
  const nftMint = Keypair.generate();
  const createNftMintTx = new Transaction();

  createNftMintTx.add(
    SystemProgram.createAccount({
      fromPubkey: payer.publicKey,
      newAccountPubkey: nftMint.publicKey,
      space: 82,
      lamports: await connection.getMinimumBalanceForRentExemption(82),
      programId: TOKEN_PROGRAM_ID,
    }),
    createInitializeMintInstruction(
      nftMint.publicKey,
      0,
      payer.publicKey,
      payer.publicKey
    )
  );

  await sendAndConfirmTransaction(connection, createNftMintTx, [payer, nftMint]);

  // 6. Create NFT token account
  const nftTokenAccount = await getOrCreateAssociatedTokenAccount(
    connection,
    payer,
    nftMint.publicKey,
    payer.publicKey
  );

  // 7. Mint 1 NFT token
  const mintNFTIx = createMintToInstruction(
    nftMint.publicKey,
    nftTokenAccount.address,
    payer.publicKey,
    1
  );

  // 8. Create metadata using Metaplex
  const { nft } = await metaplex.nfts().create({
    uri: "https://example.com/nft-metadata.json",
    name: "My Cool NFT",
    symbol: "MCNFT",
    sellerFeeBasisPoints: 1000,
    creators: [
      {
        address: payer.publicKey,
        verified: true,
        share: 100,
      },
    ],
    isMutable: true,
    maxSupply: 1,
  });

  // 9. Final transaction for minting tokens and NFT
  const finalTx = new Transaction();
  finalTx.add(mint100Ix, mint10Ix, mintNFTIx);

  const txid = await sendAndConfirmTransaction(connection, finalTx, [payer]);

  console.log("✅ Transaction signature:", txid);
  console.log("✅ Fungible Token Mint:", ftMint.toBase58());
  console.log("✅ NFT Mint:", nftMint.publicKey.toBase58());
  console.log("✅ Metadata created with URI:", nft.uri);
}

main().catch(console.error);

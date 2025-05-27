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
  mintTo,
  TOKEN_PROGRAM_ID,
  createMintToInstruction,
  createInitializeMintInstruction,
} from "@solana/spl-token";

import {
  Metaplex,
  keypairIdentity
} from "@metaplex-foundation/js";

import mplTokenMetadata from "@metaplex-foundation/mpl-token-metadata";
const { createCreateMetadataAccountV2Instruction } = mplTokenMetadata;

import fs from "fs";

async function main() {
  // 1. Connect to local Solana cluster
  const connection = new Connection("https://api.devnet.solana.com", "confirmed");


  // 2. Load payer keypair
  const secretKey = Uint8Array.from(
    JSON.parse(fs.readFileSync("./my-keypair.json", "utf-8"))
  );
  const payer = Keypair.fromSecretKey(secretKey);

  console.log("Your wallet address:", payer.publicKey.toBase58());

  // 3. Airdrop SOL (localnet only)
  console.log("Requesting local airdrop...");
  const airdropSig = await connection.requestAirdrop(payer.publicKey, 3e9);
  await connection.confirmTransaction(airdropSig);
  console.log("Airdrop received.");

  // 4. Set up Metaplex with Bundlr
  const metaplex = Metaplex.make(connection)
  .use(keypairIdentity(payer));

  const recipientAddress = new PublicKey(
    "63EEC9FfGyksm7PkVC6z8uAmqozbQcTzbkWJNsgqjkFs"
  );

  // 5. Create Fungible Token
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

  // 6. Mint fungible tokens
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

  // 7. Create NFT mint
  const nftMint = Keypair.generate();
  const nftMintTx = new Transaction();

  nftMintTx.add(
    SystemProgram.createAccount({
      fromPubkey: payer.publicKey,
      newAccountPubkey: nftMint.publicKey,
      space: 82,
      lamports: await connection.getMinimumBalanceForRentExemption(82),
      programId: TOKEN_PROGRAM_ID,
    })
  );

  const initMintIx = createInitializeMintInstruction(
    nftMint.publicKey,
    0,
    payer.publicKey,
    payer.publicKey
  );

  nftMintTx.add(initMintIx);

  // 8. Create metadata
  const metadataPDA = await metaplex.nfts().pdas().metadata({
    mint: nftMint.publicKey,
  });

  const nftMetadataData = {
    name: "My Cool NFT",
    symbol: "MCNFT",
    uri: "https://example.com/nft-metadata.json",
    sellerFeeBasisPoints: 1000,
    creators: [
      {
        address: payer.publicKey,
        verified: true,
        share: 100,
      },
    ],
    collection: null,
    uses: null,
  };

  const { nft } = await metaplex.nfts().create({
    uri: "https://example.com/nft-metadata.json",
    name: "My Cool NFT",
    sellerFeeBasisPoints: 1000,
    symbol: "MCNFT",
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


  const nftTokenAccount = await getOrCreateAssociatedTokenAccount(
    connection,
    payer,
    nftMint.publicKey,
    payer.publicKey
  );

  const mintNFTIx = createMintToInstruction(
    nftMint.publicKey,
    nftTokenAccount.address,
    payer.publicKey,
    1
  );

  // 9. Final Transaction
  const tx = new Transaction();
  tx.add(mint100Ix, mint10Ix);
  tx.add(...nftMintTx.instructions);
  tx.add(createMetadataIx);
  tx.add(mintNFTIx);

  const signers = [payer, nftMint];
  const txid = await sendAndConfirmTransaction(connection, tx, signers);

  console.log("✅ Transaction signature:", txid);
  console.log("✅ Fungible Token Mint:", ftMint.toBase58());
  console.log("✅ NFT Mint:", nftMint.publicKey.toBase58());
}

main().catch(console.error);

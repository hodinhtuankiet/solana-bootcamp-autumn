import {
  Connection,
  Keypair,
  Transaction,
  sendAndConfirmTransaction,
  PublicKey,
  clusterApiUrl,
  SystemProgram,
} from "@solana/web3.js";

import {
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  TOKEN_PROGRAM_ID,
  createMintToInstruction,
} from "@solana/spl-token";

import {
  Metaplex,
  keypairIdentity,
} from "@metaplex-foundation/js";
// import { bundlrStorage } from "@metaplex-foundation/js";

import mplTokenMetadata from "@metaplex-foundation/mpl-token-metadata";

const { createCreateMetadataAccountV2Instruction } = mplTokenMetadata;

import fs from "fs";


async function main() {
  // 1. Setup connection and payer wallet
  const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
  const secretKey = Uint8Array.from(JSON.parse(fs.readFileSync('./my-keypair.json')));
  const payer = Keypair.fromSecretKey(secretKey);

  console.log("Your wallet address:", payer.publicKey.toBase58());
  console.log("Requesting airdrop...");
  const airdropSig = await connection.requestAirdrop(payer.publicKey, 3e9);
  await connection.confirmTransaction(airdropSig);
  console.log("Airdrop received.");

  // 2. Setup Metaplex with Bundlr storage
  const metaplex = Metaplex.make(connection)
  .use(keypairIdentity(payer))
  .use(
    bundlrStorage({
      address: "https://devnet.bundlr.network",
      providerUrl: clusterApiUrl("devnet"),
      timeout: 60000,
    })
  );



  const recipientAddress = new PublicKey("63EEC9FfGyksm7PkVC6z8uAmqozbQcTzbkWJNsgqjkFs");

  // ========== Create Fungible Token ===========
  const ftMint = await createMint(
    connection,
    payer,
    payer.publicKey,
    null,
    6 // decimals
  );

  console.log("Fungible token mint:", ftMint.toBase58());

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

  // ========== Create NFT mint ===========
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
    0, // decimals = 0
    payer.publicKey,
    payer.publicKey
  );

  nftMintTx.add(initMintIx);

  // ================= Mint Instructions =================

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

  // ================= NFT Metadata =================

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

  const createMetadataIx = createCreateMetadataAccountV2Instruction(
    {
      metadata: metadataPDA,
      mint: nftMint.publicKey,
      mintAuthority: payer.publicKey,
      payer: payer.publicKey,
      updateAuthority: payer.publicKey,
    },
    {
      createMetadataAccountArgsV2: {
        data: nftMetadataData,
        isMutable: true,
      },
    }
  );

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

  // ================== Final Transaction ==================

  const tx = new Transaction();

  tx.add(mint100Ix, mint10Ix);
  tx.add(...nftMintTx.instructions);
  tx.add(createMetadataIx);
  tx.add(mintNFTIx);

  const signers = [payer, nftMint];

  const txid = await sendAndConfirmTransaction(connection, tx, signers);

  console.log("Transaction signature:", txid);
  console.log("Fungible Token Mint:", ftMint.toBase58());
  console.log("NFT Mint:", nftMint.publicKey.toBase58());
}

main().catch(console.error);

/**
 * Create a SPL token and store its metadata on-chain using Metaplex.
 */

import { Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import {
  MINT_SIZE,
  TOKEN_PROGRAM_ID,
  createInitializeMint2Instruction,
} from "@solana/spl-token";

import {
  MPL_TOKEN_METADATA_PROGRAM_ID,
  createCreateMetadataAccountV3Instruction,
} from "@metaplex-foundation/mpl-token-metadata";


import { payer, testWallet, connection } from "../lib/vars";
import {
  buildTransaction,
  explorerURL,
  extractSignatureFromFailedTransaction,
  printConsoleSeparator,
  savePublicKeyToFile,
} from "../lib/helpers";


(async () => {
  console.log("Payer address:", payer.publicKey.toBase58());
  console.log("Test wallet address:", testWallet.publicKey.toBase58());

  // Step 1: Generate a new mint
  const mintKeypair = Keypair.generate();
  console.log("Mint address:", mintKeypair.publicKey.toBase58());

  const tokenConfig = {
    decimals: 6,
    name: "Solana Bootcamp Autumn 2024",
    symbol: "SBS",
    uri: "https://raw.githubusercontent.com/trankhacvy/solana-bootcamp-autumn-2024/main/assets/sbs-token.json",
  };

  // Step 2: Create and initialize the mint account
  const createMintAccountInstruction = SystemProgram.createAccount({
    fromPubkey: payer.publicKey,
    newAccountPubkey: mintKeypair.publicKey,
    space: MINT_SIZE,
    lamports: await connection.getMinimumBalanceForRentExemption(MINT_SIZE),
    programId: TOKEN_PROGRAM_ID,
  });

  const initializeMintInstruction = createInitializeMint2Instruction(
    mintKeypair.publicKey,
    tokenConfig.decimals,
    payer.publicKey,
    payer.publicKey,
  );

  // Step 3: Create metadata PDA
  const [metadataAccount] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("metadata"),
      METADATA_PROGRAM_ID.toBuffer(),
      mintKeypair.publicKey.toBuffer(),
    ],
    METADATA_PROGRAM_ID
  );
  console.log("Metadata address:", metadataAccount.toBase58());

  // Step 4: Build metadata instruction
  const createMetadataInstruction = createCreateMetadataAccountV3Instruction(
    {
      metadata: metadataAccount,
      mint: mintKeypair.publicKey,
      mintAuthority: payer.publicKey,
      payer: payer.publicKey,
      updateAuthority: payer.publicKey,
    },
    {
      createMetadataAccountArgsV3: {
        data: {
          name: tokenConfig.name,
          symbol: tokenConfig.symbol,
          uri: tokenConfig.uri,
          sellerFeeBasisPoints: 0,
          creators: null,
          collection: null,
          uses: null,
        },
        isMutable: true,
        collectionDetails: null,
      },
    }
  );

  // Step 5: Build transaction
  const tx = await buildTransaction({
    connection,
    payer: payer.publicKey,
    signers: [payer, mintKeypair],
    instructions: [
      createMintAccountInstruction,
      initializeMintInstruction,
      createMetadataInstruction,
    ],
  });

  printConsoleSeparator();

  // Step 6: Send transaction
  try {
    const sig = await connection.sendTransaction(tx);
    console.log("Transaction completed.");
    console.log(explorerURL({ txSignature: sig }));

    savePublicKeyToFile("tokenMint", mintKeypair.publicKey);
  } catch (err) {
    console.error("Failed to send transaction:");
    console.log(tx);

    const failedSig = await extractSignatureFromFailedTransaction(connection, err);
    if (failedSig) {
      console.log("Failed signature:", explorerURL({ txSignature: failedSig }));
    }
    throw err;
  }
})();

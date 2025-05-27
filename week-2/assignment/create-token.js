import {
  Connection,
  Keypair,
  sendAndConfirmTransaction,
  LAMPORTS_PER_SOL,
  Transaction,
  PublicKey,
} from "@solana/web3.js";

import {
  createMint,
  getOrCreateAssociatedTokenAccount,
  createMintToInstruction,
} from "@solana/spl-token";

(async () => {
  const connection = new Connection("http://127.0.0.1:8899", "confirmed");
  const payer = Keypair.generate();

  // Request an airdrop of 2 SOL to fund the payer wallet
  const airdropSig = await connection.requestAirdrop(
    payer.publicKey,
    LAMPORTS_PER_SOL * 2
  );
  await connection.confirmTransaction(airdropSig, "confirmed");
  console.log("✅ Airdropped to:", payer.publicKey.toBase58());

  // Create a PDA (Program Derived Address) to act as the owner
  const seed = "my_pda_seed";
  const programId = payer.publicKey; // Using payer's public key as placeholder for program ID
  const [pda] = PublicKey.findProgramAddressSync([Buffer.from(seed)], programId);
  console.log("🔐 PDA (Program Derived Address):", pda.toBase58());

  // Create a new token mint
  const mint = await createMint(
    connection,
    payer,
    payer.publicKey, // mint authority
    null,            // freeze authority (none)
    9                // number of decimals for the token
  );
  console.log("✅ Created token mint:", mint.toBase58());

  // Get or create the associated token account (ATA) for the PDA owner
  const ata = await getOrCreateAssociatedTokenAccount(
    connection,
    payer,
    mint,
    pda,
    true // allow owner to be a PDA
  );
  console.log("📦 Token account for PDA:", ata.address.toBase58());

  // Create a new transaction object
  const tx = new Transaction();

  // Amount of tokens to mint (1000 tokens with 9 decimals)
  const amount = 1000 * 10 ** 9;

  // Add mintTo instruction to mint tokens to the PDA's associated token account
  tx.add(
    createMintToInstruction(
      mint,
      ata.address,
      payer.publicKey, // mint authority
      amount
    )
  );

  // Send and confirm the transaction
  const txSignature = await sendAndConfirmTransaction(connection, tx, [payer]);
  console.log("✅ Transaction confirmed:", txSignature);
})();

import {
    Connection,
    Keypair,
    PublicKey,
    SystemProgram,
    Transaction,
    LAMPORTS_PER_SOL,
    sendAndConfirmTransaction,
} from "@solana/web3.js";
import bs58 from "bs58";

// 1. Initialize connection to Solana devnet
const connection = new Connection("https://api.devnet.solana.com", "confirmed");

// 2. Generate a new account (used for transferring SOL)
const newAccount = Keypair.generate();

// 3. Destination account to receive 0.1 SOL
const destination = new PublicKey("63EEC9FfGyksm7PkVC6z8uAmqozbQcTzbkWJNsgqjkFs");

// 4. Payer account – replace with your actual base58-encoded private key
const payer = Keypair.fromSecretKey(
    bs58.decode("31r8WVWi4qJDPpAJR6YdvYv7c1pgD5y6hDaG45igsWPnjTZXLoHrhWaCuzQjJ8uM3UpiQGvVVrBBmsxjURaXWnTQ")
);

(async () => {
    console.log("New account:", newAccount.publicKey.toBase58());
    console.log("Payer account:", payer.publicKey.toBase58());

    // 5. Check and request airdrop if payer has less than 2 SOL
    const balance = await connection.getBalance(payer.publicKey);
    if (balance < 2 * LAMPORTS_PER_SOL) {
        console.log("Requesting airdrop of 2 SOL for payer...");
        const airdropSig = await connection.requestAirdrop(
            payer.publicKey,
            2 * LAMPORTS_PER_SOL
        );
        await connection.confirmTransaction(airdropSig);
    }

    // 6. Calculate minimum lamports required for rent-exemption
    const rentExemption = await connection.getMinimumBalanceForRentExemption(0);

    // 7. Define instructions for the transaction
    const instructions = [
        // a. Create the new account
        SystemProgram.createAccount({
            fromPubkey: payer.publicKey,
            newAccountPubkey: newAccount.publicKey,
            lamports: rentExemption + 0.1 * LAMPORTS_PER_SOL, // fund enough for rent + 0.1 SOL to transfer
            space: 0,
            programId: SystemProgram.programId,
        }),

        // b. Transfer 0.1 SOL from new account to the destination account
        SystemProgram.transfer({
            fromPubkey: newAccount.publicKey,
            toPubkey: destination,
            lamports: 0.1 * LAMPORTS_PER_SOL,
        }),

        // c. Close the new account by transferring remaining lamports back to payer
        SystemProgram.transfer({
            fromPubkey: newAccount.publicKey,
            toPubkey: payer.publicKey,
            lamports: rentExemption,
        }),
    ];

    // 8. Create the transaction containing all instructions
    const transaction = new Transaction().add(...instructions);

    // 9. Send and confirm the transaction on the network
    try {
        const signature = await sendAndConfirmTransaction(
            connection,
            transaction,
            [payer, newAccount]
        );
        console.log("✅ Transaction successful!");
        console.log("🔗 View on Explorer:", `https://explorer.solana.com/tx/${signature}?cluster=devnet`);
    } catch (err) {
        console.error("❌ Transaction failed:", err);
    }
})();

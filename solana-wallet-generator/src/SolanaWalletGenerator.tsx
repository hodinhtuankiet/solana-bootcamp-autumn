import { useState } from "react";
import * as bip39 from "bip39";
import { derivePath } from "ed25519-hd-key";
import { Keypair } from "@solana/web3.js";

export default function SolanaWalletGenerator() {
    const [mnemonic, setMnemonic] = useState("");
    const [publicKey, setPublicKey] = useState<string | null>(null);
    const [error, setError] = useState("");

    const generateWallet = () => {
        try {
            const trimmedMnemonic = mnemonic.trim();
            console.log("trimmedMnemonic", trimmedMnemonic);
            if (!bip39.validateMnemonic(trimmedMnemonic)) {
                setError("❌ Invalid seed phrase. Please check your words.");
                return;
            }
            // mnemonicToSeedSync trả về Buffer
            const seed = bip39.mnemonicToSeedSync(trimmedMnemonic);

            // @ts-ignore
            const { key } = derivePath("m/44'/501'/0'/0'", seed);
            if (!key) {
                setError("❌ Failed to derive key. Please check your seed phrase.");
                return;
            }
            const keypair = Keypair.fromSeed(key);

            setPublicKey(keypair.publicKey.toBase58());
            setError("");

            // Tạo file json chứa secretKey
            const secretKeyArray = Array.from(keypair.secretKey);
            const blob = new Blob([JSON.stringify(secretKeyArray)], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `phantom-keypair-${keypair.publicKey.toBase58()}.json`;
            a.click();
            URL.revokeObjectURL(url);

        } catch (err) {
            console.error(err);
            setError("Something went wrong. Check the console for details.");
        }
    };

    return (
        <div className="max-w-xl w-full p-6 space-y-6 bg-white shadow-xl rounded-2xl text-center">
            <h1 className="text-3xl font-bold">🔐 Solana Wallet Generator</h1>
            <input
                type="password"
                className="w-full p-4 text-base border border-gray-300 rounded"
                placeholder="Enter your 12-word seed phrase..."
                value={mnemonic}
                onChange={(e) => setMnemonic(e.target.value)}
            />


            <button
                className="bg-indigo-600 text-white px-6 py-3 rounded hover:bg-indigo-700 transition"
                onClick={generateWallet}
            >
                Generate Wallet & Download JSON
            </button>

            {error && <p className="text-red-500">{error}</p>}
            {publicKey && (
                <div className="mt-4 space-y-2 break-words">
                    <p><strong>✅ Public Key:</strong> {publicKey}</p>
                </div>
            )}
        </div>
    );
}

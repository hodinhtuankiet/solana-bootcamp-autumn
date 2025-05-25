import * as bip39 from "bip39";
import { derivePath } from "ed25519-hd-key";
import { Keypair } from "@solana/web3.js";
import { Buffer } from "buffer"; // ✅ explicitly import Buffer

export function getKeypairFromMnemonic(mnemonic: string): {
    keypair: Keypair;
    secretKeyJSON: number[];
} {
    const trimmed = mnemonic.trim();

    if (!bip39.validateMnemonic(trimmed)) {
        throw new Error("Invalid mnemonic");
    }

    // Convert seed to Buffer to satisfy derivePath
    const seed = bip39.mnemonicToSeedSync(trimmed);
    // const { key } = derivePath("m/44'/501'/0'/0'", seed);

    const keypair = Keypair.fromSeed(key);
    const secretKeyJSON = Array.from(keypair.secretKey);

    return { keypair, secretKeyJSON };
}

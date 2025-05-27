import { Connection, clusterApiUrl, Keypair , LAMPORTS_PER_SOL} from "@solana/web3.js";
import { Metaplex, keypairIdentity } from "@metaplex-foundation/js";
import fs from "fs";
import { explorerURL, printConsoleSeparator } from "./helpers.js";
import { irysStorage } from "@metaplex-foundation/js";

// 🔐 Load ví từ file wallet.json
const secretKey = JSON.parse(fs.readFileSync("my-keypair.json"));
const payer = Keypair.fromSecretKey(Uint8Array.from(secretKey));

// 📡 Kết nối tới mạng devnet
const connection = new Connection("https://api.devnet.solana.com", "confirmed");

(async () => {
  console.log("Payer address:", payer.publicKey.toBase58());

  const metadata = {
    name: "Solana Bootcamp Autumn 2024",
    symbol: "SBS",
    description: "Solana Bootcamp Autumn 2024 NFT chứng nhận hoàn thành khóa học.",
    image: "https://github.com/trankhacvy/solana-bootcamp-autumn-2024/blob/main/assets/logo.png?raw=true",
  };
  const airdropSig = await connection.requestAirdrop(
    payer.publicKey,
    LAMPORTS_PER_SOL * 2
  );
  await connection.confirmTransaction(airdropSig, "confirmed");
  console.log("✅ Airdropped to:", payer.publicKey.toBase58());
  // 🧠 Khởi tạo Metaplex SDK
  const metaplex = Metaplex.make(connection)
    .use(keypairIdentity(payer))
    .use(
      irysStorage({
        address: "https://devnet.bundlr.network",
        providerUrl: "https://api.devnet.solana.com",
        timeout: 60000,
      })
    );

  console.log("Uploading metadata...");
  const { uri } = await metaplex.nfts().uploadMetadata(metadata);
  console.log("Metadata uploaded:", uri);

  printConsoleSeparator("NFT Details");

  console.log("Minting NFT...");
  const tokenMint = Keypair.generate();

  const { nft, response } = await metaplex.nfts().create({
    uri,
    name: metadata.name,
    symbol: metadata.symbol,
    useNewMint: tokenMint,
    sellerFeeBasisPoints: 500,
    isMutable: true,
  });

  console.log("NFT Minted: ", nft.address.toBase58());
  printConsoleSeparator("Transaction Signature");
  console.log(explorerURL({ txSignature: response.signature }));

  printConsoleSeparator("Fetch NFT by mint address");

  const mintInfo = await metaplex.nfts().findByMint({ mintAddress: tokenMint.publicKey });
  console.log(mintInfo);
})();

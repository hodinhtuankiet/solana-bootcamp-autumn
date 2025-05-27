"use strict";
/**
 * Create a SPL token and store its metadata on-chain using Metaplex.
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var web3_js_1 = require("@solana/web3.js");
var spl_token_1 = require("@solana/spl-token");
var mpl_token_metadata_1 = require("@metaplex-foundation/mpl-token-metadata");
var vars_1 = require("../lib/vars");
var helpers_1 = require("../lib/helpers");
(function () { return __awaiter(void 0, void 0, void 0, function () {
    var mintKeypair, tokenConfig, createMintAccountInstruction, _a, _b, initializeMintInstruction, metadataAccount, createMetadataInstruction, tx, sig, err_1, failedSig;
    var _c;
    return __generator(this, function (_d) {
        switch (_d.label) {
            case 0:
                console.log("Payer address:", vars_1.payer.publicKey.toBase58());
                console.log("Test wallet address:", vars_1.testWallet.publicKey.toBase58());
                mintKeypair = web3_js_1.Keypair.generate();
                console.log("Mint address:", mintKeypair.publicKey.toBase58());
                tokenConfig = {
                    decimals: 6,
                    name: "Solana Bootcamp Autumn 2024",
                    symbol: "SBS",
                    uri: "https://raw.githubusercontent.com/trankhacvy/solana-bootcamp-autumn-2024/main/assets/sbs-token.json",
                };
                _b = (_a = web3_js_1.SystemProgram).createAccount;
                _c = {
                    fromPubkey: vars_1.payer.publicKey,
                    newAccountPubkey: mintKeypair.publicKey,
                    space: spl_token_1.MINT_SIZE
                };
                return [4 /*yield*/, vars_1.connection.getMinimumBalanceForRentExemption(spl_token_1.MINT_SIZE)];
            case 1:
                createMintAccountInstruction = _b.apply(_a, [(_c.lamports = _d.sent(),
                        _c.programId = spl_token_1.TOKEN_PROGRAM_ID,
                        _c)]);
                initializeMintInstruction = (0, spl_token_1.createInitializeMint2Instruction)(mintKeypair.publicKey, tokenConfig.decimals, vars_1.payer.publicKey, vars_1.payer.publicKey);
                metadataAccount = web3_js_1.PublicKey.findProgramAddressSync([
                    Buffer.from("metadata"),
                    METADATA_PROGRAM_ID.toBuffer(),
                    mintKeypair.publicKey.toBuffer(),
                ], METADATA_PROGRAM_ID)[0];
                console.log("Metadata address:", metadataAccount.toBase58());
                createMetadataInstruction = (0, mpl_token_metadata_1.createCreateMetadataAccountV3Instruction)({
                    metadata: metadataAccount,
                    mint: mintKeypair.publicKey,
                    mintAuthority: vars_1.payer.publicKey,
                    payer: vars_1.payer.publicKey,
                    updateAuthority: vars_1.payer.publicKey,
                }, {
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
                });
                return [4 /*yield*/, (0, helpers_1.buildTransaction)({
                        connection: vars_1.connection,
                        payer: vars_1.payer.publicKey,
                        signers: [vars_1.payer, mintKeypair],
                        instructions: [
                            createMintAccountInstruction,
                            initializeMintInstruction,
                            createMetadataInstruction,
                        ],
                    })];
            case 2:
                tx = _d.sent();
                (0, helpers_1.printConsoleSeparator)();
                _d.label = 3;
            case 3:
                _d.trys.push([3, 5, , 7]);
                return [4 /*yield*/, vars_1.connection.sendTransaction(tx)];
            case 4:
                sig = _d.sent();
                console.log("Transaction completed.");
                console.log((0, helpers_1.explorerURL)({ txSignature: sig }));
                (0, helpers_1.savePublicKeyToFile)("tokenMint", mintKeypair.publicKey);
                return [3 /*break*/, 7];
            case 5:
                err_1 = _d.sent();
                console.error("Failed to send transaction:");
                console.log(tx);
                return [4 /*yield*/, (0, helpers_1.extractSignatureFromFailedTransaction)(vars_1.connection, err_1)];
            case 6:
                failedSig = _d.sent();
                if (failedSig) {
                    console.log("Failed signature:", (0, helpers_1.explorerURL)({ txSignature: failedSig }));
                }
                throw err_1;
            case 7: return [2 /*return*/];
        }
    });
}); })();

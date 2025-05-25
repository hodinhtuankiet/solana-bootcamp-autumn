import * as bip39 from "bip39";

const phrase = "wink dune winner loop pistol ability still magic school trial menu path";

console.log("Is valid (default)?", bip39.validateMnemonic(phrase));
console.log("Is valid (english wordlist)?", bip39.validateMnemonic(phrase, bip39.wordlists.english));

const words = phrase.split(" ");
console.log("All words valid:", words.every(w => bip39.wordlists.english.includes(w)));
console.log("First word 'wink' in wordlist?", bip39.wordlists.english.includes("wink"));
//                 onChange={(e) => setMnemonic(e.target.value)}
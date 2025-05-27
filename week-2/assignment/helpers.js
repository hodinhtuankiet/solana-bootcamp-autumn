// helpers.js
export function explorerURL({ txSignature }) {
  return `https://explorer.solana.com/tx/${txSignature}?cluster=devnet`;
}

export function printConsoleSeparator(title = "") {
  console.log("\n==================== " + title + " ====================\n");
}

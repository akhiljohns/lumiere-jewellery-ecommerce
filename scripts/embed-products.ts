// Generate embeddings for every active product. Run with: pnpm embed:products
import { generateAllProductEmbeddings } from "../src/lib/embeddings";

async function main() {
  const started = Date.now();
  const { processed, errors } = await generateAllProductEmbeddings();
  const seconds = ((Date.now() - started) / 1000).toFixed(1);
  console.log(`Embedded ${processed} products, ${errors} errors, in ${seconds} s`);
  if (errors > 0) process.exitCode = 1;
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});

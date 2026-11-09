// Generate embeddings for every active product. Run with: pnpm embed:products
import { generateAllProductEmbeddings } from "../src/lib/embeddings";

const started = Date.now();
const { processed, errors } = await generateAllProductEmbeddings();
console.log(`Embedded ${processed} products, ${errors} errors, in ${((Date.now() - started) / 1000).toFixed(1)} s`);
if (errors > 0) process.exitCode = 1;

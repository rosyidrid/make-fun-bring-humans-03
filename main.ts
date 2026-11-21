import { chmod, copyFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const output = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
const videoJson = join(root, "VIDEO.json");
const destination = join(output, "VIDEO.json");

await mkdir(output, { recursive: true });
await copyFile(videoJson, destination);
await chmod(destination, 0o644);

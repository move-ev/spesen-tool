#!/usr/bin/env node
/**
 * Collects browser sourcemaps for upload, keyed by the asset they belong to.
 *
 * Turbopack names a sourcemap independently of the chunk it maps: chunk
 * `02mwhpb-9lwfu.js` is described by `3-k-qm3o85x8h.js.map`. Only the trailing
 * `//# sourceMappingURL=` comment relates the two, so deriving one name from
 * the other is wrong — it produces uploads that succeed and resolve nothing.
 *
 * Each map is therefore copied out under the *asset's* path, so a later step
 * can turn `chunks/02mwhpb-9lwfu.js.map` straight back into the public URL
 * `/_next/static/chunks/02mwhpb-9lwfu.js` without carrying a manifest around.
 *
 * Usage: node collect-sourcemaps.mjs <staticDir> <outDir>
 */

import { copyFile, mkdir, readdir, readFile } from "node:fs/promises";
import { dirname, join, relative, sep } from "node:path";

/** Enough of the tail to hold the comment, without reading megabyte chunks. */
const TAIL_BYTES = 2048;

const SOURCE_MAPPING_URL = /\/\/# sourceMappingURL=(\S+)\s*$/;

async function* walk(dir) {
	for (const entry of await readdir(dir, { withFileTypes: true })) {
		const path = join(dir, entry.name);
		if (entry.isDirectory()) {
			yield* walk(path);
		} else {
			yield path;
		}
	}
}

async function mappingUrlOf(file) {
	const contents = await readFile(file, "utf8");
	const tail = contents.slice(-TAIL_BYTES).trimEnd();
	return SOURCE_MAPPING_URL.exec(tail)?.[1];
}

async function main() {
	const [staticDir, outDir] = process.argv.slice(2);
	if (!staticDir || !outDir) {
		console.error("Usage: collect-sourcemaps.mjs <staticDir> <outDir>");
		process.exit(1);
	}

	let collected = 0;
	let withoutMap = 0;

	for await (const file of walk(staticDir)) {
		// JavaScript only: AppSignal resolves JS backtraces, so a CSS map is
		// bytes it would never read.
		if (!file.endsWith(".js")) continue;

		const reference = await mappingUrlOf(file);
		if (!reference) {
			withoutMap += 1;
			continue;
		}

		const mapPath = join(dirname(file), reference);
		const assetPath = relative(staticDir, file).split(sep).join("/");
		const destination = join(outDir, `${assetPath}.map`);

		await mkdir(dirname(destination), { recursive: true });
		await copyFile(mapPath, destination);
		collected += 1;
	}

	if (collected === 0) {
		// Silence would ship a release whose backtraces stay minified, with
		// nothing to explain why.
		console.error(`No sourcemaps found under ${staticDir}`);
		process.exit(1);
	}

	console.log(
		`Collected ${collected} sourcemaps` +
			(withoutMap > 0 ? ` (${withoutMap} chunks have none)` : ""),
	);
}

await main();

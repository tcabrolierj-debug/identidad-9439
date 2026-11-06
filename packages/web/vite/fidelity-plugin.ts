import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { Plugin, ResolvedConfig } from 'vite';

/** Preserve original slide bytes after the managed general-purpose optimizer. */
export default function fidelityPlugin(): Plugin {
  let config: ResolvedConfig;
  return {
    name: 'mira-immutable-artwork',
    apply: 'build',
    configResolved(resolved) { config = resolved; },
    closeBundle: {
      order: 'post',
      sequential: true,
      async handler() {
        const source = path.join(config.publicDir, 'slides');
        const destination = path.resolve(config.root, config.build.outDir, 'slides');
        await fs.mkdir(destination, { recursive: true });
        const entries = await fs.readdir(source, { withFileTypes: true });
        for (const entry of entries) {
          if (entry.isFile()) await fs.copyFile(path.join(source,entry.name),path.join(destination,entry.name));
        }
        config.logger.info('[mira-fidelity] Restored immutable original artwork bytes; no slide image quantization.');
      },
    },
  };
}
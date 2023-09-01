import path from 'path'
import { defineConfig } from 'vite'
import wasm from 'vite-plugin-wasm'

export default defineConfig({
  build: {
    outDir: 'dist',
    lib: {
      entry: path.resolve('src/index.ts'),
      fileName: 'index',
      formats: ['es'],
    },
    rollupOptions: {
      output: {
        chunkFileNames: '[name].js',
        entryFileNames: '[name].js',
      },
      input: {
        ['bench.traces.crdt-libs']: path.resolve(`./src/bench.traces.crdt-libs.ts`),
        ['bench.traces.non-crdt-libs']: path.resolve(`./src/bench.traces.non-crdt-libs.ts`),
      },
      external: ['diamond-types-node', 'fs', 'os', 'path', 'util', 'ywasm', 'zlib'],
    },
    target: 'esnext',
    minify: false,
  },
  plugins: [
    wasm(),
    {
      name: 'hack-crypto',
      generateBundle(outputOptions, bundle) {
        Object.keys(bundle).forEach(fileName => {
          const file = bundle[fileName]
          if (fileName.slice(-3) === '.js' && 'code' in file) {
            file.code = `import crypto from 'node:crypto'\n${file.code}`
          }
        })
      },
    },
  ],
})

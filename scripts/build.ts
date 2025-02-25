import dts from 'bun-plugin-dts'

await Bun.build({
  entrypoints: ['./src/index.ts', './src/effect.ts'],
  outdir: './dist',
  minify: false,
  plugins: [dts()],
  external: ['valibot', 'effect', 'zod']
})

import dts from 'bun-plugin-dts'

await Bun.build({
  entrypoints: ['./src/index.ts', './src/interchange.ts'],
  outdir: './dist',
  minify: false,
  plugins: [dts()]
})

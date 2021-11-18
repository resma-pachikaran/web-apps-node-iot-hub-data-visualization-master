import resolve from '@rollup/plugin-node-resolve';

export default {
  input: 'public/js/app.js',
  output: [
    {
      format: 'esm',
      file: 'public/js/bundle.js'
    },
  ],
  plugins: [
    resolve(),
  ]
};
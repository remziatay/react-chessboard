import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import typescript from 'rollup-plugin-typescript2';

export default {
  input: {
    index: 'src/index.ts',
    preview: 'src/preview/index.ts',
  },
  output: [
    {
      dir: 'dist',
      entryFileNames: '[name].js',
      format: 'cjs',
      exports: 'auto',
    },
    {
      dir: 'dist',
      entryFileNames: '[name].esm.js',
      format: 'esm',
    },
  ],
  plugins: [
    resolve(),
    commonjs(),
    typescript({
      clean: true,
      tsconfig: 'tsconfig.build.json',
    }),
  ],
  external: ['react', 'react-dom', 'react/jsx-runtime'],
};

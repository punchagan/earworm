import { nodeResolve } from "@rollup/plugin-node-resolve";
import { babel } from "@rollup/plugin-babel";
import alias from "@rollup/plugin-alias";
import commonjs from "@rollup/plugin-commonjs";
import replace from "@rollup/plugin-replace";

export default {
  input: "js/main.mjs",
  output: {
    file: "earworm/static/bundle.js"
  },
  plugins: [
    alias({
      entries: [
        { find: "react", replacement: "preact/compat" },
        { find: "react-dom", replacement: "preact/compat" }
      ]
    }),
    babel({
      babelHelpers: "bundled",
      presets: ["@babel/preset-react"]
    }),
    commonjs(),
    nodeResolve(),
    replace({
      preventAssignment: true,
      "process.env.NODE_ENV": JSON.stringify("production")
    })
  ],
  external: [
    "https://cdn.skypack.dev/pin/plyr@v3.6.8-UdIeSiyxM89uOBn4h5ie/mode=imports,min/optimized/plyr.js"
  ]
};

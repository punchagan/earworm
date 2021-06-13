import resolve from "@rollup/plugin-node-resolve";
import babel from "@rollup/plugin-babel";
import alias from "@rollup/plugin-alias";

export default {
  input: "static/main.mjs",
  plugins: [
    alias({
      entries: [
        { find: "react", replacement: "preact/compat" },
        { find: "react-dom", replacement: "preact/compat" },
      ],
    }),
    babel({
      presets: ["@babel/preset-react"],
      plugins: [["@babel/transform-react-jsx", { pragma: "h" }]],
    }),
    resolve(),
  ],
  external: [
    "https://cdn.skypack.dev/pin/plyr@v3.6.8-UdIeSiyxM89uOBn4h5ie/mode=imports,min/optimized/plyr.js",
  ],
};

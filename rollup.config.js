import resolve from "@rollup/plugin-node-resolve";

export default {
  input: "static/main.mjs",
  plugins: [resolve()],
  external: [
    "https://cdn.skypack.dev/pin/plyr@v3.6.8-UdIeSiyxM89uOBn4h5ie/mode=imports,min/optimized/plyr.js",
  ],
};

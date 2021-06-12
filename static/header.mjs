import { h } from "https://cdn.skypack.dev/pin/preact@v10.5.13-wi6UEiTTWqqBsSGgZ7I8/mode=imports,min/optimized/preact.js";
import htm from "https://cdn.skypack.dev/pin/htm@v3.0.4-XTYwGtlZuRXP2GLXT2TZ/mode=imports,min/optimized/htm.js";

const html = htm.bind(h);

const Header = ({ title, description }) => {
  return html`<header>
    <h1>${title}</h1>
    <p>${description}</p>
    <header></header>
  </header>`;
};

export default Header;

import { h } from "https://cdn.skypack.dev/pin/preact@v10.5.13-wi6UEiTTWqqBsSGgZ7I8/mode=imports,min/optimized/preact.js";
import htm from "https://cdn.skypack.dev/pin/htm@v3.0.4-XTYwGtlZuRXP2GLXT2TZ/mode=imports,min/optimized/htm.js";

const html = htm.bind(h);

const Header = ({ title, description, queue }) => {
  const totalMinutes = Math.floor(queue.reduce((acc, it) => acc + it.duration, 0) / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const duration = hours > 0 ? `${hours} hours, ${minutes} minutes` : `${minutes} minutes`;
  return html`<header class="heading">
    <h1>${title}</h1>
    <p dangerouslySetInnerHTML=${{ __html: description }} />
    <span>${queue.length} songs</span><span> · </span><span>${duration}</span>
  </header>`;
};

export default Header;

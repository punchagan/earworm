import { h } from "preact";
import htm from "htm";

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

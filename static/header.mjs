import { h } from "preact";

const Header = ({ title, description, queue }) => {
  const totalMinutes = Math.floor(queue.reduce((acc, it) => acc + it.duration, 0) / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const duration = hours > 0 ? `${hours} hours, ${minutes} minutes` : `${minutes} minutes`;
  return (
    <header class="heading">
      <h1>{title}</h1>
      <p dangerouslySetInnerHTML={{ __html: description }} />
      <span>{queue.length} songs</span>
      <span> · </span>
      <span>{duration}</span>
    </header>
  );
};

export default Header;

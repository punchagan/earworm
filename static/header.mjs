import React from "react";

import { AppStore } from "./app-store.mjs";

const Header = ({ title, description }) => {
  const queue = AppStore.useState((s) => s.queue);
  const totalMinutes = Math.floor(queue.reduce((acc, it) => acc + it.duration, 0) / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const duration = hours > 0 ? `${hours} hours, ${minutes} minutes` : `${minutes} minutes`;
  return (
    <header className="heading">
      <h1>{title}</h1>
      <p dangerouslySetInnerHTML={{ __html: description }} />
      <span>{queue.length} songs</span>
      <span> · </span>
      <span>{duration}</span>
    </header>
  );
};

export default Header;

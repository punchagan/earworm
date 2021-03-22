const setSource = index => {
  const song = songs[index];
  const { title, src } = song;
  const source = {
    title,
    type: "audio",
    sources: [
      {
        src,
        type: "audio/mp3"
      }
    ]
  };
  player.source = source;

  const songElements = document.querySelectorAll(".song");
  songElements.forEach(it => it.classList.remove("current"));
  songElements[index].classList.add("current");
};

const playSong = index => {
  const current = songs.findIndex(it => it.title === player.config.title);
  const songElements = document.querySelectorAll(".song");
  songElements.forEach(it => it.classList.remove("playing"));

  if (current === index && player.playing) {
    player.pause();
  } else {
    setSource(index);
    player.play();
    songElements[index].classList.add("playing");
  }
};

let loopState = 0;
const loopText = {
  0: "Off",
  1: "Song",
  2: "All"
};
const changeLoopState = () => {
  loopState = (loopState + 1) % 3;
  document.querySelector(".loopcontrol .state").textContent = loopText[loopState];
};

const handleLoopState = event => {
  switch (loopState) {
    case 1:
      player.currentTime = 0;
      player.play();
      break;
    case 2:
      const current = songs.findIndex(it => it.title === player.config.title);
      const next = (current + 1) % songs.length;
      playSong(next);
      break;
    default:
      console.log(loopState);
      break;
  }
};

document.addEventListener("DOMContentLoaded", () => {
  const player = new Plyr("#player", { settings: [] });
  window.player = player;
  player.on("ended", handleLoopState);
  setSource(0);
  changeLoopState();
});

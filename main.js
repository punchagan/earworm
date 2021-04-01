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
  if (current === index && player.playing) {
    player.pause();
  } else {
    if (current !== index) {
      setSource(index);
    }
    player.play();
  }
};

const handlePlayingState = e => {
  console.log(e, 111);
  const current = songs.findIndex(it => it.title === player.config.title);
  const songElements = document.querySelectorAll(".song");
  songElements.forEach(it => it.classList.remove("playing"));
  if (e.type === "play") {
    songElements[current].classList.add("playing");
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
  const player = new Plyr("#player", {
    controls: ["rewind", "play", "fast-forward", "progress", "current-time", "duration"]
  });
  window.player = player;
  player.on("ended", handleLoopState);
  player.on("play", handlePlayingState);
  player.on("pause", handlePlayingState);
  player.on("ended", handlePlayingState);
  setSource(0);
  changeLoopState();
});

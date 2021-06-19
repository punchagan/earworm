import { Store } from "pullstate";

export const AppStore = new Store({
  playing: false,
  currentSong: null,
  shuffle: false,
  repeatIndex: 2,
  queue: [],
});

export const findSongIndex = (songList, src) => songList.findIndex((it) => it.src === src);

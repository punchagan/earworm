import { Store } from "pullstate";

export const AppStore = new Store({
  playing: false,
  currentSong: null,
  shuffle: false,
  repeatIndex: 2,
  queue: [],
});

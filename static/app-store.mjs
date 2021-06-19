import { Store } from "pullstate";

export const AppStore = new Store({
  playing: false,
  currentSong: null,
  shuffle: false,
  repeatIndex: 2,
  queue: [],
});

export const findSongIndex = (songList, src) => songList.findIndex((it) => it.src === src);

export const setCurrentSong = (song) =>
  AppStore.update((s) => {
    s.currentSong = song;
  });

export const setPlaying = (playing) =>
  AppStore.update((s) => {
    s.playing = playing;
  });

export const setQueue = (q) => {
  AppStore.update((s) => {
    s.queue = q;
  });
};

export const setRepeatIndex = (idx) => {
  AppStore.update((s) => {
    s.repeatIndex = idx;
  });
};

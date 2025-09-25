import { useEffect, useMemo } from "react";

import clickSound from "../assets/sound_effect/Click.wav";
import errorSound from "../assets/sound_effect/Error.wav";
import connectSuccess from "../assets/sound_effect/ConnectionSuccess.wav";
import Perfect from "../assets/sound_effect/100Perfect.wav";

const audioCache = new Map();
const audioSources = [clickSound, errorSound, connectSuccess, Perfect];
let preloadPromise = null;

/**
 * Get an audio instance for a given source.
 * @param {string} src - The audio source URL.
 * @returns {HTMLAudioElement} The audio instance.
 * Core Logic: if the audio instance not found in cache then create a new one and cache it
 * Otherwise return the cached instance
 */
function getAudioInstance(src) {
  if (!audioCache.has(src)) {
    const audio = new Audio(src);
    audio.preload = "auto";
    audioCache.set(src, audio);
  }

  return audioCache.get(src);
}

/**
 * Wait for the audio to be ready for playback.
 * @param {HTMLAudioElement} audio - The audio element to check.
 * @returns {Promise<void>} A promise that resolves when the audio is ready.
 * Core Logic: if the audio is already ready, resolve immediately
 * Otherwise, set up event listeners to resolve when the audio can play through or if an error occurs
 */
function waitForAudioReady(audio) {
  if (audio.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    const cleanup = () => {
      audio.removeEventListener("canplaythrough", onReady);
      audio.removeEventListener("loadeddata", onReady);
      audio.removeEventListener("error", onReady);
      resolve();
    };

    const onReady = () => cleanup();

    audio.addEventListener("canplaythrough", onReady);
    audio.addEventListener("loadeddata", onReady);
    audio.addEventListener("error", onReady);

    Promise.resolve().then(() => {
      try {
        audio.load();
      } catch (error) {
        cleanup();
      }
    });
  });
}

/**
 * Preload all audio files and cache their instances.
 * @returns {Promise<void>} A promise that resolves when all audio files are preloaded.
 * Core Logic: if the preload process has not started, initiate it by creating a promise that waits for all audio files to be ready
 * If it has already started, return the existing promise
 */
export function preloadAudioCache() {
  if (typeof window === "undefined") {
    return Promise.resolve();
  }

  if (!preloadPromise) {
    preloadPromise = Promise.all(
      audioSources.map((src) => {
        const audio = getAudioInstance(src);
        return waitForAudioReady(audio);
      })
    ).catch((error) => {
      console.warn("Audio preloading failed", error);
    });
  }

  return preloadPromise;
}

/**
 * Preload audio files and cache their instances.
 * @returns {Promise<void>} A promise that resolves when all audio files are preloaded.
 * Core Logic: if the preload process has not started, initiate it by creating a promise that waits for all audio files to be ready
 * If it has already started, return the existing promise
 */
export function useAudio() {
  useEffect(() => {
    preloadAudioCache();
  }, []);

  return useMemo(
    () => ({
      clickAudio: getAudioInstance(clickSound),
      errorAudio: getAudioInstance(errorSound),
      connectsuccess: getAudioInstance(connectSuccess),
      perfectAudio: getAudioInstance(Perfect),
    }),
    []
  );
}

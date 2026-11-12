export function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  return minutes ? minutes + "m " + (seconds % 60) + "s" : seconds + "s";
}

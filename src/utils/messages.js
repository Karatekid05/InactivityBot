// Purge messages with their corresponding GIFs
const purgeMessageGifPairs = [
  {
    message: "User got Thanos snapped - {role} role vanished!",
    gif: "./assets/gifs/thanos-endgame.gif"
  },
  {
    message: "User got yeeted and lost {role} privileges!",
    gif: "./assets/gifs/yeet-lion-king.gif"
  },
  {
    message: "User went AFK and lost their {role} status!",
    gif: "./assets/gifs/disappear.gif"
  },
  {
    message: "User got the boot and lost {role} role!",
    gif: "./assets/gifs/rick-falling-off-a-cliff.gif"
  },
  {
    message: "User disappeared and lost {role} privileges!",
    gif: "./assets/gifs/disappear.gif"
  },
  {
    message: "User got cleaned and lost {role} status!",
    gif: "./assets/gifs/purge-button-press.gif"
  },
  {
    message: "Account was purged and lost his {role} role!",
    gif: "./assets/gifs/purge-button-press.gif"
  },
  {
    message: "Another one bites the dust - {role} role removed!",
    gif: "./assets/gifs/rick-falling-off-a-cliff.gif"
  },
  {
    message: "Inactivity strikes again - {role} role gone!",
    gif: "./assets/gifs/homer-cloud.gif"
  },
  {
    message: "Another purge victim - {role} role eliminated!",
    gif: "./assets/gifs/langley-thanos.gif"
  }
];


export function getRandomPurgeMessageAndGif(roleName) {
  const randomPair = purgeMessageGifPairs[Math.floor(Math.random() * purgeMessageGifPairs.length)];
  return {
    message: randomPair.message.replace('{role}', roleName),
    gif: randomPair.gif
  };
} 
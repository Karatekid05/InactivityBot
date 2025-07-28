// Purge messages with their corresponding GIFs
const purgeMessageGifPairs = [
  {
    message: "User got Thanos snapped - {role} role vanished!",
    gif: "https://tenor.com/view/thanos-endgame-avengers-gone-ashes-gif-14019029"
  },
  {
    message: "User got yeeted and lost {role} privileges!",
    gif: "https://tenor.com/view/yeet-lion-king-simba-rafiki-throw-gif-16194362"
  },
  {
    message: "User went AFK and lost their {role} status!",
    gif: "https://tenor.com/view/out-disappear-bye-vanished-gif-4932063"
  },
  {
    message: "User got the boot and lost {role} role!",
    gif: "https://tenor.com/view/rick-falling-off-a-cliff-gif-20556640"
  },
  {
    message: "User disappeared and lost {role} privileges!",
    gif: "https://tenor.com/view/out-disappear-bye-vanished-gif-4932063"
  },
  {
    message: "User got cleaned and lost {role} status!",
    gif: "https://tenor.com/view/purge-button-press-fast-gif-17107922"
  },
  {
    message: "Account was purged and lost his {role} role!",
    gif: "https://tenor.com/view/purge-button-press-fast-gif-17107922"
  },
  {
    message: "Another one bites the dust - {role} role removed!",
    gif: "https://tenor.com/view/rick-falling-off-a-cliff-gif-20556640"
  },
  {
    message: "Inactivity strikes again - {role} role gone!",
    gif: "https://tenor.com/view/homer-cloud-homer-simpson-simpsons-the-simpsons-gif-5392692"
  },
  {
    message: "Another purge victim - {role} role eliminated!",
    gif: "https://tenor.com/view/langley-thanos-gif-20432464"
  }
];

// Random GIF URLs (Tenor page links para embed Discord) - fallback
const purgeGifs = [
  "https://tenor.com/view/rick-falling-off-a-cliff-gif-20556640", // Person falling
  "https://tenor.com/view/homer-cloud-homer-simpson-simpsons-the-simpsons-gif-5392692", // Simpson
  "https://tenor.com/view/out-disappear-bye-vanished-gif-4932063", // Disappearing
  "https://tenor.com/view/langley-thanos-gif-20432464", // Thanos 1
  "https://tenor.com/view/yeet-lion-king-simba-rafiki-throw-gif-16194362",  // Simba yeet
  "https://tenor.com/view/thanos-endgame-avengers-gone-ashes-gif-14019029", // Thanos 2
  "https://tenor.com/view/purge-button-press-fast-gif-17107922", // Purge button
];

export function getRandomPurgeMessage(roleName) {
  const randomPair = purgeMessageGifPairs[Math.floor(Math.random() * purgeMessageGifPairs.length)];
  return randomPair.message.replace('{role}', roleName);
}

export function getRandomPurgeGif() {
  return purgeGifs[Math.floor(Math.random() * purgeGifs.length)];
}

export function getRandomPurgeMessageAndGif(roleName) {
  const randomPair = purgeMessageGifPairs[Math.floor(Math.random() * purgeMessageGifPairs.length)];
  return {
    message: randomPair.message.replace('{role}', roleName),
    gif: randomPair.gif
  };
} 
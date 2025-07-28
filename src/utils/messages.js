// Random purge messages
const purgeMessages = [
  "Account was purged and lost his {role} role!",
  "User got yeeted and lost {role} privileges!",
  "Another one bites the dust - {role} role removed!",
  "User went AFK and lost their {role} status!",
  "Inactivity strikes again - {role} role gone!",
  "User got the boot and lost {role} role!",
  "Another purge victim - {role} role eliminated!",
  "User disappeared and lost {role} privileges!",
  "User got Thanos snapped - {role} role vanished!",
  "User got cleaned and lost {role} status!"
];

// Random GIF URLs (Tenor page links para embed Discord)
const purgeGifs = [
  "https://tenor.com/view/thanos-snap-avengers-infinity-war-gif-12149187",
  "https://tenor.com/view/yeet-throw-gif-17357889",
  "https://tenor.com/view/disappear-magic-gif-10108384",
  "https://tenor.com/view/homer-simpson-bush-gif-3530837",
  "https://tenor.com/view/purge-button-press-fast-gif-17107922",
  "https://tenor.com/view/bye-falling-fall-off-cliff-gif-20556640",
  "https://tenor.com/view/shadow-realm-yu-gi-oh-gif-15198019"
];

export function getRandomPurgeMessage(roleName) {
  const randomMessage = purgeMessages[Math.floor(Math.random() * purgeMessages.length)];
  return randomMessage.replace('{role}', roleName);
}

export function getRandomPurgeGif() {
  return purgeGifs[Math.floor(Math.random() * purgeGifs.length)];
} 
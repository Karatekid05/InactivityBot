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
  "https://tenor.com/view/rick-falling-off-a-cliff-gif-20556640", // Person falling
  "https://tenor.com/view/homer-cloud-homer-simpson-simpsons-the-simpsons-gif-5392692", // Simpson
  "https://tenor.com/view/disappear-gif-10108384", // Disappearing
  "https://tenor.com/view/langley-thanos-gif-20432464", // Thanos 1
  "https://tenor.com/view/yeet-lion-king-simba-rafiki-throw-gif-16194362",  // Simba yeet
  "https://tenor.com/view/thanos-endgame-avengers-gone-ashes-gif-14019029", // Thanos 2
  "https://tenor.com/view/purge-button-press-fast-gif-17107922", // Purge button
];

export function getRandomPurgeMessage(roleName) {
  const randomMessage = purgeMessages[Math.floor(Math.random() * purgeMessages.length)];
  return randomMessage.replace('{role}', roleName);
}

export function getRandomPurgeGif() {
  return purgeGifs[Math.floor(Math.random() * purgeGifs.length)];
} 
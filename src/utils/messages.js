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

// Random GIF URLs (Tenor direct links)
const purgeGifs = [
  "https://media.tenor.com/20556640/rick-falling-off-a-cliff.gif", // Person falling
  "https://media.tenor.com/5392692/homer-cloud-homer-simpson-simpsons-the-simpsons.gif", // Simpson
  "https://media.tenor.com/10108384/disappear.gif", // Disappearing
  "https://media.tenor.com/20432464/langley-thanos.gif", // Thanos 1
  "https://media.tenor.com/16194362/yeet-lion-king-simba-rafiki-throw.gif",  // Simba yeet
  "https://media.tenor.com/14019029/thanos-endgame-avengers-gone-ashes.gif", // Thanos 2
  "https://media.tenor.com/17107922/purge-button-press-fast.gif", // Purge button
];

export function getRandomPurgeMessage(roleName) {
  const randomMessage = purgeMessages[Math.floor(Math.random() * purgeMessages.length)];
  return randomMessage.replace('{role}', roleName);
}

export function getRandomPurgeGif() {
  return purgeGifs[Math.floor(Math.random() * purgeGifs.length)];
} 
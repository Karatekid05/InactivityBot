// Elite celebration messages with their corresponding GIFs
const eliteMessageGifPairs = [
  {
    message: "🎉 **WELCOME TO THE FAMILY!** 🎉",
    gif: "./assets/gifs/congrats/talos-welcome.gif"
  },
  {
    message: "🌟 **CONGRATULATIONS!** 🌟",
    gif: "./assets/gifs/congrats/congratulations-congrats.gif"
  },
  {
    message: "👑 **ONE OF US! ONE OF US!** 👑",
    gif: "./assets/gifs/congrats/wolf-of-wall-street-jordan-belfort.gif"
  },
  {
    message: "🎊 **WELCOME, JOIN THE CLUB!** 🎊",
    gif: "./assets/gifs/congrats/simpsons-homer.gif"
  },
  {
    message: "🔥 **IT IS ELITE, MAN!** 🔥",
    gif: "./assets/gifs/congrats/it-is-elite-man-marco-wilson.gif"
  }
];

export function getRandomEliteMessageAndGif() {
  const randomPair = eliteMessageGifPairs[Math.floor(Math.random() * eliteMessageGifPairs.length)];
  return {
    message: randomPair.message,
    gif: randomPair.gif
  };
} 
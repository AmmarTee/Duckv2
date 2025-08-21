// List of words for the unscramble game
const words = [
  'garden',
  'discord',
  'coin',
  'plant',
  'duck',
  'water',
  'puzzle',
  'leaderboard',
  'economy',
  'playful'
];

function shuffle(str) {
  const arr = str.split('');
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.join('');
}

export function make() {
  const word = words[Math.floor(Math.random() * words.length)];
  let scrambled = shuffle(word);
  // Ensure the scrambled word is different from the original
  while (scrambled === word) {
    scrambled = shuffle(word);
  }
  return {
    type: 'unscramble',
    prompt: `🧠 Unscramble this word: **${scrambled}**`,
    answer: word
  };
}
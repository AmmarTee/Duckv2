// Phrases with a missing word.  Use '__' as placeholder for the missing word.
const phrases = [
  { text: 'The quick brown __ jumps over the lazy dog', answer: 'fox' },
  { text: 'A picture is worth a thousand __', answer: 'words' },
  { text: 'Better late than __', answer: 'never' },
  { text: 'Don’t count your chickens before they __', answer: 'hatch' },
  { text: 'An apple a day keeps the __ away', answer: 'doctor' }
];

export function make() {
  const item = phrases[Math.floor(Math.random() * phrases.length)];
  return {
    type: 'fill',
    prompt: `📝 Fill in the blank: ${item.text}`,
    answer: item.answer
  };
}
export function make() {
  const a = Math.floor(Math.random() * 10) + 1;
  const b = Math.floor(Math.random() * 10) + 1;
  const op = Math.random() < 0.5 ? '+' : '×';
  let answer;
  if (op === '+') {
    answer = a + b;
  } else {
    answer = a * b;
  }
  return {
    type: 'math',
    prompt: `🔢 Quick math: ${a} ${op} ${b}`,
    answer: String(answer)
  };
}
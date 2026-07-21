import assert from 'node:assert/strict';
import { test } from 'node:test';

const channel = (hex, start) => Number.parseInt(hex.slice(start, start + 2), 16) / 255;
const luminance = (hex) => {
  const values = [1, 3, 5]
    .map((start) => channel(hex, start))
    .map((value) => (value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4));
  return 0.2126 * values[0] + 0.7152 * values[1] + 0.0722 * values[2];
};
const contrast = (first, second) => {
  const a = luminance(first);
  const b = luminance(second);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
};

test('tokens textuais essenciais atingem contraste AA em ambos os papéis', () => {
  const pairs = [
    ['#171717', '#e8e4d8', 'texto claro'],
    ['#bd302b', '#e8e4d8', 'vermelho claro'],
    ['#66625b', '#e8e4d8', 'muted claro'],
    ['#7d5818', '#e8e4d8', 'âmbar claro'],
    ['#315d73', '#e8e4d8', 'azul claro'],
    ['#38664b', '#e8e4d8', 'verde claro'],
    ['#5d4569', '#e8e4d8', 'violeta claro'],
    ['#eee9dc', '#151515', 'texto escuro'],
    ['#e25d55', '#151515', 'vermelho escuro'],
    ['#aaa69b', '#151515', 'muted escuro'],
    ['#d6ac58', '#151515', 'âmbar escuro'],
  ];
  for (const [foreground, background, label] of pairs) {
    assert.ok(
      contrast(foreground, background) >= 4.5,
      `${label}: ${contrast(foreground, background).toFixed(2)}`,
    );
  }
});

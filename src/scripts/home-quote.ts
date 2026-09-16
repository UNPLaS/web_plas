/** Elige una cita al azar cada visita al home (incluye soft-nav Astro). */

type Quote = { text: string; attribution: string };

export function pickHomeQuote(): void {
  const root = document.querySelector<HTMLElement>('[data-home-quotes]');
  if (!root) return;

  let quotes: Quote[] = [];
  try {
    quotes = JSON.parse(root.dataset.homeQuotes || '[]') as Quote[];
  } catch {
    return;
  }
  if (!quotes.length) return;

  const quote = quotes[Math.floor(Math.random() * quotes.length)];
  const text = root.querySelector<HTMLElement>('[data-quote-text]');
  const attr = root.querySelector<HTMLElement>('[data-quote-attr]');
  if (text) text.textContent = quote.text;
  if (attr) attr.textContent = quote.attribution;
}

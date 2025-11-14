export function normalizeText(text) {
  return text
    // --- 1️⃣ Normalize Unicode form ---
    .normalize('NFKC')

    // --- 2️⃣ Replace smart quotes with straight quotes ---
    .replace(/[‘’‚‛]/g, "'")
    .replace(/[“”„‟]/g, '"')

    // --- 3️⃣ Replace dashes ---
    .replace(/[–—‒―]/g, '-') // en, em, figure, horizontal bars → hyphen

    // --- 4️⃣ Replace ellipsis ---
    .replace(/…/g, '...')

    // --- 5️⃣ Replace non-breaking spaces & thin spaces with normal space ---
    .replace(/[\u00A0\u2000-\u200B\u202F\u205F\u3000]/g, ' ')

    // --- 6️⃣ Remove zero-width chars (ZWNJ, ZWJ, etc.) ---
    .replace(/[\u200C\u200D\uFEFF]/g, '')

    // --- 7️⃣ Unify line endings ---
    .replace(/\r\n|\r/g, '\n')

    // --- 8️⃣ Trim unnecessary spaces (optional but helpful) ---
    .trim();
}

export function removeSpace(text) {
  let rest;
  if (text.length > 0) {
      rest = text.split(' ').filter(Boolean).join(' ');
  } else {
      rest = text;
  } 
  return rest;
}

/**
 * Make model output readable in plain UI cards.
 * Gemini especially emits LaTeX ($...$) and heavy markdown that looks like noise when unrendered.
 */

/** Convert common LaTeX fragments to plain Unicode / ASCII */
export function latexToReadable(input: string): string {
  if (!input || !/[\\$]/.test(input)) return input;

  let s = input;

  // Block / inline math delimiters
  s = s.replace(/\$\$([\s\S]*?)\$\$/g, (_m, inner: string) =>
    simplifyLatexBody(inner)
  );
  s = s.replace(/\\\[([\s\S]*?)\\\]/g, (_m, inner: string) =>
    simplifyLatexBody(inner)
  );
  s = s.replace(/\\\(([\s\S]*?)\\\)/g, (_m, inner: string) =>
    simplifyLatexBody(inner)
  );
  s = s.replace(/\$([^$\n]+)\$/g, (_m, inner: string) =>
    simplifyLatexBody(inner)
  );

  // Occasional bare commands left outside $...$
  if (s.includes('\\')) {
    s = simplifyLatexBody(s);
  }

  return s;
}

function simplifyLatexBody(raw: string): string {
  let t = raw;

  t = t.replace(/\\text\{([^{}]*)\}/g, '$1');
  t = t.replace(/\\mathrm\{([^{}]*)\}/g, '$1');
  t = t.replace(/\\mathbf\{([^{}]*)\}/g, '$1');
  t = t.replace(/\\textit\{([^{}]*)\}/g, '$1');
  t = t.replace(/\\textbf\{([^{}]*)\}/g, '$1');
  t = t.replace(/\\operatorname\{([^{}]*)\}/g, '$1');

  t = t.replace(/\\approx\b/g, '≈');
  t = t.replace(/\\sim\b/g, '∼');
  t = t.replace(/\\leq\b/g, '≤');
  t = t.replace(/\\geq\b/g, '≥');
  t = t.replace(/\\neq\b/g, '≠');
  t = t.replace(/\\times\b/g, '×');
  t = t.replace(/\\cdot\b/g, '·');
  t = t.replace(/\\pm\b/g, '±');
  t = t.replace(/\\mp\b/g, '∓');
  t = t.replace(/\\infty\b/g, '∞');
  t = t.replace(/\\degree\b/g, '°');
  t = t.replace(/\\%/g, '%');
  t = t.replace(/\\,/g, ' ');
  t = t.replace(/\\;/g, ' ');
  t = t.replace(/\\quad\b/g, ' ');
  t = t.replace(/\\qquad\b/g, '  ');

  // Greek letters (common ones)
  const greek: Record<string, string> = {
    alpha: 'α',
    beta: 'β',
    gamma: 'γ',
    delta: 'δ',
    epsilon: 'ε',
    theta: 'θ',
    lambda: 'λ',
    mu: 'μ',
    pi: 'π',
    sigma: 'σ',
    tau: 'τ',
    phi: 'φ',
    omega: 'ω',
    Delta: 'Δ',
    Sigma: 'Σ',
    Omega: 'Ω',
  };
  for (const [name, ch] of Object.entries(greek)) {
    t = t.replace(new RegExp(`\\\\${name}\\b`, 'g'), ch);
  }

  t = t.replace(/\\frac\{([^{}]*)\}\{([^{}]*)\}/g, '($1/$2)');
  t = t.replace(/\\sqrt\{([^{}]*)\}/g, '√($1)');

  // Subscripts / superscripts
  t = t.replace(/_\{([^{}]*)\}/g, '_$1');
  t = t.replace(/\^\{([^{}]*)\}/g, '^$1');
  t = t.replace(/_([A-Za-z0-9]+)/g, '_$1');
  t = t.replace(/\^([A-Za-z0-9]+)/g, '^$1');

  // Drop remaining commands
  t = t.replace(/\\[a-zA-Z]+\*?/g, '');
  t = t.replace(/[{}]/g, '');
  t = t.replace(/\s+/g, ' ').trim();

  return t;
}

/** Prepare model text for on-screen reading (does not alter copy/export source). */
export function prepareDisplayText(input: string): string {
  return latexToReadable(input);
}

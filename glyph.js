

function scoreAxis(text, axis) {
  const lower = text.toLowerCase();
  let score = 0;
  const matched = [];
  for (const kw of KW[axis].pos)  { if (lower.includes(kw)) { score += 1; matched.push(kw); } }
  for (const kw of KW[axis].neg)  { if (lower.includes(kw)) { score -= 1; matched.push(kw); } }
  for (const kw of KW[axis].rage) { if (new RegExp(kw,'i').test(lower)) { score -= 2; matched.push(kw); } }
  return { score: Math.max(-2, Math.min(2, score)), matched };
}

function hasMatch(text) {
  const lower = text.toLowerCase();
  return ['expect','price','service','hunger','value'].some(ax =>
    [...KW[ax].pos, ...KW[ax].neg].some(kw => lower.includes(kw)) ||
    KW[ax].rage.some(kw => new RegExp(kw,'i').test(lower))
  );
}

// ── GLYPH ────────────────────────────────────────────────────────
const pick = a => a[Math.floor(Math.random() * a.length)];

const eyeMap   = v => v>=2?pick(['ㅎ','ㅍ','ㅊ']):v===1?pick(['ㅇ','ㅂ']):v===0?pick(['ㅁ','ㄷ']):v===-1?pick(['ㅜ','ㄴ']):pick(['ㅠ','ㄲ']);
const mouthMap = v => v>=2?pick(['ᴗ','ㅅ','ω']):v===1?pick(['ᵕ','꒳']):v===0?pick(['ㅡ','─']):v===-1?pick(['ㅗ','︵']):pick(['ㄷ','□']);
const armsMap  = v => v>=2?{l:'ﾉ',r:'ﾉ'}:v===1?{l:'／',r:'＼'}:v===0?{l:'乁',r:'ㄏ'}:v===-1?{l:'╮',r:'╭'}:{l:'凸',r:'凸'};
const decoMap  = v => v>=2?'◆':v===1?'▪':v===0?'':v===-1?'╌':'░';

function buildGlyph(e,p,s,h) {
  const E=eyeMap(e), M=mouthMap(p), A=armsMap(s), D=decoMap(h);
  return (e+p+s+h)>=6 ? `(${A.l}${E}${M}${E})${A.r}${D}` : `${A.l}(${E}${M}${E})${A.r}${D}`;
}

function emotionLabel(e,p,s,h) {
  const t=e+p+s+h;
  if(t>=7)  return 'overwhelming ecstasy';
  if(t>=5)  return 'moved';
  if(t>=3)  return 'joyful satisfaction';
  if(t>=1)  return 'contentment';
  if(t===0) return 'ambivalence';
  if(t>=-2) return 'cynicism';
  if(t>=-4) return 'disappointment';
  if(t>=-6) return 'anger';
  return 'rage';
}

// ── SENTENCE SPLIT ───────────────────────────────────────────────
function splitSentences(text) {
  // Split on sentence endings OR newlines OR semicolons
  const parts = text.split(/(?<=[.!?])\s+|\n+|(?<=;)\s+/);
  const result = [];
  parts.forEach(s => {
    s = s.trim();
    if (s.length <= 6) return;
    // If a chunk is very long (>120 chars) and has commas, split further at comma+conjunction
    if (s.length > 120) {
      const sub = s.split(/,\s*(?=but\s|and\s|however\s|though\s|although\s|yet\s)/i);
      sub.forEach(t => { if (t.trim().length > 6) result.push(t.trim()); });
    } else {
      result.push(s);
    }
  });
  // If nothing came out of split, just use whole text
  return result.length ? result : [text.trim()];
}

// ── TYPE ANIM ────────────────────────────────────────────────────

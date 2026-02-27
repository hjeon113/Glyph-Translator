// ── TYPE ANIMATION ───────────────────────────────────────────────
let timers = [];

function clearTimers() {
  timers.forEach(clearTimeout);
  timers = [];
}

function typeInto(container, str) {
  const cur = container.querySelector(".cursor");
  [...str].forEach((ch, i) => {
    const t = setTimeout(() => {
      const span = document.createElement("span");
      span.className = "char";
      span.textContent = ch;
      container.insertBefore(span, cur);
      requestAnimationFrame(() =>
        requestAnimationFrame(() => span.classList.add("on")),
      );
      if (i === str.length - 1) {
        const t2 = setTimeout(() => cur.classList.add("done"), 200);
        timers.push(t2);
      }
    }, i * 50);
    timers.push(t);
  });
}

// ── RENDER ───────────────────────────────────────────────────────
// Split text into sentences and score each separately
let currentResults = [];

function render(text) {
  clearTimers();
  const panel = document.getElementById("outputPanel");
  panel.innerHTML = "";
  currentResults = [];

  if (!text.trim()) {
    panel.innerHTML = "";
    updateSubmit();
    return;
  }

  // Split into sentences
  const sentences = splitSentences(text);

  // Filter sentences that have keywords and score them
  sentences.forEach((sentence, idx) => {
    const lower = sentence.toLowerCase();

    // Score all 5 axes
    const axes = ["expect", "price", "service", "hunger", "value"].map((ax) =>
      scoreAxis(lower, ax),
    );
    const [eR, pR, sR, hR, vR] = axes;

    // Merge value into expectation
    const eScore = Math.max(-2, Math.min(2, eR.score + vR.score));
    const total = eScore + pR.score + sR.score + hR.score;

    // Skip if no keywords detected
    if (
      total === 0 &&
      eR.matched.length === 0 &&
      pR.matched.length === 0 &&
      sR.matched.length === 0 &&
      hR.matched.length === 0 &&
      vR.matched.length === 0
    ) {
      return;
    }

    const glyph = buildGlyph(eScore, pR.score, sR.score, hR.score);
    const label = emotionLabel(eScore, pR.score, sR.score, hR.score);
    const pips = [eScore, pR.score, sR.score, hR.score]
      .map(
        (v) =>
          `<div class="pip ${v >= 1 ? "pip-h" : v === 0 ? "pip-m" : "pip-l"}"></div>`,
      )
      .join("");

    currentResults.push({ glyph, label, sentence: sentence.trim() });

    const block = document.createElement("div");
    block.className = "out-block";
    block.innerHTML = `
      <div class="out-glyph" id="og-${idx}"><span class="cursor"></span></div>
      <div class="out-meta">
        <span class="out-emotion">${label}</span>
        <div class="out-pips">${pips}</div>
      </div>
      <div class="out-src">${sentence}</div>
    `;
    panel.appendChild(block);

    const gt = document.getElementById(`og-${idx}`);
    const delay = idx * 100; // stagger animation
    const t = setTimeout(() => typeInto(gt, glyph), delay);
    timers.push(t);
  });

  // Show message if no sentences had keywords
  if (currentResults.length === 0) {
    panel.innerHTML = '<span class="out-empty">no keyword detected</span>';
  }

  updateSubmit();
}

// ── ARCHIVE ──────────────────────────────────────────────────────
let archiveCount = 0;

function randomPos() {
  const W = window.innerWidth;
  const H = window.innerHeight;
  const cx = W / 2;
  const cy = H / 2;
  const cw = 760;
  const ch = 420;
  const pad = 20;

  const zones = [
    () => ({
      x: Math.random() * (W - 200),
      y: Math.random() * Math.max(10, cy - ch / 2 - pad - 120),
    }),
    () => ({
      x: Math.random() * (W - 200),
      y:
        cy +
        ch / 2 +
        pad +
        Math.random() * Math.max(10, H - cy - ch / 2 - pad - 120),
    }),
    () => ({
      x: Math.random() * Math.max(10, cx - cw / 2 - pad - 180),
      y: Math.random() * (H - 120),
    }),
    () => ({
      x:
        cx +
        cw / 2 +
        pad +
        Math.random() * Math.max(10, W - cx - cw / 2 - pad - 180),
      y: Math.random() * (H - 120),
    }),
  ];

  const valid = zones.filter((_, i) => {
    if (i === 0) return cy - ch / 2 - pad > 130;
    if (i === 1) return H - (cy + ch / 2 + pad) > 130;
    if (i === 2) return cx - cw / 2 - pad > 190;
    if (i === 3) return W - (cx + cw / 2 + pad) > 190;
  });

  const fn = valid.length
    ? valid[Math.floor(Math.random() * valid.length)]
    : zones[0];
  return fn();
}

function addPostit(name, glyph, label) {
  const pos = randomPos();
  const rot = (Math.random() - 0.5) * 10;

  const el = document.createElement("div");
  el.className = "postit";
  el.style.left = `${Math.max(8, Math.min(window.innerWidth - 198, pos.x))}px`;
  el.style.top = `${Math.max(8, Math.min(window.innerHeight - 140, pos.y))}px`;
  el.style.setProperty("--rot", `${rot}deg`);
  el.innerHTML = `
    <div class="postit-name">${name || "anonymous"}</div>
    <div class="postit-glyph">${glyph}</div>
    <div class="postit-emotion">${label}</div>
  `;
  document.getElementById("archive").appendChild(el);

  archiveCount++;
}

function updateSubmit() {
  document.getElementById("submitBtn").disabled = currentResults.length === 0;
}

// ── EVENTS ───────────────────────────────────────────────────────
const reviewInput = document.getElementById("reviewInput");
const nameInput = document.getElementById("nameInput");
const clearBtn = document.getElementById("clearBtn");
const submitBtn = document.getElementById("submitBtn");

let debounce = null;
reviewInput.addEventListener("input", () => {
  clearTimeout(debounce);
  debounce = setTimeout(() => render(reviewInput.value), 450);
});

clearBtn.addEventListener("click", () => {
  reviewInput.value = "";
  render("");
});

submitBtn.addEventListener("click", () => {
  if (!currentResults.length) return;
  const name = nameInput.value.trim() || "anonymous";

  // Combine all glyphs into one postit
  const combinedGlyph = currentResults.map((r) => r.glyph).join(" ");
  const labels = currentResults.map((r) => r.label);

  // Use the most extreme emotion label
  const emotionPriority = [
    "rage",
    "anger",
    "disappointment",
    "cynicism",
    "ambivalence",
    "contentment",
    "joyful satisfaction",
    "moved",
    "overwhelming ecstasy",
  ];
  const dominantLabel =
    emotionPriority.reverse().find((label) => labels.includes(label)) ||
    labels[0];

  addPostit(name, combinedGlyph, dominantLabel);

  reviewInput.value = "";
  nameInput.value = "";
  render("");
});

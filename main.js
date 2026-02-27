// ── TYPE ANIMATION ───────────────────────────────────────────────
let timers = [];

function clearTimers() { 
  timers.forEach(clearTimeout); 
  timers = []; 
}

function typeInto(container, str) {
  const cur = container.querySelector('.cursor');
  [...str].forEach((ch, i) => {
    const t = setTimeout(() => {
      const span = document.createElement('span');
      span.className = 'char'; 
      span.textContent = ch;
      container.insertBefore(span, cur);
      requestAnimationFrame(() => requestAnimationFrame(() => span.classList.add('on')));
      if (i === str.length - 1) {
        const t2 = setTimeout(() => cur.classList.add('done'), 200);
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
  const panel = document.getElementById('outputPanel');
  panel.innerHTML = '';
  currentResults = [];

  if (!text.trim()) {
    panel.innerHTML = '';
    updateSubmit(); 
    return;
  }

  // Split into sentences
  const sentences = splitSentences(text);
  
  // Filter sentences that have keywords and score them
  sentences.forEach((sentence, idx) => {
    const lower = sentence.toLowerCase();
    
    // Score all 5 axes
    const axes = ['expect','price','service','hunger','value'].map(ax => scoreAxis(lower, ax));
    const [eR, pR, sR, hR, vR] = axes;
    
    // Merge value into expectation
    const eScore = Math.max(-2, Math.min(2, eR.score + vR.score));
    const total = eScore + pR.score + sR.score + hR.score;
    
    // Skip if no keywords detected
    if (total === 0 && eR.matched.length === 0 && pR.matched.length === 0 &&
        sR.matched.length === 0 && hR.matched.length === 0 && vR.matched.length === 0) {
      return;
    }
    
    const glyph = buildGlyph(eScore, pR.score, sR.score, hR.score);
    const label = emotionLabel(eScore, pR.score, sR.score, hR.score);
    const pips = [eScore, pR.score, sR.score, hR.score].map(v =>
      `<div class="pip ${v >= 1 ? 'pip-h' : v === 0 ? 'pip-m' : 'pip-l'}"></div>`).join('');
    
    currentResults.push({ glyph, label, sentence: sentence.trim() });
    
    const block = document.createElement('div');
    block.className = 'out-block';
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
  const ch = 500;
  const pad = 40;
  const postitW = 190;
  const postitH = 140;

  // Define 4 zones around the card
  const zones = [];
  
  // Top zone
  if (cy - ch / 2 - pad > postitH + 20) {
    zones.push(() => ({
      x: Math.random() * (W - postitW - 20) + 10,
      y: Math.random() * (cy - ch / 2 - pad - postitH) + 10
    }));
  }
  
  // Bottom zone
  if (H - (cy + ch / 2 + pad) > postitH + 20) {
    zones.push(() => ({
      x: Math.random() * (W - postitW - 20) + 10,
      y: cy + ch / 2 + pad + Math.random() * (H - cy - ch / 2 - pad - postitH - 20)
    }));
  }
  
  // Left zone
  if (cx - cw / 2 - pad > postitW + 20) {
    zones.push(() => ({
      x: Math.random() * (cx - cw / 2 - pad - postitW - 20) + 10,
      y: Math.random() * (H - postitH - 20) + 10
    }));
  }
  
  // Right zone
  if (W - (cx + cw / 2 + pad) > postitW + 20) {
    zones.push(() => ({
      x: cx + cw / 2 + pad + Math.random() * (W - cx - cw / 2 - pad - postitW - 20),
      y: Math.random() * (H - postitH - 20) + 10
    }));
  }

  // If no valid zones, place anywhere on screen
  if (zones.length === 0) {
    return {
      x: Math.random() * (W - postitW - 20) + 10,
      y: Math.random() * (H - postitH - 20) + 10
    };
  }

  const fn = zones[Math.floor(Math.random() * zones.length)];
  return fn();
}

function addPostit(name, glyph, label) {
  const pos = randomPos();
  const rot = (Math.random() - 0.5) * 10;
  const postitW = 190;
  const postitH = 140;

  const el = document.createElement('div');
  el.className = 'postit';
  
  // Ensure postit stays within viewport bounds
  const safeX = Math.max(10, Math.min(window.innerWidth - postitW - 10, pos.x));
  const safeY = Math.max(10, Math.min(window.innerHeight - postitH - 10, pos.y));
  
  el.style.left = `${safeX}px`;
  el.style.top = `${safeY}px`;
  el.style.setProperty('--rot', `${rot}deg`);
  el.innerHTML = `
    <div class="postit-name">${name || 'anonymous'}</div>
    <div class="postit-glyph">${glyph}</div>
    <div class="postit-emotion">${label}</div>
  `;
  
  // Make postit draggable
  makeDraggable(el);
  
  document.getElementById('archive').appendChild(el);

  archiveCount++;
}

// Draggable functionality
function makeDraggable(element) {
  let isDragging = false;
  let offsetX = 0;
  let offsetY = 0;

  element.addEventListener('mousedown', dragStart);
  element.addEventListener('touchstart', dragStart, { passive: false });

  function dragStart(e) {
    isDragging = true;
    element.style.cursor = 'grabbing';
    element.style.zIndex = 1000;

    const rect = element.getBoundingClientRect();
    
    if (e.type === 'touchstart') {
      offsetX = e.touches[0].clientX - rect.left;
      offsetY = e.touches[0].clientY - rect.top;
    } else {
      offsetX = e.clientX - rect.left;
      offsetY = e.clientY - rect.top;
    }

    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', dragEnd);
    document.addEventListener('touchmove', drag, { passive: false });
    document.addEventListener('touchend', dragEnd);

    e.preventDefault();
  }

  function drag(e) {
    if (!isDragging) return;
    e.preventDefault();

    let clientX, clientY;
    
    if (e.type === 'touchmove') {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    let newX = clientX - offsetX;
    let newY = clientY - offsetY;

    // Boundary check
    const rect = element.getBoundingClientRect();
    const maxX = window.innerWidth - rect.width;
    const maxY = window.innerHeight - rect.height;
    
    newX = Math.max(10, Math.min(maxX - 10, newX));
    newY = Math.max(10, Math.min(maxY - 10, newY));

    element.style.left = `${newX}px`;
    element.style.top = `${newY}px`;
  }

  function dragEnd() {
    if (!isDragging) return;
    
    isDragging = false;
    element.style.cursor = 'grab';
    element.style.zIndex = 'auto';

    document.removeEventListener('mousemove', drag);
    document.removeEventListener('mouseup', dragEnd);
    document.removeEventListener('touchmove', drag);
    document.removeEventListener('touchend', dragEnd);
  }
}

function updateSubmit() {
  document.getElementById('submitBtn').disabled = currentResults.length === 0;
}

// ── EVENTS ───────────────────────────────────────────────────────
const reviewInput = document.getElementById('reviewInput');
const nameInput = document.getElementById('nameInput');
const clearBtn = document.getElementById('clearBtn');
const submitBtn = document.getElementById('submitBtn');

let debounce = null;
reviewInput.addEventListener('input', () => {
  clearTimeout(debounce);
  debounce = setTimeout(() => render(reviewInput.value), 450);
});

clearBtn.addEventListener('click', () => {
  reviewInput.value = '';
  render('');
});

submitBtn.addEventListener('click', () => {
  if (!currentResults.length) return;
  const name = nameInput.value.trim() || 'anonymous';
  
  // Combine all glyphs into one postit
  const combinedGlyph = currentResults.map(r => r.glyph).join(' ');
  const labels = currentResults.map(r => r.label);
  
  // Use the most extreme emotion label (prioritize negative emotions)
  const emotionPriority = [
    'overwhelming ecstasy', 'moved', 'joyful satisfaction',
    'contentment', 'ambivalence', 'cynicism', 
    'disappointment', 'anger', 'rage'
  ];
  const dominantLabel = emotionPriority.reverse().find(label => labels.includes(label)) || labels[0];
  
  addPostit(name, combinedGlyph, dominantLabel);
  
  reviewInput.value = '';
  nameInput.value = '';
  render('');
});

const ADDRESS = "0x59430f1ba747b41e582403f2e3102bc89645f964";

const STEPS = [
  {
    kicker: "After this step",
    rows: [
      ["Signature", "kept in this browser"],
      ["Spending key", "derived locally"],
      ["Viewing key", "derived locally"],
      ["Sent to the chain", "nothing"],
    ],
    note: "First time only: one small transaction registers your public key, so others can pay you privately.",
  },
  {
    kicker: "Proof",
    rows: [
      ["Proof", "0x…"],
      ["Written by", "your device"],
      ["Notes and keys sent", "none"],
      ["Amount visible to", "you"],
    ],
  },
  {
    kicker: "Transaction",
    rows: [
      ["Sent by", "a bundler"],
      ["Gas from your address", "0 ETH"],
      ["Network fee", "paid in ZERO, from notes"],
      ["Your address", ""],
    ],
  },
  {
    kicker: "Stored on-chain",
    rows: [
      ["Nullifier", "0x…"],
      ["Commitment", "0x…"],
      ["Encrypted note", "0x…"],
      ["Amount", ""],
      ["Sender", ""],
      ["Recipient", ""],
    ],
  },
  {
    kicker: "What your friend sees",
    rows: [
      ["Received", "+1,500.00 ZERO"],
      ["From", "a private sender"],
      ["Status", "spendable"],
    ],
  },
];

function toast(message) {
  let el = document.querySelector(".toast");
  if (!el) {
    el = document.createElement("div");
    el.className = "toast";
    document.body.appendChild(el);
  }
  el.textContent = message;
  el.classList.add("show");
  clearTimeout(toast._t);
  toast._t = setTimeout(() => el.classList.remove("show"), 1600);
}

function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function drawField(canvas, mode) {
  const rect = canvas.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.max(1, Math.floor(rect.width * dpr));
  canvas.height = Math.max(1, Math.floor(rect.height * dpr));
  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, rect.width, rect.height);

  const rand = mulberry32(mode === "zero" ? 42 : 77);
  const count = Math.round((rect.width * rect.height) / 4200);
  const dots = [];
  for (let i = 0; i < count; i++) {
    dots.push({
      x: 36 + rand() * (rect.width - 72),
      y: 36 + rand() * (rect.height - 72),
      r: 3.1 + rand() * 1.3,
    });
  }
  const mine = dots[Math.floor(dots.length * 0.72)] || dots[0];
  const decoy = dots[Math.floor(dots.length * 0.18)] || dots[1];

  if (mode === "normal" && mine) {
    const linked = dots
      .map((d, i) => ({ d, i, dist: Math.hypot(d.x - mine.x, d.y - mine.y) }))
      .filter((item) => item.i !== dots.indexOf(mine))
      .sort((a, b) => a.dist - b.dist)
      .slice(0, 7);
    ctx.strokeStyle = "rgba(40, 42, 48, 0.28)";
    ctx.lineWidth = 1;
    linked.forEach((item) => {
      ctx.beginPath();
      ctx.moveTo(mine.x, mine.y);
      ctx.lineTo(item.d.x, item.d.y);
      ctx.stroke();
    });
  }

  dots.forEach((d) => {
    ctx.beginPath();
    ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
    ctx.fillStyle = "#b9bcc2";
    ctx.fill();
  });

  if (mode === "zero") {
    if (decoy) {
      ctx.beginPath();
      ctx.arc(decoy.x, decoy.y, 11, 0, Math.PI * 2);
      ctx.strokeStyle = "#d5d6da";
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
    if (mine) {
      ctx.beginPath();
      ctx.arc(mine.x, mine.y, 13, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(200, 245, 66, 0.28)";
      ctx.fill();
      ctx.beginPath();
      ctx.arc(mine.x, mine.y, 5.5, 0, Math.PI * 2);
      ctx.fillStyle = "#c8f542";
      ctx.fill();
    }
  } else if (mine) {
    ctx.beginPath();
    ctx.arc(mine.x, mine.y, 6.5, 0, Math.PI * 2);
    ctx.fillStyle = "#222328";
    ctx.fill();
  }
}

function drawMark(canvas) {
  const size = 220;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = size * dpr;
  canvas.height = size * dpr;
  canvas.style.width = size + "px";
  canvas.style.height = size + "px";
  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const cols = 11;
  const rows = 13;
  const gap = 15.2;
  const ox = (size - (cols - 1) * gap) / 2;
  const oy = (size - (rows - 1) * gap) / 2;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = (c / (cols - 1)) * 2 - 1;
      const y = (r / (rows - 1)) * 2 - 1;
      const d = Math.hypot(x * 0.92, y * 1.05);
      const ring = d > 0.46 && d < 0.78;
      const slash = Math.abs(x * 0.85 - y) < 0.16 && d < 0.95 && d > 0.12;
      ctx.beginPath();
      ctx.arc(ox + c * gap, oy + r * gap, 4.3, 0, Math.PI * 2);
      ctx.fillStyle = ring || slash ? "#c8f542" : "#2a2c32";
      ctx.fill();
    }
  }
}

function setMode(mode) {
  const stage = document.querySelector("[data-stage]");
  if (!stage) return;
  stage.classList.toggle("is-normal", mode === "normal");
  stage.querySelector(".stage-track").classList.toggle("is-normal", mode === "normal");
  stage.querySelectorAll(".seg button").forEach((btn) => {
    btn.setAttribute("aria-pressed", String(btn.dataset.mode === mode));
  });
  const copy = stage.querySelector(".stage-copy");
  copy.textContent =
    mode === "zero"
      ? "ZERO. The chain stores commitments and ciphertext, all alike. One of these notes is yours; only you can tell which."
      : "A normal token. Every balance and payment is a public record, and one labelled address ties the rest to you.";
}

function renderReceipt(index) {
  const paper = document.querySelector("[data-receipt]");
  if (!paper) return;
  const step = STEPS[index];
  const rows = step.rows
    .map(([k, v]) => {
      const value = v || "—";
      const hidden = v ? "" : " hidden-row";
      return `<div class="paper-row${hidden}"><dt>${k}</dt><dd>${value}</dd></div>`;
    })
    .join("");
  paper.innerHTML = `
    <div class="paper-head"><span>Example payment · 1,500 ZERO</span><span>0${index + 1}/05</span></div>
    <p class="paper-kicker">${step.kicker.toUpperCase()}</p>
    <dl>${rows}</dl>
    ${step.note ? `<p class="paper-note">${step.note}</p>` : ""}
  `;
  document.querySelectorAll("[data-step]").forEach((el) => {
    el.classList.toggle("active", Number(el.dataset.step) === index);
  });
  document.querySelectorAll(".stepper button").forEach((btn, i) => {
    btn.classList.toggle("active", i === index);
  });
}

function setupHow() {
  const how = document.querySelector("#how");
  if (!how) return;
  let current = 0;
  renderReceipt(0);

  const pick = (index) => {
    current = index;
    renderReceipt(index);
  };

  document.querySelectorAll(".stepper button").forEach((btn, i) => {
    btn.addEventListener("click", () => {
      pick(i);
      if (!window.matchMedia("(min-width: 1101px)").matches) return;
      const total = how.offsetHeight - window.innerHeight;
      const y = how.offsetTop + (total * (i + 0.45)) / STEPS.length;
      window.scrollTo({ top: y, behavior: "smooth" });
    });
  });

  const onScroll = () => {
    if (!window.matchMedia("(min-width: 1101px)").matches) return;
    const total = how.offsetHeight - window.innerHeight;
    const passed = Math.min(Math.max(-how.getBoundingClientRect().top, 0), total);
    const index = Math.min(STEPS.length - 1, Math.floor((passed / total) * STEPS.length));
    if (index !== current) pick(index);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
}

function setupNav() {
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector(".nav");
  if (!toggle || !nav) return;
  toggle.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(open));
  });
  nav.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => nav.classList.remove("open")));

  const links = [...nav.querySelectorAll("a[href*='#']")];
  const sections = links
    .map((a) => document.querySelector(a.getAttribute("href").replace(/^.*#/, "#")))
    .filter(Boolean);
  if (!sections.length) return;
  const spy = () => {
    let current = null;
    sections.forEach((section) => {
      if (section.getBoundingClientRect().top < 160) current = section;
    });
    links.forEach((a) => {
      const id = a.getAttribute("href").split("#")[1];
      a.classList.toggle("active", current && current.id === id);
    });
  };
  window.addEventListener("scroll", spy, { passive: true });
  spy();
}

function setupCopy() {
  document.querySelectorAll("[data-copy]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(ADDRESS);
        toast("Address copied");
      } catch {
        toast(ADDRESS);
      }
    });
  });
}

function setupCanvases() {
  document.querySelectorAll("canvas[data-field]").forEach((canvas) => {
    const paint = () => drawField(canvas, canvas.dataset.field);
    paint();
    const ro = new ResizeObserver(paint);
    ro.observe(canvas);
  });
  document.querySelectorAll("canvas[data-mark]").forEach(drawMark);
}

function setupStage() {
  const stage = document.querySelector("[data-stage]");
  if (!stage) return;
  stage.querySelectorAll(".seg button").forEach((btn) => {
    btn.addEventListener("click", () => setMode(btn.dataset.mode));
  });
}

function setupVerify() {
  const form = document.querySelector("[data-verify]");
  if (!form) return;
  const error = form.querySelector(".form-error");
  const result = document.querySelector("[data-verify-result]");
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const value = form.querySelector("textarea").value.trim();
    if (!value) {
      error.textContent = "Paste a proof of payment first.";
      result.hidden = true;
      return;
    }
    error.textContent = "";
    result.hidden = false;
    result.querySelector("[data-proof-state]").textContent =
      "This preview shows the sample payment. A live proof is checked against the vault on zerotrace.so.";
  });
}

function setupWallet() {
  const root = document.querySelector("[data-wallet]");
  if (!root) return;
  const status = root.querySelector(".status-line");
  root.querySelectorAll("[data-connect]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      if (!window.ethereum) {
        status.textContent = "No browser wallet found. Install MetaMask, then return to this page.";
        return;
      }
      try {
        const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
        const account = accounts && accounts[0];
        status.textContent = account
          ? `Connected ${account.slice(0, 6)}…${account.slice(-4)}. Signing in and shielding happen in the live app.`
          : "The wallet did not return an account.";
      } catch (err) {
        status.textContent = err && err.message ? err.message : "The wallet request was dismissed.";
      }
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  setupNav();
  setupCopy();
  setupCanvases();
  setupStage();
  setupHow();
  setupVerify();
  setupWallet();
});

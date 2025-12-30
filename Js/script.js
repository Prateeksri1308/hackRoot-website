// FULL UPDATED front-end JS with OPTIMISTIC POPUP
// Paste into Js/script.js (replace existing)

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("joinForm");
const ENDPOINT = form.getAttribute("action");

  let ticking = false;


window.addEventListener("scroll", () => {
  if (ticking) return;

  ticking = true;
  requestAnimationFrame(() => {
    header.classList.toggle("scrolled", window.scrollY > 20);
    updateActiveNav?.();
    updateTimelineProgress?.();
    ticking = false;
  });
});

// ⏱️ Anti-bot timing stamp
const tsField = document.getElementById("form_ts");
if (tsField) {
  tsField.value = Date.now() / 1000; // seconds
}
  // core nodes
  const submitBtn = form?.querySelector(".submit-btn");
  const statusMsg =
    form?.querySelector(".status-msg") ||
    (function () {
      const el = document.createElement("div");
      el.className = "status-msg";
      form.appendChild(el);
      return el;
    })();
  const successModal = document.getElementById("successModal");
  const closeSuccess = document.getElementById("closeSuccess");
  const successTitle = successModal?.querySelector("h3");
  const successBody = successModal?.querySelector("p");

  const phoneInput = form?.querySelector('input[name="phone"]') || null;
  const emailInput = form?.querySelector('input[name="email"]') || null;
  const nameInput = form?.querySelector('input[name="name"]') || null;
  const messageInput = form?.querySelector('textarea[name="message"]') || null;

  // 🔁 Show captcha again when user starts typing
function showCaptchaIfHidden() {
  const captchaWrap = document.getElementById("captchaWrap");
  if (captchaWrap && captchaWrap.style.display === "none") {
    captchaWrap.style.display = "";
  }
}

// show captcha when user starts typing again
[nameInput, emailInput, phoneInput, messageInput].forEach(el => {
  el?.addEventListener("input", showCaptchaIfHidden);
});

  /* ================= LOTTIE ================= */
  let lottieAvailable = false;
  let lottieAnim = null;

  (function loadLottie() {
    const LOTTIE_CDN =
      "https://cdnjs.cloudflare.com/ajax/libs/lottie-web/5.9.6/lottie.min.js";

    function scriptLoaded() {
      try {
        if (!window.lottie) {
          lottieAvailable = false;
          return;
        }
        const container = document.getElementById("lottieContainer");
        if (!container) {
          lottieAvailable = false;
          return;
        }

        lottieAnim = window.lottie.loadAnimation({
          container,
          renderer: "svg",
          loop: false,
          autoplay: false,
          path: "Assets/Success.json",
          rendererSettings: { progressiveLoad: true },
        });

        lottieAnim.setSpeed(1.8);
        lottieAvailable = true;
      } catch (err) {
        lottieAvailable = false;
      }
    }

    if (window.lottie) {
      scriptLoaded();
      return;
    }

    const s = document.createElement("script");
    s.src = LOTTIE_CDN;
    s.async = true;
    s.onload = scriptLoaded;
    s.onerror = () => (lottieAvailable = false);
    document.head.appendChild(s);
  })();

  /* ================= GIF POPUP ================= */
  const gifPopup = document.getElementById("gifPopup");
  const gifPanel = document.getElementById("gifPanel");
  const gifImg = gifPopup?.querySelector(".gif-tick") || null;
  const gifTitle = document.getElementById("gifTitle");
  const gifMessage = document.getElementById("gifMessage");
  let gifAutoCloseTimer = null;

  const RELATIVE_GIF = "Assets/Success.gif";
  const GIF_URL = new URL(RELATIVE_GIF, location.href).href;
  const GIF_BASE = GIF_URL.split("?")[0];

  (function verifyGif() {
    if (!gifImg) return;
    gifImg.src = GIF_BASE;
    fetch(GIF_BASE, { method: "HEAD" }).catch(() => {});
  })();

  function showGifSuccess(
    title = "Message Sent!",
    msg = "We'll get back to you soon."
  ) {
    if (!gifPopup) return;

    if (gifTitle) gifTitle.textContent = title;
    if (gifMessage) gifMessage.textContent = msg;

    if (gifImg) {
      gifImg.src = "";
      setTimeout(() => {
        gifImg.src = GIF_BASE + "?t=" + Date.now();
      }, 25);
    }

    gifPopup.classList.add("show");
    gifPopup.setAttribute("aria-hidden", "false");

    clearTimeout(gifAutoCloseTimer);
    gifAutoCloseTimer = setTimeout(hideGifSuccess, 5000);
  }

  function hideGifSuccess() {
    if (!gifPopup) return;
    gifPopup.classList.remove("show");
    gifPopup.setAttribute("aria-hidden", "true");
    clearTimeout(gifAutoCloseTimer);
  }

  gifPanel?.addEventListener("click", hideGifSuccess);
  gifPopup?.addEventListener("click", (ev) => {
    if (ev.target === gifPopup) hideGifSuccess();
  });

  /* ================= CSS FALLBACK POPUP ================= */
  function showFastSuccess() {
    const popup = document.getElementById("fastSuccess");
    if (!popup) {
      statusMsg.textContent = "Thanks — message received";
      setTimeout(() => (statusMsg.textContent = ""), 1800);
      return;
    }
    popup.classList.add("show");
    clearTimeout(popup._autoHide);
    popup._autoHide = setTimeout(() => popup.classList.remove("show"), 1500);
  }

  /* ================= LOTTIE POPUP ================= */
  function showLottieSuccess(
    title = "Thanks — message received",
    body = "We'll get back to you soon."
  ) {
    const popup = document.getElementById("successPopup");
    const panel = document.getElementById("successPanel");
    const lottieContainer = document.getElementById("lottieContainer");
    const successTitleEl = document.getElementById("successTitle");
    const successMsgEl = document.getElementById("successMessage");

    if (!popup || !lottieContainer || !lottieAnim) {
      if (gifPopup) return showGifSuccess(title, body);
      return showFastSuccess();
    }

    successTitleEl.textContent = title;
    successMsgEl.textContent = body;

    popup.classList.add("show");
    popup.setAttribute("aria-hidden", "false");
    panel?.focus?.();

    try {
      lottieAnim.stop();
      setTimeout(() => lottieAnim.goToAndPlay(0, true), 40);
    } catch {}

    setTimeout(() => {
      popup.classList.remove("show");
      popup.setAttribute("aria-hidden", "true");
      try {
        lottieAnim.stop();
      } catch {}
    }, 1400);
  }

  window.showTickPopup = function (title, body) {
    if (lottieAvailable) showLottieSuccess(title, body);
    else if (gifPopup) showGifSuccess(title, body);
    else showFastSuccess();
  };

  /* ================= VALIDATION ================= */
  function markInvalid(input) {
    if (!input) return;
    input.classList.add("invalid");
    input.parentElement?.classList.add("shake");
    setTimeout(() => input.parentElement?.classList.remove("shake"), 400);
    setTimeout(() => input.classList.remove("invalid"), 1500);
  }

  function clearInvalidAll() {
    [nameInput, emailInput, phoneInput, messageInput].forEach((inp) => {
      inp?.classList.remove("invalid");
      inp?.parentElement?.classList.remove("shake");
    });
  }

  phoneInput?.addEventListener("input", (e) => {
    e.target.value = e.target.value.replace(/\D/g, "").slice(0, 10);
  });

  function validateForm() {
    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const phone = phoneInput.value.trim();
    const message = messageInput.value.trim();

    if (!name) return { ok: false, msg: "Name is required.", field: nameInput };
    if (!/^\S+@\S+\.\S+$/.test(email))
      return { ok: false, msg: "Enter valid email.", field: emailInput };
    if (!/^\d{10}$/.test(phone))
      return { ok: false, msg: "Enter valid 10-digit number.", field: phoneInput };
    if (message.length < 5)
      return { ok: false, msg: "Message too short.", field: messageInput };

    return { ok: true };
  }

  /* ================= LOADING ================= */
  function startLoading() {
    submitBtn?.classList.add("loading");
    statusMsg.textContent = "Sending...";
  }
  function stopLoading() {
    submitBtn?.classList.remove("loading");
    setTimeout(() => (statusMsg.textContent = ""), 1200);
  }

  /* ================= FETCH WITH TIMEOUT ================= */
  async function fetchWithTimeout(resource, options = {}, timeout = 15000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(resource, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(id); // 🔴 CRITICAL
    return response;
  } catch (err) {
    clearTimeout(id); // 🔴 CRITICAL
    throw err;
  }
}


  /* ================= SUBMIT HANDLER ================= */
  form?.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearInvalidAll();

  const v = validateForm();
  if (!v.ok) {
    showError(v.msg);
    markInvalid(v.field);
    v.field.focus();
    return;
  }

  // 🔐 CAPTCHA CHECK
  if (typeof grecaptcha !== "undefined") {
    const captchaResponse = grecaptcha.getResponse();
    if (!captchaResponse) {
      showError("Please verify that you are not a robot.");
      return;
    }
  }

  startLoading();

  // sanitize phone
  let digits = phoneInput.value.replace(/\D/g, "");
  if (digits.startsWith("91") && digits.length === 12) digits = digits.slice(2);
  if (digits.startsWith("0") && digits.length === 11) digits = digits.slice(1);
  phoneInput.value = digits;

  const formData = new FormData(form);

  try {
const response = await fetch(ENDPOINT, {
  method: "POST",
  body: formData
});


    let data = null;

// 🔥 RATE LIMIT — FIRST (NO JSON PARSE)
if (response.status === 429) {
  stopLoading();
  showError("Too many attempts. Please wait a minute.");
  return;
}

// ✅ TRY JSON SAFELY
try {
  data = await response.json();
} catch {
  data = {};
}

stopLoading();


// 🛡 BLOCKED (honeypot / timing)
if (data.status === "blocked") {
  return; // silent
}

// ❌ CAPTCHA FAILED
if (data.status === "error" && data.message?.includes("Captcha")) {
  showError("Captcha verification failed. Try again.");
  grecaptcha.reset?.();
  return;
}

// ❌ GENERIC ERROR
if (data.status !== "success") {
  showError("Something went wrong. Please try again.");
  return;
}


    // ✅ SUCCESS
    showTickPopup(
      "Message Sent!",
      "Thanks — we'll get back to you soon."
    );

    resetForm();
// reset captcha token
grecaptcha.reset?.();

// hide captcha after success
const captchaWrap = document.getElementById("captchaWrap");
if (captchaWrap) {
  captchaWrap.style.display = "none";
}
    nameInput?.focus();
    stopLoading();


  } catch (err) {
    stopLoading();
if (err.name === "AbortError") {
    showError("Request timed out. Please try again.");
  } else {
    showError("Something went wrong. Please try again.");
  }  }
});


  /* ================= HELPERS ================= */
  function showError(msg) {
    statusMsg.textContent = msg;
    form.classList.add("shake");
    setTimeout(() => form.classList.remove("shake"), 400);
    setTimeout(() => (statusMsg.textContent = ""), 4200);
  }

 function resetForm() {
  form.reset();

  // reset timestamp (anti-bot)
  const tsField = document.getElementById("form_ts");
  if (tsField) {
    tsField.value = Date.now() / 1000;
  }

  // clear UI states
  submitBtn?.classList.remove("loading");
  form.classList.remove("shake");

  // clear validation styles
  [nameInput, emailInput, phoneInput, messageInput].forEach(el => {
    el?.classList.remove("invalid");
    el?.parentElement?.classList.remove("shake");
    el?.parentElement?.classList.remove("valid");
  });

  // clear status text
  statusMsg.textContent = "";
}


});
// Step-by-step reveal
document.addEventListener("DOMContentLoaded", () => {
  const fields = document.querySelectorAll(".premium-form .field");
  fields.forEach((field, i) => {
    setTimeout(() => field.classList.add("reveal"), 120 * i);
  });
});

// AI typing glow
document.querySelectorAll('.premium-form input, .premium-form textarea')
  .forEach(el => {
    el.addEventListener('input', () => {
      el.classList.add('is-typing');
      clearTimeout(el._typingTimer);
      el._typingTimer = setTimeout(() => {
        el.classList.remove('is-typing');
      }, 600);
    });
  });

  // Inline validation
document.querySelectorAll(".premium-form input, .premium-form textarea")
  .forEach(input => {
    input.addEventListener("blur", () => {
      const field = input.closest(".field");
      field.classList.remove("invalid", "valid");

      if (!input.checkValidity()) {
        field.classList.add("invalid");
      } else {
        field.classList.add("valid");
      }
    });
  });
const badge = document.querySelector(".verified-badge");
document.getElementById("joinForm")
  .addEventListener("input", e => {
    if (e.target.form.checkValidity()) {
      badge.classList.add("show");
    }
  });
// toggle?.addEventListener("click", () => {
//   const open = toggle.getAttribute("aria-expanded") === "true";
//   toggle.setAttribute("aria-expanded", !open);
//   principlesList.classList.toggle("open", !open);

//   if (!open) {
//     setTimeout(() => {
//       document
//         .querySelectorAll(".principles-list li:not(.reveal)")
//         .forEach(li => principleObserver.observe(li));
//     }, 120);
//   }
// });
/* ===============================
   NAVBAR JS (CLEAN & FINAL)
================================ */
/* ===============================
   NAVBAR JS (Font Awesome)
================================ */
const header = document.querySelector(".site-header");
const nav = document.getElementById("mainNav");
const toggle = document.getElementById("navToggle");
const backdrop = document.getElementById("navBackdrop");

/* toggle */
toggle.addEventListener("click", () => {
  const open = nav.classList.toggle("open");
  toggle.classList.toggle("open", open);
  backdrop.classList.toggle("show", open);
  toggle.setAttribute("aria-expanded", open);
});

/* close on backdrop */
backdrop.addEventListener("click", closeNav);

/* close on link */
document.querySelectorAll(".nav-link").forEach(link =>
  link.addEventListener("click", closeNav)
);

function closeNav() {
  nav.classList.remove("open");
  toggle.classList.remove("open");
  backdrop.classList.remove("show");
  toggle.setAttribute("aria-expanded", "false");
}
function lockScroll(lock) {
  document.documentElement.style.overflow = lock ? "hidden" : "auto";
}


toggle.addEventListener("click", () => {
  const open = nav.classList.contains("open");
  lockScroll(open);
});

function closeNav() {
  nav.classList.remove("open");
  toggle.classList.remove("open");
  backdrop.classList.remove("show");
  toggle.setAttribute("aria-expanded", "false");
  lockScroll(false);
}
/* ===============================
   NAV ACTIVE LINK LOGIC (FIXED)
================================ */

const navLinks = document.querySelectorAll(".nav-link");
const navSections = Array.from(navLinks)
  .map(link => document.querySelector(link.getAttribute("href")))
  .filter(Boolean);
function updateActiveNav() {
  const scrollPos = window.scrollY + 140;

  navSections.forEach((section, index) => {
    const top = section.offsetTop;
    const height = section.offsetHeight;

    if (scrollPos >= top && scrollPos < top + height) {
      navLinks.forEach(l => l.classList.remove("active"));
      navLinks[index].classList.add("active");
    }
  });
}

window.addEventListener("scroll", updateActiveNav);
window.addEventListener("load", updateActiveNav);
navLinks.forEach(link => {
  link.addEventListener("click", () => {
    navLinks.forEach(l => l.classList.remove("active"));
    link.classList.add("active");
  });
});

/* header scroll */
window.addEventListener("scroll", () => {
  header.classList.toggle("scrolled", window.scrollY > 20);
});


/* LOGO SHRINK ON SCROLL */
window.addEventListener("scroll", () => {
  document
    .querySelector(".site-header")
    .classList.toggle("scrolled", window.scrollY > 12);
});
/* RIPPLE EFFECT */
function addRipple(e) {
  const el = e.currentTarget;
  const circle = document.createElement("span");
  const d = Math.max(el.clientWidth, el.clientHeight);
  const rect = el.getBoundingClientRect();

  circle.style.width = circle.style.height = `${d}px`;
  circle.style.left = `${e.clientX - rect.left - d / 2}px`;
  circle.style.top = `${e.clientY - rect.top - d / 2}px`;
  circle.classList.add("ripple");

  el.appendChild(circle);
  setTimeout(() => circle.remove(), 600);
}

document.querySelector(".nav-toggle")?.addEventListener("click", addRipple);
document.querySelectorAll(".nav-link").forEach(link =>
  link.addEventListener("click", addRipple)
);
/* ===============================
   HEADER SCROLL EFFECT
================================ */

window.addEventListener("scroll", () => {
  if (window.scrollY > 40) {
    header.classList.add("scrolled");
  } else {
    header.classList.remove("scrolled");
  }
});
window.addEventListener("load", () => {
  document.querySelector(".site-header").classList.add("loaded");
});




/* ===============================
   PRINCIPLES TOGGLE (CLEAN)
================================ */
const principlesToggle = document.querySelector(".principles-toggle");
const principlesList = document.getElementById("principlesList");

if (principlesToggle && principlesList) {
  principlesToggle.addEventListener("click", () => {
    const isOpen =
      principlesToggle.getAttribute("aria-expanded") === "true";

    principlesToggle.setAttribute(
      "aria-expanded",
      String(!isOpen)
    );

    principlesList.classList.toggle("open", !isOpen);
  });
}






/* ===============================
   TIMELINE PROGRESS FILL (FIXED)
================================ */
const timelineWrap = document.querySelector(".timeline-wrap");
const progressLine = document.getElementById("timelineProgress");

window.addEventListener("scroll", () => {
  if (!timelineWrap || !progressLine) return;

  const rect = timelineWrap.getBoundingClientRect();
  const viewHeight = window.innerHeight;

  // start filling when timeline enters viewport
  const start = viewHeight * 0.2;
  const end = rect.height + start;

  const progress = Math.min(
    Math.max(start - rect.top, 0),
    end
  );

  const percent = (progress / end) * 100;
  progressLine.style.height = `${percent}%`;
});






  const modal = document.getElementById("projectModal");
  const panel = modal?.querySelector(".project-panel");
  const overlay = modal?.querySelector(".project-overlay");
  const closeBtn = modal?.querySelector(".project-close");

  const titleEl = document.getElementById("ppTitle");
  const taglineEl = document.getElementById("ppTagline");
  const techEl = document.getElementById("ppTech");
  const principlesEl = document.getElementById("ppPrinciples");
  const statusEl = document.getElementById("ppStatus");
  const githubBtn = document.getElementById("ppGithub");
  const demoBtn = document.getElementById("ppDemo");
const TEAM_MAP = {
  prateek: { name: "Prateek", img: "Assets/my pic.jpg" },
  suchi: { name: "Suchi", img: "Assets/suchi.jpeg" },
  krishna: { name: "Krishna", img: "Assets/krishna.jpeg" },
  lakshya: { name: "Lakshya", img: "Assets/lakshya.jpg" },
  shivi: { name: "Shivi", img: "Assets/shivi.jpeg" }
};

  document.querySelectorAll(".project-click").forEach(card => {
    card.addEventListener("click", () => openProject(card));
  });

  function openProject(card) {
    
    if (!modal || !panel) return;

    const d = card.dataset;
    
/* OWNERS */
/* ===============================
   PP TEAM CONTRIBUTIONS
================================ */

const teamWrap = document.getElementById("ppOwners");
teamWrap.innerHTML = "";

if (d.owners) {
  d.owners.split(",").forEach(entry => {
    const [id, role] = entry.split("|");
    const member = TEAM_MAP[id.trim()];

    if (!member) return;

    teamWrap.insertAdjacentHTML(
      "beforeend",
      `<div class="pp-team-item">
        <div class="pp-team-avatar">
          <img src="${member.img}" alt="${member.name}">
        </div>
        <div class="pp-team-info">
          <strong>${member.name}</strong>
          <span>${role?.trim() || ""}</span>
        </div>
      </div>`
    );
  });
}

/* ROADMAP */
const roadmapWrap = document.getElementById("ppRoadmap");
roadmapWrap.innerHTML = "";

if (d.roadmap) {
  d.roadmap.split(",").forEach(step => {
    const [label, state] = step.split("|");

    roadmapWrap.insertAdjacentHTML(
      "beforeend",
      `<div class="roadmap-item ${state}">
        <span class="roadmap-dot"></span>
        <span>${label.trim()}</span>
      </div>`
    );
  });
}

// /* TEAM CONTRIBUTIONS */
// const ownersWrap = document.getElementById("ppOwners");
// ownersWrap.innerHTML = "";

// if (d.owners) {
//   d.owners.split(",").forEach(entry => {
//     const [name, role] = entry.split("|");

//     ownersWrap.insertAdjacentHTML(
//       "beforeend",
//       `<div class="contrib-item">
//         <strong>${name.trim()}</strong>
//         <span>${role?.trim() || ""}</span>
//       </div>`
//     );
//   });
// }


document.querySelectorAll(".readiness-item").forEach(item => {
  const bar = item.querySelector(".r-bar span");
  if (!bar) return;

  let percent = 40;
  if (item.dataset.type === "model") percent = 60;
  if (item.dataset.type === "data") percent = 45;
  if (item.dataset.type === "infra") percent = 30;

  bar.style.width = percent + "%";
});

    /* CONTENT */
    titleEl.textContent = d.title || "Project";
    taglineEl.textContent = d.desc || "";

    /* STATUS */
    const badge = card.querySelector(".launch-badge, .project-status");
    if (badge) {
      statusEl.textContent = badge.textContent;
      statusEl.className = "pp-status " + badge.classList[1];
    }

    /* TECH */
    techEl.innerHTML = "";
    d.tech?.split(",").forEach(t =>
      techEl.insertAdjacentHTML(
        "beforeend",
        `<span class="tag">${t.trim()}</span>`
      )
    );

    /* PRINCIPLES */
    principlesEl.innerHTML = "";
    d.principles?.split(",").forEach(p =>
      principlesEl.insertAdjacentHTML(
        "beforeend",
        `<span class="tag subtle">${p.trim()}</span>`
      )
    );

    /* LINKS */
    githubBtn.style.display = d.github ? "inline-flex" : "none";
    demoBtn.style.display = d.demo ? "inline-flex" : "none";
    if (d.github) githubBtn.href = d.github;
    if (d.demo) demoBtn.href = d.demo;

    /* SHOW PANEL */
    modal.classList.add("show");
    panel.classList.add("show");
    document.body.style.overflow = "hidden";
  }

  function closeProject() {
    modal.classList.remove("show");
    panel.classList.remove("show");
    document.body.style.overflow = "";
  }

  closeBtn?.addEventListener("click", closeProject);
  overlay?.addEventListener("click", closeProject);

  document.addEventListener("keydown", e => {
    if (e.key === "Escape") closeProject();
  });


/* ===============================
   PRINCIPLES ICON SCROLL REVEAL
================================ */
/* ===============================
   PRINCIPLES ICON REVEAL
================================ */
window.principleObserver = new IntersectionObserver(
  entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("reveal");
        window.principleObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.25 }
);

document
  .querySelectorAll(".principles-list li")
  .forEach(li => window.principleObserver.observe(li));










// /* ===============================
//    TIMELINE SCROLL REVEAL
// ================================ */
// const timelineItems = document.querySelectorAll(".timeline-item");

// const revealObserver = new IntersectionObserver(
//   entries => {
//     entries.forEach(entry => {
//       if (entry.isIntersecting) {
//         entry.target.classList.add("reveal");
//         revealObserver.unobserve(entry.target);
//       }
//     });
//   },
//   { threshold: 0.2 }
// );

// timelineItems.forEach(item => revealObserver.observe(item));

// /* ===============================
//    AUTO TIMELINE STATE (YEAR SAFE)
// ================================ */
// const now = new Date();
// const m = now.getMonth(); // 0–11

// const items = document.querySelectorAll(".timeline-item");

// // reset
// items.forEach(i =>
//   i.classList.remove("completed", "active", "upcoming")
// );

// // Dec–Jan
// if (m === 11 || m === 0) {
//   items[0]?.classList.add("active");
//   items[1]?.classList.add("upcoming");
//   items[2]?.classList.add("upcoming");
// }

// // Feb–Mar
// else if (m === 1 || m === 2) {
//   items[0]?.classList.add("completed");
//   items[1]?.classList.add("active");
//   items[2]?.classList.add("upcoming");
// }

// // April+
// else {
//   items[0]?.classList.add("completed");
//   items[1]?.classList.add("completed");
//   items[2]?.classList.add("active");
// }
// // toogle - team section start




/* ===============================
   PREMIUM TIMELINE SCROLL ENGINE
================================ */
/* ===============================
   CINEMATIC TIMELINE LOGIC
================================ */

const timeline = document.querySelector(".timeline-wrap");
const items = [...document.querySelectorAll(".timeline-item")];
const progress = document.getElementById("timelineProgress");

function updateTimeline() {
  if (!timeline) return;

  const rect = timeline.getBoundingClientRect();
  const vh = window.innerHeight;

  /* progress */
  const total = rect.height - vh * 0.3;
  const scrolled = Math.min(
    Math.max(vh * 0.3 - rect.top, 0),
    total
  );
  const percent = Math.max(0, Math.min(scrolled / total, 1));
  progress.style.height = `${percent * 100}%`;

  /* active index */
  const index = Math.min(
    items.length - 1,
    Math.floor(percent * items.length)
  );

  items.forEach((item, i) => {
    item.classList.remove("is-active", "is-past", "is-future");

    if (i < index) item.classList.add("is-past");
    else if (i === index) item.classList.add("is-active");
    else item.classList.add("is-future");
  });
}

/* buttery smooth */
let ticking = false;
function onScroll() {
  if (!ticking) {
    requestAnimationFrame(() => {
      updateTimeline();
      ticking = false;
    });
    ticking = true;
  }
}

window.addEventListener("scroll", onScroll, { passive: true });
window.addEventListener("resize", updateTimeline);
updateTimeline();
/* ===============================
   TEAM INTERACTIONS
================================ */

// toggle expand


// auto highlight from project

/* example hook:
   highlightMember("fake-news")
*/
/* ===============================
   TEAM QUICK VIEW LOGIC
================================ */

/* ===============================
   TEAM QUICK VIEW (FINAL)
================================ */

/* ===============================
   TEAM QUICK VIEW – CLEAN LOGIC
================================ */

const TEAM_DATA = {
  prateek: {
    name: "Prateek",
    role: "AI/ML · Backend Lead",
    avatar: "Assets/my pic.jpg",
    desc: "Leads architecture, AI pipelines, backend APIs, and deployment.",
    projects: ["AI Fake News", "Healthcare AI"],
    timeline: [
      "System architecture & model design",
      "Backend & GenAI integration",
      "Deployment & scaling"
    ],
    github: "https://github.com/prateeksri1308/",
    linkedin: "https://www.linkedin.com/in/prateek-srivastava-backend/"
  },

  suchi: {
    name: "Suchi",
    role: "Frontend Lead",
    avatar: "Assets/suchi.jpeg",
    desc: "Owns UI/UX, responsive layouts, and frontend API integration.",
    projects: ["UI / UX", "Responsive Design"],
    timeline: [
      "Design system",
      "Frontend integration",
      "Polish & responsiveness"
    ],
    github: "https://github.com/suchig9434/",
    linkedin: "https://www.linkedin.com/in/suchi-g-b13a4b333/"
  },

  krishna: {
    name: "Krishna",
    role: "Database Engineer",
    avatar: "Assets/krishna.jpeg",
    desc: "Manages database schema, optimization, and backend data reliability.",
    projects: ["SQL", "Optimization"],
    timeline: [
      "Schema design",
      "Query optimization",
      "Data validation"
    ],
    github: "https://github.com/codewithkrishna09/",
    linkedin: "https://www.linkedin.com/in/krishna-jaiswal-177a86399/"
  },

  lakshya: {
    name: "Lakshya",
    role: "MERN Developer",
    avatar: "Assets/lakshya.jpg",
    desc: "Builds React components and handles frontend-backend integration.",
    projects: ["React", "Node"],
    timeline: [
      "Component development",
      "API integration",
      "Performance tuning"
    ],
    github: "https://github.com/lakshyajaiswal123/",
    linkedin: "https://www.linkedin.com/in/lakshya-jaiswal-356106385/"
  },

  shivi: {
    name: "Shivi",
    role: "Frontend Support · QA",
    avatar: "Assets/shivi.jpeg",
    desc: "Ensures UI stability, testing quality, and documentation.",
    projects: ["Testing", "Docs"],
    timeline: [
      "UI testing",
      "Bug fixing",
      "Documentation"
    ],
    github: "https://github.com/shivigoel9/",
    linkedin: "https://www.linkedin.com/in/shivi-goel-604845327/"
  }
};

const teamQuickView = document.getElementById("teamQuickView");

/* OPEN */
document.querySelectorAll(".team-profile-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    const key = btn.closest(".team-member-card").dataset.member;
    openQuickView(key);
  });
});

function openQuickView(key) {
  teamQuickView.querySelector(".quickview-card")
  .classList.remove("skeleton");

  const d = TEAM_DATA[key];
  if (!d) return;

  qvAvatar.src = d.avatar;
  qvName.textContent = d.name;
  qvRole.textContent = d.role;
  qvDesc.textContent = d.desc;

  qvProjects.innerHTML = d.projects.map(p => `<span>${p}</span>`).join("");
  qvTimeline.innerHTML = d.timeline.map(t => `<li>${t}</li>`).join("");

  qvGithub.href = d.github;
  qvLinkedin.href = d.linkedin;


  teamQuickView.classList.add("show");
  document.body.style.overflow = "hidden";
}

/* CLOSE */
function closeQuickView() {
  teamQuickView.classList.remove("show");
  document.body.style.overflow = "";
}

document.querySelector(".quickview-close").onclick = closeQuickView;
document.querySelector(".quickview-overlay").onclick = e => {
  if (e.target.classList.contains("quickview-overlay")) closeQuickView();
};

/* ===============================
   IMAGE PARALLAX (MOBILE)
================================ */

const qvContent = document.querySelector(".quickview-content");
const qvImage = document.querySelector(".quickview-media img");

if (qvContent && qvImage) {
  qvContent.addEventListener("scroll", () => {
    const y = qvContent.scrollTop;
    qvImage.style.transform =
      `translateY(${y * 0.18}px) scale(1.08)`;
  });
}
/* ===============================
   SWIPE DOWN TO CLOSE (MOBILE)
================================ */

let startY = 0;
let currentY = 0;

const sheet = document.querySelector(".quickview-card");

sheet.addEventListener("touchstart", e => {
  startY = e.touches[0].clientY;
});

sheet.addEventListener("touchmove", e => {
  currentY = e.touches[0].clientY;
  const diff = currentY - startY;

  if (diff > 0) {
    sheet.style.transform = `translateY(${diff}px)`;
  }
});

sheet.addEventListener("touchend", () => {
  const diff = currentY - startY;

  if (diff > 120) {
    closeQuickView();
  } else {
    sheet.style.transform = "";
  }

  startY = currentY = 0;
});
/* ===============================
   PROJECT PANEL — FIXED
================================ */

// loading-page

/* ===============================
   PAGE LOAD CONTROL
================================ */
/* ===============================
   BRAND LOADER CONTROL
================================ */
document.documentElement.style.overflow = "hidden";

window.addEventListener("load", () => {
  const loader = document.getElementById("brandLoader");

  setTimeout(() => {
    document.body.classList.add("page-loaded");
  }, 200);

  setTimeout(() => {
    loader.classList.add("hide");
    document.documentElement.style.overflow = "auto";
  }, 800);
});



// slowly reveal


/* ===============================
   SCROLL REVEAL (SAFE – TIMELINE EXCLUDED)
================================ */
document.addEventListener("DOMContentLoaded", () => {
  const revealItems = document.querySelectorAll(
    ".reveal, .reveal-fade, .reveal-lift, .reveal-glass, .reveal-scale, .reveal-stagger"
  );

  if (!("IntersectionObserver" in window)) {
    revealItems.forEach(el => el.classList.add("visible"));
    return;
  }

  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.18,
      rootMargin: "0px 0px -80px 0px"
    }
  );

  revealItems.forEach(el => {
    // ⛔ SKIP TIMELINE COMPLETELY
    if (el.closest("#timeline")) return;
    observer.observe(el);
  });
});

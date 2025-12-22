// FULL UPDATED front-end JS with OPTIMISTIC POPUP
// Paste into Js/script.js (replace existing)

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("joinForm");
  const ENDPOINT = "https://ct81fshw-5000.inc1.devtunnels.ms/submit";

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
      const resp = await fetch(resource, { ...options, signal: controller.signal });
      clearTimeout(id);
      return resp;
    } catch (err) {
      clearTimeout(id);
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

  startLoading();

// ⭐⭐⭐ OPTIMISTIC POPUP — SHOW AFTER 3 SECONDS ⭐⭐⭐
setTimeout(() => {
  showGifSuccess("Sending...", "We are submitting your request...");
}, 4000);



    // sanitize phone
    let digits = phoneInput.value.replace(/\D/g, "");
    if (digits.startsWith("91") && digits.length === 12) digits = digits.slice(2);
    if (digits.startsWith("0") && digits.length === 11) digits = digits.slice(1);
    phoneInput.value = digits;

    const formData = new FormData(form);

    try {
      const response = await fetchWithTimeout(
        ENDPOINT,
        { method: "POST", body: formData },
        15000
      );

      if (!response.ok) {
        hideGifSuccess();
        stopLoading();
        showError("Server error. Please try again.");
        return;
      }

      // SUCCESS — Update popup text
      gifTitle.textContent = "Message Sent!";
      gifMessage.textContent = "Thanks — we'll contact you soon.";

      stopLoading();
      resetForm();

    } catch (err) {
      hideGifSuccess();
      stopLoading();
      showError("Network error. Try again.");
    }
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
    [nameInput, emailInput, phoneInput, messageInput].forEach((el) =>
      el?.classList.remove("invalid")
    );
  }
});
/* ===============================
   NAVBAR JS (Font Awesome)
================================ */
const header = document.querySelector(".site-header");
const nav = document.getElementById("mainNav");
const toggle = document.getElementById("navToggle");
const icon = toggle.querySelector("i");
const links = document.querySelectorAll(".nav-link");

/* toggle menu */
toggle.addEventListener("click", () => {
  const open = nav.classList.toggle("open");
  toggle.classList.toggle("open", open);
  toggle.setAttribute("aria-expanded", open);

  icon.classList.toggle("fa-bars", !open);
  icon.classList.toggle("fa-xmark", open);
});

/* close on link click */
links.forEach(link => {
  link.addEventListener("click", () => {
    nav.classList.remove("open");
    toggle.classList.remove("open");
    toggle.setAttribute("aria-expanded", "false");
    icon.classList.add("fa-bars");
    icon.classList.remove("fa-xmark");
  });
});

/* active section + scroll effect */
const sections = [...links].map(l => document.querySelector(l.getAttribute("href")));

window.addEventListener("scroll", () => {
  header.classList.toggle("scrolled", window.scrollY > 20);

  const pos = window.scrollY + 120;
  sections.forEach((sec, i) => {
    if (!sec) return;
    if (pos >= sec.offsetTop && pos < sec.offsetTop + sec.offsetHeight) {
      links.forEach(l => l.classList.remove("active"));
      links[i].classList.add("active");
    }
  });
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
















/* ===============================
   TIMELINE SCROLL REVEAL
================================ */
const timelineItems = document.querySelectorAll(".timeline-item");

const revealObserver = new IntersectionObserver(
  entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("reveal");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.2 }
);

timelineItems.forEach(item => revealObserver.observe(item));

/* ===============================
   AUTO TIMELINE STATE (YEAR SAFE)
================================ */
const now = new Date();
const m = now.getMonth(); // 0–11

const items = document.querySelectorAll(".timeline-item");

// reset
items.forEach(i =>
  i.classList.remove("completed", "active", "upcoming")
);

// Dec–Jan
if (m === 11 || m === 0) {
  items[0]?.classList.add("active");
  items[1]?.classList.add("upcoming");
  items[2]?.classList.add("upcoming");
}

// Feb–Mar
else if (m === 1 || m === 2) {
  items[0]?.classList.add("completed");
  items[1]?.classList.add("active");
  items[2]?.classList.add("upcoming");
}

// April+
else {
  items[0]?.classList.add("completed");
  items[1]?.classList.add("completed");
  items[2]?.classList.add("active");
}

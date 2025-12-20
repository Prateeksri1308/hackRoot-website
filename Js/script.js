document.addEventListener("DOMContentLoaded", () => {
    // ---------------------------
    // Loader + Submit Handler
    // ---------------------------
    const form = document.getElementById("joinForm");
    if (!form) return;

    const ENDPOINT = "https://ct81fshw-5000.inc1.devtunnels.ms/submit";

    // Create loader overlay
    const overlay = document.createElement("div");
    overlay.className = "loading-overlay";
    overlay.innerHTML = `
    <div class="fast-loader" id="fast-loader"></div>
    <div class="fast-check" id="fast-check">
      <svg viewBox="0 0 24 24">
        <path d="M9 16.2 4.8 12l-1.4 1.4 5.8 5.8L21 7.4 19.6 6z"/>
      </svg>
    </div>
  `;
    document.body.appendChild(overlay);

    const loader = document.getElementById("fast-loader");
    const check = document.getElementById("fast-check");

    function showLoader() {
        loader.style.display = "block";
        check.classList.remove("show");
        overlay.classList.add("show");
    }

    function showSuccess() {
        loader.style.display = "none";
        check.classList.add("show");

        // hide after animation
        setTimeout(() => {
            overlay.classList.remove("show");
        }, 900);
    }

    // ---------------------------
    // Submit event
    // ---------------------------
    form.addEventListener("submit", async(e) => {
        e.preventDefault();

        showLoader();

        const formData = new FormData(form);
        const wait = (ms) => new Promise((res) => setTimeout(res, ms));
        const minLoaderTime = wait(150); // feels premium, not rushed
        // smoother & faster

        try {
            const response = await fetch(ENDPOINT, {
                method: "POST",
                body: formData,
            });

            const data = await response.json(); // <-- get JSON instead of redirect
            await minLoaderTime;

            if (data.status === "ok") {
                form.reset();
                showSuccess();
            } else {
                overlay.classList.remove("show");
            }
        } catch (err) {
            console.error(err);
            overlay.classList.remove("show");
        }
    });

    // ---------------------------
    // Team More Button Placeholder
    // ---------------------------
    //     document.querySelectorAll(".btn-link").forEach((btn) => {
    //         btn.addEventListener("click", () => {
    //             // remove alerts completely
    //             // show a modal later if you want
    //         });
    //     });
    // });

    //  navbar menu ---------------

    const menuBtn = document.getElementById("menuBtn");
    const navLinks = document.getElementById("navLinks");

    menuBtn.addEventListener("click", () => {
        menuBtn.classList.toggle("active");
        navLinks.classList.toggle("active");
    });

    // Close menu on link click
    navLinks.querySelectorAll("a").forEach((link) => {
        link.addEventListener("click", closeMenu);
    });

    // Close on scroll
    window.addEventListener("scroll", closeMenu);

    function closeMenu() {
        navLinks.classList.remove("active");
        menuBtn.classList.remove("active");
    }

    // Navbar scroll effect
    window.addEventListener("scroll", () => {
        document
            .querySelector(".navbar")
            .classList.toggle("scrolled", window.scrollY > 40);
    });

    //  teaam card section -------------

    const cards = document.querySelectorAll(".team-card");

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = 1;
                    entry.target.style.transform = "translateY(0)";
                }
            });
        }, {
            threshold: 0.2,
        }
    );

    cards.forEach((card) => {
        card.style.opacity = 0;
        card.style.transform = "translateY(30px)";
        card.style.transition = "0.6s ease";
        observer.observe(card);
    });
});
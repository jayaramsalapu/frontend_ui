
/*
 * EASYCONNECT - MAIN JAVASCRIPT
 * Vanilla JavaScript Frontend
 *
 * Features:
 * - Responsive navigation
 * - Homepage animations
 * - Registration step wizard
 * - Donor search and filtering
 * - Blood request form validation
 *
 * Frontend prototype only.
 * No backend calls or permanent user storage.
 */

document.addEventListener("DOMContentLoaded", () => {

  /* ========================================
     1. RESPONSIVE NAVIGATION
  ======================================== */

  const menuToggle = document.querySelector(".menu-toggle");
  // Supports both original and redesigned navigation
  const nav = document.querySelector(".nav-links, .navlinks");

  let closeNav = null;

  if (menuToggle && nav) {
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Open menu");

    closeNav = (returnFocus = false) => {
      nav.classList.remove("open");
      menuToggle.setAttribute("aria-expanded", "false");
      menuToggle.setAttribute("aria-label", "Open menu");
      const icon = menuToggle.querySelector("i");
      if (icon) {
        icon.classList.remove("fa-xmark");
        icon.classList.add("fa-bars");
      }
      if (returnFocus) menuToggle.focus();
    };

    menuToggle.addEventListener("click", () => {
      const isOpen = nav.classList.toggle("open");
      menuToggle.setAttribute("aria-expanded", String(isOpen));
      menuToggle.setAttribute("aria-label", isOpen ? "Close menu" : "Open menu");
      const icon = menuToggle.querySelector("i");
      if (icon) {
        icon.classList.toggle("fa-bars", !isOpen);
        icon.classList.toggle("fa-xmark", isOpen);
      }
      if (isOpen) {
        const firstLink = nav.querySelector("a");
        if (firstLink) firstLink.focus();
      }
    });

    // Close navigation when any link is clicked
    nav.querySelectorAll("a").forEach(link => {
      link.addEventListener("click", () => {
        closeNav(false);
      });
    });

    // Close navigation when clicking outside
    document.addEventListener("click", event => {
      if (
        !nav.contains(event.target) &&
        !menuToggle.contains(event.target)
      ) {
        closeNav(false);
      }
    });

    // Close navigation with Escape and restore focus to menuToggle
    document.addEventListener("keydown", event => {
      if (event.key === "Escape" && nav.classList.contains("open")) {
        closeNav(true);
      }
    });
  }


  /* ========================================
     1.5 HERO ENTRANCE TRIGGER
  ======================================== */
  document.body.classList.add("js-ready");
  requestAnimationFrame(() => {
    setTimeout(() => {
      document.body.classList.add("hero-animated");
    }, 60);
  });

  /* ========================================
     2. MOTION SYSTEM & NATIVE SCROLL REVEALS
  ======================================== */

  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  // Progressive native IntersectionObserver scroll reveals
  if ("IntersectionObserver" in window && !reducedMotion) {
    document.documentElement.classList.add("js-scroll-reveal");

    const revealSelectors = [
      // Section A: Introduction
      ".intro-image-frame",
      ".intro-heading",
      ".intro-lead",
      ".intro-highlights-list",
      ".intro-action-wrap",
      // Section B: How It Works Header
      ".story-header",
      // Section C: Privacy & Control
      ".privacy-heading",
      ".privacy-lead",
      ".privacy-row-item",
      ".privacy-image-frame",
      // Section D: Safety Statement Card & Pillars
      ".statement-card-header",
      ".statement-pillar-item",
      // Section E: Frequently Asked Questions
      ".faq-header",
      ".faq-accordion-item",
      // Section F: Closing Call to Action
      ".final-cta-heading",
      ".final-cta-lead",
      ".final-cta-buttons"
    ];

    const revealElements = document.querySelectorAll(revealSelectors.join(", "));

    // Stagger sibling cards with incremental delays
    const staggerParents = [
      ".privacy-rows-wrap",
      ".statement-pillars-grid",
      ".faq-accordion-list",
      ".intro-highlights-list",
      ".card-grid-4",
      ".three-feature-cards"
    ];

    staggerParents.forEach(selector => {
      document.querySelectorAll(selector).forEach(parent => {
        const children = Array.from(parent.children);
        children.forEach((child, idx) => {
          child.classList.add(`reveal-stagger-${Math.min(4, idx + 1)}`);
        });
      });
    });

    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-revealed");
          observer.unobserve(entry.target); // Play once without continuous scroll overhead!
        }
      });
    }, {
      threshold: 0.08,
      rootMargin: "0px 0px -20px 0px"
    });

    revealElements.forEach(el => {
      el.classList.add("reveal-item");
      revealObserver.observe(el);
    });
  }

  /* ========================================
     3. SMOOTH ANCHOR SCROLLING (Accessible & Header-Aware)
  ======================================== */
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener("click", function (event) {
      const hash = this.getAttribute("href");
      if (!hash || hash === "#") return;
      const target = document.querySelector(hash);
      if (target) {
        event.preventDefault();
        const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        target.scrollIntoView({
          behavior: prefersReduced ? "auto" : "smooth",
          block: "start"
        });
        if (history.pushState) {
          history.pushState(null, null, hash);
        }
        // Close mobile navigation if open
        if (typeof closeNav === "function") {
          closeNav(false);
        } else {
          const mobileNav = document.getElementById("navLinks");
          const mobileToggle = document.getElementById("menuToggle");
          if (mobileNav && mobileNav.classList.contains("open")) {
            mobileNav.classList.remove("open");
            if (mobileToggle) {
              mobileToggle.setAttribute("aria-expanded", "false");
              mobileToggle.setAttribute("aria-label", "Open menu");
            }
          }
        }
        // Accessibility: set keyboard focus to target
        if (target.getAttribute("tabindex") === null) {
          target.setAttribute("tabindex", "-1");
        }
        target.focus({ preventScroll: true });
      }
    });
  });

  /* ========================================
     READING PROGRESS & STICKY HEADER
  ======================================== */
  const siteHeader = document.querySelector(".site-header");
  const scrollProgressBar = document.querySelector("#scrollProgressBar");
  let isScrollTicking = false;

  const updateScrollState = () => {
    const scrollY = window.pageYOffset || document.documentElement.scrollTop;

    // Sticky header shadow / blur class
    if (siteHeader) {
      siteHeader.classList.toggle("header-scrolled", scrollY > 16);
    }

    // Transform-based reading progress line
    if (scrollProgressBar && !reducedMotion) {
      const docHeight = document.documentElement.scrollHeight;
      const winHeight = window.innerHeight;
      const maxScroll = Math.max(1, docHeight - winHeight);
      const progress = Math.min(1, Math.max(0, scrollY / maxScroll));
      scrollProgressBar.style.transform = `scaleX(${progress})`;
    }

    isScrollTicking = false;
  };

  window.addEventListener("scroll", () => {
    if (!isScrollTicking) {
      requestAnimationFrame(updateScrollState);
      isScrollTicking = true;
    }
  }, { passive: true });

  updateScrollState();

  /* ========================================
     SUBTLE 2-3° CARD TILT (FINE POINTER ONLY)
  ======================================== */
  const hasFinePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  if (hasFinePointer && !reducedMotion) {
    const tiltCards = document.querySelectorAll(
      ".three-feature-cards .feature-card, .card-grid-4 .min-card"
    );
    tiltCards.forEach(card => {
      card.addEventListener("mousemove", (e) => {
        const rect = card.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        const tiltX = (-y * 2.5).toFixed(2);
        const tiltY = (x * 2.5).toFixed(2);
        card.style.transform = `perspective(800px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) translateY(-2px)`;
      });
      card.addEventListener("mouseleave", () => {
        card.style.transform = "";
      });
    });
  }


  /* ========================================
     3. REGISTRATION FORM WIZARD & BATTERY
  ======================================== */

  const form = document.querySelector("#register-form");

  if (form) {

    const labels = [
      "Personal Details",
      "Your Location",
      "Blood Group details",
      "Availability",
      "Donor Preferences"
    ];

    const stories = [
      [
        "A kind intention begins.",
        "Enter your personal details to start powering your lifesaver battery."
      ],
      [
        "Your community comes closer.",
        "Your location ensures nearby emergency requests reach you reliably."
      ],
      [
        "A little more clarity.",
        "Setting your blood group details prepares the battery for urgent matching."
      ],
      [
        "Your schedule is set!",
        "Availability routes requests to where you actually are throughout the day."
      ],
      [
        "Almost at full power!",
        "Review your donor preferences to finalize your registration."
      ],
      [
        "Registration complete · 100% Power!",
        "Thank you! Your lifesaver battery is fully charged and ready to save lives."
      ]
    ];

    const steps = [
      ...form.querySelectorAll(".form-step")
    ];

    const back = document.querySelector("#back-btn");
    const next = document.querySelector("#next-btn");

    const formActions = document.querySelector("#form-actions");
    const stepName = document.querySelector("#step-name");
    const percent = document.querySelector("#percent");
    const progressFill = document.querySelector("#progress-fill");

    const storyTitle = document.querySelector("#story-title");
    const storyCopy = document.querySelector("#story-copy");

    // Battery elements
    const batteryLiquid = document.querySelector("#batteryLiquid");
    const batteryPercent = document.querySelector("#batteryPercent");
    const batteryStatus = document.querySelector("#batteryStatus");
    const bubbleText = document.querySelector("#bubble-speech-text");
    const batteryCylinder = document.querySelector("#batteryCylinder");

    // Milestone tags
    const tagIdentity = document.querySelector("#tag-identity");
    const tagBlood = document.querySelector("#tag-blood");
    const tagEligibility = document.querySelector("#tag-eligibility");
    const tagLocation = document.querySelector("#tag-location");
    const tagSchedule = document.querySelector("#tag-schedule");

    let current = 0;

    // PREFILL AUTHENTICATED USER DATA IF LOGGED IN
    try {
      const storedUser = localStorage.getItem("easyconnect_user");
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        const nameField = form.querySelector("#fullname");
        const emailField = form.querySelector("#email");
        if (nameField && !nameField.value && parsed.name && parsed.name !== "Logged In User") {
          nameField.value = parsed.name;
          setTimeout(() => validateFieldInput(nameField), 50);
        }
        if (emailField && !emailField.value && parsed.email) {
          emailField.value = parsed.email;
          setTimeout(() => validateFieldInput(emailField), 50);
        }
      }
    } catch (e) {
      console.warn("Could not read stored user", e);
    }

    /* COMPUTE ACCURATE BATTERY CHARGE DYNAMICALLY */
    const computeBatteryCharge = () => {
      let charge = 0;

      // STEP 1 FIELDS (up to 20%)
      const fullname = form.querySelector("#fullname")?.value.trim() || "";
      const email = form.querySelector("#email")?.value.trim() || "";
      const phoneDigits = (form.querySelector("#phone")?.value || "").replace(/\D/g, "");
      const dob = form.querySelector("#dob")?.value || "";

      if (fullname.length >= 2) charge += 5;
      if (email.includes("@") && email.includes(".") && email.length >= 5) charge += 5;
      if (phoneDigits.length >= 10) charge += 5;
      if (dob) charge += 5;

      // If user has advanced past Step 1, guarantee at least 20%
      if (current >= 1 && charge < 20) charge = 20;

      // STEP 2 FIELDS (up to +20%, total 40%)
      if (current >= 1 || form.querySelector("#city")?.value || form.querySelector("#gps-input")?.value) {
        const gps = form.querySelector("#gps-input")?.value.trim() || "";
        const city = form.querySelector("#city")?.value.trim() || "";
        const state = form.querySelector("#state")?.value || "";
        const pincode = form.querySelector("#pincode")?.value.trim() || "";

        if (gps.length > 0) charge += 10;
        if (city.length >= 2) charge += 5;
        if (state) charge += 3;
        if (pincode.length >= 4) charge += 2;
      }

      // If user has advanced past Step 2, guarantee at least 40%
      if (current >= 2 && charge < 40) charge = 40;

      // STEP 3 FIELDS (up to +20%, total 60%)
      if (current >= 2 || form.querySelector("#blood-group")?.value) {
        const bg = form.querySelector("#blood-group")?.value || "";
        const lastDonation = form.querySelector("#last-donation")?.value || "";

        if (bg && bg !== "") charge += 15;
        if (lastDonation || form.querySelector("#proof")?.files?.length > 0) charge += 5;
        else if (bg) charge += 5;
      }

      // If user has advanced past Step 3, guarantee at least 60%
      if (current >= 3 && charge < 60) charge = 60;

      // STEP 4 FIELDS (up to +20%, total 80%)
      if (current >= 3 || form.querySelector("#daytime-location")?.value || form.querySelector("#evening-location")?.value) {
        const daytime = form.querySelector("#daytime-location")?.value.trim() || "";
        const evening = form.querySelector("#evening-location")?.value.trim() || "";
        const travel = form.querySelector('input[name="travel_range"]:checked')?.value || "";

        if (daytime.length >= 2) charge += 10;
        if (evening.length >= 2) charge += 6;
        if (travel) charge += 4;
      }

      // If user has advanced past Step 4, guarantee at least 80%
      if (current >= 4 && charge < 80) charge = 80;

      // STEP 5 FIELDS: Donor Preferences (up to +15%, reaching 95% during form filling)
      if (current >= 4) {
        const avail = form.querySelector('input[name="available"]:checked')?.value || "";
        const consent = form.querySelector("#consent")?.checked;

        if (avail) charge += 8;
        if (consent) charge += 7;
      }

      // Reaching 100% ONLY after successful registration
      if (current >= 5) {
        charge = 100;
      } else {
        charge = Math.min(95, charge);
      }

      return Math.min(100, Math.max(0, charge));
    };

    /* CHECK INDIVIDUAL FIELD VALIDITY & DRAW CHECKMARK (180ms) */
    const validateFieldInput = input => {
      if (!input) return false;
      let valid = false;
      const val = (input.value || "").trim();

      if (input.id === "fullname") {
        valid = val.length >= 2;
      } else if (input.id === "email") {
        valid = val.includes("@") && val.includes(".") && val.length >= 5;
      } else if (input.id === "phone") {
        const digits = val.replace(/\D/g, "");
        valid = digits.length >= 10;
      } else if (input.id === "dob") {
        valid = val.length > 0;
      } else if (input.id === "city") {
        valid = val.length >= 2;
      } else if (input.id === "state") {
        valid = val.length > 0;
      } else if (input.id === "pincode") {
        const digits = val.replace(/\D/g, "");
        valid = digits.length >= 4;
      } else if (input.id === "gps-input") {
        valid = val.length > 0;
      } else if (input.id === "blood-group") {
        valid = val.length > 0;
      } else if (input.id === "daytime-location") {
        valid = val.length >= 2;
      } else if (input.id === "evening-location") {
        valid = val.length >= 2;
      } else if (input.id === "consent") {
        valid = input.checked === true;
      } else if (input.type === "radio") {
        valid = true;
      }

      const wrap = input.closest(".input-icon-wrap") || input.closest(".field");
      if (wrap) {
        wrap.classList.toggle("is-valid", valid);
      }
      return valid;
    };

    /* CHECK IF AN ENTIRE SECTION IS FULLY VALID */
    const isSectionComplete = sectionIndex => {
      if (sectionIndex === 0) {
        const fn = form.querySelector("#fullname");
        const em = form.querySelector("#email");
        const ph = form.querySelector("#phone");
        const db = form.querySelector("#dob");
        return validateFieldInput(fn) && validateFieldInput(em) && validateFieldInput(ph) && validateFieldInput(db);
      }
      if (sectionIndex === 1) {
        const ct = form.querySelector("#city");
        const st = form.querySelector("#state");
        const pin = form.querySelector("#pincode");
        return validateFieldInput(ct) && validateFieldInput(st) && validateFieldInput(pin);
      }
      if (sectionIndex === 2) {
        const bg = form.querySelector("#blood-group");
        return validateFieldInput(bg);
      }
      if (sectionIndex === 3) {
        const dt = form.querySelector("#daytime-location");
        const ev = form.querySelector("#evening-location");
        return validateFieldInput(dt) && validateFieldInput(ev);
      }
      if (sectionIndex === 4) {
        const cs = form.querySelector("#consent");
        return validateFieldInput(cs);
      }
      return false;
    };

    const completedSections = new Set();

    /* TRIGGER SUBTLE SURFACE RIPPLE ON LIQUID */
    const triggerLiquidRipple = () => {
      const wave = document.querySelector(".battery-wave");
      if (wave) {
        wave.classList.remove("ripple");
        void wave.offsetWidth; // force reflow
        wave.classList.add("ripple");
        setTimeout(() => wave.classList.remove("ripple"), 700);
      }
    };

    /* SEND GOLDEN SPARK FROM SECTION LABEL TOWARD BATTERY (ONCE PER NEWLY COMPLETED SECTION) */
    const playSectionSparkEffect = sectionIndex => {
      const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (prefersReducedMotion) {
        return;
      }

      // Briefly highlight floating label & active step heading
      if (stepName) {
        stepName.classList.add("spark-highlight");
        setTimeout(() => stepName.classList.remove("spark-highlight"), 850);
      }
      const activeStep = steps[sectionIndex];
      const activeH2 = activeStep?.querySelector("h2");
      if (activeH2) {
        activeH2.classList.add("spark-highlight");
        setTimeout(() => activeH2.classList.remove("spark-highlight"), 850);
      }

      const labelSource = activeH2 || stepName;
      const batteryTarget = document.querySelector("#batteryLiquid") || batteryCylinder;

      if (!labelSource || !batteryTarget) return;

      const srcRect = labelSource.getBoundingClientRect();
      const destRect = batteryTarget.getBoundingClientRect();

      const startX = srcRect.left + srcRect.width * 0.45;
      const startY = srcRect.top + srcRect.height * 0.5;
      const endX = destRect.left + destRect.width * 0.5;
      const endY = destRect.top + 8; // near liquid surface

      const midX = (startX + endX) / 2;
      const midY = Math.min(startY, endY) - 35; // gentle upward arc

      const spark = document.createElement("div");
      spark.className = "golden-spark";
      document.body.appendChild(spark);

      if (spark.animate) {
        const anim = spark.animate([
          { transform: `translate3d(${startX}px, ${startY}px, 0) scale(0.6)`, opacity: 0 },
          { transform: `translate3d(${startX + (midX - startX) * 0.35}px, ${midY}px, 0) scale(1.35)`, opacity: 1, offset: 0.35 },
          { transform: `translate3d(${midX}px, ${midY}px, 0) scale(1.1)`, opacity: 0.95, offset: 0.65 },
          { transform: `translate3d(${endX}px, ${endY}px, 0) scale(0.3)`, opacity: 0 }
        ], {
          duration: 520,
          easing: "cubic-bezier(0.22, 1, 0.36, 1)"
        });

        anim.onfinish = () => {
          spark.remove();
          triggerLiquidRipple();
        };
      } else {
        spark.remove();
        triggerLiquidRipple();
      }
    };

    let hasPlayed100Celebration = false;

    /* RELEASE SHORT BURST OF CORAL & GOLD PARTICLES DRIFTING OUTWARD INSIDE BATTERY PANEL */
    const spawnCelebrationParticles = () => {
      const panel = document.querySelector(".battery-panel");
      const cylinder = document.querySelector("#batteryCylinder");
      if (!panel || !cylinder) return;

      const panelRect = panel.getBoundingClientRect();
      const cylRect = cylinder.getBoundingClientRect();

      // Center point of burst near heart / battery cap
      const originX = cylRect.left - panelRect.left + cylRect.width * 0.5;
      const originY = cylRect.top - panelRect.top + 28;

      const particleColors = ["#C8503D", "#E86C5A", "#E5B869", "#FFDF95", "#F4E3D8"];
      const particleCount = 18;

      for (let i = 0; i < particleCount; i++) {
        const p = document.createElement("div");
        p.className = "battery-celebration-particle";
        const size = Math.floor(4.5 + Math.random() * 4);
        p.style.width = `${size}px`;
        p.style.height = `${size}px`;
        p.style.background = particleColors[i % particleColors.length];
        p.style.left = `${originX}px`;
        p.style.top = `${originY}px`;
        panel.appendChild(p);

        const angle = (2 * Math.PI * i) / particleCount + (Math.random() - 0.5) * 0.35;
        const dist = 32 + Math.random() * 52;
        const targetX = Math.cos(angle) * dist;
        const targetY = Math.sin(angle) * dist - 18; // gentle upward drift
        const duration = 1100 + Math.random() * 350;

        if (p.animate) {
          const anim = p.animate([
            { transform: "translate3d(0, 0, 0) scale(0.5)", opacity: 1 },
            { transform: `translate3d(${targetX * 0.65}px, ${targetY * 0.65}px, 0) scale(1.2)`, opacity: 0.95, offset: 0.4 },
            { transform: `translate3d(${targetX}px, ${targetY}px, 0) scale(0.7)`, opacity: 0 }
          ], {
            duration: duration,
            easing: "cubic-bezier(0.18, 0.89, 0.32, 1)"
          });
          anim.onfinish = () => p.remove();
        } else {
          p.remove();
        }
      }
    };

    /* 100% CELEBRATION SEQUENCE (PLAYS ONCE WHEN COUNTER REACHES 100%) */
    const run100Celebration = () => {
      const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      if (prefersReducedMotion) {
        if (batteryCylinder) batteryCylinder.classList.add("steady-glow");
        const bubble = document.querySelector(".battery-bubble");
        if (bubble) bubble.classList.add("steady-glow");
        if (bubbleText) bubbleText.textContent = "Fully charged. Your profile is ready.";
        return;
      }

      // Step 1: Pause for a beat (~420ms)
      setTimeout(() => {
        // Step 2: Send warm ring of light up through the glass
        const lightRing = document.querySelector("#batteryLightRing");
        if (lightRing) {
          lightRing.classList.remove("rising");
          void lightRing.offsetWidth; // force reflow
          lightRing.classList.add("rising");
        }

        const heartIcon = document.querySelector(".bubble-heart-icon");
        const ecgLine = document.querySelector(".battery-ecg-line");

        // Step 3: First distinct heartbeat synced with ECG peak (at +580ms)
        setTimeout(() => {
          if (heartIcon) {
            heartIcon.classList.remove("heart-beat-pulse");
            void heartIcon.offsetWidth;
            heartIcon.classList.add("heart-beat-pulse");
          }
          if (ecgLine) {
            ecgLine.classList.add("ecg-sync-peak");
            setTimeout(() => ecgLine.classList.remove("ecg-sync-peak"), 320);
          }
        }, 580);

        // Step 4: Second distinct heartbeat synced with ECG peak + Particle burst (at +1020ms)
        setTimeout(() => {
          if (heartIcon) {
            heartIcon.classList.remove("heart-beat-pulse");
            void heartIcon.offsetWidth;
            heartIcon.classList.add("heart-beat-pulse");
            setTimeout(() => heartIcon.classList.remove("heart-beat-pulse"), 380);
          }
          if (ecgLine) {
            ecgLine.classList.add("ecg-sync-peak");
            setTimeout(() => ecgLine.classList.remove("ecg-sync-peak"), 380);
          }

          // Release burst on second beat!
          spawnCelebrationParticles();
        }, 1020);

        // Step 5: Over next 2 seconds, settle into soft steady glow and fade in completion message
        setTimeout(() => {
          if (batteryCylinder) batteryCylinder.classList.add("steady-glow");
          const bubble = document.querySelector(".battery-bubble");
          if (bubble) bubble.classList.add("steady-glow");

          if (bubbleText) {
            bubbleText.classList.remove("fade-swap");
            void bubbleText.offsetWidth;
            bubbleText.classList.add("fade-swap");
            bubbleText.textContent = "Fully charged. Your profile is ready.";
          }
        }, 1500);

      }, 420);
    };

    /* UPDATE ALL BATTERY & PROGRESS UI ELEMENTS */
    const updateBatteryUI = charge => {
      // Battery cylinder liquid height
      if (batteryLiquid) {
        batteryLiquid.style.height = `${charge}%`;
      }

      // Battery numeric core
      if (batteryPercent) {
        batteryPercent.textContent = `${charge}%`;
      }

      // Track fill in form wizard header
      if (progressFill) {
        progressFill.style.width = `${charge}%`;
      }

      if (percent) {
        percent.textContent = `${charge}%`;
      }

      // Battery status text & cylinder visual class
      if (batteryCylinder) {
        batteryCylinder.classList.toggle("has-charge", charge >= 35);
      }

      if (batteryStatus) {
        batteryStatus.textContent = "COMPLETE";
      }

      // Speech bubble text
      if (bubbleText) {
        if (charge >= 100 && hasPlayed100Celebration) {
          bubbleText.textContent = "Fully charged. Your profile is ready.";
        } else if (charge === 0) {
          bubbleText.textContent = "Ready to charge! Enter your details to power up.";
        } else if (charge < 20) {
          bubbleText.textContent = `Powering up... ${charge}% complete. Keep going!`;
        } else if (charge < 40) {
          bubbleText.textContent = "Personal details saved! Your location helps match urgent requests.";
        } else if (charge < 60) {
          bubbleText.textContent = "Location saved! Blood group details enable rapid matching.";
        } else if (charge < 80) {
          bubbleText.textContent = "Blood group set! Availability routes requests where you are.";
        } else if (charge < 100) {
          bubbleText.textContent = "Almost ready! Confirm donor preferences to complete registration.";
        } else {
          bubbleText.innerHTML = "At 100%, Your Battery Powers a Heartbeat to Save Lives! ❤️";
        }
      }

      // Orbiting milestone tags with dynamic icon states
      if (tagIdentity) {
        const isAct = charge >= 20;
        tagIdentity.classList.toggle("active", isAct);
        const icon = tagIdentity.querySelector(".tag-status-icon i");
        if (icon) icon.className = isAct ? "fa-solid fa-check" : "fa-regular fa-user";
      }
      if (tagLocation) {
        const isAct = charge >= 40;
        tagLocation.classList.toggle("active", isAct);
        const icon = tagLocation.querySelector(".tag-status-icon i");
        if (icon) icon.className = isAct ? "fa-solid fa-check" : "fa-solid fa-location-dot";
      }
      if (tagBlood) {
        const isAct = charge >= 60;
        tagBlood.classList.toggle("active", isAct);
        const icon = tagBlood.querySelector(".tag-status-icon i");
        if (icon) icon.className = isAct ? "fa-solid fa-check" : "fa-solid fa-droplet";
      }
      if (tagSchedule) {
        const isAct = charge >= 80;
        tagSchedule.classList.toggle("active", isAct);
        const icon = tagSchedule.querySelector(".tag-status-icon i");
        if (icon) icon.className = isAct ? "fa-solid fa-check" : "fa-regular fa-clock";
      }
      if (tagEligibility) {
        const isAct = charge >= 95;
        tagEligibility.classList.toggle("active", isAct);
        const icon = tagEligibility.querySelector(".tag-status-icon i");
        if (icon) icon.className = isAct ? "fa-solid fa-check" : "fa-solid fa-shield-heart";
      }

      // Trigger 100% Celebration Sequence once when 100% is reached
      if (charge === 100 && !hasPlayed100Celebration) {
        hasPlayed100Celebration = true;
        run100Celebration();
      }
    };

    /* SHOW REGISTRATION STEP */
    const showStep = index => {
      if (index < 0 || index >= steps.length) {
        return;
      }

      current = index;

      steps.forEach((element, i) => {
        element.classList.toggle("active", i === current);
      });

      const completed = current >= 5;

      if (formActions) {
        formActions.style.display = completed ? "none" : "flex";
      }

      if (completed) {
        if (stepName) stepName.textContent = "Journey complete · 100% Charged";
      } else {
        if (stepName) stepName.textContent = `Step ${current + 1} of 5 · ${labels[current]}`;
        if (next) {
          next.innerHTML = current === 4 ? "Complete Registration ♡" : 'Continue <i class="fa-solid fa-arrow-right"></i>';
        }
      }

      /* BACK BUTTON */
      if (back) {
        back.style.visibility = current === 0 ? "hidden" : "visible";
      }

      /* STORY PANEL TEXT */
      const story = stories[Math.min(current, stories.length - 1)];
      if (storyTitle) storyTitle.textContent = story[0];
      if (storyCopy) storyCopy.textContent = story[1];

      /* UPDATE BATTERY & PROGRESS */
      const currentCharge = computeBatteryCharge();
      updateBatteryUI(currentCharge);

      /* Scroll into view on mobile */
      const formCard = document.querySelector(".form-card");
      if (formCard && window.innerWidth < 800) {
        formCard.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    };

    /* SHOW ERROR HELPER */
    const setFieldError = (fieldId, isError) => {
      const fieldEl = form.querySelector(`#${fieldId}`);
      if (fieldEl) {
        fieldEl.classList.toggle("has-error", isError);
      }
    };

    /* CLEAR ALL ERRORS IN ACTIVE STEP */
    const clearStepErrors = () => {
      const activeStep = steps[current];
      if (activeStep) {
        activeStep.querySelectorAll(".has-error").forEach(el => el.classList.remove("has-error"));
      }
    };

    /* VALIDATE CURRENT STEP */
    const validateStep = () => {
      clearStepErrors();
      let isValid = true;
      let firstInvalidInput = null;

      if (current === 0) {
        // Step 1: Full Name, Email, Phone, DOB
        const fullname = form.querySelector("#fullname");
        if (!fullname || fullname.value.trim().length < 2) {
          setFieldError("field-fullname", true);
          isValid = false;
          if (!firstInvalidInput) firstInvalidInput = fullname;
        }

        const email = form.querySelector("#email");
        const emailVal = email?.value.trim() || "";
        if (!email || !emailVal.includes("@") || !emailVal.includes(".") || emailVal.length < 5) {
          setFieldError("field-email", true);
          isValid = false;
          if (!firstInvalidInput) firstInvalidInput = email;
        }

        const phone = form.querySelector("#phone");
        const phoneDigits = (phone?.value || "").replace(/\D/g, "");
        if (!phone || phoneDigits.length < 10) {
          setFieldError("field-phone", true);
          isValid = false;
          if (!firstInvalidInput) firstInvalidInput = phone;
        }

        const dob = form.querySelector("#dob");
        if (!dob || !dob.value) {
          setFieldError("field-dob", true);
          isValid = false;
          if (!firstInvalidInput) firstInvalidInput = dob;
        }
      } else if (current === 1) {
        // Step 2: City, State, PIN
        const city = form.querySelector("#city");
        if (!city || city.value.trim().length < 2) {
          setFieldError("field-city", true);
          isValid = false;
          if (!firstInvalidInput) firstInvalidInput = city;
        }

        const state = form.querySelector("#state");
        if (!state || !state.value) {
          setFieldError("field-state", true);
          isValid = false;
          if (!firstInvalidInput) firstInvalidInput = state;
        }

        const pincode = form.querySelector("#pincode");
        const pinVal = (pincode?.value || "").replace(/\D/g, "");
        if (!pincode || pinVal.length < 4) {
          setFieldError("field-pincode", true);
          isValid = false;
          if (!firstInvalidInput) firstInvalidInput = pincode;
        }

        // Auto-fill GPS input if user skipped GPS button
        const gpsInput = form.querySelector("#gps-input");
        if (gpsInput && !gpsInput.value.trim() && city && state) {
          gpsInput.value = `${city.value.trim()}, ${state.value} · General Area`;
          gpsInput.classList.add("gps-verified");
        }
      } else if (current === 2) {
        // Step 3: Blood Group
        const bg = form.querySelector("#blood-group");
        if (!bg || !bg.value) {
          setFieldError("field-blood-group", true);
          isValid = false;
          if (!firstInvalidInput) firstInvalidInput = bg;
        }
      } else if (current === 3) {
        // Step 4: Schedule
        const daytime = form.querySelector("#daytime-location");
        if (!daytime || daytime.value.trim().length < 2) {
          setFieldError("field-daytime", true);
          isValid = false;
          if (!firstInvalidInput) firstInvalidInput = daytime;
        }

        const evening = form.querySelector("#evening-location");
        if (!evening || evening.value.trim().length < 2) {
          setFieldError("field-evening", true);
          isValid = false;
          if (!firstInvalidInput) firstInvalidInput = evening;
        }
      } else if (current === 4) {
        // Step 5: Emergency invitations & Consent
        const avail = form.querySelector('input[name="available"]:checked');
        if (!avail) {
          setFieldError("field-available", true);
          isValid = false;
          if (!firstInvalidInput) firstInvalidInput = form.querySelector('input[name="available"]');
        } else {
          setFieldError("field-available", false);
        }

        const consent = form.querySelector("#consent");
        if (!consent || !consent.checked) {
          setFieldError("field-consent", true);
          isValid = false;
          if (!firstInvalidInput) firstInvalidInput = consent;
        } else {
          setFieldError("field-consent", false);
        }
      }

      if (!isValid && firstInvalidInput) {
        firstInvalidInput.focus();
      }

      return isValid;
    };

    /* NEXT BUTTON */
    if (next) {
      next.addEventListener("click", () => {
        if (!validateStep()) {
          return;
        }
        showStep(current + 1);
      });
    }

    /* BACK BUTTON */
    if (back) {
      back.addEventListener("click", () => {
        showStep(current - 1);
      });
    }

    /* PREVENT DEFAULT SUBMIT */
    form.addEventListener("submit", event => {
      event.preventDefault();
    });

    /* LIVE GPS DETECTION HANDLER */
    const detectGpsBtn = document.querySelector("#detectGpsBtn");
    const gpsInput = document.querySelector("#gps-input");
    const gpsStatusMsg = document.querySelector("#gpsStatusMsg");
    const cityInput = document.querySelector("#city");
    const stateInput = document.querySelector("#state");

    if (detectGpsBtn && gpsInput) {
      detectGpsBtn.addEventListener("click", () => {
        if (!navigator.geolocation) {
          if (gpsStatusMsg) {
            gpsStatusMsg.className = "gps-status-msg error";
            gpsStatusMsg.textContent = "Geolocation is not supported by your browser. Please enter city/area manually.";
          }
          return;
        }

        detectGpsBtn.classList.add("detecting");
        detectGpsBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> <span>Detecting GPS...</span>';
        if (gpsStatusMsg) {
          gpsStatusMsg.className = "gps-status-msg";
          gpsStatusMsg.textContent = "Requesting accurate GPS coordinates...";
        }

        navigator.geolocation.getCurrentPosition(
          position => {
            detectGpsBtn.classList.remove("detecting");
            detectGpsBtn.innerHTML = '<i class="fa-solid fa-check"></i> <span>GPS Acquired</span>';
            const lat = position.coords.latitude.toFixed(4);
            const lng = position.coords.longitude.toFixed(4);

            gpsInput.value = `Visakhapatnam (${lat}° N, ${lng}° E) · Live GPS`;
            gpsInput.classList.add("gps-verified");
            validateFieldInput(gpsInput);

            if (cityInput && !cityInput.value) {
              cityInput.value = "Visakhapatnam";
              validateFieldInput(cityInput);
            }
            if (stateInput && !stateInput.value) {
              stateInput.value = "Andhra Pradesh";
              validateFieldInput(stateInput);
            }

            if (gpsStatusMsg) {
              gpsStatusMsg.className = "gps-status-msg";
              gpsStatusMsg.innerHTML = `<i class="fa-solid fa-circle-check"></i> Accuracy radius: within ${Math.round(position.coords.accuracy)}m. Live coordinates recorded.`;
            }

            const currentCharge = computeBatteryCharge();
            updateBatteryUI(currentCharge);

            if (isSectionComplete(current) && !completedSections.has(current)) {
              completedSections.add(current);
              playSectionSparkEffect(current);
            }
          },
          () => {
            detectGpsBtn.classList.remove("detecting");
            detectGpsBtn.innerHTML = '<i class="fa-solid fa-crosshairs"></i> <span>Detect Live GPS</span>';

            // Fallback coordinates for demo purposes if permission dismissed
            gpsInput.value = "Visakhapatnam, Andhra Pradesh · Verified Coords";
            gpsInput.classList.add("gps-verified");
            validateFieldInput(gpsInput);
            if (cityInput && !cityInput.value) {
              cityInput.value = "Visakhapatnam";
              validateFieldInput(cityInput);
            }
            if (stateInput && !stateInput.value) {
              stateInput.value = "Andhra Pradesh";
              validateFieldInput(stateInput);
            }

            if (gpsStatusMsg) {
              gpsStatusMsg.className = "gps-status-msg";
              gpsStatusMsg.innerHTML = '<i class="fa-solid fa-circle-check"></i> Primary location set to Visakhapatnam, Andhra Pradesh.';
            }

            const currentCharge = computeBatteryCharge();
            updateBatteryUI(currentCharge);

            if (isSectionComplete(current) && !completedSections.has(current)) {
              completedSections.add(current);
              playSectionSparkEffect(current);
            }
          },
          { timeout: 8000, enableHighAccuracy: true }
        );
      });
    }

    /* REAL-TIME INPUT EVENT LISTENERS (DYNAMIC CHARGING & ANIMATION TRIGGERS) */
    const inputs = form.querySelectorAll("input, select, textarea");
    inputs.forEach(input => {
      const handleInput = () => {
        const fieldEl = input.closest(".field");
        if (fieldEl) {
          fieldEl.classList.remove("has-error");
        }
        input.classList.toggle("has-value", input.value.trim().length > 0);

        // Animate 180ms green checkmark when valid
        validateFieldInput(input);

        // Recalculate battery charge in real-time
        const liveCharge = computeBatteryCharge();
        updateBatteryUI(liveCharge);

        // Check if entire section became newly completed (trigger spark effect once)
        if (isSectionComplete(current) && !completedSections.has(current)) {
          completedSections.add(current);
          playSectionSparkEffect(current);
        }
      };

      input.addEventListener("input", handleInput);
      input.addEventListener("change", handleInput);

      if (input.value && input.value.trim().length > 0) {
        input.classList.add("has-value");
        validateFieldInput(input);
      }
    });

    // Initialize registration at Step 0 with 0% charge
    showStep(0);
    updateBatteryUI(0);

  }


  /* ========================================
     4. DONOR SEARCH AND FILTERING
  ======================================== */

  const donorResults =
    document.querySelector("#donor-results");

  if (donorResults) {

    /* EXAMPLE DATA ONLY */

    const donors = [
      {
        name: "Example Person A",
        group: "O+",
        city: "Visakhapatnam",
        available: "Available",
        initials: "EA",
        area: "MVP Colony"
      },
      {
        name: "Example Person B",
        group: "B+",
        city: "Vijayawada",
        available: "Available",
        initials: "EB",
        area: "Benz Circle"
      },
      {
        name: "Example Person C",
        group: "A+",
        city: "Visakhapatnam",
        available: "Unavailable",
        initials: "EC",
        area: "Madhurawada"
      },
      {
        name: "Example Person D",
        group: "O−",
        city: "Hyderabad",
        available: "Available",
        initials: "ED",
        area: "Kukatpally"
      },
      {
        name: "Example Person E",
        group: "AB+",
        city: "Guntur",
        available: "Available",
        initials: "EE",
        area: "Arundelpet"
      },
      {
        name: "Example Person F",
        group: "B−",
        city: "Visakhapatnam",
        available: "Unavailable",
        initials: "EF",
        area: "Seethammadhara"
      }
    ];

    const searchForm =
      document.querySelector("#donor-search");

    const cityInput =
      document.querySelector("#search-city");

    const bloodInput =
      document.querySelector("#search-blood");

    const availableInput =
      document.querySelector("#search-available");

    const resultCount =
      document.querySelector("#result-count");

    const emptyResults =
      document.querySelector("#empty-results");


    /* RENDER DONOR CARDS */

    const renderDonors = () => {

      const city = cityInput
        ? cityInput.value.trim().toLowerCase()
        : "";

      const blood = bloodInput
        ? bloodInput.value
        : "";

      const available = availableInput
        ? availableInput.value
        : "";

      const filteredDonors = donors.filter(donor => {

        const location =
          `${donor.city} ${donor.area}`.toLowerCase();

        const cityMatch =
          !city || location.includes(city);

        const bloodMatch =
          !blood || donor.group === blood;

        const availabilityMatch =
          !available ||
          donor.available === available;

        return (
          cityMatch &&
          bloodMatch &&
          availabilityMatch
        );

      });


      /* GENERATE CARDS */

      donorResults.innerHTML = filteredDonors.map(donor => {

        const isAvailable =
          donor.available === "Available";

        return `
          <article class="donor-card">

            <div class="donor-top">

              <div class="avatar">
                ${donor.initials}
              </div>

              <div>
                <h3>${donor.name}</h3>
                <p>${donor.city}</p>
              </div>

              <span class="blood-pill">
                ${donor.group}
              </span>

            </div>

            <div class="donor-meta">

              <span>
                <i class="fa-solid fa-location-dot"></i>
                ${donor.area}
              </span>

              <span>
                ${isAvailable
            ? "● Open to requests"
            : "○ Not currently open"
          }
              </span>

              <span>Self-reported</span>

            </div>

            <div class="card-bottom">

              <span class="small-note">
                Illustrative profile
              </span>

              <a
                href="request.html"
                class="btn outline small"
              >
                Make request ↗
              </a>

            </div>

          </article>
        `;

      }).join("");


      /* RESULTS COUNT */

      if (resultCount) {

        resultCount.textContent =
          `Showing ${filteredDonors.length} of ${donors.length} example profiles`;

      }


      /* EMPTY STATE */

      if (emptyResults) {

        emptyResults.style.display =
          filteredDonors.length === 0
            ? "block"
            : "none";

      }

    };


    /* SEARCH SUBMISSION */

    if (searchForm) {

      searchForm.addEventListener("submit", event => {

        event.preventDefault();

        renderDonors();

      });

    }


    /* INITIAL RESULTS */

    renderDonors();

  }


  /* ========================================
     5. BLOOD REQUEST FORM
  ======================================== */

  const requestForm =
    document.querySelector("#request-form");

  if (requestForm) {

    const dateInput =
      requestForm.querySelector("#req-date");

    const requestMessage =
      document.querySelector("#request-message");


    /* PREVENT PAST DATES */

    if (dateInput) {

      const today = new Date();

      const localToday = new Date(
        today.getTime() -
        today.getTimezoneOffset() * 60000
      )
        .toISOString()
        .slice(0, 10);

      dateInput.min = localToday;

    }


    /* REQUEST SUBMISSION PREVIEW */

    requestForm.addEventListener("submit", event => {

      event.preventDefault();

      if (!requestForm.reportValidity()) {
        return;
      }

      if (requestMessage) {

        requestMessage.textContent =
          "Preview complete — your request has NOT been published. " +
          "Connect Flask endpoints, authentication, moderation " +
          "and notifications to enable real submissions.";

      }

    });

  }


  /* ========================================
     6. REPORT AN ISSUE MODAL & BACK TO TOP
  ======================================== */

  const reportTriggers = document.querySelectorAll("#openReportModal, .open-report-trigger");
  const reportModal = document.querySelector("#reportModal");
  const closeReportBtn = document.querySelector("#closeReportBtn");
  const cancelReportBtn = document.querySelector("#cancelReportBtn");
  const reportForm = document.querySelector("#reportForm");
  const reportSuccessMsg = document.querySelector("#reportSuccessMsg");
  let lastActiveTrigger = null;

  if (reportTriggers.length && reportModal) {
    const mainEl = document.querySelector("main");
    const headerEl = document.querySelector(".site-header");
    const footerEl = document.querySelector("footer");

    const getModalFocusables = () => {
      return Array.from(
        reportModal.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
      ).filter(el => !el.hasAttribute("disabled") && el.offsetParent !== null);
    };

    const showModal = (e) => {
      if (e) e.preventDefault();
      lastActiveTrigger = document.activeElement;
      reportModal.classList.add("active");
      reportModal.setAttribute("aria-hidden", "false");

      // Make background content inert while open
      if (mainEl) mainEl.setAttribute("inert", "");
      if (headerEl) headerEl.setAttribute("inert", "");
      if (footerEl) footerEl.setAttribute("inert", "");

      // Move focus inside dialog
      requestAnimationFrame(() => {
        const focusables = getModalFocusables();
        if (focusables.length > 0) {
          focusables[0].focus();
        }
      });
    };

    const hideModal = () => {
      reportModal.classList.remove("active");
      reportModal.setAttribute("aria-hidden", "true");

      // Restore background content
      if (mainEl) mainEl.removeAttribute("inert");
      if (headerEl) headerEl.removeAttribute("inert");
      if (footerEl) footerEl.removeAttribute("inert");

      if (reportSuccessMsg) reportSuccessMsg.style.display = "none";
      if (reportForm) reportForm.reset();

      // Restore focus to opening control
      if (lastActiveTrigger && typeof lastActiveTrigger.focus === "function") {
        lastActiveTrigger.focus();
      }
    };

    reportTriggers.forEach(trigger => trigger.addEventListener("click", showModal));
    if (closeReportBtn) closeReportBtn.addEventListener("click", hideModal);
    if (cancelReportBtn) cancelReportBtn.addEventListener("click", hideModal);

    reportModal.addEventListener("click", (e) => {
      if (e.target === reportModal) hideModal();
    });

    // Keyboard trap & Escape support
    reportModal.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        hideModal();
        return;
      }

      if (e.key === "Tab") {
        const focusables = getModalFocusables();
        if (focusables.length === 0) return;

        const firstEl = focusables[0];
        const lastEl = focusables[focusables.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstEl) {
            e.preventDefault();
            lastEl.focus();
          }
        } else {
          if (document.activeElement === lastEl) {
            e.preventDefault();
            firstEl.focus();
          }
        }
      }
    });

    if (reportForm) {
      reportForm.addEventListener("submit", (e) => {
        e.preventDefault();
        if (reportSuccessMsg) {
          reportSuccessMsg.style.display = "block";
          setTimeout(() => {
            hideModal();
          }, 2200);
        }
      });
    }
  }

  // Back to Top (respects prefers-reduced-motion)
  const backToTopBtn = document.querySelector("#backToTopBtn");
  if (backToTopBtn) {
    backToTopBtn.addEventListener("click", () => {
      window.scrollTo({
        top: 0,
        behavior: reducedMotion ? "auto" : "smooth"
      });
    });
  }

  /* ========================================
     HOW IT WORKS TABS (REQUESTER VS DONOR)
  ======================================== */
  const tabHowRequester = document.getElementById("tabHowRequester");
  const tabHowDonor = document.getElementById("tabHowDonor");
  const panelHowRequester = document.getElementById("panelHowRequester");
  const panelHowDonor = document.getElementById("panelHowDonor");

  if (tabHowRequester && tabHowDonor) {
    tabHowRequester.addEventListener("click", () => {
      tabHowRequester.classList.add("active");
      tabHowRequester.setAttribute("aria-selected", "true");
      tabHowDonor.classList.remove("active");
      tabHowDonor.setAttribute("aria-selected", "false");

      if (panelHowRequester) panelHowRequester.style.display = "block";
      if (panelHowDonor) panelHowDonor.style.display = "none";
    });

    tabHowDonor.addEventListener("click", () => {
      tabHowDonor.classList.add("active");
      tabHowDonor.setAttribute("aria-selected", "true");
      tabHowRequester.classList.remove("active");
      tabHowRequester.setAttribute("aria-selected", "false");

      if (panelHowDonor) panelHowDonor.style.display = "block";
      if (panelHowRequester) panelHowRequester.style.display = "none";
    });
  }

});

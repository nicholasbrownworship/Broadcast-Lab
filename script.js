// Broadcast Lab – Preview / Program with switcher-style transitions + camera preview
(function () {
  function $(selector) {
    return document.querySelector(selector);
  }
  function $all(selector) {
    return Array.from(document.querySelectorAll(selector));
  }

  // === ELEMENTS ===
  const overlaySelect = $("#overlaySelect");
  const overlayNotes = $("#overlayNotes");
  const switchFlash = $("#programSwitchFlash");
  const btnThemeToggle = $("#btnThemeToggle");
  const btnFakeData = $("#btnFakeData");
  const btnTakeLive = $("#btnTakeLive");
  const btnStartCam = $("#btnStartCam");
  const previewCam = $("#previewCam");
  const liveCam = $("#liveCam");

  let camStream = null;

  // Track current overlay types
  let currentPreviewOverlay = "lower-third";
  let currentLiveOverlay = "lower-third";

  // === OVERLAY HELP TEXT ===
  const overlayHelp = {
    "lower-third":
      "Lower third: use for intros, interviews, and feature segments.",
    "score-bug":
      "Score bug: use in the corner during live play for match score & status.",
    "matchup-bar":
      "Matchup bar: use over tee shots or B-roll when introducing a head-to-head match.",
    desk:
      "Desk panel: use when hosts are on camera at the desk, introducing topics or breaking down the round.",
    "coming-up":
      "Coming up slate: use over B-roll or wide shots when teasing the next few segments."
  };

  // === CAMERA PREVIEW ===

  async function startCamera() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert("Camera access is not supported in this browser.");
      return;
    }

    try {
      // Stop any existing stream
      if (camStream) {
        camStream.getTracks().forEach((t) => t.stop());
        camStream = null;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false
      });

      camStream = stream;

      if (previewCam) {
        previewCam.srcObject = stream;
      }
      if (liveCam) {
        liveCam.srcObject = stream;
      }
    } catch (err) {
      console.error("Error starting camera:", err);
      alert("Could not access camera. Check permissions and try again.");
    }
  }

  if (btnStartCam) {
    btnStartCam.addEventListener("click", startCamera);
  }

  // Clean up camera when leaving the page
  window.addEventListener("beforeunload", () => {
    if (camStream) {
      camStream.getTracks().forEach((t) => t.stop());
    }
  });

  // === OVERLAY SWITCHING ===

  function setOverlayImmediate(type, screen) {
    // screen: "preview" or "live"
    $all('.overlay[data-screen="' + screen + '"]').forEach((el) => {
      if (el.dataset.overlay === type) {
        el.classList.add("is-active");
      } else {
        el.classList.remove("is-active");
      }
    });

    if (screen === "preview" && overlayNotes) {
      overlayNotes.textContent = overlayHelp[type] || "";
    }
  }

  function triggerSwitchFx(callback) {
    if (!switchFlash) {
      if (typeof callback === "function") callback();
      return;
    }

    switchFlash.classList.remove("is-on");
    void switchFlash.offsetWidth; // reflow
    switchFlash.classList.add("is-on");

    setTimeout(() => {
      if (typeof callback === "function") callback();
    }, 120);
  }

  if (switchFlash) {
    switchFlash.addEventListener("animationend", () => {
      switchFlash.classList.remove("is-on");
    });
  }

  function changeOverlay(type, screen, animate = true) {
    if (screen === "live" && animate) {
      triggerSwitchFx(() => setOverlayImmediate(type, "live"));
      currentLiveOverlay = type;
    } else {
      setOverlayImmediate(type, screen);
      if (screen === "preview") currentPreviewOverlay = type;
    }
  }

  if (overlaySelect) {
    overlaySelect.addEventListener("change", () => {
      const val = overlaySelect.value || "lower-third";
      changeOverlay(val, "preview", false);
    });

    // Initial state
    changeOverlay(overlaySelect.value || "lower-third", "preview", false);
    changeOverlay(overlaySelect.value || "lower-third", "live", false);
  }

  // === DATA BINDINGS ===

  const bindings = [
    { inputId: "fieldTournament", bindKey: "tournament" },
    { inputId: "fieldRound", bindKey: "round" },
    { inputId: "fieldSegment", bindKey: "segment" },
    { inputId: "fieldSponsor", bindKey: "sponsor" },
    { inputId: "fieldPlayer1", bindKey: "player1" },
    { inputId: "fieldPlayer1Team", bindKey: "player1Team" },
    { inputId: "fieldPlayer1Score", bindKey: "player1Score" },
    { inputId: "fieldMatchStatus", bindKey: "matchStatus" },
    { inputId: "fieldPlayer2", bindKey: "player2" },
    { inputId: "fieldPlayer2Team", bindKey: "player2Team" },
    { inputId: "fieldPlayer2Score", bindKey: "player2Score" },
    // Desk / slate
    { inputId: "fieldHost1", bindKey: "host1" },
    { inputId: "fieldHost2", bindKey: "host2" },
    { inputId: "fieldTopic", bindKey: "topic" },
    { inputId: "fieldComing1", bindKey: "coming1" },
    { inputId: "fieldComing2", bindKey: "coming2" },
    { inputId: "fieldComing3", bindKey: "coming3" }
  ];

  function updateBoundElements(bindKey, value, target) {
    // target: "preview" or "live"
    const selector =
      '[data-bind="' + bindKey + '"][data-target="' + target + '"]';
    const els = $all(selector);

    els.forEach((el) => {
      const def = el.getAttribute("data-default") || "";
      const text = (value || "").trim();
      el.textContent = text || def;
    });
  }

  // Inputs drive PREVIEW only
  bindings.forEach(({ inputId, bindKey }) => {
    const input = $("#" + inputId);
    if (!input) return;

    input.addEventListener("input", () => {
      updateBoundElements(bindKey, input.value || "", "preview");
    });
  });

  // === THEME TOGGLE ===

  function applyTheme(theme) {
    const body = document.body;
    if (theme === "light") {
      body.classList.add("theme-light");
    } else {
      body.classList.remove("theme-light");
    }
    try {
      localStorage.setItem("broadcastLabTheme", theme);
    } catch (_) {
      // ignore
    }
  }

  if (btnThemeToggle) {
    btnThemeToggle.addEventListener("click", () => {
      const body = document.body;
      const nextTheme = body.classList.contains("theme-light")
        ? "dark"
        : "light";
      applyTheme(nextTheme);
    });
  }

  (function initTheme() {
    let theme = "dark";
    try {
      theme = localStorage.getItem("broadcastLabTheme") || "dark";
    } catch (_) {
      theme = "dark";
    }
    applyTheme(theme);
  })();

  // === SAMPLE DATA ===

  const sampleData = {
    tournament: "Ozark Invitational",
    round: "Day 1 — Best Ball",
    segment: "Feature Group",
    sponsor: "Presented by +3 Golf Co.",
    player1: "Nick Brown",
    player1Team: "Team Ozark",
    player1Score: "-3 thru 8",
    matchStatus: "2 Up — Ozark",
    player2: "Valley Player",
    player2Team: "Team Valley",
    player2Score: "+1 thru 8",
    host1: "Nick Brown",
    host2: "Guest Analyst",
    topic: "Key matches that could swing the cup",
    coming1: "Feature Group on 7 tee",
    coming2: "Mic’d Up: Cart Cam Highlights",
    coming3: "Scoreboard check & standings"
  };

  function loadSampleData() {
    bindings.forEach(({ inputId, bindKey }) => {
      const val = sampleData[bindKey];
      const input = $("#" + inputId);
      if (!input || typeof val !== "string") return;
      input.value = val;
      updateBoundElements(bindKey, val, "preview");
      updateBoundElements(bindKey, val, "live");
    });
  }

  if (btnFakeData) {
    btnFakeData.addEventListener("click", () => {
      loadSampleData();
    });
  }

  (function initSampleOnce() {
    try {
      const flag = localStorage.getItem("broadcastLabSampleLoaded");
      if (!flag) {
        loadSampleData();
        localStorage.setItem("broadcastLabSampleLoaded", "1");
      }
    } catch (_) {
      // ignore
    }
  })();

  // === TAKE TO LIVE ===

  function takeToLive() {
    // 1) Copy all text values from preview (inputs) to live bindings
    bindings.forEach(({ inputId, bindKey }) => {
      const input = $("#" + inputId);
      const val = input ? input.value || "" : "";
      updateBoundElements(bindKey, val, "live");
    });

    // 2) Switch the overlay type on the live/program frame with flash
    const newType = currentPreviewOverlay;
    changeOverlay(newType, "live", true);
  }

  if (btnTakeLive) {
    btnTakeLive.addEventListener("click", () => {
      takeToLive();
    });
  }
})();

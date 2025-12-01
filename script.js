// Broadcast Lab – basic interactivity
(function () {
  function $(selector) {
    return document.querySelector(selector);
  }
  function $all(selector) {
    return Array.from(document.querySelectorAll(selector));
  }

  // ========== OVERLAY SWITCHER ==========
  const overlaySelect = $("#overlaySelect");
  const overlayNotes = $("#overlayNotes");

  const overlayHelp = {
    "lower-third":
      "Lower third: use for intros, interviews, and feature segments.",
    "score-bug":
      "Score bug: use in the corner during live play for match score & status.",
    "matchup-bar":
      "Matchup bar: use over B-roll or tee shots when introducing players."
  };

  function setActiveOverlay(type) {
    $all(".overlay").forEach((el) => {
      if (el.dataset.overlay === type) {
        el.classList.add("is-active");
      } else {
        el.classList.remove("is-active");
      }
    });

    if (overlayNotes) {
      overlayNotes.textContent = overlayHelp[type] || "";
    }
  }

  if (overlaySelect) {
    overlaySelect.addEventListener("change", () => {
      setActiveOverlay(overlaySelect.value);
    });
    // Initial state
    setActiveOverlay(overlaySelect.value || "lower-third");
  }

  // ========== DATA BINDINGS ==========
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
    { inputId: "fieldPlayer2Score", bindKey: "player2Score" }
  ];

  function updateBoundElements(bindKey, value) {
    const els = $all('[data-bind="' + bindKey + '"]');
    els.forEach((el) => {
      const def = el.getAttribute("data-default") || "";
      const text = value.trim();
      el.textContent = text || def;
    });
  }

  bindings.forEach(({ inputId, bindKey }) => {
    const input = $("#" + inputId);
    if (!input) return;

    input.addEventListener("input", () => {
      updateBoundElements(bindKey, input.value || "");
    });
  });

  // ========== THEME TOGGLE ==========
  const btnThemeToggle = $("#btnThemeToggle");

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
      // ignore storage errors
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

  // Initialize theme from storage
  (function initTheme() {
    let theme = "dark";
    try {
      theme = localStorage.getItem("broadcastLabTheme") || "dark";
    } catch (_) {
      theme = "dark";
    }
    applyTheme(theme);
  })();

  // ========== FAKE DATA / SAMPLE BUTTON ==========
  const btnFakeData = $("#btnFakeData");

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
    player2Score: "+1 thru 8"
  };

  function loadSampleData() {
    bindings.forEach(({ inputId, bindKey }) => {
      const val = sampleData[bindKey];
      const input = $("#" + inputId);
      if (input && typeof val === "string") {
        input.value = val;
        updateBoundElements(bindKey, val);
      }
    });
  }

  if (btnFakeData) {
    btnFakeData.addEventListener("click", () => {
      loadSampleData();
    });
  }

  // Optionally preload sample data once on first visit
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
})();

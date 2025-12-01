// Broadcast Lab – Preview/Program with video + overlay switcher, camera, scenes,
// hotkeys, guides & graphics mode.
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
  const videoSourceSelect = $("#videoSourceSelect");
  const btnThemeToggle = $("#btnThemeToggle");
  const btnFakeData = $("#btnFakeData");
  const btnTakeLive = $("#btnTakeLive");
  const btnStartCam = $("#btnStartCam");
  const btnSafeGuides = $("#btnSafeGuides");
  const btnGraphicsMode = $("#btnGraphicsMode");
  const btnExitGraphics = $("#btnExitGraphics");
  const previewCam = $("#previewCam");
  const liveCam = $("#liveCam");
  const sceneGrid = $("#sceneGrid");

  const previewFrame = document.querySelector(
    ".preview-frame:not(.program-frame)"
  );
  const programFrame = document.querySelector(".preview-frame.program-frame");

  // === STATE ===
  let camStream = null;

  let currentPreviewOverlay = "lower-third";
  let currentLiveOverlay = "lower-third";

  let currentPreviewVideo = "camera";
  let currentLiveVideo = "camera";

  const SCENES_KEY = "broadcastLabScenes_v1";
  let scenes = [];

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
      "Coming up slate: use over B-roll or wide shots when teasing the next few segments.",
    none:
      "No overlay: clean feed for replays, drone shots, or scoreboard-only looks."
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

  // === SAFE GUIDES TOGGLE ===
  function toggleSafeGuides() {
    document.body.classList.toggle("show-safe-guides");
  }

  if (btnSafeGuides) {
    btnSafeGuides.addEventListener("click", toggleSafeGuides);
  }

  // === GRAPHICS-ONLY PROGRAM MODE ===
  function enterGraphicsMode() {
    document.body.classList.add("graphics-mode");
  }

  function exitGraphicsMode() {
    document.body.classList.remove("graphics-mode");
  }

  function toggleGraphicsMode() {
    if (document.body.classList.contains("graphics-mode")) {
      exitGraphicsMode();
    } else {
      enterGraphicsMode();
    }
  }

  if (btnGraphicsMode) {
    btnGraphicsMode.addEventListener("click", toggleGraphicsMode);
  }

  if (btnExitGraphics) {
    btnExitGraphics.addEventListener("click", () => {
      exitGraphicsMode();
    });
  }

  // === VIDEO SOURCE SWITCHING ===

  function setVideoSource(frame, source) {
    if (!frame) return;
    frame.dataset.videoSource = source;
  }

  function cycleVideoSource() {
    if (!videoSourceSelect) return;
    const options = Array.from(videoSourceSelect.options).map((o) => o.value);
    if (!options.length) return;

    const idx = options.indexOf(currentPreviewVideo);
    const next = options[(idx + 1) % options.length];

    currentPreviewVideo = next;
    videoSourceSelect.value = next;
    setVideoSource(previewFrame, next);
  }

  if (videoSourceSelect) {
    videoSourceSelect.addEventListener("change", () => {
      const val = videoSourceSelect.value || "camera";
      currentPreviewVideo = val;
      setVideoSource(previewFrame, val);
    });
  }

  // Initialize video source state
  setVideoSource(previewFrame, currentPreviewVideo);
  setVideoSource(programFrame, currentLiveVideo);

  // === OVERLAY SWITCHING ===

  function setOverlayImmediate(type, screen) {
    const overlays = $all('.overlay[data-screen="' + screen + '"]');

    if (type === "none") {
      overlays.forEach((el) => el.classList.remove("is-active"));
    } else {
      overlays.forEach((el) => {
        if (el.dataset.overlay === type) {
          el.classList.add("is-active");
        } else {
          el.classList.remove("is-active");
        }
      });
    }

    if (screen === "preview" && overlayNotes) {
      overlayNotes.textContent = overlayHelp[type] || "";
    }
  }

  function triggerOverlayFlash(overlayEl) {
    if (!overlayEl) return;
    const flash = overlayEl.querySelector(".overlay-switch-flash");
    if (!flash) return;

    flash.classList.remove("is-on");
    // Force reflow to restart animation
    void flash.offsetWidth;
    flash.classList.add("is-on");
  }

  function changeOverlay(type, screen, animate = true) {
    if (screen === "live") {
      setOverlayImmediate(type, "live");
      currentLiveOverlay = type;

      if (animate && type !== "none") {
        const overlayEl = document.querySelector(
          '.overlay[data-screen="live"][data-overlay="' + type + '"]'
        );
        triggerOverlayFlash(overlayEl);
      }
    } else {
      setOverlayImmediate(type, "preview");
      currentPreviewOverlay = type;
    }
  }

  function cycleOverlay() {
    if (!overlaySelect) return;
    const options = Array.from(overlaySelect.options).map((o) => o.value);
    if (!options.length) return;

    const idx = options.indexOf(currentPreviewOverlay);
    const next = options[(idx + 1) % options.length];

    overlaySelect.value = next;
    changeOverlay(next, "preview", false);
  }

  if (overlaySelect) {
    overlaySelect.addEventListener("change", () => {
      const val = overlaySelect.value || "lower-third";
      changeOverlay(val, "preview", false);
    });

    // Initial state (keep lower third selected initially)
    const initial = overlaySelect.value || "lower-third";
    if (initial === "none") {
      // Force to lower-third by default
      changeOverlay("lower-third", "preview", false);
      changeOverlay("lower-third", "live", false);
    } else {
      changeOverlay(initial, "preview", false);
      changeOverlay(initial, "live", false);
    }
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

  function toggleTheme() {
    const body = document.body;
    const nextTheme = body.classList.contains("theme-light")
      ? "dark"
      : "light";
    applyTheme(nextTheme);
  }

  if (btnThemeToggle) {
    btnThemeToggle.addEventListener("click", toggleTheme);
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

  // === SCENES ===

  function captureCurrentPreviewFields() {
    const data = {};
    bindings.forEach(({ inputId, bindKey }) => {
      const input = $("#" + inputId);
      data[bindKey] = input ? input.value || "" : "";
    });
    return data;
  }

  function applyFieldsToPreview(fields) {
    if (!fields) return;
    bindings.forEach(({ inputId, bindKey }) => {
      const val = fields[bindKey];
      if (typeof val !== "string") return;
      const input = $("#" + inputId);
      if (input) {
        input.value = val;
        updateBoundElements(bindKey, val, "preview");
      }
    });
  }

  function saveScenesToStorage() {
    try {
      localStorage.setItem(SCENES_KEY, JSON.stringify(scenes));
    } catch (_) {
      // ignore
    }
  }

  function refreshSceneUI() {
    if (!sceneGrid) return;
    const rows = sceneGrid.querySelectorAll(".scene-row");
    rows.forEach((row) => {
      const idx = parseInt(row.dataset.sceneIndex, 10) || 0;
      const scene = scenes[idx];
      if (!scene) return;

      const nameInput = row.querySelector(".scene-name-input");
      const metaEl = row.querySelector("[data-scene-meta]");

      if (nameInput) {
        nameInput.value = scene.name || "";
      }

      if (metaEl) {
        const overlayLabel =
          scene.overlay === "none"
            ? "No overlay"
            : (scene.overlay || "lower-third");
        const videoLabel = scene.videoSource || "camera";
        const hasFields =
          scene.fields && Object.keys(scene.fields).length > 0;

        metaEl.textContent = hasFields
          ? overlayLabel + " • " + videoLabel
          : "Empty scene – Save to capture current preview.";
      }
    });
  }

  function loadScenes() {
    try {
      const raw = localStorage.getItem(SCENES_KEY);
      scenes = raw ? JSON.parse(raw) : [];
    } catch (_) {
      scenes = [];
    }
    if (!Array.isArray(scenes)) {
      scenes = [];
    }
    // Ensure four slots
    for (let i = 0; i < 4; i++) {
      if (!scenes[i]) {
        scenes[i] = {
          id: i + 1,
          name: "",
          overlay: "lower-third",
          videoSource: "camera",
          fields: {}
        };
      }
    }
    refreshSceneUI();
  }

  function saveScene(index) {
    const scene = scenes[index];
    if (!scene) return;

    scene.overlay = currentPreviewOverlay;
    scene.videoSource = currentPreviewVideo;
    scene.fields = captureCurrentPreviewFields();

    saveScenesToStorage();
    refreshSceneUI();
  }

  function recallScene(index) {
    const scene = scenes[index];
    if (!scene) return;

    const overlay = scene.overlay || "lower-third";
    const videoSource = scene.videoSource || "camera";

    // Apply overlay to preview
    if (overlaySelect) {
      overlaySelect.value = overlay;
    }
    changeOverlay(overlay, "preview", false);

    // Apply video source to preview
    if (videoSourceSelect) {
      videoSourceSelect.value = videoSource;
    }
    currentPreviewVideo = videoSource;
    setVideoSource(previewFrame, currentPreviewVideo);

    // Apply fields to preview inputs/bindings
    applyFieldsToPreview(scene.fields);
  }

  if (sceneGrid) {
    sceneGrid.addEventListener("click", function (evt) {
      const btn = evt.target.closest(".scene-btn");
      if (!btn) return;
      const row = btn.closest(".scene-row");
      if (!row) return;

      const idx = parseInt(row.dataset.sceneIndex, 10) || 0;
      const action = btn.getAttribute("data-scene-action");

      if (action === "save") {
        saveScene(idx);
      } else if (action === "recall") {
        recallScene(idx);
      }
    });

    sceneGrid.addEventListener("input", function (evt) {
      const input = evt.target;
      if (!input.classList.contains("scene-name-input")) return;
      const row = input.closest(".scene-row");
      if (!row) return;
      const idx = parseInt(row.dataset.sceneIndex, 10) || 0;
      const scene = scenes[idx];
      if (!scene) return;

      scene.name = input.value || "";
      saveScenesToStorage();
    });
  }

  // Load scenes on startup
  loadScenes();

  // === TAKE TO LIVE ===

  function takeToLive() {
    // 1) Copy all text values from preview (inputs) to live bindings
    bindings.forEach(({ inputId, bindKey }) => {
      const input = $("#" + inputId);
      const val = input ? input.value || "" : "";
      updateBoundElements(bindKey, val, "live");
    });

    // 2) Switch overlay + video source on the live/program frame
    const newOverlay = currentPreviewOverlay;
    const newVideoSource = currentPreviewVideo;

    // Video source first, so overlay wipe rides on top of the final view
    currentLiveVideo = newVideoSource;
    setVideoSource(programFrame, currentLiveVideo);

    // Overlay cut with subtle overlay-only flash
    changeOverlay(newOverlay, "live", true);
  }

  if (btnTakeLive) {
    btnTakeLive.addEventListener("click", () => {
      takeToLive();
    });
  }

  // === GLOBAL HOTKEYS ===
  function handleGlobalHotkeys(e) {
    // Ignore when typing in form fields
    const target = e.target;
    if (
      target &&
      (target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable)
    ) {
      return;
    }

    // Ignore when modifier keys are held
    if (e.metaKey || e.ctrlKey || e.altKey) return;

    const key = e.key;

    switch (key) {
      case " ":
        // Space = TAKE live
        e.preventDefault();
        takeToLive();
        break;
      case "1":
      case "2":
      case "3":
      case "4": {
        const idx = parseInt(key, 10) - 1;
        recallScene(idx);
        break;
      }
      case "g":
      case "G":
        e.preventDefault();
        toggleGraphicsMode();
        break;
      case "s":
      case "S":
        e.preventDefault();
        toggleSafeGuides();
        break;
      case "t":
      case "T":
        e.preventDefault();
        toggleTheme();
        break;
      case "f":
      case "F":
        e.preventDefault();
        loadSampleData();
        break;
      case "v":
      case "V":
        e.preventDefault();
        cycleVideoSource();
        break;
      case "o":
      case "O":
        e.preventDefault();
        cycleOverlay();
        break;
      default:
        break;
    }
  }

  document.addEventListener("keydown", handleGlobalHotkeys);
})();

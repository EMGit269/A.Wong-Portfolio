(function () {
  const body = document.body;
  const overlay = document.querySelector(".intro-overlay");

  if (!overlay) {
    return;
  }

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reducedMotion) {
    body.classList.remove("intro-playing");
    body.classList.add("intro-complete");
    overlay.remove();
    return;
  }

  const statusBar = document.querySelector(".intro-toolbar");
  const statusText = document.querySelector(".intro-status-text");
  const userPrompt = document.querySelector('.intro-user-prompt[data-step="0"]');
  const skipButton = document.querySelector(".intro-skip-button");
  const pdfAttachment = document.querySelector(".intro-attachment");
  const pdfPanel = document.querySelector(".pdf-panel");
  const pdfClose = document.querySelector(".pdf-panel-close");
  const entryCard = document.querySelector(".intro-entry-card");
  const transcript = document.querySelector(".intro-transcript");
  const transcriptToggle = document.querySelector(".intro-transcript-toggle");
  const lines = Array.from(document.querySelectorAll(".intro-message .intro-line"));
  const editsPanel = document.querySelector(".intro-edits");
  const nameLine = document.querySelector(".intro-name");
  const heroNameText = document.querySelector(".hero-name-text");

  const timers = [];
  const heroNames = ["王汝昊", "Wang Ruhuao", "Allan Wong"];
  const workStartedAt = performance.now();
  let isCancelled = false;

  if (statusBar) {
    statusBar.remove();
  }

  function wait(ms) {
    return new Promise(function (resolve) {
      const timer = window.setTimeout(resolve, ms);
      timers.push(timer);
    });
  }

  function waitWithoutCancel(ms) {
    return new Promise(function (resolve) {
      window.setTimeout(resolve, ms);
    });
  }

  function setStatus(text, className) {
    if (!statusBar || !statusText) {
      return;
    }

    statusBar.classList.add("is-visible");
    statusBar.classList.remove("is-thinking", "is-output", "is-edited", "is-ready");
    statusBar.classList.add(className);
    statusText.textContent = text;
  }

  function thoughtLabel(startTime) {
    const seconds = Math.max(0.1, (performance.now() - startTime) / 1000);
    return `已思考 ${seconds.toFixed(1)} 秒`;
  }

  function workLabel() {
    const seconds = Math.max(0.1, (performance.now() - workStartedAt) / 1000);
    return `已工作 ${seconds.toFixed(1)} 秒`;
  }

  function finalizeThoughtNote(statusElement, startTime) {
    if (!statusElement) {
      return;
    }

    statusElement.classList.add("intro-thought-note");
    statusElement.classList.remove("is-thinking");
    statusElement.textContent = thoughtLabel(startTime);
  }

  function moveStatusBefore(element) {
    if (!statusBar || !element || !element.parentElement) {
      return;
    }

    element.parentElement.insertBefore(statusBar, element);
  }

  function createStatusBefore(element, text, className) {
    if (!statusBar || !element || !element.parentElement) {
      return null;
    }

    const status = statusBar.cloneNode(true);
    const textNode = status.querySelector(".intro-status-text");
    status.className = `intro-toolbar is-visible ${className}`;
    if (textNode) {
      textNode.textContent = text;
    }
    element.parentElement.insertBefore(status, element);
    return status;
  }

  function moveStatusAfter(element) {
    if (!statusBar || !element || !element.parentElement) {
      return;
    }

    element.parentElement.insertBefore(statusBar, element.nextSibling);
  }

  async function typeText(element, speed) {
    const original = element.dataset.text || element.textContent || "";
    element.dataset.text = original;
    element.textContent = "";
    element.classList.add("is-visible");

    for (const character of Array.from(original)) {
      if (isCancelled) {
        return;
      }

      appendStreamCharacter(element, character);
      await wait(speed);
    }
  }

  function appendStreamCharacter(parent, character) {
    const span = document.createElement("span");
    span.className = "intro-stream-char";
    span.textContent = character;
    parent.appendChild(span);
  }

  async function typeIntroName(element, speed) {
    const strongText = element.dataset.name || element.querySelector("strong")?.textContent || "";
    const plainText = element.dataset.text || element.textContent || "";
    const bodyText = plainText.startsWith(strongText)
      ? plainText.slice(strongText.length).trimStart()
      : plainText.trimStart();
    element.textContent = "";
    element.classList.add("is-visible");

    const strong = document.createElement("strong");
    element.appendChild(strong);

    for (const character of Array.from(strongText)) {
      if (isCancelled) {
        return;
      }

      appendStreamCharacter(strong, character);

      await wait(speed);
    }

    element.appendChild(document.createElement("br"));

    for (const character of Array.from(bodyText)) {
      if (isCancelled) {
        return;
      }

      appendStreamCharacter(element, character);
      await wait(speed);
    }
  }

  function enterSite() {
    isCancelled = true;
    for (const timer of timers) {
      window.clearTimeout(timer);
    }

    body.classList.remove("intro-playing");
    body.classList.add("intro-complete");
    closePdfPanel();
    overlay.classList.add("is-exiting");
    overlay.classList.add("is-finished");
    window.setTimeout(function () {
      overlay.remove();
    }, 180);
  }

  function openPdfPanel() {
    if (!pdfPanel || !pdfAttachment) {
      return;
    }

    overlay.classList.add("has-pdf-open");
    pdfPanel.classList.add("is-open");
    pdfPanel.setAttribute("aria-hidden", "false");
    pdfAttachment.setAttribute("aria-expanded", "true");
  }

  function closePdfPanel() {
    if (!pdfPanel || !pdfAttachment) {
      return;
    }

    overlay.classList.remove("has-pdf-open");
    pdfPanel.classList.remove("is-open");
    pdfPanel.setAttribute("aria-hidden", "true");
    pdfAttachment.setAttribute("aria-expanded", "false");
  }

  function collapseTranscript() {
    if (!transcript || !transcriptToggle) {
      return;
    }

    transcript.classList.add("is-collapsed");
    transcript.classList.remove("is-working");
    transcript.classList.remove("is-expanded");
    transcriptToggle.setAttribute("aria-expanded", "false");
    const label = transcriptToggle.querySelector(".intro-transcript-label");
    const action = transcriptToggle.querySelector(".intro-transcript-action");
    if (label) {
      label.textContent = workLabel();
    }
    if (action) {
      action.textContent = "";
    }
  }

  function showWorkingStatus() {
    if (!transcript || !transcriptToggle) {
      return;
    }

    transcript.classList.add("is-working");
    const label = transcriptToggle.querySelector(".intro-transcript-label");
    const action = transcriptToggle.querySelector(".intro-transcript-action");
    if (label) {
      label.textContent = "工作中";
    }
    if (action) {
      action.textContent = "";
    }
  }

  function toggleTranscript() {
    if (!transcript || !transcriptToggle) {
      return;
    }

    const isExpanded = transcript.classList.toggle("is-expanded");
    transcriptToggle.setAttribute("aria-expanded", String(isExpanded));
    const action = transcriptToggle.querySelector(".intro-transcript-action");
    if (action) {
      action.textContent = "";
    }
  }

  async function runIntro() {
    if (userPrompt) {
      const typingStatus = createStatusBefore(userPrompt, "typing", "is-thinking");
      if (typingStatus) {
        typingStatus.classList.add("is-user-typing");
      }
      await wait(980);
      if (typingStatus) {
        typingStatus.remove();
      }
      userPrompt.classList.add("is-visible");
      if (skipButton) {
        skipButton.classList.add("is-visible");
      }
      await wait(260);
    }

    showWorkingStatus();
    await wait(160);

    for (const line of lines) {
      if (isCancelled) {
        return;
      }

      const thoughtStartedAt = performance.now();
      const currentStatus = createStatusBefore(line, "思考中", "is-thinking");
      await wait(520);
      await typeText(line, 2);
      finalizeThoughtNote(currentStatus, thoughtStartedAt);
      await wait(140);
    }

    await wait(320);
    collapseTranscript();
    await wait(540);

    if (editsPanel && !isCancelled) {
      editsPanel.classList.add("is-visible");
      await wait(260);
    }

    if (nameLine && !isCancelled) {
      const thoughtStartedAt = performance.now();
      const currentStatus = createStatusBefore(nameLine, "思考中", "is-thinking");
      await wait(360);
      await typeIntroName(nameLine, 3);
      finalizeThoughtNote(currentStatus, thoughtStartedAt);
      await wait(140);
    }

    if (entryCard && !isCancelled) {
      entryCard.classList.add("is-visible");
      entryCard.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }

  async function runHeroNameLoop() {
    if (!heroNameText) {
      return;
    }

    let nameIndex = 0;

    while (true) {
      const currentName = heroNames[nameIndex % heroNames.length];
      heroNameText.replaceChildren();

      for (const character of Array.from(currentName)) {
        const previousActive = heroNameText.querySelector(".is-current");
        if (previousActive) {
          previousActive.classList.remove("is-current");
        }

        const characterElement = document.createElement("span");
        characterElement.className = "hero-name-char is-current";
        characterElement.textContent = character;
        heroNameText.appendChild(characterElement);
        await waitWithoutCancel(86);
      }

      const finalActive = heroNameText.querySelector(".is-current");
      if (finalActive) {
        finalActive.classList.remove("is-current");
      }

      await waitWithoutCancel(1050);

      while (heroNameText.lastChild) {
        heroNameText.removeChild(heroNameText.lastChild);
        await waitWithoutCancel(54);
      }

      await waitWithoutCancel(180);
      nameIndex += 1;
    }
  }

  if (entryCard) {
    entryCard.addEventListener("click", enterSite, { once: true });
  }

  if (skipButton) {
    skipButton.addEventListener("click", enterSite, { once: true });
  }

  if (pdfAttachment) {
    pdfAttachment.addEventListener("click", openPdfPanel);
  }

  if (pdfClose) {
    pdfClose.addEventListener("click", closePdfPanel);
  }

  window.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      closePdfPanel();
    }
  });

  if (transcriptToggle) {
    transcriptToggle.addEventListener("click", toggleTranscript);
  }

  window.addEventListener(
    "pagehide",
    function () {
      isCancelled = true;
      for (const timer of timers) {
        window.clearTimeout(timer);
      }
    },
    { once: true }
  );

  runIntro();
  runHeroNameLoop();
})();

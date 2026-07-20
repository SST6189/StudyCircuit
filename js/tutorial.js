document.addEventListener("DOMContentLoaded", () => {
  if (localStorage.getItem("tutorialDone")) {
    return;
  }

  let stepIndex = Number(localStorage.getItem("tutorialStep")) || 0;

  function currentPage() {
    let page = location.pathname.split("/").pop();

    if (page === "") {
      return "index.html";
    }

    return page;
  }

  function loadStep() {
    const step = tutorialSteps[stepIndex];

    const page = currentPage();

    // If tutorial step belongs to another page,
    // do nothing. Wait until Next moves there.
    if (page !== step.page) {
      return;
    }

    showTutorial(step);
  }

  function showTutorial(step) {
    removeOld();

    const overlay = document.createElement("div");

    overlay.id = "tutorial-overlay";

    overlay.innerHTML = `

<div id="tutorial-card">

<h2>${step.title}</h2>

<p>${step.text}</p>

<div class="tutorial-controls">

<button id="tutorial-back">
Back
</button>

<button id="tutorial-skip">
Skip
</button>

<button id="tutorial-next">
Next
</button>

</div>

</div>

`;

    document.body.appendChild(overlay);

    if (step.target) {
      const element = document.querySelector(step.target);

      if (element) {
        // Special actions for feature demonstrations
        if (step.action === "openInventory") {
          const inventory = document.getElementById("inventory-panel");
          const button = document.getElementById("toggle-inventory");

          if (inventory && inventory.classList.contains("closed")) {
            button.click();
          }
        }

        if (step.action === "openAI") {
          const button = document.querySelector(
            ".tool-section:nth-child(2) .tool-toggle",
          );

          if (button && !button.nextElementSibling.classList.contains("open")) {
            button.click();
          }
        }

        if (step.action === "openCalendar") {
          const button = document.querySelector(
            ".tool-section:nth-child(3) .tool-toggle",
          );

          if (button && !button.nextElementSibling.classList.contains("open")) {
            button.click();
          }
        }

        if (step.action === "openPlanner") {
          const button = document.querySelector(
            ".tool-section:nth-child(4) .tool-toggle",
          );

          if (button && !button.nextElementSibling.classList.contains("open")) {
            button.click();
          }
        }

        element.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });

        setTimeout(() => {
          createSpotlight(element);
        }, 900);
      }
    }

    const nextButton = document.getElementById("tutorial-next");
    const backButton = document.getElementById("tutorial-back");

    if (stepIndex === 0) {
      backButton.style.display = "none";
    } else {
      backButton.style.display = "block";
    }

    if (stepIndex === tutorialSteps.length - 1) {
      nextButton.textContent = "Finish";
      nextButton.onclick = end;
    } else {
      nextButton.textContent = "Next";
      nextButton.onclick = next;
    }

    backButton.onclick = back;

    const skipButton = document.getElementById("tutorial-skip");

    if (stepIndex === tutorialSteps.length - 1) {
      skipButton.style.display = "none";
    } else {
      skipButton.style.display = "block";
      skipButton.onclick = end;
    }
  }

  function next() {
    stepIndex++;

    if (stepIndex >= tutorialSteps.length) {
      end();
      return;
    }

    localStorage.setItem("tutorialStep", stepIndex);

    let nextStep = tutorialSteps[stepIndex];

    if (currentPage() !== nextStep.page) {
      location.href = nextStep.page;
    } else {
      loadStep();
    }
  }

  function back() {
    if (stepIndex <= 0) {
      return;
    }

    stepIndex--;

    localStorage.setItem("tutorialStep", stepIndex);

    const previousStep = tutorialSteps[stepIndex];

    if (currentPage() !== previousStep.page) {
      location.href = previousStep.page;
    } else {
      loadStep();
    }
  }

  function end() {
    localStorage.removeItem("tutorialStep");

    localStorage.setItem("tutorialDone", "true");

    removeOld();
  }

  function removeOld() {
    document.getElementById("tutorial-overlay")?.remove();

    document
      .querySelectorAll(".tutorial-focus")
      .forEach((e) => e.classList.remove("tutorial-focus"));
  }
  loadStep();
});

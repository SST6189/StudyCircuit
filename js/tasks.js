const taskInput = document.getElementById("new-task");
const taskDeadline = document.getElementById("task-deadline");
const taskDifficulty = document.getElementById("task-difficulty");
const taskList = document.getElementById("task-list");
const addButton = document.getElementById("add-task");
const subtaskList = document.getElementById("subtask-list");
const addSubtaskButton = document.getElementById("add-subtask");
const coinTotal = document.getElementById("coin-total");
const levelTotal = document.getElementById("level-total");
const xpProgress = document.getElementById("xp-progress");
const xpProgressFill = document.getElementById("xp-progress-fill");
const homeworkInput = document.getElementById("homework-photo-input");
const analyzeButton = document.getElementById("analyze-homework");
const photoPreviewWrapper = document.getElementById("photo-preview-wrapper");
const photoPreview = document.getElementById("homework-photo-preview");
const aiStatus = document.getElementById("ai-status");
const aiSuggestion = document.getElementById("ai-suggestion");
const suggestionSummary = document.getElementById("suggestion-summary");
const suggestionDetails = document.getElementById("suggestion-details");
const acceptSuggestionButton = document.getElementById("accept-suggestion");
const dismissSuggestionButton = document.getElementById("dismiss-suggestion");

const canModifyTasks = Boolean(
  taskInput && taskDeadline && taskDifficulty && taskList && addButton,
);
const canCompleteTasks = Boolean(taskList);
const isDashboard =
  document.body.classList.contains("dashboard") ||
  window.location.pathname.endsWith("index.html") ||
  window.location.pathname.endsWith("/");
const XP = { Easy: 10, Medium: 20, Hard: 30 };
const COINS = { Easy: 5, Medium: 10, Hard: 20 };
const LEVEL_BASE_XP = 100;
const LEVEL_GROWTH_RATE = 1.3;

function xpNeededForLevel(level) {
  return Math.floor(LEVEL_BASE_XP * Math.pow(LEVEL_GROWTH_RATE, level - 1));
}

function levelUpBonus(level) {
  return 10 * level;
}

function playLevelUpSound() {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const notes = [659.25, 783.99, 987.77]; // C5 E5 G5

    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.value = freq;

      gain.gain.setValueAtTime(0.15, ctx.currentTime + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(
        0.0001,
        ctx.currentTime + i * 0.08 + 0.18,
      );

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + i * 0.08);
      osc.stop(ctx.currentTime + i * 0.08 + 0.18);
    });

    const resumeAudio = () => {
      if (ctx.state === "suspended") {
        ctx.resume().catch(() => {});
      }
    };

    resumeAudio();

    setTimeout(() => {
      if (ctx && typeof ctx.close === "function") {
        ctx.close().catch(() => {});
      }
    }, 500);
  } catch (error) {
    // Ignore audio errors so the level-up flow still continues.
  }
}

function resetXPBar() {
  if (!xpProgressFill) return;

  xpProgressFill.style.transition = "none";
  xpProgressFill.style.width = "0%";
  void xpProgressFill.offsetWidth;
  xpProgressFill.style.transition = "width 0.6s ease";
}

function animateXPBar(targetPercent, duration = 600) {
  if (!xpProgressFill) return Promise.resolve();

  xpProgressFill.style.transition = `width ${duration}ms ease`;
  xpProgressFill.style.width = `${Math.min(100, Math.max(0, targetPercent))}%`;

  return new Promise((resolve) => {
    setTimeout(resolve, duration);
  });
}

function showLevelUpPopup(level, bonusCoins, onContinue) {
  const existingPopup = document.getElementById("level-up-popup");
  if (existingPopup) existingPopup.remove();

  const overlay = document.createElement("div");
  overlay.id = "level-up-popup";
  overlay.className = "level-up-overlay";
  overlay.innerHTML = `
    <div class="level-up-modal" role="dialog" aria-modal="true" aria-labelledby="level-up-title">
      <h2 id="level-up-title">LEVEL UP!</h2>
      <p class="level-up-subtitle">You reached Level ${level}!</p>
      <div class="level-up-bonus">
        <span>Level Bonus</span>
        <strong>+<span id="level-up-bonus-value">0</span> Coins</strong>
      </div>
      <button id="level-up-continue" type="button">Continue</button>
    </div>
  `;

  document.body.appendChild(overlay);

  const bonusValue = overlay.querySelector("#level-up-bonus-value");
  const continueButton = overlay.querySelector("#level-up-continue");

  if (bonusValue) {
    const steps = 24;
    const duration = 900;
    const stepTime = duration / steps;
    let currentValue = 0;

    const animateBonus = () => {
      const nextValue = Math.min(
        bonusCoins,
        Math.round((currentValue + bonusCoins / steps) * 10) / 10,
      );
      currentValue = nextValue;
      bonusValue.textContent = currentValue;

      if (currentValue >= bonusCoins) {
        bonusValue.textContent = bonusCoins;
        return;
      }

      setTimeout(animateBonus, stepTime);
    };

    setTimeout(animateBonus, 120);
  }

  if (continueButton) {
    continueButton.addEventListener("click", () => {
      overlay.remove();
      if (typeof onContinue === "function") onContinue();
    });
  }
}

function calculateLevelProgress(startXP, startLevel, gainedXP) {
  let xp = startXP + gainedXP;
  let level = startLevel;
  let bonusCoins = 0;
  let levelUps = 0;

  while (xp >= xpNeededForLevel(level)) {
    xp -= xpNeededForLevel(level);
    level += 1;
    bonusCoins += levelUpBonus(level);
    levelUps += 1;
  }

  return { level, xp, bonusCoins, levelUps };
}

let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
let editingTaskIndex = null;
let totalXP = parseInt(localStorage.getItem("totalXP")) || 0;
let currentXP = parseInt(localStorage.getItem("currentXP")) || 0;
let level = parseInt(localStorage.getItem("level")) || 1;
let totalCoins = parseInt(localStorage.getItem("totalCoins")) || 0;

if (canModifyTasks) {
  addButton.addEventListener("click", () => {
    if (editingTaskIndex !== null) {
      saveEditedTask(editingTaskIndex);
    } else {
      addTask();
    }
  });
  taskInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      if (editingTaskIndex !== null) {
        saveEditedTask(editingTaskIndex);
      } else {
        addTask();
      }
    }
  });
}

if (addSubtaskButton) {
  addSubtaskButton.addEventListener("click", () => {
    createSubtaskInput();
  });
}

let pendingSuggestion = null;

function setAiStatus(message, isError) {
  if (!aiStatus) return;
  aiStatus.textContent = message;
  aiStatus.style.color = isError ? "#c0392b" : "#6b3fa2";
}

function resetSuggestionPanel() {
  if (!aiSuggestion) return;
  aiSuggestion.hidden = true;
  if (suggestionSummary) suggestionSummary.textContent = "";
  if (suggestionDetails) suggestionDetails.innerHTML = "";
  pendingSuggestion = null;
}

function previewSelectedImage(file) {
  if (!file || !photoPreview || !photoPreviewWrapper) return;
  const reader = new FileReader();
  reader.onload = function (event) {
    photoPreview.src = event.target.result;
    photoPreviewWrapper.hidden = false;
  };
  reader.readAsDataURL(file);
}

function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = function (event) {
      const result = event.target && event.target.result;
      if (typeof result === "string") {
        const commaIndex = result.indexOf(",");
        resolve(commaIndex >= 0 ? result.slice(commaIndex + 1) : result);
      } else {
        reject(new Error("The image could not be read."));
      }
    };
    reader.onerror = function () {
      reject(new Error("The image could not be read."));
    };
    reader.readAsDataURL(file);
  });
}

async function analyzeHomeworkImage(file) {
  if (!file) {
    setAiStatus("Please choose a homework photo first.", true);
    return;
  }

  setAiStatus("Analyzing your homework photo...");
  resetSuggestionPanel();

  try {
    const imageBase64 = await readFileAsBase64(file);
    const response = await fetch("http://localhost:3000/scan-homework", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        imageBase64,
        mimeType: file.type || "image/jpeg",
      }),
    });
    const responseText = await response.text();
    let data = {};

    try {
      data = responseText ? JSON.parse(responseText) : {};
    } catch (parseError) {
      if (responseText && responseText.trim()) {
        throw new Error("The server returned an invalid response.");
      }
      throw new Error("The server did not return any data.");
    }

    if (!response.ok) {
      throw new Error(data.error || "Unable to analyze the image.");
    }

    if (!data || !data.suggestion) {
      throw new Error("The AI did not return a suggestion.");
    }

    pendingSuggestion = data.suggestion.tasks || [];

    if (suggestionSummary) {
      const suggestedTasks = data.suggestion.tasks || [];

      suggestionSummary.textContent =
        suggestedTasks.length === 1
          ? `${suggestedTasks[0].title || "Suggested task"} • ${suggestedTasks[0].difficulty || "Medium"}`
          : `${suggestedTasks.length} suggested tasks found`;
    }

    if (suggestionDetails) {
      const list = document.createElement("ul");
      const suggestedTasks = data.suggestion.tasks || [];

      list.innerHTML = suggestedTasks
        .map(
          (task) => `
        <li>
          <strong>${task.title || "Untitled task"}</strong><br>
          Subject: ${task.subject || "Unknown"}<br>
          Deadline: ${task.deadline || "No deadline detected"}<br>
          Difficulty: ${task.difficulty || "Medium"}<br>
        Notes: ${task.notes || "No notes"}<br>
Subtasks:
${
  task.subtasks && task.subtasks.length > 0
    ? `<ul>${task.subtasks
        .map((subtask) => `<li>${subtask}</li>`)
        .join("")}</ul>`
    : "No subtasks suggested"
}<br>
Confidence: ${(task.confidence || 0).toFixed(2)}
          </li>
      `,
        )
        .join("");

      suggestionDetails.appendChild(list);
    }

    if (aiSuggestion) aiSuggestion.hidden = false;
    setAiStatus("Suggestion ready. Review and add it if it looks right.");
  } catch (error) {
    setAiStatus(error.message || "Could not analyze the image.", true);
  }
}

function normalizeDeadline(deadline) {
  if (!deadline) return "";

  const original = deadline.trim();
  const lower = original.toLowerCase();

  const today = new Date();

  if (lower.includes("today")) {
    return formatLocalDate(today);
  }

  if (lower.includes("tomorrow")) {
    today.setDate(today.getDate() + 1);
    return formatLocalDate(today);
  }

  // Already in correct format: YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(original)) {
    return original;
  }

  // Handle formats like "July 18, 2026" or "07/18/2026"
  const parsedDate = new Date(original);

  if (!isNaN(parsedDate.getTime())) {
    return formatLocalDate(parsedDate);
  }

  console.warn("Could not normalize deadline:", deadline);
  return "";
}

function formatLocalDate(date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function acceptPendingSuggestion() {
  if (!pendingSuggestion || !Array.isArray(pendingSuggestion)) return;

  pendingSuggestion.forEach((suggestion) => {
    const difficulty =
      (suggestion.difficulty || "medium").charAt(0).toUpperCase() +
      (suggestion.difficulty || "medium").slice(1).toLowerCase();

    tasks.push({
      id: crypto.randomUUID(),
      text: suggestion.title || "Suggested homework task",
      difficulty,
      xp: XP[difficulty] || 10,
      coins: COINS[difficulty] || 5,
      deadline: normalizeDeadline(suggestion.deadline),
      subtasks: (suggestion.subtasks || []).map((subtask) => ({
        id: crypto.randomUUID(),
        text: subtask,
        completed: false,
      })),
      notes: suggestion.notes || "",
      subject: suggestion.subject || "",
      completed: false,
    });
  });

  localStorage.setItem("tasks", JSON.stringify(tasks));
  renderTasks();

  setAiStatus("Added all suggested tasks!");
  resetSuggestionPanel();
}

if (homeworkInput) {
  homeworkInput.addEventListener("change", (event) => {
    const file = event.target.files && event.target.files[0];
    previewSelectedImage(file);
    if (file) {
      setAiStatus("Photo ready. Press Suggest Task to analyze it.");
    }
  });
}

if (analyzeButton) {
  analyzeButton.addEventListener("click", () => {
    if (homeworkInput && homeworkInput.files && homeworkInput.files[0]) {
      analyzeHomeworkImage(homeworkInput.files[0]);
    } else {
      setAiStatus("Please choose a homework photo first.", true);
    }
  });
}

if (acceptSuggestionButton) {
  acceptSuggestionButton.addEventListener("click", acceptPendingSuggestion);
}

if (dismissSuggestionButton) {
  dismissSuggestionButton.addEventListener("click", resetSuggestionPanel);
}

function hasMeaningfulText(value) {
  return /[A-Za-z0-9\u00C0-\u024F\u1E00-\u1EFF]/.test(value);
}

function createSubtaskInput(value = "") {
  const row = document.createElement("div");
  row.className = "subtask-row";

  const input = document.createElement("input");
  input.type = "text";
  input.placeholder = "Subtask...";
  input.value = value;

  const removeButton = document.createElement("button");
  removeButton.type = "button";
  removeButton.textContent = "✕";

  removeButton.addEventListener("click", () => {
    row.remove();
  });

  row.appendChild(input);
  row.appendChild(removeButton);

  subtaskList.appendChild(row);
}

async function analyzeCalendarEvent(event) {
  const response = await fetch("http://localhost:3000/analyze-calendar-event", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      title: event.summary || "Calendar Event",
      date: event.start.date || event.start.dateTime || "",
      description: event.description || "",
    }),
  });

  if (!response.ok) {
    throw new Error("Could not analyze calendar event.");
  }

  const data = await response.json();

  return data;
}

function addCalendarTask(event, aiSuggestion) {
  const task = {
    id: crypto.randomUUID(),
    text: aiSuggestion.title,
    difficulty: aiSuggestion.difficulty,
    xp: XP[aiSuggestion.difficulty],
    coins: COINS[aiSuggestion.difficulty],
    deadline: aiSuggestion.deadline,
    subtasks: (aiSuggestion.subtasks || []).map((subtask) => ({
      id: crypto.randomUUID(),
      text: subtask,
      completed: false,
    })),
    completed: false,
    source: "Google Calendar",
    calendarEventId: event.id,
  };

  tasks.push(task);

  localStorage.setItem("tasks", JSON.stringify(tasks));

  renderTasks();

  alert("Calendar task added!");
}

function addTask() {
  const text = taskInput.value.trim();
  const deadline = taskDeadline ? taskDeadline.value : "";
  if (!text || !hasMeaningfulText(text)) return;

  const difficulty = taskDifficulty.value;
  const xp = XP[difficulty];
  const coins = COINS[difficulty];

  const subtasks = [];

  document.querySelectorAll(".subtask-row input").forEach((input) => {
    const text = input.value.trim();

    if (text) {
      subtasks.push({
        id: crypto.randomUUID(),
        text,
        completed: false,
      });
    }
  });

  tasks.push({
    id: crypto.randomUUID(),
    text,
    difficulty,
    xp,
    coins,
    deadline,
    subtasks,
    completed: false,
  });
  localStorage.setItem("tasks", JSON.stringify(tasks));

  renderTasks();
  taskInput.value = "";
  if (taskDeadline) taskDeadline.value = "";
  taskInput.focus();
  subtaskList.innerHTML = "";
}

function saveEditedTask(index) {
  const oldTask = tasks[index];

  const subtasks = [];

  document.querySelectorAll(".subtask-row input").forEach((input, i) => {
    const text = input.value.trim();

    if (text) {
      const oldSubtask = oldTask.subtasks?.[i];

      subtasks.push({
        id: oldSubtask ? oldSubtask.id : crypto.randomUUID(),
        text,
        completed: oldSubtask ? oldSubtask.completed : false,
      });
    }
  });

  tasks[index] = {
    ...oldTask,
    text: taskInput.value.trim(),
    deadline: taskDeadline.value,
    difficulty: taskDifficulty.value,
    xp: XP[taskDifficulty.value],
    coins: COINS[taskDifficulty.value],
    subtasks,
  };

  localStorage.setItem("tasks", JSON.stringify(tasks));

  renderTasks();

  taskInput.value = "";
  taskDeadline.value = "";
  subtaskList.innerHTML = "";
  addButton.textContent = "Add Task";
  editingTaskIndex = null;
}

function isUpcomingTask(task) {
  if (!task.deadline) return false;
  const [year, month, day] = task.deadline.split("-").map(Number);
  const dueDate = new Date(year, month - 1, day, 23, 59, 59);
  if (Number.isNaN(dueDate.getTime())) return false;

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const weekAhead = new Date(now);
  weekAhead.setDate(weekAhead.getDate() + 7);
  weekAhead.setHours(23, 59, 59, 999);

  return dueDate >= now && dueDate <= weekAhead;
}

function formatDeadline(value) {
  // Parse date string (YYYY-MM-DD) as local time, not UTC
  const [yr, mo, dy] = value.split("-").map(Number);
  const date = new Date(yr, mo - 1, dy);
  if (Number.isNaN(date.getTime())) return value;
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const month = monthNames[date.getMonth()];
  const day = date.getDate();
  const year = date.getFullYear();
  const currentYear = new Date().getFullYear();
  return year === currentYear ? `${month} ${day}` : `${month} ${day}, ${year}`;
}

function updateXPProgress() {
  const needed = xpNeededForLevel(level);
  if (levelTotal) levelTotal.textContent = level;
  if (xpProgress) xpProgress.textContent = `${currentXP}/${needed}`;
  if (xpProgressFill)
    xpProgressFill.style.width = `${Math.min(100, Math.round((currentXP / needed) * 100))}%`;
}

function renderTasks() {
  taskList.innerHTML = "";
  const activeTasks = tasks
    .map((task, index) => ({ task, originalIndex: index }))
    .filter(({ task }) => !task.completed);
  const visibleTasks = isDashboard
    ? activeTasks
        .filter(({ task }) => isUpcomingTask(task))
        .sort((a, b) => {
          const [yA, mA, dA] = a.task.deadline.split("-").map(Number);
          const [yB, mB, dB] = b.task.deadline.split("-").map(Number);
          return new Date(yA, mA - 1, dA) - new Date(yB, mB - 1, dB);
        })
        .slice(0, 5)
    : activeTasks.sort((a, b) => {
        if (!a.task.deadline) return 1;
        if (!b.task.deadline) return -1;

        const [yA, mA, dA] = a.task.deadline.split("-").map(Number);
        const [yB, mB, dB] = b.task.deadline.split("-").map(Number);

        return new Date(yA, mA - 1, dA) - new Date(yB, mB - 1, dB);
      });

  if (isDashboard && visibleTasks.length === 0) {
    const emptyMessage = document.createElement("li");
    emptyMessage.className = "task-empty-message";

    const messageText = document.createElement("span");
    messageText.textContent = "No upcoming tasks in the next 7 days.";

    const allTasksLink = document.createElement("a");
    allTasksLink.href = "tasks.html";
    allTasksLink.textContent = "All Tasks";
    allTasksLink.className = "task-empty-link";

    emptyMessage.appendChild(messageText);
    emptyMessage.appendChild(document.createTextNode(" "));
    emptyMessage.appendChild(allTasksLink);

    taskList.appendChild(emptyMessage);
    return;
  }

  visibleTasks.forEach(({ task, originalIndex }, visibleIndex) => {
    const li = document.createElement("li");
    const rowContent = document.createElement("div");
    rowContent.className = "task-row-content";

    const nameSpan = document.createElement("span");
    nameSpan.className = "task-name";
    nameSpan.textContent = task.text;

    const deadlineSpan = document.createElement("span");
    deadlineSpan.className = `task-deadline difficulty-${task.difficulty.toLowerCase()}`;
    deadlineSpan.textContent = task.deadline
      ? formatDeadline(task.deadline)
      : "";

    const difficultySpan = document.createElement("span");
    difficultySpan.className = `task-difficulty difficulty-${task.difficulty.toLowerCase()}`;
    difficultySpan.textContent = task.difficulty;

    rowContent.appendChild(nameSpan);
    if (task.deadline) rowContent.appendChild(deadlineSpan);
    rowContent.appendChild(difficultySpan);

    // mark overdue tasks visually
    const nowCheck = new Date();
    let dueDateCheck = null;
    if (task.deadline) {
      const [year, month, day] = task.deadline.split("-").map(Number);
      dueDateCheck = new Date(year, month - 1, day, 23, 59, 59);
    }
    if (dueDateCheck && nowCheck > dueDateCheck) {
      li.classList.add("task-overdue");
    }

    if (canCompleteTasks) {
      const doneButton = document.createElement("button");
      doneButton.type = "button";
      doneButton.className = "task-complete-button";
      doneButton.textContent = task.completed ? "☑" : "☐";
      doneButton.setAttribute("aria-label", "Mark task complete");
      doneButton.setAttribute("aria-pressed", "false");

      if (task.completed) {
        doneButton.classList.add("completed");
        doneButton.disabled = true;
        doneButton.setAttribute("aria-pressed", "true");
      }

      doneButton.addEventListener("click", () => {
        if (doneButton.disabled) return;
        // Update daily streak
        const currentStreak = updateStreak();
        updateStats(task);
        updateProductivityCalendar();

        console.log("🔥 Current streak:", currentStreak);
        doneButton.textContent = "☑";
        doneButton.classList.add("completed");
        doneButton.setAttribute("aria-pressed", "true");
        doneButton.disabled = true;

        const now = new Date();
        const dueDate = task.deadline
          ? new Date(task.deadline + "T23:59:59")
          : null;
        const earnedXP = dueDate && now > dueDate ? 0 : task.xp;
        const earnedCoins =
          dueDate && now > dueDate
            ? 0
            : task.coins !== undefined
              ? task.coins
              : COINS[task.difficulty] || 0;

        const finishCompletion = () => {
          const taskIndex = tasks.findIndex((taskEntry) => taskEntry === task);

          if (taskIndex >= 0) {
            tasks[taskIndex].completed = true;
          }
          localStorage.setItem("tasks", JSON.stringify(tasks));
          localStorage.setItem("totalXP", totalXP);
          localStorage.setItem("currentXP", currentXP);
          localStorage.setItem("level", level);
          localStorage.setItem("totalCoins", totalCoins);
          renderTasks();

          if (coinTotal) coinTotal.textContent = totalCoins;

          updateXPProgress();

          const streakDisplay = document.getElementById("streak-total");

          if (streakDisplay && typeof getStreak === "function") {
            streakDisplay.textContent = getStreak();
          }
        };
        try {
          if (earnedXP === 0) {
            totalCoins += earnedCoins;
            finishCompletion();
            return;
          }

          const previousXP = currentXP;
          const previousLevel = level;
          const previousNeeded = xpNeededForLevel(previousLevel);
          const startPercent = xpProgressFill
            ? Math.min(100, Math.max(0, (previousXP / previousNeeded) * 100))
            : 0;

          let xpAfterLeveling = previousXP + earnedXP;
          let newLevel = previousLevel;
          let bonusCoins = 0;

          while (xpAfterLeveling >= xpNeededForLevel(newLevel)) {
            xpAfterLeveling -= xpNeededForLevel(newLevel);
            newLevel += 1;
            bonusCoins += levelUpBonus(newLevel);
          }

          totalXP += earnedXP;
          currentXP = xpAfterLeveling;
          level = newLevel;
          totalCoins += earnedCoins + bonusCoins;

          if (xpProgressFill) {
            const targetPercent = Math.min(
              100,
              Math.max(0, (currentXP / xpNeededForLevel(level)) * 100),
            );
            xpProgressFill.style.transition = "width 0.6s ease";
            xpProgressFill.style.width = `${startPercent}%`;
            void xpProgressFill.offsetWidth;
            xpProgressFill.style.width = `${targetPercent}%`;
          }

          finishCompletion();

          if (bonusCoins > 0) {
            playLevelUpSound();
            setTimeout(() => {
              try {
                showLevelUpPopup(level, bonusCoins, () => {});
              } catch (popupError) {
                // Ignore popup errors so the game can continue.
              }
            }, 180);
          }
        } catch (error) {
          finishCompletion();
        }
      });

      li.appendChild(doneButton);
    }

    li.appendChild(rowContent);

    if (task.subtasks && task.subtasks.length > 0) {
      const subtaskContainer = document.createElement("div");
      subtaskContainer.className = "subtask-container";

      task.subtasks.forEach((subtask) => {
        const subtaskRow = document.createElement("div");
        subtaskRow.className = "subtask-item";

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = subtask.completed;

        checkbox.addEventListener("change", () => {
          subtask.completed = checkbox.checked;

          const allSubtasksDone = task.subtasks.every(
            (subtask) => subtask.completed,
          );

          localStorage.setItem("tasks", JSON.stringify(tasks));

          if (allSubtasksDone) {
            const parentCompleteButton = li.querySelector(
              ".task-complete-button",
            );

            if (parentCompleteButton) {
              parentCompleteButton.click();
              return;
            }
          }

          renderTasks();
        });

        const text = document.createElement("span");
        text.textContent = subtask.text;

        if (subtask.completed) {
          text.style.textDecoration = "line-through";
          text.style.opacity = "0.6";
        }

        subtaskRow.appendChild(checkbox);
        subtaskRow.appendChild(text);

        subtaskContainer.appendChild(subtaskRow);
      });

      li.appendChild(subtaskContainer);
    }

    if (canModifyTasks) {
      const editButton = document.createElement("button");
      editButton.type = "button";
      editButton.textContent = "Edit";
      editButton.addEventListener("click", () => {
        editingTaskIndex = originalIndex;

        taskInput.value = task.text;

        if (taskDeadline) {
          taskDeadline.value = task.deadline || "";
        }

        taskDifficulty.value = task.difficulty;

        subtaskList.innerHTML = "";

        if (task.subtasks) {
          task.subtasks.forEach((subtask) => {
            createSubtaskInput(subtask.text);
          });
        }

        addButton.textContent = "Save";

        taskInput.focus();
      });

      const deleteButton = document.createElement("button");
      deleteButton.type = "button";
      deleteButton.textContent = "Delete";
      deleteButton.addEventListener("click", () => {
        tasks.splice(originalIndex, 1);
        localStorage.setItem("tasks", JSON.stringify(tasks));
        renderTasks();
      });

      li.appendChild(editButton);
      li.appendChild(deleteButton);
    }
    taskList.appendChild(li);
  });
}
function updateStats(task) {
  let stats = JSON.parse(localStorage.getItem("stats")) || {
    tasksCompleted: 0,
    easy: 0,
    medium: 0,
    hard: 0,
    longestStreak: 0,
  };

  stats.tasksCompleted++;

  if (task.difficulty === "Easy") {
    stats.easy++;
  }

  if (task.difficulty === "Medium") {
    stats.medium++;
  }

  if (task.difficulty === "Hard") {
    stats.hard++;
  }

  const currentStreak = Number(localStorage.getItem("streak")) || 0;

  if (currentStreak > stats.longestStreak) {
    stats.longestStreak = currentStreak;
  }

  localStorage.setItem("stats", JSON.stringify(stats));
}

function updateProductivityCalendar() {
  let calendar = JSON.parse(localStorage.getItem("calendar")) || {};

  const today = new Date().toISOString().split("T")[0];

  if (!calendar[today]) {
    calendar[today] = 0;
  }

  calendar[today]++;

  localStorage.setItem("calendar", JSON.stringify(calendar));
}

renderTasks();
if (coinTotal) coinTotal.textContent = totalCoins;
updateXPProgress();

const streakDisplay = document.getElementById("streak-total");

if (streakDisplay && typeof getStreak === "function") {
  const streak = getStreak();

  streakDisplay.textContent = streak;

  const streakWord = document.getElementById("streak-word");

  if (streakWord) {
    streakWord.textContent = streak === 1 ? "day" : "days";
  }
}

/* ==========================================================
   GOOGLE CALENDAR
========================================================== */

const CLIENT_ID =
  "1037059700810-klmvk9nh9tv06v93nbmpf06h8un3ce4a.apps.googleusercontent.com";

const DISCOVERY_DOC =
  "https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest";

const SCOPES = "https://www.googleapis.com/auth/calendar.readonly";

const connectCalendarButton = document.getElementById("connect-calendar");
const calendarStatus = document.getElementById("calendar-status");
const calendarEvents = document.getElementById("calendar-events");
const calendarEventList = document.getElementById("calendar-event-list");

const suggestCalendarTasksButton = document.getElementById(
  "suggest-calendar-tasks",
);

let accessToken = localStorage.getItem("googleAccessToken") || null;

function restoreGoogleCalendarSession() {
  const savedToken = localStorage.getItem("googleAccessToken");

  if (savedToken) {
    accessToken = savedToken;

    gapi.client.setToken({
      access_token: savedToken,
    });

    localStorage.setItem("googleCalendarConnected", "true");

    calendarStatus.textContent = "✅ Connected";

    return true;
  }

  return false;
}

let calendarEventsData = [];
let pendingCalendarSuggestions =
  JSON.parse(localStorage.getItem("calendarSuggestions")) || [];

function calendarTaskAlreadyAdded(eventId) {
  return tasks.some((task) => task.calendarEventId === eventId);
}

async function initializeGoogleCalendar() {
  await new Promise((resolve) => gapi.load("client", resolve));

  await gapi.client.init({
    discoveryDocs: [DISCOVERY_DOC],
  });
}

async function connectGoogleCalendar() {
  const tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: SCOPES,

    callback: async (response) => {
      if (response.error) {
        console.error(response);
        return;
      }

      accessToken = response.access_token;

      localStorage.setItem("googleAccessToken", accessToken);

      gapi.client.setToken({
        access_token: accessToken,
      });

      localStorage.setItem("googleCalendarConnected", "true");

      calendarStatus.textContent = "✅ Connected";
    },
  });

  tokenClient.requestAccessToken();
}

async function loadUpcomingEvents() {
  try {
    const response = await gapi.client.calendar.events.list({
      calendarId: "primary",
      timeMin: new Date().toISOString(),
      showDeleted: false,
      singleEvents: true,
      maxResults: 10,
      orderBy: "startTime",
    });

    calendarEventList.innerHTML = "";

    const events = response.result.items;

    calendarEventsData = events;

    const uniqueEvents = events.filter(
      (event, index, self) =>
        index === self.findIndex((e) => e.id === event.id),
    );

    localStorage.setItem("calendarEvents", JSON.stringify(uniqueEvents));

    localStorage.setItem("calendarEvents", JSON.stringify(events));
    if (!events || events.length === 0) {
      calendarEventList.innerHTML = "<li>No upcoming calendar events.</li>";
      calendarEvents.hidden = false;
      return;
    }

    events.forEach((event) => {
      const li = document.createElement("li");

      const start = event.start.dateTime || event.start.date || "";

      const aiSuggestion = pendingCalendarSuggestions.find(
        (item) => item.event.id === event.id,
      );

      const suggestion = aiSuggestion?.suggestion;

      li.innerHTML = `
<strong>📅 ${event.summary || "Untitled Event"}</strong><br>

Deadline:
${suggestion?.deadline || new Date(start).toLocaleString()}

<br>

Difficulty:
${suggestion?.difficulty || "Analyzing..."}

<br><br>

💡 Suggested Study Task:
<br>
${suggestion?.title || "Generating suggestion..."}

<br><br>

Subtasks:
${
  suggestion?.subtasks?.length
    ? `<ul>
        ${suggestion.subtasks.map((s) => `<li>${s}</li>`).join("")}
       </ul>`
    : "None"
}

<br>

<button class="calendar-add-task">
  Add Task
</button>
`;

      const addButton = li.querySelector(".calendar-add-task");

      addButton.addEventListener("click", () => {
        const suggestion = pendingCalendarSuggestions.find(
          (item) => item.event.id === event.id,
        );

        if (!suggestion) {
          alert("Please generate study suggestions first.");
          return;
        }

        addCalendarTask(suggestion.event, suggestion.suggestion);

        addButton.remove();

        const successMessage = document.createElement("div");

        successMessage.innerHTML = `
    <strong>✅ Added to StudyCircuit!</strong>
    <br>
    Study for ${event.summary || "Calendar Event"}
    <br><br>
    <a href="tasks.html">
      View Tasks →
    </a>
  `;

        successMessage.className = "calendar-success-message";

        li.appendChild(successMessage);

        li.classList.add("calendar-added");
      });

      calendarEventList.appendChild(li);
    });

    calendarEvents.hidden = false;
  } catch (err) {
    console.error(err);
  }
}

if (connectCalendarButton) {
  initializeGoogleCalendar().then(() => {
    restoreGoogleCalendarSession();
  });

  connectCalendarButton.addEventListener("click", () => {
    connectGoogleCalendar();
  });
}

if (suggestCalendarTasksButton) {
  suggestCalendarTasksButton.addEventListener("click", () => {
    suggestCalendarTasks();
  });
}

async function suggestCalendarTasks() {
  if (!localStorage.getItem("googleCalendarConnected")) {
    alert("Please connect Google Calendar first.");
    return;
  }

  // If suggestions already exist, just show them again
  if (pendingCalendarSuggestions.length > 0) {
    console.log("Showing saved AI suggestions");

    await loadUpcomingEvents();
    return;
  }

  // Otherwise generate new suggestions
  if (!accessToken) {
    alert("Please reconnect Google Calendar.");
    return;
  }

  await loadUpcomingEvents();

  pendingCalendarSuggestions = [];

  for (const event of calendarEventsData) {
    const suggestion = await analyzeCalendarEvent(event);

    pendingCalendarSuggestions.push({
      event,
      suggestion,
    });
  }

  // Save AI suggestions
  localStorage.setItem(
    "calendarSuggestions",
    JSON.stringify(pendingCalendarSuggestions),
  );

  // Refresh display with AI data
  await loadUpcomingEvents();

  console.log("AI Suggestions generated:", pendingCalendarSuggestions);
}

if (localStorage.getItem("googleCalendarConnected")) {
  calendarStatus.textContent = "✅ Connected";
}

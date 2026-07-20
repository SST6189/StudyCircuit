const stats = JSON.parse(localStorage.getItem("stats")) || {};

const currentStreak = Number(localStorage.getItem("streak")) || 0;
const longestStreak = Number(stats.longestStreak) || 0;

document.getElementById("current-streak").textContent =
  `${currentStreak} ${currentStreak === 1 ? "day" : "days"}`;

document.getElementById("longest-streak").textContent =
  `${longestStreak} ${longestStreak === 1 ? "day" : "days"}`;

document.getElementById("total-xp").textContent =
  `${localStorage.getItem("totalXP") || 0}`;

document.getElementById("total-coins").textContent =
  `${localStorage.getItem("totalCoins") || 0}`;

document.getElementById("tasks-completed").textContent =
  `${stats.tasksCompleted || 0}`;

document.getElementById("easy-count").textContent = `${stats.easy || 0}`;

document.getElementById("medium-count").textContent = `${stats.medium || 0}`;

document.getElementById("hard-count").textContent = `${stats.hard || 0}`;

document.getElementById("completion-rate").textContent =
  `${calculateCompletionRate()}%`;

const calendarGrid = document.getElementById("calendar-grid");
const calendarMonth = document.getElementById("calendar-month");

if (calendarGrid && calendarMonth) {
  const calendar = JSON.parse(localStorage.getItem("calendar")) || {};

  const today = new Date();

  const month = today.getMonth();
  const year = today.getFullYear();

  const monthName = today.toLocaleString("default", {
    month: "long",
    year: "numeric",
  });

  calendarMonth.textContent = monthName;

  const firstDay = new Date(year, month, 1).getDay();

  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // empty spaces before month starts
  for (let i = 0; i < firstDay; i++) {
    const blank = document.createElement("div");
    blank.className = "calendar-empty";
    calendarGrid.appendChild(blank);
  }

  // actual days
  for (let day = 1; day <= daysInMonth; day++) {
    const square = document.createElement("div");

    square.className = "calendar-day";

    const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

    const completed = calendar[dateKey] || 0;

    square.innerHTML = `
      <span>${day}</span>
      <div class="calendar-tooltip"></div>
    `;

    const tooltip = square.querySelector(".calendar-tooltip");

    if (completed === 0) {
      square.classList.add("no-tasks");
      tooltip.textContent = "No tasks completed";
    } else if (completed === 1) {
      square.classList.add("one-task");
      tooltip.textContent = "1 task completed 🎉";
    } else {
      square.classList.add("many-tasks");
      tooltip.textContent = `${completed} tasks completed 🔥`;
    }

    calendarGrid.appendChild(square);
  }
}

function calculateCompletionRate() {
  const tasks = JSON.parse(localStorage.getItem("tasks")) || [];

  if (tasks.length === 0) {
    return 0;
  }

  const completedTasks = tasks.filter((task) => task.completed).length;

  const completionRate = Math.round((completedTasks / tasks.length) * 100);

  return completionRate;
}

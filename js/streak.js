// streak.js
// Handles daily task completion streaks

function getTodayDate() {
  const today = new Date();
  return today.toISOString().split("T")[0];
}

// Called whenever a task is completed
function updateStreak() {
  let streak = Number(localStorage.getItem("streak")) || 0;
  let longestStreak = Number(localStorage.getItem("longestStreak")) || 0;

  let lastCompletedDate = localStorage.getItem("lastCompletedDate");
  let today = getTodayDate();

  // Prevent multiple increases in one day
  if (lastCompletedDate === today) {
    return streak;
  }

  if (lastCompletedDate) {
    let yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    let yesterdayDate = yesterday.toISOString().split("T")[0];

    if (lastCompletedDate === yesterdayDate) {
      streak++;
    } else {
      streak = 1;
    }
  } else {
    streak = 1;
  }

  // Update longest streak
  if (streak > longestStreak) {
    longestStreak = streak;
    localStorage.setItem("longestStreak", longestStreak);
  }

  localStorage.setItem("streak", streak);
  localStorage.setItem("lastCompletedDate", today);

  return streak;
}

// Gets current streak
function getStreak() {
  return Number(localStorage.getItem("streak")) || 0;
}

// Gets best streak ever
function getLongestStreak() {
  return Number(localStorage.getItem("longestStreak")) || 0;
}

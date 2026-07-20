const studyPlanButton = document.getElementById("generate-study-plan");

const studyPlanStatus = document.getElementById("study-plan-status");

const studyPlanContainer = document.getElementById("study-plan-container");

const studyPlanResults = document.getElementById("study-plan-results");

const toggleButton = document.getElementById("toggle-study-plan");

const saveButton = document.getElementById("save-study-plan");

const deleteButton = document.getElementById("delete-study-plan");

const savedPlan = localStorage.getItem("savedStudyPlan");

if (savedPlan) {
  studyPlanResults.innerHTML = savedPlan;
  studyPlanContainer.hidden = false;
  toggleButton.hidden = false;
}

if (studyPlanButton) {
  studyPlanButton.addEventListener("click", generateStudyPlan);
}

function calculateFreeTime(calendarEvents) {
  const freeTime = [];

  const startHour = 15; // 3 PM
  const endHour = 22; // 10 PM

  const days = {};

  // Create the next 7 days
  for (let i = 0; i < 7; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);

    const day = date.toISOString().split("T")[0];

    days[day] = [];
  }

  // Add calendar events into those days
  calendarEvents.forEach((event) => {
    if (!event.start || !event.end) return;

    const start = new Date(event.start);
    const end = new Date(event.end);

    const day = start.toISOString().split("T")[0];

    if (!days[day]) {
      days[day] = [];
    }

    days[day].push({
      start,
      end,
    });
  });

  // Calculate free blocks
  Object.keys(days).forEach((day) => {
    const events = days[day].sort((a, b) => a.start - b.start);

    let current = new Date(
      `${day}T${String(startHour).padStart(2, "0")}:00:00`,
    );

    // If this is today, don't include past times
    const now = new Date();

    if (current < now) {
      current = now;
    }

    const endOfDay = new Date(
      `${day}T${String(endHour).padStart(2, "0")}:00:00`,
    );

    events.forEach((event) => {
      if (event.start > current) {
        freeTime.push({
          day,

          start: current.toLocaleTimeString([], {
            hour: "numeric",
            minute: "2-digit",
          }),

          end: event.start.toLocaleTimeString([], {
            hour: "numeric",
            minute: "2-digit",
          }),
        });
      }

      if (event.end > current) {
        current = event.end;
      }
    });

    if (current < endOfDay) {
      freeTime.push({
        day,

        start: current.toLocaleTimeString([], {
          hour: "numeric",
          minute: "2-digit",
        }),

        end: endOfDay.toLocaleTimeString([], {
          hour: "numeric",
          minute: "2-digit",
        }),
      });
    }
  });

  return freeTime;
}

async function generateStudyPlan() {
  studyPlanStatus.textContent = "Generating your AI study plan...";

  studyPlanContainer.hidden = true;

  try {
    const tasks = JSON.parse(localStorage.getItem("tasks")) || [];

    const incompleteTasks = tasks.filter((task) => !task.completed);

    const savedCalendarEvents =
      JSON.parse(localStorage.getItem("calendarEvents")) || [];

    const calendarEvents = savedCalendarEvents.map((event) => ({
      title: event.summary || "Calendar Event",
      start: event.start.dateTime || event.start.date,
      end: event.end?.dateTime || event.end?.date,
    }));

    const freeTime = calculateFreeTime(calendarEvents);

    console.log("Free Time:", freeTime);

    console.log("CALENDAR EVENTS:", calendarEvents);
    console.log("FREE TIME:", freeTime);

    const response = await fetch("http://localhost:3000/generate-study-plan", {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        tasks: incompleteTasks,
        calendarEvents,
        freeTime,
      }),
    });

    if (!response.ok) throw new Error("AI could not generate a study plan.");

    const data = await response.json();

    const fullSchedule = [
      ...data.schedule.map((session) => ({
        type: "study",
        date: session.date,
        day: session.day,
        start: session.start,
        end: session.end,
        task: session.task,
        reason: session.reason,
      })),
    ];

    fullSchedule.forEach((session) => {
      session.day = session.day.trim();
    });

    fullSchedule.sort((a, b) => {
      const dateA = new Date(`${a.date} ${a.start}`);
      const dateB = new Date(`${b.date} ${b.start}`);

      return dateA - dateB;
    });

    renderStudyPlan(fullSchedule);

    toggleButton.hidden = false;
    toggleButton.textContent = "Hide Plan";

    studyPlanStatus.textContent = "Study plan generated!";
  } catch (error) {
    console.error(error);

    studyPlanStatus.textContent = error.message;
  }
}

function renderStudyPlan(schedule) {
  studyPlanResults.innerHTML = "";

  studyPlanContainer.hidden = false;

  schedule.forEach((session) => {
    const calendarClass =
      session.type === "calendar" ? "calendar-session" : "study-session";

    studyPlanResults.innerHTML += `
      <div class="${calendarClass}">

        <div class="study-time">
          ${session.day}
          <br>
          ${session.start} - ${session.end}
        </div>

        <h4>${session.task}</h4>

        <div class="study-reason">
          ${session.reason}
        </div>

      </div>
    `;
  });
}

toggleButton?.addEventListener("click", () => {
  const hidden = studyPlanContainer.hidden;

  studyPlanContainer.hidden = !hidden;

  toggleButton.textContent = hidden ? "Hide Plan" : "Show Plan";
});

saveButton?.addEventListener("click", () => {
  localStorage.setItem("savedStudyPlan", studyPlanResults.innerHTML);

  alert("Study plan saved!");
});

deleteButton?.addEventListener("click", () => {
  localStorage.removeItem("savedStudyPlan");

  studyPlanResults.innerHTML = "";

  studyPlanContainer.hidden = true;

  toggleButton.hidden = true;

  studyPlanStatus.textContent = "Study plan deleted.";
});

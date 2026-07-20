const tutorialSteps = [
  {
    page: "index.html",
    title: "Welcome to StudyCircuit!",
    text: "Your productivity adventure starts here! Complete tasks, earn XP, and customize your world.",
    target: null,
  },

  {
    page: "index.html",
    title: "Your Dashboard",
    text: "This is your command center. View your tasks, avatar, XP, coins, and streak progress.",
    target: ".dashboard-top",
  },

  {
    page: "tasks.html",
    title: "Smart Tools",
    text: "Your AI-powered tools help you organize homework, deadlines, and study plans.",
    target: ".smart-tools",
  },

  {
    page: "tasks.html",
    title: "AI Homework Assistant",
    text: "Upload a homework photo and AI can suggest a task for you.",
    target: ".ai-photo-panel",
    action: "openAI",
  },

  {
    page: "tasks.html",
    title: "Google Calendar",
    text: "Connect your calendar to get smarter study suggestions based on your schedule.",
    target: ".calendar-panel",
    action: "openCalendar",
  },

  {
    page: "tasks.html",
    title: "AI Study Planner",
    text: "Generate a personalized study schedule using your tasks and calendar events.",
    target: ".study-planner-panel",
    action: "openPlanner",
  },

  {
    page: "tasks.html",
    title: "Create Tasks",
    text: "Add assignments, deadlines, and difficulty levels here.",
    target: ".task-form",
  },

  {
    page: "tasks.html",
    title: "Break Tasks Into Steps",
    text: "Use subtasks to make large assignments easier to manage.",
    target: "#add-subtask",
  },

  {
    page: "tasks.html",
    title: "Track Progress",
    text: "Complete tasks to earn XP, coins, and level up.",
    target: ".xp-progress-wrapper",
  },

  {
    page: "stats.html",
    title: "Track Your Growth",
    text: "Review your productivity, streaks, and completion history.",
    target: ".stats-container",
  },

  {
    page: "apartment.html",
    title: "Customize Your Space",
    text: "Use your rewards to decorate your apartment.",
    target: "#inventory-panel",
    action: "openInventory",
  },

  {
    page: "shop.html",
    title: "Visit The Shop",
    text: "Spend your coins on customization items.",
    target: ".store-category",
  },

  {
    page: "index.html",
    title: "You're Ready!",
    text: "Start completing tasks and building your productivity streak!",
    target: null,
  },
];

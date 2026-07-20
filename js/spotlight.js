function createSpotlight(element) {
  // Remove old spotlight
  document.getElementById("tutorial-spotlight")?.remove();

  const rect = element.getBoundingClientRect();

  const spotlight = document.createElement("div");

  spotlight.id = "tutorial-spotlight";

  spotlight.style.top = `${rect.top + window.scrollY - 12}px`;
  spotlight.style.left = `${rect.left - 12}px`;
  spotlight.style.width = `${rect.width + 24}px`;
  spotlight.style.height = `${rect.height + 24}px`;

  document.body.appendChild(spotlight);
}

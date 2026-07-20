document.addEventListener("DOMContentLoaded", () => {
  const buttons = document.querySelectorAll(".tool-toggle");

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      const content = button.nextElementSibling;

      button.classList.toggle("active");
      content.classList.toggle("open");
    });
  });
});

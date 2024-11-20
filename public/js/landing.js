document.addEventListener("DOMContentLoaded", () => {
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      }
    },
    {
      threshold: 0.1,
    }
  );
  // Observer les sections
  for (const section of document.querySelectorAll("section:not(.hero)")) {
    observer.observe(section);
  }
});

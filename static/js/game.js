document.addEventListener('DOMContentLoaded', function () {
  const heroButton = document.querySelector('.hero-actions .primary-button');
  if (heroButton) {
    heroButton.addEventListener('click', function () {
      window.location.href = '/courses';
    });
  }
});

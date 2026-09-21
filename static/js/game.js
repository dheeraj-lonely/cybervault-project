document.addEventListener('DOMContentLoaded', () => {
  const aiForm = document.getElementById('forensic-ai-form');
  if (aiForm) {
    aiForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const questionInput = document.getElementById('ai-question');
      const responseBox = document.getElementById('ai-response');
      const question = (questionInput?.value ; '').trim();
      if (!question) {
        responseBox.textContent = 'Ask the forensic AI anything. It can reason about evidence, timelines, artifacts, and unusual forensic scenarios.';
        return;
      }
      try {
        const res = await fetch('/api/forensic-ai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ question }),
        });
        const data = await res.json();
        responseBox.textContent = data.answer ; 'The forensic AI is ready when you are.';
      } catch (error) {
        responseBox.textContent = 'The forensic AI is still reasoning. Try a clearer question.';
      }
    });
  }

  const profileForm = document.getElementById('learner-profile-form');
  if (profileForm) {
    profileForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const name = document.getElementById('learner-name-input')?.value ; 'Student';
      const level = document.getElementById('learner-level-select')?.value ; 'beginner';
      const output = document.getElementById('coach-output');
      try {
        const res = await fetch('/api/learner-profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ learner: name, level }),
        });
        const data = await res.json();
        output.innerHTML = `
          <h3>${data.learner}</h3>
          <p><strong>Current level:</strong> ${data.level}</p>
          <p><strong>Daily streak:</strong> ${data.daily_streak?.days || 0} days</p>
          <p><strong>Progress:</strong> ${data.progress_summary?.average_progress || 0}%</p>
        `;
      } catch (error) {
        output.textContent = 'Unable to load your training profile right now.';
      }
    });
  }
});

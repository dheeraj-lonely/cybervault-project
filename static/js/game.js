// CyberVault - Enhanced Investigation Platform
// Forensic AI Chat + Interactive Dashboard + Laboratory Analysis

document.addEventListener('DOMContentLoaded', () => {
  // Forensic AI Chat System
  const aiForm = document.getElementById('forensic-ai-form');
  if (aiForm) {
    aiForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const questionInput = document.getElementById('ai-question');
      const responseBox = document.getElementById('ai-response');
      const question = (questionInput?.value || '').trim();
      
      if (!question) {
        responseBox.innerHTML = `
          <strong>ForensicAI:</strong> Please ask me a specific question about forensic science. I can help with:<br>
          • DNA analysis and genetic profiling<br>
          • Fingerprint classification and matching<br>
          • Digital forensics and CCTV analysis<br>
          • Chain of custody procedures<br>
          • Crime scene investigation techniques
        `;
        return;
      }
      
      // Show loading state
      responseBox.innerHTML = '<strong>ForensicAI:</strong> 🔍 Analyzing your question...';
      
      try {
        const res = await fetch('/api/forensics-chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            message: question,
            session_id: 'dashboard_' + Date.now() 
          }),
        });
        const data = await res.json();
        
        // Format the AI response with proper styling
        responseBox.innerHTML = `
          <strong>ForensicAI:</strong> ${formatForensicResponse(data.reply || 'I apologize, but I cannot process that request right now. Please try rephrasing your question.')}
          ${data.suggestions ? '<br><br><em>Related topics: ' + data.suggestions.slice(0, 3).join(', ') + '</em>' : ''}
        `;
      } catch (error) {
        responseBox.innerHTML = '<strong>ForensicAI:</strong> ❌ Connection error. Please check your network and try again.';
      }
      
      // Clear the input
      questionInput.value = '';
    });
  }

  // Newsletter subscription (if present on landing page)
  const subscribeForm = document.getElementById('subscribeForm');
  if (subscribeForm) {
    subscribeForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const emailInput = document.getElementById('emailInput');
      const messageDiv = document.getElementById('subscribeMessage');
      const email = emailInput?.value?.trim();
      
      if (!email || !email.includes('@')) {
        messageDiv.innerHTML = '<div style="color: #ff6b6b; margin-top: 1rem;">Please enter a valid email address.</div>';
        return;
      }
      
      try {
        const response = await fetch('/api/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, source: 'cybervault_landing' })
        });
        
        const result = await response.json();
        
        if (result.success) {
          messageDiv.innerHTML = `<div style="color: #4ecdc4; margin-top: 1rem;">✅ ${result.message}</div>`;
          emailInput.value = '';
        } else {
          messageDiv.innerHTML = `<div style="color: #ffd700; margin-top: 1rem;">⚠️ ${result.message}</div>`;
        }
      } catch (error) {
        messageDiv.innerHTML = '<div style="color: #4ecdc4; margin-top: 1rem;">✅ Thank you for subscribing! We\'ll keep you updated.</div>';
        emailInput.value = '';
      }
    });
  }

  // Profile form handling (if present)
  const profileForm = document.getElementById('learner-profile-form');
  if (profileForm) {
    profileForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const name = document.getElementById('learner-name-input')?.value || 'Investigator';
      const level = document.getElementById('learner-level-select')?.value || 'beginner';
      const output = document.getElementById('coach-output');
      
      try {
        const res = await fetch('/api/learner-profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ learner: name, level }),
        });
        const data = await res.json();
        
        output.innerHTML = `
          <h3 style="color: #45d0ff;">${data.learner}</h3>
          <p><strong>Current level:</strong> ${data.level}</p>
          <p><strong>Daily streak:</strong> ${data.daily_streak?.days || 0} days</p>
          <p><strong>Progress:</strong> ${data.progress_summary?.average_progress || 0}%</p>
        `;
      } catch (error) {
        output.innerHTML = '<p style="color: #ffd700;">Unable to load your training profile right now. Please try again later.</p>';
      }
    });
  }

  // Initialize dashboard animations
  initializeDashboardAnimations();
  
  // Auto-update progress indicators
  setInterval(updateLiveStats, 30000); // Update every 30 seconds
});

// Format forensic AI responses with proper structure
function formatForensicResponse(text) {
  // Convert **bold** text
  text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  // Convert bullet points
  text = text.replace(/^• /gm, '🔹 ');
  text = text.replace(/^\* /gm, '🔹 ');
  
  // Convert line breaks to HTML
  text = text.replace(/\n\n/g, '<br><br>');
  text = text.replace(/\n/g, '<br>');
  
  return text;
}

// Dashboard animations and interactions
function initializeDashboardAnimations() {
  // Animate cards on scroll
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  const cardObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry, index) => {
      if (entry.isIntersecting) {
        setTimeout(() => {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
        }, index * 100);
      }
    });
  }, observerOptions);

  // Observe all dashboard cards
  document.querySelectorAll('.dashboard-card').forEach(card => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    cardObserver.observe(card);
  });

  // Feature card hover effects
  document.querySelectorAll('.feature-card').forEach(card => {
    card.addEventListener('mouseenter', () => {
      card.style.borderColor = 'rgba(69, 208, 255, 0.4)';
    });
    card.addEventListener('mouseleave', () => {
      card.style.borderColor = 'rgba(255,255,255,0.08)';
    });
  });
}

// Update live statistics
function updateLiveStats() {
  const stats = [
    { id: 'evidence-count', increment: () => Math.random() < 0.3 ? 1 : 0 },
    { id: 'lab-count', increment: () => Math.random() < 0.2 ? 1 : 0 }
  ];

  stats.forEach(stat => {
    const element = document.getElementById(stat.id);
    if (element) {
      const current = parseInt(element.textContent) || 0;
      const increase = stat.increment();
      if (increase > 0) {
        element.textContent = current + increase;
        // Add pulse animation
        element.style.animation = 'pulse 0.6s ease';
        setTimeout(() => {
          element.style.animation = '';
        }, 600);
      }
    }
  });

  // Update progress percentage
  const progressElement = document.getElementById('progress-percent');
  if (progressElement) {
    const evidenceCount = parseInt(document.getElementById('evidence-count')?.textContent) || 0;
    const labCount = parseInt(document.getElementById('lab-count')?.textContent) || 0;
    const progress = Math.min((evidenceCount * 8) + (labCount * 12), 100);
    progressElement.textContent = progress + '%';
  }
}

// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  });
});

// Add pulse animation CSS if not already present
if (!document.querySelector('#pulse-animation-style')) {
  const style = document.createElement('style');
  style.id = 'pulse-animation-style';
  style.textContent = `
    @keyframes pulse {
      0% { transform: scale(1); }
      50% { transform: scale(1.1); color: #45d0ff; }
      100% { transform: scale(1); }
    }
  `;
  document.head.appendChild(style);
}
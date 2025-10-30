document.addEventListener("DOMContentLoaded", () => {
  const activitiesListEl = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageEl = document.getElementById("message");

  // Fetch activities, render activity cards with participants, and handle signup.
  async function loadActivities() {
    activitiesListEl.innerHTML = "<p>Loading activities...</p>";
    try {
      const res = await fetch("/activities");
      const data = await res.json();
      renderActivities(data);
      populateSelect(Object.keys(data));
    } catch (err) {
      activitiesListEl.innerHTML = '<div class="error message">Failed to load activities.</div>';
    }
  }

  function renderActivities(activities) {
    activitiesListEl.innerHTML = "";
    for (const [name, info] of Object.entries(activities)) {
      const card = document.createElement("div");
      card.className = "activity-card";

      // Basic info
      card.innerHTML = `
      <h4>${escapeHtml(name)}</h4>
      <p>${escapeHtml(info.description)}</p>
      <p><strong>Schedule:</strong> ${escapeHtml(info.schedule)}</p>
    `;

      // Participants section
      const participantsWrap = document.createElement("div");
      participantsWrap.className = "participants";
      const title = document.createElement("div");
      title.className = "participants-title";
      title.textContent = "Participants";
      participantsWrap.appendChild(title);

      if (Array.isArray(info.participants) && info.participants.length > 0) {
        const ul = document.createElement("ul");
        ul.className = "participants-list";
        info.participants.forEach((p) => {
          const li = document.createElement("li");

          // Optional avatar: generate initials avatar as data URL fallback
          const img = document.createElement("img");
          img.className = "participant-avatar";
          img.alt = p;
          img.src = generateInitialsAvatar(p);

          const span = document.createElement("span");
          span.className = "participant-name";
          span.textContent = p;

          li.appendChild(img);
          li.appendChild(span);
          ul.appendChild(li);
        });
        participantsWrap.appendChild(ul);
      } else {
        const none = document.createElement("div");
        none.className = "no-participants";
        none.textContent = "No participants yet";
        participantsWrap.appendChild(none);
      }

      card.appendChild(participantsWrap);
      activitiesListEl.appendChild(card);
    }
  }

  function populateSelect(activityNames) {
    // Clear existing options except the placeholder
    const placeholder = activitySelect.querySelector("option[value='']");
    activitySelect.innerHTML = "";
    if (placeholder) activitySelect.appendChild(placeholder);
    activityNames.forEach((name) => {
      const opt = document.createElement("option");
      opt.value = name;
      opt.textContent = name;
      activitySelect.appendChild(opt);
    });
  }

  signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("email").value.trim();
    const activity = activitySelect.value;
    clearMessage();

    if (!email || !activity) {
      showMessage("Please enter an email and select an activity.", "error");
      return;
    }

    try {
      const url = `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`;
      const res = await fetch(url, { method: "POST" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "Signup failed" }));
        showMessage(err.detail || "Signup failed", "error");
        return;
      }
      const body = await res.json();
      showMessage(body.message || "Signed up successfully", "success");
      // Refresh activities to update participants list
      await loadActivities();
      signupForm.reset();
    } catch (err) {
      showMessage("Network error during signup.", "error");
    }
  });

  function showMessage(text, type) {
    messageEl.className = `message ${type}`;
    messageEl.textContent = text;
    messageEl.classList.remove("hidden");
    setTimeout(() => {
      messageEl.classList.add("hidden");
    }, 4000);
  }

  function clearMessage() {
    messageEl.className = "hidden";
    messageEl.textContent = "";
  }

  // Simple initials avatar generator (SVG data URL) as a lightweight avatar fallback
  function generateInitialsAvatar(email) {
    const name = email.split("@")[0];
    const initials = name
      .split(/[.\-_]/)
      .map((s) => s.charAt(0))
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?";
    const bg = "#e8eaf6";
    const fg = "#1a237e";
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='64' height='64'><rect width='100%' height='100%' fill='${bg}'/><text x='50%' y='55%' font-size='28' fill='${fg}' font-family='Arial,Helvetica,sans-serif' text-anchor='middle' dominant-baseline='middle'>${escapeHtml(initials)}</text></svg>`;
    return `data:image/svg+xml;base64,${btoa(svg)}`;
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  // Initial load
  loadActivities();
});

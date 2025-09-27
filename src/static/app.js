document.addEventListener("DOMContentLoaded", () => {
  // Activities logic (existing)
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Project ideas logic (new)
  const projectIdeasList = document.getElementById("project-ideas-list");
  const projectIdeaForm = document.getElementById("project-idea-form");
  const projectMessageDiv = document.getElementById("project-message");

  // Fetch and render activities
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();
      activitiesList.innerHTML = "";
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";
        const spotsLeft = details.max_participants - details.participants.length;
        const participantsHTML =
          details.participants.length > 0
            ? `<div class="participants-section">
                <h5>Participants:</h5>
                <ul class="participants-list">
                  ${details.participants
                    .map(
                      (email) =>
                        `<li><span class="participant-email">${email}</span><button class="delete-btn" data-activity="${name}" data-email="${email}">❌</button></li>`
                    )
                    .join("")}
                </ul>
              </div>`
            : `<p><em>No participants yet</em></p>`;
        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants-container">
            ${participantsHTML}
          </div>
        `;
        activitiesList.appendChild(activityCard);
        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
      // Add event listeners to delete buttons
      document.querySelectorAll(".delete-btn").forEach((button) => {
        button.addEventListener("click", handleUnregister);
      });
    } catch (error) {
      activitiesList.innerHTML =
        "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Fetch and render project ideas
  async function fetchProjectIdeas() {
    try {
      const response = await fetch("/project-ideas");
      const ideas = await response.json();
      projectIdeasList.innerHTML = "";
      if (Object.keys(ideas).length === 0) {
        projectIdeasList.innerHTML = "<p>No project ideas yet.</p>";
        return;
      }
      Object.entries(ideas).forEach(([title, details]) => {
        const ideaCard = document.createElement("div");
        ideaCard.className = "activity-card";
        const collaboratorsHTML =
          details.collaborators.length > 0
            ? `<div class="participants-section">
                <h5>Collaborators:</h5>
                <ul class="participants-list">
                  ${details.collaborators
                    .map(
                      (email) =>
                        `<li><span class="participant-email">${email}</span>${email !== details.owner_email ? `<button class="leave-collab-btn" data-title="${title}" data-email="${email}">❌</button>` : "<span style='color:#888;font-size:12px;'>(owner)</span>"}</li>`
                    )
                    .join("")}
                </ul>
              </div>`
            : `<p><em>No collaborators yet</em></p>`;
        ideaCard.innerHTML = `
          <h4>${title}</h4>
          <p>${details.description}</p>
          <p><strong>Owner:</strong> ${details.owner_email}</p>
          <div class="participants-container">
            ${collaboratorsHTML}
          </div>
          <div style="margin-top:10px;">
            <input type="email" class="collab-email-input" placeholder="Your email to join" style="width:60%;padding:5px;" />
            <button class="join-collab-btn" data-title="${title}">Join as Collaborator</button>
          </div>
        `;
        projectIdeasList.appendChild(ideaCard);
      });
      // Add event listeners for join/leave buttons
      document.querySelectorAll(".join-collab-btn").forEach((button) => {
        button.addEventListener("click", handleJoinCollaborator);
      });
      document.querySelectorAll(".leave-collab-btn").forEach((button) => {
        button.addEventListener("click", handleLeaveCollaborator);
      });
    } catch (error) {
      projectIdeasList.innerHTML =
        "<p>Failed to load project ideas. Please try again later.</p>";
      console.error("Error fetching project ideas:", error);
    }
  }

  // Handle unregister functionality (activities)
  async function handleUnregister(event) {
    const button = event.target;
    const activity = button.getAttribute("data-activity");
    const email = button.getAttribute("data-email");
    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/unregister?email=${encodeURIComponent(email)}`,
        { method: "DELETE" }
      );
      const result = await response.json();
      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }
      messageDiv.classList.remove("hidden");
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to unregister. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error unregistering:", error);
    }
  }

  // Handle join as collaborator (project idea)
  async function handleJoinCollaborator(event) {
    const button = event.target;
    const title = button.getAttribute("data-title");
    const card = button.closest(".activity-card");
    const emailInput = card.querySelector(".collab-email-input");
    const email = emailInput.value.trim();
    if (!email) {
      projectMessageDiv.textContent = "Please enter your email to join as collaborator.";
      projectMessageDiv.className = "error";
      projectMessageDiv.classList.remove("hidden");
      setTimeout(() => projectMessageDiv.classList.add("hidden"), 4000);
      return;
    }
    try {
      const response = await fetch(
        `/project-ideas/${encodeURIComponent(title)}/join?email=${encodeURIComponent(email)}`,
        { method: "POST" }
      );
      const result = await response.json();
      if (response.ok) {
        projectMessageDiv.textContent = result.message;
        projectMessageDiv.className = "success";
        emailInput.value = "";
        fetchProjectIdeas();
      } else {
        projectMessageDiv.textContent = result.detail || "An error occurred";
        projectMessageDiv.className = "error";
      }
      projectMessageDiv.classList.remove("hidden");
      setTimeout(() => projectMessageDiv.classList.add("hidden"), 4000);
    } catch (error) {
      projectMessageDiv.textContent = "Failed to join as collaborator. Please try again.";
      projectMessageDiv.className = "error";
      projectMessageDiv.classList.remove("hidden");
      console.error("Error joining as collaborator:", error);
    }
  }

  // Handle leave as collaborator (project idea)
  async function handleLeaveCollaborator(event) {
    const button = event.target;
    const title = button.getAttribute("data-title");
    const email = button.getAttribute("data-email");
    try {
      const response = await fetch(
        `/project-ideas/${encodeURIComponent(title)}/leave?email=${encodeURIComponent(email)}`,
        { method: "DELETE" }
      );
      const result = await response.json();
      if (response.ok) {
        projectMessageDiv.textContent = result.message;
        projectMessageDiv.className = "success";
        fetchProjectIdeas();
      } else {
        projectMessageDiv.textContent = result.detail || "An error occurred";
        projectMessageDiv.className = "error";
      }
      projectMessageDiv.classList.remove("hidden");
      setTimeout(() => projectMessageDiv.classList.add("hidden"), 4000);
    } catch (error) {
      projectMessageDiv.textContent = "Failed to leave as collaborator. Please try again.";
      projectMessageDiv.className = "error";
      projectMessageDiv.classList.remove("hidden");
      console.error("Error leaving as collaborator:", error);
    }
  }

  // Handle project idea submission
  projectIdeaForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const title = document.getElementById("project-title").value.trim();
    const description = document.getElementById("project-description").value.trim();
    const ownerEmail = document.getElementById("project-owner-email").value.trim();
    if (!title || !description || !ownerEmail) {
      projectMessageDiv.textContent = "Please fill in all fields.";
      projectMessageDiv.className = "error";
      projectMessageDiv.classList.remove("hidden");
      setTimeout(() => projectMessageDiv.classList.add("hidden"), 4000);
      return;
    }
    try {
      const response = await fetch(
        `/project-ideas/submit?title=${encodeURIComponent(title)}&description=${encodeURIComponent(description)}&owner_email=${encodeURIComponent(ownerEmail)}`,
        { method: "POST" }
      );
      const result = await response.json();
      if (response.ok) {
        projectMessageDiv.textContent = result.message;
        projectMessageDiv.className = "success";
        projectIdeaForm.reset();
        fetchProjectIdeas();
      } else {
        projectMessageDiv.textContent = result.detail || "An error occurred";
        projectMessageDiv.className = "error";
      }
      projectMessageDiv.classList.remove("hidden");
      setTimeout(() => projectMessageDiv.classList.add("hidden"), 4000);
    } catch (error) {
      projectMessageDiv.textContent = "Failed to submit project idea. Please try again.";
      projectMessageDiv.className = "error";
      projectMessageDiv.classList.remove("hidden");
      console.error("Error submitting project idea:", error);
    }
  });

  // Handle activity sign up (existing)
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;
    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        { method: "POST" }
      );
      const result = await response.json();
      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }
      messageDiv.classList.remove("hidden");
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
  fetchProjectIdeas();
});

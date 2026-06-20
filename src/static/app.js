document.addEventListener("DOMContentLoaded", () => {
  const capabilitiesList = document.getElementById("capabilities-list");
  const messageDiv = document.getElementById("message");
  const modal = document.getElementById("register-modal");
  const modalCapabilityName = document.getElementById("modal-capability-name");
  const modalCapability = document.getElementById("modal-capability");
  const modalClose = document.getElementById("modal-close");
  const modalOverlay = document.getElementById("modal-overlay");
  const registerForm = document.getElementById("register-form");

  // Open modal for a specific capability
  function openModal(capabilityName) {
    modalCapabilityName.textContent = capabilityName;
    modalCapability.value = capabilityName;
    document.getElementById("email").value = "";
    modal.classList.remove("hidden");
    document.getElementById("email").focus();
  }

  // Close modal
  function closeModal() {
    modal.classList.add("hidden");
  }

  modalClose.addEventListener("click", closeModal);
  modalOverlay.addEventListener("click", closeModal);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeModal();
  });

  // Function to fetch capabilities from API
  async function fetchCapabilities() {
    try {
      const response = await fetch("/capabilities");
      const capabilities = await response.json();

      capabilitiesList.innerHTML = "";

      Object.entries(capabilities).forEach(([name, details]) => {
        const capabilityCard = document.createElement("div");
        capabilityCard.className = "capability-card";

        const availableCapacity = details.capacity || 0;
        const currentConsultants = details.consultants ? details.consultants.length : 0;
        const practiceAreaClass = (details.practice_area || "").toLowerCase().replace(/\s+/g, "-");

        const consultantsHTML =
          details.consultants && details.consultants.length > 0
            ? `<div class="consultants-section">
              <h5>Registered Consultants:</h5>
              <ul class="consultants-list">
                ${details.consultants
                  .map(
                    (email) =>
                      `<li><span class="consultant-email">${email}</span><button class="delete-btn" data-capability="${name}" data-email="${email}" aria-label="Remove ${email}">❌</button></li>`
                  )
                  .join("")}
              </ul>
            </div>`
            : `<p class="no-consultants"><em>No consultants registered yet</em></p>`;

        capabilityCard.innerHTML = `
          <div class="card-header">
            <h4>${name}</h4>
            <span class="practice-area-badge practice-area-${practiceAreaClass}">${details.practice_area || ""}</span>
          </div>
          <p>${details.description}</p>
          <div class="card-meta">
            <span><strong>Verticals:</strong> ${details.industry_verticals ? details.industry_verticals.join(", ") : "Not specified"}</span>
            <span><strong>Capacity:</strong> ${availableCapacity} hrs/week</span>
            <span><strong>Team:</strong> ${currentConsultants} consultants</span>
          </div>
          <div class="consultants-container">
            ${consultantsHTML}
          </div>
          <button class="register-btn" data-capability="${name}">+ Register Expertise</button>
        `;

        capabilitiesList.appendChild(capabilityCard);
      });

      // Add event listeners to delete and register buttons
      document.querySelectorAll(".delete-btn").forEach((button) => {
        button.addEventListener("click", handleUnregister);
      });

      document.querySelectorAll(".register-btn").forEach((button) => {
        button.addEventListener("click", () => openModal(button.getAttribute("data-capability")));
      });
    } catch (error) {
      capabilitiesList.innerHTML =
        "<p>Failed to load capabilities. Please try again later.</p>";
      console.error("Error fetching capabilities:", error);
    }
  }

  // Handle unregister functionality
  async function handleUnregister(event) {
    const button = event.target;
    const capability = button.getAttribute("data-capability");
    const email = button.getAttribute("data-email");

    try {
      const response = await fetch(
        `/capabilities/${encodeURIComponent(
          capability
        )}/unregister?email=${encodeURIComponent(email)}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (response.ok) {
        showMessage(result.message, "success");
        fetchCapabilities();
      } else {
        showMessage(result.detail || "An error occurred", "error");
      }
    } catch (error) {
      showMessage("Failed to unregister. Please try again.", "error");
      console.error("Error unregistering:", error);
    }
  }

  // Handle form submission
  registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const capability = modalCapability.value;

    try {
      const response = await fetch(
        `/capabilities/${encodeURIComponent(
          capability
        )}/register?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        showMessage(result.message, "success");
        closeModal();
        fetchCapabilities();
      } else {
        showMessage(result.detail || "An error occurred", "error");
      }
    } catch (error) {
      showMessage("Failed to register. Please try again.", "error");
      console.error("Error registering:", error);
    }
  });

  function showMessage(text, type) {
    messageDiv.textContent = text;
    messageDiv.className = type;
    messageDiv.classList.remove("hidden");
    setTimeout(() => messageDiv.classList.add("hidden"), 5000);
  }

  // Initialize app
  fetchCapabilities();
});

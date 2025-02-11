// Retrieve the logged-in user from localStorage
const loggedInUser = localStorage.getItem("loggedInUser");

// Update the preferences header with the username
if (loggedInUser) {
    document.getElementById("preferences-header").innerText = `Preferences for: ${loggedInUser}`;
} else {
    // Redirect to login page if no user is logged in
    alert("Please log in first.");
    window.location.href = "login_page.html";
}

// Fetch available equipment from the backend and populate checkboxes
document.addEventListener("DOMContentLoaded", async () => {
    const equipmentContainer = document.getElementById("equipment-container");
    const username = localStorage.getItem("loggedInUser");

    try {
        // Fetch available equipment
        const equipmentResponse = await fetch("http://localhost:3000/get-equipment");
        const equipmentData = await equipmentResponse.json();

        if (equipmentData.success && equipmentData.equipment.length > 0) {
            // Populate the equipment checkboxes dynamically
            equipmentContainer.innerHTML = ""; // Clear any existing content
            equipmentData.equipment.forEach((equipmentName) => {
                const label = document.createElement("label");
                label.innerHTML = `
                    <input type="checkbox" name="equipment" value="${equipmentName}"> ${equipmentName}
                `;
                equipmentContainer.appendChild(label);
            });

            // Fetch user preferences and update checkboxes
            const preferencesResponse = await fetch(`http://localhost:3000/get-preferences?username=${username}`);
            const preferencesData = await preferencesResponse.json();

            if (preferencesData.success) {
                const preferences = preferencesData.preferences;

                // Check the boxes based on stored preferences
                preferences.forEach((preference) => {
                    const checkbox = document.querySelector(`input[value="${preference}"]`);
                    if (checkbox) {
                        checkbox.checked = true;
                    }
                });
            } else {
                alert("Failed to load preferences.");
            }
        } else {
            equipmentContainer.innerHTML = "<p>No equipment available.</p>";
        }
    } catch (error) {
        console.error("Error fetching equipment:", error);
        equipmentContainer.innerHTML = "<p>Failed to load equipment.</p>";
    }
});

// Handle form submission
document.getElementById("equipment-form").addEventListener("submit", (event) => {
    event.preventDefault(); // Prevent the form from submitting the traditional way

    // Get selected equipment
    const selectedEquipment = Array.from(document.querySelectorAll('input[name="equipment"]:checked')).map(
        (checkbox) => checkbox.value
    );

    // Send the preferences to the server
    const username = localStorage.getItem("loggedInUser");
    fetch("http://localhost:3000/save-preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, preferences: selectedEquipment }),
    })
        .then((response) => response.json())
        .then((data) => {
            if (data.success) {
                alert("Preferences updated successfully!");
            } else {
                alert("Failed to update preferences.");
            }
        })
        .catch((error) => {
            console.error("Error updating preferences:", error);
        });
});

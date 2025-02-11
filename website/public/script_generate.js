// Retrieve the logged-in user from localStorage
const loggedInUser = localStorage.getItem("loggedInUser");

// Update the preferences header with the username
if (loggedInUser) {
    document.getElementById("mealcounts-header").innerText = `Preferences for: ${loggedInUser}`;
} else {
    // Redirect to login page if no user is logged in
    alert("Please log in first.");
    window.location.href = "login_page.html";
}

// Handle form submission
document.getElementById("meal-preferences-form").addEventListener("submit", async (event) => {
    event.preventDefault(); // Prevent the form from submitting traditionally

    // Get selected values from dropdowns and convert to numbers
    const breakfastCount = parseInt(document.getElementById("breakfast").value, 10);
    const lunchCount = parseInt(document.getElementById("lunch").value, 10);
    const dinnerCount = parseInt(document.getElementById("dinner").value, 10);
    
     // Check if the values are valid integers
    if (isNaN(breakfastCount) || isNaN(lunchCount) || isNaN(dinnerCount)) {
        alert("Invalid input values.");
        return;
    }

    // Simulate saving data to the server (or localStorage)
    const response = await fetch("http://localhost:3000/save-meal-preferences", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            username: loggedInUser,
            preferences: {
                breakfast: breakfastCount,
                lunch: lunchCount,
                dinner: dinnerCount,
            },
        }),
    });

    const data = await response.json();

    if (data.success) {
        alert("Preferences updated successfully!");
        window.location.href = "recipes.html"; // Redirect to recipes.html
    } else {
        alert("Failed to update preferences.");
    }
});

// Pre-fill the dropdowns with existing preferences
document.addEventListener("DOMContentLoaded", async () => {
    const response = await fetch(`http://localhost:3000/get-meal-preferences?username=${loggedInUser}`);
    const data = await response.json();

    if (data.success) {
        const { breakfast, lunch, dinner } = data.preferences;

        // Set the dropdowns to the saved values
        document.getElementById("breakfast").value = breakfast;
        document.getElementById("lunch").value = lunch;
        document.getElementById("dinner").value = dinner;
    } else {
        console.error("Failed to fetch meal preferences.");
    }
});

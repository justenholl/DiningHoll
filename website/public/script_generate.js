// Retrieve the logged-in user from localStorage
const loggedInUser = localStorage.getItem("loggedInUser");

// Update the preferences header with the username
if (loggedInUser) {
    document.getElementById("mealcounts-header").innerText = `Preferences for: ${loggedInUser}`;
} else {
    alert("Please log in first.");
    window.location.href = "./index.html";
}

// Function to fetch the user's saved equipment preferences
async function fetchUserEquipment() {
    try {
        const response = await fetch(`${API_BASE_URL}/get-preferences?username=${loggedInUser}`);
        const data = await response.json();

        if (data.success) {
            console.log("Fetched user preferences.");
            return data.preferences || []; // Return array of equipment names
        } else {
            console.error("Failed to fetch user equipment.");
            return [];
        }
    } catch (error) {
        console.error("Error fetching user equipment:", error);
        return [];
    }
}

// Handle form submission
async function handleSubmit(event) {
    event.preventDefault();
    
    const username = localStorage.getItem('username');
    if (!username) {
        alert('Please log in first');
        return;
    }

    // Get meal counts from form
    const breakfastCount = document.getElementById('breakfast-count').value || "0";
    const lunchCount = document.getElementById('lunch-count').value || "0";
    const dinnerCount = document.getElementById('dinner-count').value || "0";

    try {
        // Save preferences to server
        const response = await fetch(`${API_BASE_URL}/save-meal-preferences`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username,
                preferences: {
                    breakfast: breakfastCount,
                    lunch: lunchCount,
                    dinner: dinnerCount
                }
            })
        });

        if (!response.ok) {
            throw new Error('Failed to save preferences');
        }

        // Redirect to recipes page
        window.location.href = './recipes.html';
    } catch (error) {
        console.error('Error saving preferences:', error);
        alert('Failed to save preferences. Please try again.');
    }
}

// Single DOMContentLoaded event listener for all initialization
document.addEventListener("DOMContentLoaded", async () => {
    // Pre-fill the dropdowns with existing meal preferences
    const response = await fetch(`${API_BASE_URL}/get-meal-preferences?username=${loggedInUser}`);
    const data = await response.json();

    if (data.success) {
        document.getElementById("breakfast").value = data.preferences.breakfast;
        document.getElementById("lunch").value = data.preferences.lunch;
        document.getElementById("dinner").value = data.preferences.dinner;
    } else {
        console.error("Failed to fetch meal preferences.");
    }

    // Add form submit event listener
    const form = document.getElementById('meal-form');
    if (form) {
        form.addEventListener('submit', handleSubmit);
    }
});

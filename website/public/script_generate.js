// Make sure all initialization happens after DOM is loaded
document.addEventListener("DOMContentLoaded", async () => {
    console.log("Starting script_generate.js");
    const loggedInUser = localStorage.getItem("loggedInUser");
    console.log("loggedInUser from localStorage:", loggedInUser);

    // Update the preferences header with the username
    if (loggedInUser) {
        console.log("User is logged in as:", loggedInUser);
        document.getElementById("mealcounts-header").innerText = `Weekly Meal Counts for: ${loggedInUser}`;
        
        // Add form submit event listener
        const form = document.getElementById('meal-form');
        if (form) {
            console.log("Form found, adding submit listener");
            form.addEventListener('submit', async (event) => {
                event.preventDefault();
                console.log("Form submitted for user:", loggedInUser);
                
                // Get meal counts from form
                const breakfastCount = document.getElementById('breakfast').value || "0";
                const lunchCount = document.getElementById('lunch').value || "0";
                const dinnerCount = document.getElementById('dinner').value || "0";

                try {
                    console.log("Sending preferences to server:", {
                        username: loggedInUser,
                        preferences: { breakfast: breakfastCount, lunch: lunchCount, dinner: dinnerCount }
                    });

                    // Save preferences to server
                    const response = await fetch(`${API_BASE_URL}/save-meal-preferences`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            username: loggedInUser,
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

                    console.log("Successfully saved preferences, redirecting...");
                    window.location.href = './recipes.html';
                } catch (error) {
                    console.error('Error saving preferences:', error);
                    alert('Failed to save preferences. Please try again.');
                }
            });
        } else {
            console.error("Could not find form with id 'meal-form'");
        }
    } else {
        console.log("No logged in user found");
        alert("Please log in first.");
        window.location.href = "./index.html";
    }
});

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

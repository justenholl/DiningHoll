// Retrieve the logged-in user from localStorage
const loggedInUser = localStorage.getItem("loggedInUser");

// Update the preferences header with the username
if (loggedInUser) {
    document.getElementById("mealcounts-header").innerText = `Preferences for: ${loggedInUser}`;
} else {
    alert("Please log in first.");
    window.location.href = "login_page.html";
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

// Function to fetch viable recipes based on meal preferences and available equipment
async function fetchViableRecipes(breakfastCount, lunchCount, dinnerCount, userEquipment) {
    try {
        console.log("Fetching recipes from API...");
        const response = await fetch(`${API_BASE_URL}/get-recipes?breakfast=${breakfastCount}&lunch=${lunchCount}&dinner=${dinnerCount}`);
        const data = await response.json();

        if (!data.success || !Array.isArray(data.recipes)) {
            console.error("Failed to fetch recipes.");
            return [];
        }

        const recipes = data.recipes;
        const recipeEquipmentMap = {}; // Map recipe_id -> required equipment list

        console.log("API response for recipes:", data);

        return recipes;
    } catch (error) {
        console.error("Error fetching viable recipes:", error);
        return [];
    }
}

// Handle form submission
document.getElementById("meal-preferences-form").addEventListener("submit", async (event) => {
    event.preventDefault();

    const breakfastCount = parseInt(document.getElementById("breakfast").value, 10);
    const lunchCount = parseInt(document.getElementById("lunch").value, 10);
    const dinnerCount = parseInt(document.getElementById("dinner").value, 10);

    if (isNaN(breakfastCount) || isNaN(lunchCount) || isNaN(dinnerCount)) {
        alert("Invalid input values.");
        return;
    }

    // Fetch user's saved equipment
    const userEquipment = await fetchUserEquipment();

    // Fetch viable recipes based on equipment and meal preferences
    const viableRecipes = await fetchViableRecipes(breakfastCount, lunchCount, dinnerCount, userEquipment);

    if (viableRecipes.length > 0) {
        localStorage.setItem("filteredRecipes", JSON.stringify(viableRecipes));
        window.location.href = "recipes.html";
    } else {
        alert("No recipes available that match your meal preferences and equipment.");
    }
});

// Pre-fill the dropdowns with existing meal preferences
document.addEventListener("DOMContentLoaded", async () => {
    const response = await fetch(`${API_BASE_URL}/get-meal-preferences?username=${loggedInUser}`);
    const data = await response.json();

    if (data.success) {
        document.getElementById("breakfast").value = data.preferences.breakfast;
        document.getElementById("lunch").value = data.preferences.lunch;
        document.getElementById("dinner").value = data.preferences.dinner;
    } else {
        console.error("Failed to fetch meal preferences.");
    }
});

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
        const response = await fetch(`${API_BASE_URL}/get-recipes`);
        const data = await response.json();

        if (!data.success || !Array.isArray(data.recipes)) {
            console.error("Failed to fetch recipes.");
            return [];
        }

        const recipes = data.recipes;
        const recipeEquipmentMap = {}; // Map recipe_id -> required equipment list
        
        console.log("API response for recipes:", data);
        console.log("Recipes array:", data.recipes);
        console.log("Recipes array type:", Array.isArray(data.recipes));

        for (const recipe of recipes) {
            console.log(`Fetching equipment for recipe_id: ${recipe.id}`); // Debugging log

            const recipeEquipmentResponse = await fetch(`${API_BASE_URL}/get-recipe-equipment?recipe_id=${recipe.id}`);
            console.log(`Fetching equipment for recipe_id: ${recipe.id}`); 
            console.log("Response status:", recipeEquipmentResponse.status); // Debugging log
            
            const recipeEquipmentData = await recipeEquipmentResponse.json();
            console.log("Recipe equipment data:", recipeEquipmentData); // Debugging log

            if (!recipeEquipmentData.success || !Array.isArray(recipeEquipmentData.equipment)) {
                console.error(`Failed to fetch equipment for recipe_id: ${recipe.id}`);
                continue;
            }

            recipeEquipmentMap[recipe.id] = recipeEquipmentData.equipment.map(e => e.name);
        }

        // Filter recipes that match the meal type and user's equipment
        const viableRecipes = recipes.filter((recipe) => {
            const requiredEquipment = recipeEquipmentMap[recipe.id] || [];
            return (
                requiredEquipment.every((eq) => userEquipment.includes(eq)) && // User has all required equipment
                ((breakfastCount > 0 && recipe.breakfast_bool) ||
                 (lunchCount > 0 && recipe.lunch_bool) ||
                 (dinnerCount > 0 && recipe.dinner_bool))
            );
        });

        return viableRecipes;
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

document.addEventListener('DOMContentLoaded', async () => {
    console.log("DOM Content Loaded");
    const loggedInUser = localStorage.getItem("loggedInUser");
    console.log("LoggedInUser from localStorage:", loggedInUser); // Debug log

    if (!loggedInUser) {
        console.log("No logged in user found, redirecting to login");
        window.location.href = "./index.html";
        return;
    }

    try {
        // Fetch the user's meal preferences from the backend
        const response = await fetch(`${API_BASE_URL}/get-meal-preferences?username=${loggedInUser}`);
        const data = await response.json();
        console.log("Meal preferences response:", data); // Debug log

        if (data.success) {
            const { breakfast, lunch, dinner } = data.preferences;

            // Update the preferences header dynamically
            const preferencesHeader = document.getElementById("preferences-header");
            if (preferencesHeader) {
                preferencesHeader.innerText = `Preferences for: ${loggedInUser}`;
            }

            // Update meal info dynamically based on fetched data
            const mealInfo = document.getElementById("meal-info");
            if (mealInfo) {
                mealInfo.innerText = `For this week, ${loggedInUser} wants ${breakfast} breakfast(s), ${lunch} lunch(es), and ${dinner} dinner(s).`;
            }

            // Get user equipment preferences
            const equipmentResponse = await fetch(`${API_BASE_URL}/get-preferences?username=${loggedInUser}`);
            const equipmentData = await equipmentResponse.json();
            const userEquipment = equipmentData.success ? equipmentData.preferences : [];

            // Generate recipes based on preferences
            const recipesResponse = await fetch(
                `${API_BASE_URL}/get-recipes?breakfast=${breakfast}&lunch=${lunch}&dinner=${dinner}&userEquipment=${userEquipment.join(',')}`
            );

            if (!recipesResponse.ok) {
                throw new Error('Failed to generate recipes');
            }

            const recipesData = await recipesResponse.json();
            
            if (!recipesData.success) {
                throw new Error(recipesData.message);
            }

            // Display the results
            displayRecipes(recipesData.recipes);
            displayShoppingList(recipesData.shoppingList);

        } else {
            const mealInfo = document.getElementById("meal-info");
            if (mealInfo) {
                mealInfo.innerText = "Error retrieving meal preferences. Please try again.";
            }
        }
    } catch (error) {
        console.error('Error:', error);
        const mealInfo = document.getElementById("meal-info");
        if (mealInfo) {
            mealInfo.innerText = "An error occurred while fetching data. Please try again later.";
        }
    }
});

function displayRecipes(recipes) {
    const recipesContainer = document.getElementById('recipes-list');
    let html = '<h2>Your Weekly Recipes</h2>';
    
    recipes.forEach(recipe => {
        html += `
            <div class="recipe">
                <h3>${recipe.title}</h3>
                <button onclick="window.location.href='recipe.html?id=${recipe.id}'">View Recipe</button>
            </div>
        `;
    });

    recipesContainer.innerHTML = html;
}

function displayShoppingList(shoppingList) {
    const shoppingListContainer = document.getElementById('shopping-list');
    let html = '<h2>Shopping List</h2><ul>';
    
    shoppingList.forEach(item => {
        html += `<li>${item.quantity} ${item.unit} ${item.name}</li>`;
    });

    html += '</ul>';
    shoppingListContainer.innerHTML = html;
}

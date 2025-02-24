// Retrieve the logged-in user from localStorage
const loggedInUser = localStorage.getItem("loggedInUser");

if (loggedInUser) {
    // Fetch the user's meal preferences from the backend
    fetch(`${API_BASE_URL}/get-meal-preferences?username=${loggedInUser}`)
        .then((response) => response.json())
        .then((data) => {
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

                // Generate and display recipes based on preferences
                generateAndDisplayRecipes();
            } else {
                const mealInfo = document.getElementById("meal-info");
                if (mealInfo) {
                    mealInfo.innerText = "Error retrieving meal preferences. Please try again.";
                }
            }
        })
        .catch((error) => {
            const mealInfo = document.getElementById("meal-info");
            if (mealInfo) {
                mealInfo.innerText = "An error occurred while fetching data. Please try again later.";
            }
            console.error(error);
        });
} else {
    // If no user is logged in, redirect to login page
    window.location.href = "login_page.html";
}

// Function to display recipes and shopping list
function displayRecipes(recipes, shoppingList) {
    console.log("Using pre-fetched recipes:", recipes); // Debugging
    console.log("Using stored shopping list:", shoppingList); // Debugging

    const mealSection = document.getElementById("recipes-list");
    const shoppingListSection = document.getElementById("shopping-list");

    // Clear previous content
    mealSection.innerHTML = `<h2>Recipes</h2>`;
    shoppingListSection.innerHTML = `<h2>Shopping List</h2>`;

    if (recipes.length > 0) {
        // ** Display recipe titles dynamically**
        recipes.forEach((recipe) => {
            const recipeLink = document.createElement("a");
            recipeLink.href = `recipe.html?id=${recipe.id}`; // Dynamic link
            recipeLink.innerText = recipe.title;
            recipeLink.classList.add("recipe-link"); // Optional for styling

            const recipeTitle = document.createElement("h3");
            recipeTitle.setAttribute("data-id", recipe.id); // Store recipe ID for later use
            recipeTitle.appendChild(recipeLink);
            mealSection.appendChild(recipeTitle);
        });

        if (shoppingList.length > 0) {
            const ingredientMap = new Map();

            // Sum quantities for each ingredient
            shoppingList.forEach((item) => {
                const key = `${item.name}-${item.unit}`; // Unique key to group by name & unit
                const quantity = parseFloat(item.quantity) || 0; // Ensure numeric conversion

                if (ingredientMap.has(key)) {
                    ingredientMap.get(key).quantity += quantity; // Add to existing quantity
                } else {
                    ingredientMap.set(key, { name: item.name, quantity: quantity, unit: item.unit });
                }
            });

            // ** Display shopping list dynamically**
            const shoppingListItems = document.createElement("ul");
            ingredientMap.forEach((item) => {
                const listItem = document.createElement("li");
                listItem.innerText = `${item.name}: ${item.quantity.toFixed(2)} ${item.unit}`;
                shoppingListItems.appendChild(listItem);
            });

            shoppingListSection.appendChild(shoppingListItems);
        } else {
            shoppingListSection.innerHTML += `<p>No ingredients needed.</p>`;
        }
    } else {
        mealSection.innerHTML += `<p>No recipes found for the selected preferences.</p>`;
    }
}

async function generateAndDisplayRecipes() {
    try {
        const loggedInUser = localStorage.getItem('loggedInUser');
        if (!loggedInUser) {
            alert('Please log in first');
            return;
        }

        // Get meal preferences from server
        const response = await fetch(`${API_BASE_URL}/get-meal-preferences?username=${loggedInUser}`);
        if (!response.ok) {
            throw new Error('Failed to get meal preferences');
        }

        const data = await response.json();
        if (!data.success) {
            throw new Error(data.message);
        }

        const { breakfast, lunch, dinner } = data.preferences;

        // If no preferences set, just display saved recipes (if any)
        if (breakfast === "0" && lunch === "0" && dinner === "0") {
            await displaySavedRecipes();
            return;
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
        displayRecipes(recipesData.recipes, recipesData.shoppingList);

    } catch (error) {
        console.error('Error generating recipes:', error);
        document.getElementById('recipes-list').innerHTML = '<p>Error generating recipes. Please try again.</p>';
        document.getElementById('shopping-list').innerHTML = '<p>Error generating shopping list.</p>';
    }
}

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

// Add event listener for page load
document.addEventListener('DOMContentLoaded', async () => {
    await generateAndDisplayRecipes();
});

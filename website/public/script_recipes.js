// Retrieve the logged-in user from localStorage
const loggedInUser = localStorage.getItem("loggedInUser");

// Retrieve stored recipes and shopping list from localStorage
const viableRecipes = localStorage.getItem("filteredRecipes") ? JSON.parse(localStorage.getItem("filteredRecipes")) : [];
const storedShoppingList = JSON.parse(localStorage.getItem("shoppingList")) || [];

if (loggedInUser) {
    // Fetch the user's meal preferences from the backend
    fetch(`${API_BASE_URL}/get-meal-preferences?username=${loggedInUser}`)
        .then((response) => response.json())
        .then((data) => {
            if (data.success) {
                const { breakfast, lunch, dinner } = data.preferences;

                // ** Update the preferences header dynamically**
                const preferencesHeader = document.getElementById("preferences-header");
                if (preferencesHeader) {
                    preferencesHeader.innerText = `Preferences for: ${loggedInUser}`;
                }

                // ** Update meal info dynamically based on fetched data**
                const mealInfo = document.getElementById("meal-info");
                if (mealInfo) {
                    mealInfo.innerText = `For this week, ${loggedInUser} wants ${breakfast} breakfast(s), ${lunch} lunch(es), and ${dinner} dinner(s).`;
                }

                // ** Call displayRecipes with pre-fetched recipes**
                displayRecipes(viableRecipes, storedShoppingList);
            } else {
                // If there's an issue fetching preferences, display an error
                const mealInfo = document.getElementById("meal-info");
                if (mealInfo) {
                    mealInfo.innerText = "Error retrieving meal preferences. Please try again.";
                }
            }
        })
        .catch((error) => {
            // Handle any errors during the fetch
            const mealInfo = document.getElementById("meal-info");
            if (mealInfo) {
                mealInfo.innerText = "An error occurred while fetching data. Please try again later.";
            }
            console.error(error);
        });
} 
else {
    // If no user is logged in, prompt to log in
    const mealInfo = document.getElementById("meal-info");
    if (mealInfo) {
        mealInfo.innerText = "Please log in first.";
    }
    window.location.href = "login_page.html";  // Redirect to login page if no logged-in user
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

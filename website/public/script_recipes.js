// Retrieve the logged-in user from localStorage
const loggedInUser = localStorage.getItem("loggedInUser");

if (loggedInUser) {
    // Fetch the user's meal preferences from the backend
    fetch(`http://localhost:3000/get-meal-preferences?username=${loggedInUser}`)
        .then((response) => response.json())
        .then((data) => {
            if (data.success) {
                const { breakfast, lunch, dinner } = data.preferences;

                // Update the preferences header with the logged-in user
                document.getElementById("preferences-header").innerText = `Preferences for: ${loggedInUser}`;

                // Update the meal information with the fetched preferences
                document.getElementById("meal-info").innerText = `For this week, ${loggedInUser} wants ${breakfast} breakfast(s), ${lunch} lunch(es), and ${dinner} dinner(s).`;

                // Call displayRecipes after meal preferences have been fetched
                displayRecipes(breakfast, lunch, dinner);
            } else {
                document.getElementById("meal-info").innerText = "Error retrieving meal preferences. Please try again.";
            }
        })
        .catch((error) => {
            document.getElementById("meal-info").innerText = "An error occurred while fetching data. Please try again later.";
            console.error(error);
        });
} 
else {
    // If no user is logged in, prompt to log in
    document.getElementById("meal-info").innerText = "Please log in first.";
    window.location.href = "login_page.html";  // Redirect to login page if no logged-in user
}

// Function to fetch and display recipes and shopping list
function displayRecipes(breakfast, lunch, dinner) {
    console.log("Sending parameters:", { breakfast, lunch, dinner }); // Debugging
    fetch(`http://localhost:3000/get-recipes?breakfast=${breakfast}&lunch=${lunch}&dinner=${dinner}`)
        .then((response) => response.json())
        .then((data) => {
            console.log("Fetched data:", data);
            const mealSection = document.getElementById("recipes-list");
            const shoppingListSection = document.getElementById("shopping-list");

            // Clear previous content
            mealSection.innerHTML = `<h2>Recipes</h2>`;
            shoppingListSection.innerHTML = `<h2>Shopping List</h2>`;

            if (data.success) {
                if (data.recipes.length > 0) {
                    // Display recipe titles only
                    data.recipes.forEach((recipe) => {
                        const recipeLink = document.createElement("a");
                        recipeLink.href = `recipe.html?id=${recipe.id}`; // Dynamic link
                        recipeLink.innerText = recipe.title;
                        recipeLink.classList.add("recipe-link"); // Optional for styling

                        const recipeTitle = document.createElement("h3");
                        recipeTitle.appendChild(recipeLink);
                        mealSection.appendChild(recipeTitle);
                    });

                    // ** Process and combine ingredients in the shopping list **
                    if (data.shoppingList.length > 0) {
                        const ingredientMap = new Map();

                        // Sum quantities for each ingredient
                        data.shoppingList.forEach((item) => {
                            const key = `${item.name}-${item.unit}`; // Unique key to group by name & unit
                            const quantity = parseFloat(item.quantity) || 0; // Ensure numeric conversion

                            if (ingredientMap.has(key)) {
                                ingredientMap.get(key).quantity += quantity; // Add to existing quantity
                            } else {
                                ingredientMap.set(key, { name: item.name, quantity: quantity, unit: item.unit });
                            }
                        });

                        // Display shopping list
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
            } else {
                mealSection.innerHTML += `<p>Failed to fetch recipes. Please try again later.</p>`;
            }
        })
        .catch((error) => {
            console.error("Error fetching recipes:", error);
        });
}

// Send the email 
async function sendEmail() {
    try {
        const userEmail = loggedInUser; // Retrieve user's email
        if (!userEmail) {
            alert("User email not found. Please log in.");
            return;
        }

        const recipes = [];
        document.querySelectorAll("#recipes-list h3").forEach(recipe => {
            // Assuming each <h3> contains a data-id attribute for the recipe ID
            const recipeId = recipe.getAttribute("data-id");
            const recipeTitle = recipe.innerText;
            recipes.push({ id: recipeId, title: recipeTitle });
        });

        const shoppingList = [];
        document.querySelectorAll("#shopping-list ul li").forEach(item => {
            shoppingList.push(item.innerText);
        });

        const response = await fetch("http://localhost:3000/send-email", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ email: userEmail, recipes, shoppingList })
        });

        const result = await response.json();
        if (result.success) {
            alert("Email sent successfully!");
        } else {
            alert("Failed to send email.");
        }
    } catch (error) {
        console.error("Error sending email:", error);
        alert("An error occurred while sending the email.");
    }
}

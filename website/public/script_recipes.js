console.log("Script loading - before login check");
const loggedInUser = localStorage.getItem("loggedInUser");
console.log("Initial loggedInUser check:", loggedInUser);

if (!loggedInUser) {
    console.log("First login check failed - redirecting");
    alert("Please log in first (check 1)");
    window.location.href = "./index.html";
}

document.addEventListener('DOMContentLoaded', async () => {
    console.log("DOM Content Loaded");
    const loggedInUser = localStorage.getItem("loggedInUser");
    console.log("LoggedInUser check:", loggedInUser);

    if (!loggedInUser) {
        console.log("No logged in user found - redirecting");
        alert("Please log in first");
        window.location.href = "./index.html";
        return;
    }
    
    try {
        // Fetch the user's meal preferences from the backend
        const response = await fetch(`${API_BASE_URL}/get-meal-preferences?username=${loggedInUser}`);
        const data = await response.json();
        console.log("Meal preferences response:", data);

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
            console.log("Failed to get meal preferences");
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
    console.log("Displaying recipes:", recipes); // Debug log
    
    let html = '<h2>Your Weekly Recipes</h2>';
    
    recipes.forEach(recipe => {
        html += `
            <div class="recipe">
                <h3><a href="recipe.html?id=${recipe.id}" class="recipe-link">${recipe.title}</a></h3>
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

// Add this function to handle email sending
async function sendEmail() {
    console.log("Send email function called"); // Debug log
    const loggedInUser = localStorage.getItem("loggedInUser");
    console.log("User email:", loggedInUser); // Debug log
    
    if (!loggedInUser) {
        alert("Please log in first");
        return;
    }

    try {
        // Get the current recipes and shopping list from the page
        const recipes = Array.from(document.querySelectorAll('.recipe h3 a')).map(a => ({
            id: new URLSearchParams(new URL(a.href).search).get('id'),
            title: a.textContent
        }));
        console.log("Collected recipes:", recipes); // Debug log

        const shoppingItems = Array.from(document.querySelectorAll('#shopping-list li')).map(li => li.textContent);
        console.log("Collected shopping items:", shoppingItems); // Debug log

        // Send to the server
        const response = await fetch(`${API_BASE_URL}/send-email`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: loggedInUser,
                recipes: recipes,
                shoppingList: shoppingItems
            })
        });

        const data = await response.json();
        console.log("Server response:", data); // Debug log
        
        if (data.success) {
            alert('Email sent successfully!');
        } else {
            throw new Error(data.message || 'Failed to send email');
        }
    } catch (error) {
        console.error('Error sending email:', error);
        alert('Failed to send email. Please try again.');
    }
}

// Retrieve the logged-in user from localStorage
const loggedInUser = localStorage.getItem("loggedInUser");

if (loggedInUser) {
    // Update the welcome message with the username
    document.getElementById("welcome-message").innerText = `${loggedInUser} is logged in successfully.`;
} else {
    // If no user is logged in, redirect to the login page
    alert("Please log in first.");
    window.location.href = "login_page.html";
}

// Add event listener for the "Go to Equipment Preferences" button
const equipmentButton = document.getElementById("equipment-button");
equipmentButton.addEventListener("click", () => {
    // Navigate to equipment.html
    window.location.href = "equipment.html";
});

// Add event listener for the "Generate Week's Meals" button
const generateButton = document.getElementById("generate");
generateButton.addEventListener("click", () => {
    // Navigate to generate.html
    window.location.href = "generate.html";
});

// Add event listener for the "Generate Week's Meals" button
const addRecipesButton = document.getElementById("add-recipe");
addRecipesButton.addEventListener("click", () => {
    // Navigate to generate.html
    window.location.href = "add_recipe.html";
});
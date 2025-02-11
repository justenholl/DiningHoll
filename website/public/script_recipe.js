document.addEventListener("DOMContentLoaded", async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const recipeId = urlParams.get("id");

    if (!recipeId) {
        document.getElementById("recipe-title").innerText = "Recipe not found.";
        return;
    }

    try {
        const response = await fetch(`http://localhost:3000/get-recipe?id=${recipeId}`);
        const data = await response.json();

        if (data.success) {
            document.getElementById("recipe-title").innerText = data.recipe.title;
            document.getElementById("recipe-instructions").innerText = data.recipe.instructions;

            const ingredientsList = document.getElementById("recipe-ingredients");
            data.recipe.ingredients.forEach(ingredient => {
                const li = document.createElement("li");
                li.innerText = `${ingredient.name}: ${ingredient.quantity} ${ingredient.unit}`;
                ingredientsList.appendChild(li);
            });

            const equipmentList = document.getElementById("recipe-equipment");
            data.recipe.equipment.forEach(equipment => {
                const li = document.createElement("li");
                li.innerText = equipment;
                equipmentList.appendChild(li);
            });
        } else {
            document.getElementById("recipe-title").innerText = "Recipe not found.";
        }
    } catch (error) {
        console.error("Error fetching recipe:", error);
        document.getElementById("recipe-title").innerText = "Failed to load recipe.";
    }
});

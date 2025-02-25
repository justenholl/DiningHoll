document.addEventListener("DOMContentLoaded", async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const recipeId = urlParams.get("id");

    if (!recipeId) {
        alert('No recipe ID provided');
        window.location.href = './recipes.html';
    }

    try {
        const response = await fetch(`${API_BASE_URL}/get-recipe?id=${recipeId}`);
        const data = await response.json();

        if (data.success) {
            const recipe = data.recipe;
            
            document.getElementById("recipe-title").innerText = recipe.title;
            
            const formattedInstructions = recipe.instructions
                .split(';')
                .map(instruction => instruction.trim())
                .filter(instruction => instruction.length > 0)
                .join('\n');
            
            document.getElementById("recipe-instructions").innerText = formattedInstructions;

            const ingredientsList = document.getElementById("recipe-ingredients");
            recipe.ingredients.forEach(ingredient => {
                const li = document.createElement("li");
                li.textContent = `${ingredient.quantity} ${ingredient.unit} ${ingredient.name}`;
                ingredientsList.appendChild(li);
            });

            const equipmentList = document.getElementById("recipe-equipment");
            recipe.equipment.forEach(equipment => {
                const li = document.createElement("li");
                li.textContent = equipment;
                equipmentList.appendChild(li);
            });
        } else {
            alert('Failed to load recipe');
            window.location.href = './recipes.html';
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error loading recipe');
        window.location.href = './recipes.html';
    }
});

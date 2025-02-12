document.addEventListener("DOMContentLoaded", async function () {
    console.log("Script loaded and DOM fully loaded.");

    const ingredientFields = document.getElementById("ingredient-fields");
    const addIngredientButton = document.getElementById("add-ingredient");
    const equipmentFields = document.getElementById("equipment-fields");
    const formElement = document.getElementById("add-recipe-form");

    const availableUnits = ["cup", "tablespoon", "teaspoon", "whole", "grams", "milliliters", "ounces"];

    // Fetch unique ingredients from the database
    async function fetchIngredients() {
        try {
            const response = await fetch("http://localhost:3000/get-ingredients");
            const data = await response.json();

            if (data.success && data.ingredients.length > 0) {
                return data.ingredients; // Returns an array of ingredient names
            } else {
                console.error("No ingredients found.");
                return [];
            }
        } catch (error) {
            console.error("Error fetching ingredients:", error);
            return [];
        }
    }

    // Fetch available equipment from the database
    async function fetchEquipment() {
        try {
            const response = await fetch(`{API_BASE_URL}/get-equipment`);
            const data = await response.json();

            console.log("Equipment API Response:", data); // Debugging log

            // Ensure data is an object and contains the 'equipment' array
            if (data && Array.isArray(data.equipment)) {
                return data.equipment; // Return the array of equipment
            } else {
                console.error("Invalid equipment data format:", data);
                return []; // Return an empty array if data format is incorrect
            }
        } catch (error) {
            console.error("Error fetching equipment:", error);
            return []; // Return an empty array on error
        }
    }

    // Populate equipment checkboxes
    async function populateEquipment() {
        const equipmentList = await fetchEquipment();
        equipmentFields.innerHTML = "<label>Equipment</label>"; // Reset content

        if (equipmentList.length === 0) {
            equipmentFields.innerHTML += "<p>No equipment available.</p>";
            return;
        }

        equipmentList.forEach((equipment) => {
            const checkboxItem = document.createElement("div");
            checkboxItem.classList.add("checkbox-item");
            checkboxItem.innerHTML = `
                <input type="checkbox" id="${equipment}" name="equipment[${equipment}]" value="1" />
                <label for="${equipment}">${equipment}</label>
            `;
            equipmentFields.appendChild(checkboxItem);
        });
    }

    // Add a new ingredient field dynamically
    async function addIngredientField() {
        const ingredientsList = await fetchIngredients();

        if (ingredientsList.length === 0) {
            alert("No ingredients available to select.");
            return;
        }

        const ingredientDiv = document.createElement("div");
        ingredientDiv.classList.add("ingredient-entry");

        ingredientDiv.innerHTML = `
            <select name="ingredient" class="ingredient-select">
                ${ingredientsList.map((name) => `<option value="${name}">${name}</option>`).join("")}
            </select>
            <input type="number" name="quantity" class="ingredient-quantity" min="0.1" step="0.1" required />
            <select name="unit" class="ingredient-unit">
                ${availableUnits.map((unit) => `<option value="${unit}">${unit}</option>`).join("")}
            </select>
            <button type="button" class="remove-ingredient">Remove</button>
        `;

        document.getElementById("ingredient-fields").appendChild(ingredientDiv);
        ingredientFields.appendChild(ingredientDiv);

        // Remove ingredient event
        ingredientDiv.querySelector(".remove-ingredient").addEventListener("click", () => {
            ingredientDiv.remove();
        });
    }

    // Handle adding new ingredient field
    addIngredientButton.addEventListener("click", addIngredientField);

    // Populate equipment dynamically
    populateEquipment();

    // Handle form submission
    formElement.addEventListener("submit", (e) => {
        e.preventDefault();
        console.log("Form submission event triggered.");

        // Collect form data
        const formData = {
            title: document.getElementById("title").value,
            instructions: document.getElementById("instructions").value,
            prepTime: document.getElementById("prepTime").value,
            cookTime: document.getElementById("cookTime").value,
            mealTypes: {
                breakfast: document.getElementById("breakfast").checked ? 1 : 0,
                lunch: document.getElementById("lunch").checked ? 1 : 0,
                dinner: document.getElementById("dinner").checked ? 1 : 0,
            },
            equipment: Array.from(document.querySelectorAll("#equipment-fields input[type='checkbox']:checked"))
                .map((checkbox) => checkbox.id),
            ingredients: Array.from(document.querySelectorAll(".ingredient-entry")).map((div) => ({
                name: div.querySelector(".ingredient-select").value,
                quantity: parseFloat(div.querySelector(".ingredient-quantity").value) || 0,
                unit: div.querySelector(".ingredient-unit").value,
            })),
        };

        console.log("Form Data Being Sent:", formData);

        // Send data to the server
        fetch(`{API_BASE_URL}/add-recipe`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formData),
        })
            .then((response) => response.json())
            .then((data) => {
                if (data.success) {
                    document.getElementById("success-message").style.display = "block";
                    setTimeout(() => {
                        document.getElementById("success-message").style.display = "none";
                    }, 3000);
                    formElement.reset();
                    ingredientFields.innerHTML = "";
                    populateEquipment(); // Refresh equipment checkboxes
                } else {
                    alert(data.message || "Failed to add recipe.");
                }
            })
            .catch((error) => console.error("Error:", error));
    });
});

document.addEventListener("DOMContentLoaded", async function () {
    console.log("Script loaded and DOM fully loaded.");

    const ingredientFields = document.getElementById("ingredient-fields");
    const addIngredientButton = document.getElementById("add-ingredient");
    const equipmentFields = document.getElementById("equipment-fields");
    const instructionFields = document.getElementById("instructions-list");
    const addInstructionButton = document.getElementById("add-instruction");
    const formElement = document.getElementById("add-recipe-form");

    const availableUnits = ["cup", "tablespoon", "teaspoon", "whole", "grams", "milliliters", "ounces"];

    async function fetchIngredients() {
        try {
            const response = await fetch(`${API_BASE_URL}/get-ingredients`);
            const data = await response.json();
            return data.success && data.ingredients.length > 0 ? data.ingredients : [];
        } catch (error) {
            console.error("Error fetching ingredients:", error);
            return [];
        }
    }

    async function fetchEquipment() {
        try {
            const response = await fetch(`${API_BASE_URL}/get-equipment`);
            const data = await response.json();
            return data && Array.isArray(data.equipment) ? data.equipment : [];
        } catch (error) {
            console.error("Error fetching equipment:", error);
            return [];
        }
    }

    async function populateEquipment() {
        const equipmentList = await fetchEquipment();
        equipmentFields.innerHTML = "<label>Equipment</label>";
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
        ingredientFields.appendChild(ingredientDiv);
        ingredientDiv.querySelector(".remove-ingredient").addEventListener("click", () => ingredientDiv.remove());
    }

    function addInstructionStep() {
        const stepNumber = instructionFields.children.length + 1;
        const instructionDiv = document.createElement("div");
        instructionDiv.classList.add("instruction-entry");
        instructionDiv.innerHTML = `
            <span>${stepNumber}.</span>
            <input type="text" class="instruction-text" placeholder="Enter step ${stepNumber}" required />
            <button type="button" class="remove-instruction">Remove</button>
        `;
        instructionFields.appendChild(instructionDiv);
        instructionDiv.querySelector(".remove-instruction").addEventListener("click", () => {
            instructionDiv.remove();
            updateInstructionNumbers();
        });
    }

    function updateInstructionNumbers() {
        document.querySelectorAll(".instruction-entry").forEach((div, index) => {
            div.querySelector("span").textContent = `${index + 1}.`;
            div.querySelector(".instruction-text").setAttribute("placeholder", `Enter step ${index + 1}`);
        });
    }

    addIngredientButton.addEventListener("click", addIngredientField);
    addInstructionButton.addEventListener("click", addInstructionStep);
    populateEquipment();

    formElement.addEventListener("submit", (e) => {
        e.preventDefault();
        console.log("Form submission event triggered.");
        const formData = {
            title: document.getElementById("title").value,
            instructions: Array.from(document.querySelectorAll(".instruction-entry"))
                .map((div, index) => `${index + 1}. ${div.querySelector(".instruction-text").value.trim()}`)
                .filter((text) => text !== "1. ") // Ensure empty instructions are not saved
                .join("; "),
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
        fetch(`${API_BASE_URL}/add-recipe`, {
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
                    instructionFields.innerHTML = "";
                    populateEquipment();
                } else {
                    alert(data.message || "Failed to add recipe.");
                }
            })
            .catch((error) => console.error("Error:", error));
    });
});

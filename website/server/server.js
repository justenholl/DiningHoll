const mysql = require("mysql2"); // Use callback-based MySQL
const express = require("express");
const bcrypt = require("bcrypt");
const cors = require("cors");
const nodemailer = require("nodemailer");

const app = express();
const port = 3000;

// Middleware
app.use(express.json());
app.use(cors({
    origin: ["https://justenholl.github.io"], // Allow requests from GitHub Pages
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true 
}));

// MySQL Connection Pool (callback-based)
const db = mysql.createPool({
    host: 'monorail.proxy.rlwy.net',  // use the provided host
    user: 'root',                     // your MYSQLUSER
    password: 'txWOqacViRbQiGezjJiIaiqapiClhvwG', // your MYSQLPASSWORD
    database: 'railway',              // your MYSQLDATABASE (usually 'railway' if not specific)
    port: 28041,                      // your MYSQLPORT
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Make sure you can connect to the database
db.query("SELECT 1", (err, results) => {
    if (err) {
        console.error("Could not connect to database:", err);
    } else {
        console.log("Connected to MySQL database.");
    }
});

// In-memory "database" (use a real database in production)
const users = [];
const preferences = {};

// Handle registration
app.post("/register", async (req, res) => {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
        return res.status(400).json({ success: false, message: "Missing email or password." });
    }

    // Check if user already exists
    if (users.find((user) => user.email === email)) {
        return res.status(400).json({ success: false, message: "Email is already registered." });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Store the user in the "users" array
    users.push({ email, password: hashedPassword });

    // Initialize default meal preferences
    preferences[email] = {
        breakfast: 0,
        lunch: 0,
        dinner: 0,
    };

    console.log("Registered users:", users);  // Log to check the user data
    console.log("User preferences:", preferences);  // Log to check the preferences

    res.json({ success: true, message: "User registered successfully." });
});

// Handle login
app.post("/login", async (req, res) => {
    const { email, password } = req.body;

    // Check if the user exists
    const user = users.find((user) => user.email === email);

    if (!user) {
        return res.status(400).json({ success: false, message: "Invalid email or password." });
    }

    // Check if the password matches
    const match = await bcrypt.compare(password, user.password);

    if (!match) {
        return res.status(400).json({ success: false, message: "Invalid email or password." });
    }

    // If login is successful, return a success response
    res.json({ success: true, message: "Login successful." });
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});

// Get all registered users (for development only)
app.get("/users", (req, res) => {
    const userList = users.map((user) => ({ email: user.email }));
    res.json({ success: true, users: userList });
});

// Get all the unique ingredients
app.get("/get-ingredients", (req, res) => {
    const query = "SELECT DISTINCT name FROM Ingredients";
    
    db.query(query, (err, results) => {
        if (err) {
            console.error("Error fetching ingredients:", err);
            return res.status(500).json({ success: false, message: "Database query failed." });
        }
        
        const ingredients = results.map(row => row.name);
        res.json({ success: true, ingredients });
    });
});

// Get all the unique equipment
app.get("/get-equipment", (req, res) => {
    const query = "SELECT DISTINCT name FROM Equipment";
    
    db.query(query, (err, results) => {
        if (err) {
            console.error("Error fetching equipment:", err);
            return res.status(500).json({ success: false, message: "Database query failed." });
        }
        
        const equipment = results.map(row => row.name);
        res.json({ success: true, equipment });
    });
});

// Add the users preferences and equipment
app.post("/save-preferences", (req, res) => {
    const { username, preferences } = req.body;

    if (!username || !preferences) {
        return res.status(400).json({ success: false, message: "Username or preferences are missing." });
    }

    // Simulate saving preferences in a database
    const user = users.find((user) => user.email === username);
    if (!user) {
        return res.status(404).json({ success: false, message: "User not found." });
    }

    // Save preferences (for simplicity, we attach it directly to the user object)
    user.preferences = preferences;

    res.json({ success: true, message: "Preferences saved successfully." });
});

// Get the users preferences and equipment
app.get("/get-preferences", (req, res) => {
    const username = req.query.username;

    if (!username) {
        return res.status(400).json({ success: false, message: "Username is required." });
    }

    // Find the user in the database
    const user = users.find((user) => user.email === username);

    if (!user) {
        return res.status(404).json({ success: false, message: "User not found." });
    }

    // Return the user's preferences
    res.json({ success: true, preferences: user.preferences || [] });
});

// Save meal preferences
app.post("/save-meal-preferences", (req, res) => {
    const { username, preferences: userPreferences } = req.body;
    
    // Log the incoming preferences to see if they are strings
    console.log("Received Preferences:", userPreferences);

    if (!username || !userPreferences) {
        return res.status(400).json({ success: false, message: "Invalid request data." });
    }

    const breakfast = parseInt(userPreferences.breakfast, 10);
    const lunch = parseInt(userPreferences.lunch, 10);
    const dinner = parseInt(userPreferences.dinner, 10);

    if (isNaN(breakfast) || isNaN(lunch) || isNaN(dinner)) {
        return res.status(400).json({ success: false, message: "Invalid input values." });
    }

    // Save preferences in the mock database (or real database)
    preferences[username] = {
        breakfast,
        lunch,
        dinner,
    };

    res.json({ success: true, message: "Preferences saved successfully!" });
});

// Get meal preferences
app.get("/get-meal-preferences", (req, res) => {
    const username = req.query.username;

    if (!username) {
        return res.status(400).json({ success: false, message: "Username is required." });
    }

    const userPreferences = preferences[username];

    if (!userPreferences) {
        return res.json({
            success: true,
            preferences: {
                breakfast: "0",
                lunch: "0",
                dinner: "0",
            },
        });
    }

    res.json({ success: true, preferences: userPreferences });
});

// Get recipes by meal preferences (breakfast, lunch, dinner)
app.get("/get-recipes", async (req, res) => {
    const { breakfast, lunch, dinner } = req.query;

    // Parse query parameters as integers
    const breakfastCount = parseInt(breakfast, 10) || 0;
    const lunchCount = parseInt(lunch, 10) || 0;
    const dinnerCount = parseInt(dinner, 10) || 0;

    const queries = [];
    const recipes = [];
    const ingredientsMap = new Map(); // To aggregate the shopping list

    try {
        // Query for recipes based on meal type
        const createQuery = async (mealType, count) => {
            if (count > 0) {
                const query = `
                    SELECT id, title
                    FROM Recipes
                    WHERE ${mealType}_bool = 1
                    ORDER BY RAND()
                    LIMIT ?;
                `;
                const [rows] = await db.promise().query(query, [count]);
                return rows;
            }
            return [];
        };

        // Fetch recipes for breakfast, lunch, and dinner
        const breakfastRecipes = await createQuery("breakfast", breakfastCount);
        const lunchRecipes = await createQuery("lunch", lunchCount);
        const dinnerRecipes = await createQuery("dinner", dinnerCount);

        // Combine all selected recipes
        const selectedRecipes = [...breakfastRecipes, ...lunchRecipes, ...dinnerRecipes];

        if (selectedRecipes.length === 0) {
            return res.json({ success: true, recipes: [], shoppingList: [] });
        }

        // Get recipe IDs for fetching ingredients and equipment
        const recipeIds = selectedRecipes.map(recipe => recipe.id);

        // Fetch ingredients for the selected recipes
        const ingredientQuery = `
            SELECT ri.recipe_id, i.name AS ingredient_name, ri.quantity, ri.unit
            FROM Recipe_Ingredients ri
            JOIN Ingredients i ON ri.ingredient_id = i.id
            WHERE ri.recipe_id IN (?);
        `;
        const [ingredientRows] = await db.promise().query(ingredientQuery, [recipeIds]);

        // Fetch equipment for the selected recipes
        const equipmentQuery = `
            SELECT re.recipe_id, e.name AS equipment_name
            FROM Recipe_Equipment re
            JOIN Equipment e ON re.equipment_id = e.id
            WHERE re.recipe_id IN (?);
        `;
        const [equipmentRows] = await db.promise().query(equipmentQuery, [recipeIds]);

        // Organize recipes with their ingredients and equipment
        const recipeMap = new Map(selectedRecipes.map(recipe => [recipe.id, { ...recipe, ingredients: [], equipment: [] }]));

        // Aggregate ingredients correctly by summing up quantities and handling duplicates
        ingredientRows.forEach(({ recipe_id, ingredient_name, quantity, unit }) => {
            const recipe = recipeMap.get(recipe_id);
            if (recipe) {
                // Parse the quantity as a float to ensure correct aggregation
                const parsedQuantity = parseFloat(quantity);

                // Check if this ingredient already exists in the map, if so, sum the quantities
                if (ingredientsMap.has(ingredient_name)) {
                    ingredientsMap.get(ingredient_name).quantity += parsedQuantity;
                } else {
                    // Add new ingredient with its quantity
                    ingredientsMap.set(ingredient_name, { quantity: parsedQuantity, unit });
                }
            }
        });

        // Organize the equipment
        equipmentRows.forEach(({ recipe_id, equipment_name }) => {
            const recipe = recipeMap.get(recipe_id);
            if (recipe) {
                recipe.equipment.push(equipment_name);
            }
        });

        // Convert the ingredients map to an array for the shopping list
        const shoppingList = Array.from(ingredientsMap, ([name, { quantity, unit }]) => ({
            name: name.replace(/_/g, " "), // Replace underscores with spaces for readability
            quantity,
            unit
        }));

        // Send the response with the recipes and shopping list
        res.json({ success: true, recipes: Array.from(recipeMap.values()), shoppingList });
    } catch (error) {
        console.error("Error fetching recipes:", error);
        res.status(500).json({ success: false, message: "Database query failed." });
    }
});

// Add a recipe through the recipe web page
app.post("/add-recipe", (req, res) => {
    console.log("Received POST request to /add-recipe");
    console.log("Request body:", req.body);

    const { title, instructions, prepTime, cookTime, mealTypes, equipment, ingredients } = req.body;

    if (!title || !instructions || !prepTime || !cookTime) {
        console.error("Missing required fields:", { title, instructions, prepTime, cookTime });
        return res.status(400).json({ success: false, message: "Missing required fields." });
    }

    // Step 1: Insert into Recipes Table
    const recipeQuery = `
        INSERT INTO Recipes (title, instructions, prep_time, cook_time, breakfast_bool, lunch_bool, dinner_bool)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const recipeValues = [
        title,
        instructions,
        prepTime,
        cookTime,
        mealTypes.breakfast || 0,
        mealTypes.lunch || 0,
        mealTypes.dinner || 0,
    ];

    db.query(recipeQuery, recipeValues, (err, result) => {
        if (err) {
            console.error("Error inserting recipe:", err);
            return res.status(500).json({ success: false, message: "Error inserting recipe" });
        }

        const recipeId = result.insertId; // Get the inserted recipe's ID
        let responseSent = false; // Track whether the response has been sent

        // Step 2: Insert Ingredients into Recipe_Ingredients Table
        if (ingredients && ingredients.length > 0) {
            let ingredientIds = [];
            let ingredientProcessed = 0;

            // Function to handle inserting ingredients into Recipe_Ingredients table once all ingredient_ids are found
            const handleInsertIngredients = () => {
                if (ingredientProcessed === ingredients.length) {
                    // Insert into Recipe_Ingredients Table with ingredient_ids
                    const ingredientQuery = `
                        INSERT INTO Recipe_Ingredients (recipe_id, ingredient_id, quantity, unit)
                        VALUES ${ingredientIds.map(() => "(?, ?, ?, ?)").join(", ")}
                    `;
                    const ingredientValues = ingredientIds.flatMap(({ id, quantity, unit }) => [recipeId, id, quantity, unit]);

                    db.query(ingredientQuery, ingredientValues, (err) => {
                        if (err) {
                            console.error("Error inserting ingredients:", err);
                            if (!responseSent) {
                                responseSent = true;
                                return res.status(500).json({ success: false, message: "Error inserting ingredients" });
                            }
                        }
                    });
                }
            };

            // Query the Ingredients table for each ingredient name to get the ingredient_id
            ingredients.forEach((ingredient) => {
                const query = "SELECT id FROM Ingredients WHERE name = ?";
                db.query(query, [ingredient.name], (err, results) => {
                    if (err) {
                        console.error(`Error fetching ingredient ID for ${ingredient.name}:`, err);
                        if (!responseSent) {
                            responseSent = true;
                            return res.status(500).json({ success: false, message: `Error fetching ingredient ID for ${ingredient.name}` });
                        }
                    }

                    if (results.length > 0) {
                        // If ingredient is found, push the ingredient_id, quantity, and unit into the array
                        ingredientIds.push({
                            id: results[0].id,
                            quantity: ingredient.quantity,
                            unit: ingredient.unit
                        });
                    } else {
                        console.error(`Ingredient not found: ${ingredient.name}`);
                        if (!responseSent) {
                            responseSent = true;
                            return res.status(404).json({ success: false, message: `Ingredient not found: ${ingredient.name}` });
                        }
                    }

                    ingredientProcessed++;  // Increment the count of processed ingredients

                    handleInsertIngredients();  // Check if all ingredients have been processed
                });
            });
        }

        // Step 3: Insert Equipment into Recipe_Equipment Table
        if (equipment && equipment.length > 0) {
            let equipmentIds = [];
            let equipmentProcessed = 0;  // To track how many equipment queries have been processed

            // Function to handle inserting equipment into Recipe_Equipment table once all equipment_ids are found
            const handleInsertEquipment = () => {
                if (equipmentProcessed === equipment.length) {
                    // Insert into Recipe_Equipment Table with equipment_ids
                    const equipmentQuery = `
                        INSERT INTO Recipe_Equipment (recipe_id, equipment_id)
                        VALUES ${equipmentIds.map(() => "(?, ?)").join(", ")}
                    `;
                    const equipmentValues = equipmentIds.flatMap(id => [recipeId, id]);

                    db.query(equipmentQuery, equipmentValues, (err) => {
                        if (err) {
                            console.error("Error inserting equipment:", err);
                            if (!responseSent) {
                                responseSent = true;
                                return res.status(500).json({ success: false, message: "Error inserting equipment" });
                            }
                        }

                        console.log("Recipe added successfully with ingredients and equipment");
                        if (!responseSent) {
                            responseSent = true;
                            return res.json({ success: true, message: "Recipe added successfully!" });
                        }
                    });
                }
            };

            // Query the Equipment table for each equipment name to get the equipment_id
            equipment.forEach((equipmentName) => {
                const query = "SELECT id FROM Equipment WHERE name = ?";
                db.query(query, [equipmentName], (err, results) => {
                    if (err) {
                        console.error(`Error fetching equipment ID for ${equipmentName}:`, err);
                        if (!responseSent) {
                            responseSent = true;
                            return res.status(500).json({ success: false, message: `Error fetching equipment ID for ${equipmentName}` });
                        }
                    }

                    if (results.length > 0) {
                        // If equipment is found, push the equipment_id into the array
                        equipmentIds.push(results[0].id);
                    } else {
                        console.error(`Equipment not found: ${equipmentName}`);
                        if (!responseSent) {
                            responseSent = true;
                            return res.status(404).json({ success: false, message: `Equipment not found: ${equipmentName}` });
                        }
                    }

                    equipmentProcessed++;  // Increment the count of processed equipment

                    handleInsertEquipment();  // Check if all equipment have been processed
                });
            });
        } else {
            console.log("Recipe added successfully without equipment.");
            if (!responseSent) {
                responseSent = true;
                return res.json({ success: true, message: "Recipe added successfully!" });
            }
        }
    });
});

// Send the weekly email
app.post("/send-email", async (req, res) => {
    const { email, recipes, shoppingList } = req.body;

    if (!email) {
        return res.status(400).json({ success: false, message: "User email is required." });
    }

    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: "justenm12@gmail.com", // Replace with your email
            pass: "mfjn nnnr jprb hxmb" // nodemailer google password
        }
    });
    
    const emailContent = `
        <h2>Your Recipes</h2>
        <ul>
            ${recipes.map(recipe => 
                `<li><a href="recipe.html?id=${recipe.id}">${recipe.title}</a></li>`
            ).join("")}
        </ul>

        <h2>Your Shopping List</h2>
        <ul>${shoppingList.map(item => `<li>${item}</li>`).join("")}</ul>
    `;

    const mailOptions = {
        from: "Justenm12@gmail.com",
        to: email, // Use the logged-in user's email
        subject: "Your Recipes & Shopping List",
        html: emailContent
    };

    try {
        await transporter.sendMail(mailOptions);
        res.json({ success: true });
    } catch (error) {
        console.error("Email sending failed:", error);
        res.status(500).json({ success: false, message: "Failed to send email." });
    }
});

// For displaying one recipe
app.get("/get-recipe", async (req, res) => {
    const recipeId = req.query.id;
    if (!recipeId) return res.json({ success: false, message: "No recipe ID provided" });

    try {
        const [recipeRows] = await db.promise().query("SELECT * FROM Recipes WHERE id = ?", [recipeId]);
        if (recipeRows.length === 0) return res.json({ success: false, message: "Recipe not found" });

        const recipe = recipeRows[0];

        // Fetch ingredients
        const [ingredientRows] = await db.promise().query(`
            SELECT i.name, ri.quantity, ri.unit 
            FROM Recipe_Ingredients ri
            JOIN Ingredients i ON ri.ingredient_id = i.id
            WHERE ri.recipe_id = ?`, [recipeId]);

        // Fetch equipment
        const [equipmentRows] = await db.promise().query(`
            SELECT e.name 
            FROM Recipe_Equipment re
            JOIN Equipment e ON re.equipment_id = e.id
            WHERE re.recipe_id = ?`, [recipeId]);

        res.json({
            success: true,
            recipe: {
                id: recipe.id,
                title: recipe.title,
                instructions: recipe.instructions,
                ingredients: ingredientRows,
                equipment: equipmentRows.map(row => row.name),
            }
        });
    } catch (error) {
        console.error("Error fetching recipe:", error);
        res.status(500).json({ success: false, message: "Database error" });
    }
});

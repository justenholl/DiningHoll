document.getElementById("login-form").addEventListener("submit", async (event) => {
    event.preventDefault(); // Prevent the form from submitting the traditional way

    // Get form data
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {
        const response = await fetch(`${API_BASE_URL}/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                email: email,
                password: password,
            }),
        });

            const data = await response.json();

            if (data.success) {
                // Store the logged-in user's email
                localStorage.setItem("loggedInUser", email);
                alert("Login successful!");
                window.location.href = "dashboard.html";
            } else {
                alert("Invalid username or password. Please try again.");
                document.getElementById("login-form").reset();
            }
        } 
    catch (error) {
        console.error("Error during login:", error);
        alert("An error occurred while logging in. Please try again.");
    }

});
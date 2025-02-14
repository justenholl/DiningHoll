async function handleFormSubmission(event) {
    event.preventDefault(); // Prevent form submission

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const confirmPassword = document.getElementById("confirm-password").value;

    if (password !== confirmPassword) {
        alert("Passwords do not match!");
        return;
    }

    // Send the data to the server
    const response = await fetch(`${API_BASE_URL}/register`, {
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
        alert("Registration successful!");
        // Redirect to login page
        window.location.href = `${BASE_URL}/index`;
    } else {
        alert(data.message);
    }
}

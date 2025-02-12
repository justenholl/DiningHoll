document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll("button[data-page]").forEach(button => {
        button.addEventListener("click", () => {
            window.location.href = `${BASE_URL}/${button.dataset.page}`;
        });
    });
});
document.addEventListener("DOMContentLoaded", () => {
  const usernameInput = document.getElementById("username");
  const passwordInput = document.getElementById("password");
  const loginButton = document.getElementById("login");
  const errorText = document.getElementById("error");
  const resultText = document.getElementById("resultText");

  if (!usernameInput || !passwordInput || !loginButton || !errorText || !resultText) {
    console.error("One or more elements not found. Check HTML structure and IDs.");
    return;
  }

  loginButton.addEventListener("click", async () => {
    const username = usernameInput.value;
    const password = passwordInput.value;

    if (password.length < 6) {
      resultText.innerHTML = "Password must be at least 6 characters.";
      return;
    } else {
      resultText.innerHTML = "Password is invalid.";
    }

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (data?.token) {
        localStorage.setItem("token", data.token);
        const expirationTime = decodedToken.exp * 1000;
        const currentTime = Date.now();

        if (currentTime > expirationTime) {
          localStorage.removeItem("token");
          errorText.innerText = "Session has expired. Please log in again.";
          return;
        }

        window.location.href = "/";
      } else {
        errorText.innerText = data.error || "An error occurred.";
      }
    } catch (error) {
      console.error("An error occurred:", error);
      errorText.innerText = "An error occurred. Please try again.";
    }
  });
});

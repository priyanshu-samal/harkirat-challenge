document.addEventListener("DOMContentLoaded", () => {
  const loginCard = document.getElementById("login-card");
  const signupCard = document.getElementById("signup-card");
  const showSignupBtn = document.getElementById("show-signup");
  const showLoginBtn = document.getElementById("show-login");

  // Toggle Forms
  showSignupBtn.addEventListener("click", (e) => {
    e.preventDefault();
    loginCard.classList.add("hidden");
    signupCard.classList.remove("hidden");
  });

  showLoginBtn.addEventListener("click", (e) => {
    e.preventDefault();
    signupCard.classList.add("hidden");
    loginCard.classList.remove("hidden");
  });

  // Login Logic
  document.getElementById("login-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("login-email").value;
    const password = document.getElementById("login-password").value;
    const errorDiv = document.getElementById("login-error");

    errorDiv.textContent = "";

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (data.success) {
        localStorage.setItem("token", data.data.token);
        window.location.href = "/dashboard.html";
      } else {
        errorDiv.textContent = data.error || "Login failed";
      }
    } catch (err) {
      errorDiv.textContent = "Network error";
    }
  });

  // Signup Logic
  document.getElementById("signup-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = document.getElementById("signup-name").value;
    const email = document.getElementById("signup-email").value;
    const password = document.getElementById("signup-password").value;
    const role = document.getElementById("signup-role").value;
    const errorDiv = document.getElementById("signup-error");

    errorDiv.textContent = "";

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role }),
      });

      const data = await res.json();

      if (data.success) {
        // Auto login or ask to login? Let's just switch to login view for simplicity or auto login if we had token.
        // Signup response usually doesn't return token unless we implemented it that way. 
        // My controller returns user data only. So ask to login.
        alert("Account created! Please login.");
        signupCard.classList.add("hidden");
        loginCard.classList.remove("hidden");
      } else {
        errorDiv.textContent = data.error || "Signup failed";
      }
    } catch (err) {
      errorDiv.textContent = "Network error";
    }
  });
});

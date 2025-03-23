const promptForm = document.querySelector(".prompt-form");
const themeToggle = document.querySelector(".theme-toggle");
const promptBtn = document.querySelector(".prompt-btn");
const promptInput = document.querySelector(".prompt-input");
const generateBtn = document.querySelector(".generate-btn");
const galleryGrid = document.querySelector(".gallery-grid");
const modelSelect = document.getElementById("model-select");
const countSelect = document.getElementById("count-select");
const ratioSelect = document.getElementById("ratio-select");

const API_KEY = ""; // Your Hugging Face API Key

// Example prompts
const examplePrompts = [
  "A magic forest with glowing plants and fairy homes among giant mushrooms",
  "An old steampunk airship floating through golden clouds at sunset",
  "A future Mars colony with glass domes and gardens against red mountains",
  "A dragon sleeping on gold coins in a crystal cave",
  "An underwater kingdom with merpeople and glowing coral buildings",
  "A floating island with waterfalls pouring into clouds below",
  "A witch's cottage in fall with magic herbs in the garden",
  "A robot painting in a sunny studio with art supplies around it",
  "A magical library with floating glowing books and spiral staircases",
  "A Japanese shrine during cherry blossom season with lanterns and misty mountains",
  "A cosmic beach with glowing sand and an aurora in the night sky",
  "A medieval marketplace with colorful tents and street performers",
  "A cyberpunk city with neon signs and flying cars at night",
  "A peaceful bamboo forest with a hidden ancient temple",
  "A giant turtle carrying a village on its back in the ocean",
];

// Set theme based on saved preference or system default
(() => {
  const savedTheme = localStorage.getItem("theme");
  const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

  const isDarkTheme = savedTheme === "dark" || (!savedTheme && systemPrefersDark);
  document.body.classList.toggle("dark-theme", isDarkTheme);
  themeToggle.querySelector("i").className = isDarkTheme ? "fa-solid fa-sun" : "fa-solid fa-moon";
})();

// Switch between light and dark themes
const toggleTheme = () => {
  const isDarkTheme = document.body.classList.toggle("dark-theme");
  localStorage.setItem("theme", isDarkTheme ? "dark" : "light");
  themeToggle.querySelector("i").className = isDarkTheme ? "fa-solid fa-sun" : "fa-solid fa-moon";
};

// Calculate width/height based on chosen ratio
const getImageDimensions = (aspectRatio, baseSize = 512) => {
  const [width, height] = aspectRatio.split("/").map(Number);
  const scaleFactor = baseSize / Math.sqrt(width * height);

  let calculatedWidth = Math.round(width * scaleFactor);
  let calculatedHeight = Math.round(height * scaleFactor);

  // Ensure dimensions are multiples of 16 (AI model requirements)
  calculatedWidth = Math.floor(calculatedWidth / 16) * 16;
  calculatedHeight = Math.floor(calculatedHeight / 16) * 16;

  return { width: calculatedWidth, height: calculatedHeight };
};

// Replace loading spinner with the actual image
const updateImageCard = (index, imageUrl, promptText) => {
  const imgCard = document.getElementById(`img-card-${index}`);
  if (!imgCard) return;

  imgCard.classList.remove("loading");
  imgCard.innerHTML = `
    <img class="result-img" src="${imageUrl}" />
    <div class="img-overlay">
      <a href="${imageUrl}" class="img-download-btn" title="Download Image" download="generated_image_${index + 1}.png">
        <i class="fa-solid fa-download"></i>
      </a>
    </div>`;
};

// Send requests to Hugging Face API to create images
const generateImages = async (selectedModel, imageCount, aspectRatio, promptText) => {
  const MODEL_URL = `https://api-inference.huggingface.co/models/${selectedModel}`;
  const { width, height } = getImageDimensions(aspectRatio);
  generateBtn.setAttribute("disabled", "true");

  // Create an array of image generation promises
  const imagePromises = Array.from({ length: imageCount }, async (_, i) => {
    try {
      // Send request to the AI model API
      const response = await fetch(MODEL_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          "Content-Type": "application/json",
          "x-use-cache": "false",
        },
        body: JSON.stringify({
          inputs: promptText,
          parameters: { width, height },
        }),
      });

      if (!response.ok) throw new Error((await response.json())?.error);

      // Convert response to an image URL and update the image card
      const blob = await response.blob();
      updateImageCard(i, URL.createObjectURL(blob));
    } catch (error) {
      console.error(error);
      const imgCard = document.getElementById(`img-card-${i}`);
      imgCard.classList.replace("loading", "error");
      imgCard.querySelector(".status-text").textContent = "Generation failed! Check console for more details.";
    }
  });

  await Promise.allSettled(imagePromises);
  generateBtn.removeAttribute("disabled");
};

// Create placeholder cards with loading spinners
const createImageCards = (selectedModel, imageCount, aspectRatio, promptText) => {
  galleryGrid.innerHTML = "";

  for (let i = 0; i < imageCount; i++) {
    galleryGrid.innerHTML += `
      <div class="img-card loading" id="img-card-${i}" style="aspect-ratio: ${aspectRatio}">
        <div class="status-container">
          <div class="spinner"></div>
          <i class="fa-solid fa-triangle-exclamation"></i>
          <p class="status-text">Generating...</p>
        </div>
      </div>`;
  }

  // Stagger animation
  document.querySelectorAll(".img-card").forEach((card, i) => {
    setTimeout(() => card.classList.add("animate-in"), 100 * i);
  });

  generateImages(selectedModel, imageCount, aspectRatio, promptText); // Generate Images
};

// Constants for image generation limits
const NON_LOGGED_IN_LIMIT = 3; // Max generations for non-logged-in users
const STORAGE_KEY = "imageGenerations";

// Check if the user has reached the limit
const hasReachedLimit = () => {
  const token = localStorage.getItem("token");
  if (token) return false; // Logged-in users have no limit

  const imageGenerations = parseInt(localStorage.getItem(STORAGE_KEY) || 0);
  return imageGenerations >= NON_LOGGED_IN_LIMIT;
};

// Update the image generation count
const updateImageCount = () => {
  const token = localStorage.getItem("token");
  if (token) return; // Logged-in users have no limit

  const imageGenerations = parseInt(localStorage.getItem(STORAGE_KEY) || 0);
  localStorage.setItem(STORAGE_KEY, imageGenerations + 1);
};

// Reset the count daily
const resetImageCountDaily = () => {
  const lastGeneratedDate = localStorage.getItem("lastGeneratedDate");
  const today = new Date().toDateString();

  if (lastGeneratedDate !== today) {
    localStorage.setItem(STORAGE_KEY, 0);
    localStorage.setItem("lastGeneratedDate", today);
  }
};

// Display the remaining generations
const updateRemainingGenerationsDisplay = () => {
  const token = localStorage.getItem("token");
  const remainingGenerationsDisplay = document.getElementById("remaining-generations-display");

  if (token) {
    // Logged-in users have no limit
    if (remainingGenerationsDisplay) {
      remainingGenerationsDisplay.textContent = "You have unlimited image generations!";
    }
  } else {
    // Non-logged-in users have a limit
    const imageGenerations = parseInt(localStorage.getItem(STORAGE_KEY) || 0);
    const remainingGenerations = NON_LOGGED_IN_LIMIT - imageGenerations;

    if (remainingGenerationsDisplay) {
      remainingGenerationsDisplay.textContent = `You can generate ${remainingGenerations} more images today.`;
    }
  }
};

// Handle form submission
const handleFormSubmit = (e) => {
  e.preventDefault();

  // Check if the user is logged in
  const token = localStorage.getItem("token");

  // Check if the non-logged-in user has reached the limit
  if (!token && hasReachedLimit()) {
    alert(`You have reached the limit of ${NON_LOGGED_IN_LIMIT} image generations. Please log in for unlimited generations.`);
    return;
  }

  // Get form values
  const selectedModel = modelSelect.value;
  const imageCount = parseInt(countSelect.value) || 1;
  const aspectRatio = ratioSelect.value || "1/1";
  const promptText = promptInput.value.trim();

  // Check if the requested number of images exceeds the limit for non-logged-in users
  if (!token) {
    const imageGenerations = parseInt(localStorage.getItem(STORAGE_KEY) || 0);
    const remainingGenerations = NON_LOGGED_IN_LIMIT - imageGenerations;

    if (imageCount > remainingGenerations) {
      alert(`You can only generate ${remainingGenerations} more images today.`);
      return;
    }
  }

  // Generate images
  createImageCards(selectedModel, imageCount, aspectRatio, promptText);

  // Update the image count for non-logged-in users
  updateImageCount();

  // Update the remaining generations display
  updateRemainingGenerationsDisplay();
};

// Update UI After Login
function updateUIAfterLogin() {
  const navLinks = document.querySelector(".nav-links");
  navLinks.innerHTML = `
    <a href="#" id="logout-link">Logout</a>
  `;
  document.getElementById("logout-link").addEventListener("click", logout);

  // Update the remaining generations display
  updateRemainingGenerationsDisplay();
}

// Logout Function
function logout() {
  localStorage.removeItem("token");
  alert("Logged out successfully!");

  // Update UI to show logged-out state
  const navLinks = document.querySelector(".nav-links");
  navLinks.innerHTML = `
    <a href="#" id="login-link">Login</a>
    <a href="#" id="register-link">Register</a>
  `;

  // Re-attach event listeners for login and register links
  document.getElementById("login-link").addEventListener("click", () => (loginModal.style.display = "flex"));
  document.getElementById("register-link").addEventListener("click", () => (registerModal.style.display = "flex"));

  // Update the remaining generations display
  updateRemainingGenerationsDisplay();
}

// Check if user is already logged in on page load
function checkLoginStatus() {
  const token = localStorage.getItem("token");
  if (token) {
    updateUIAfterLogin();
  }
}

// Initialize
checkLoginStatus();
resetImageCountDaily();
updateRemainingGenerationsDisplay();

// Fill prompt input with random example (typing effect)
promptBtn.addEventListener("click", () => {
  const prompt = examplePrompts[Math.floor(Math.random() * examplePrompts.length)];

  let i = 0;
  promptInput.focus();
  promptInput.value = "";

  // Disable the button during typing animation
  promptBtn.disabled = true;
  promptBtn.style.opacity = "0.5";

  // Typing effect
  const typeInterval = setInterval(() => {
    if (i < prompt.length) {
      promptInput.value += prompt.charAt(i);
      i++;
    } else {
      clearInterval(typeInterval);
      promptBtn.disabled = false;
      promptBtn.style.opacity = "0.8";
    }
  }, 10); // Speed of typing
});

// DOM Elements
const loginLink = document.getElementById("login-link");
const registerLink = document.getElementById("register-link");
const loginModal = document.getElementById("login-modal");
const registerModal = document.getElementById("register-modal");
const closeButtons = document.querySelectorAll(".close");

// Open Modals
loginLink.addEventListener("click", () => (loginModal.style.display = "flex"));
registerLink.addEventListener("click", () => (registerModal.style.display = "flex"));

// Close Modals
closeButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    loginModal.style.display = "none";
    registerModal.style.display = "none";
  });
});

// Handle Login Form Submission
document.getElementById("login-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("login-email").value;
  const password = document.getElementById("login-password").value;

  try {
    const response = await fetch("http://localhost:5000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await response.json();
    if (response.ok) {
      localStorage.setItem("token", data.token); // Save token to localStorage
      alert("Login successful!");
      loginModal.style.display = "none";
      // Update UI to show logged-in state
      updateUIAfterLogin();
    } else {
      alert(data.error || "Login failed. Please try again.");
    }
  } catch (err) {
    alert("An error occurred. Please try again.");
  }
});

// Handle Registration Form Submission

document.getElementById("register-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const username = document.getElementById("register-username").value;
  const email = document.getElementById("register-email").value;
  const password = document.getElementById("register-password").value;
  const passwordError = document.getElementById("password-error");

  // Reset error message
  passwordError.textContent = "";
  passwordError.style.display = "none";

  // Password validation rules
  const minLength = 6;
  const hasNumber = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  // Validate password
  if (password.length < minLength) {
    passwordError.textContent = "Password must be at least 6 characters long.";
    passwordError.style.display = "block";
    return;
  }

  if (!hasNumber) {
    passwordError.textContent = "Password must include at least one number.";
    passwordError.style.display = "block";
    return;
  }

  if (!hasSpecialChar) {
    passwordError.textContent = "Password must include at least one special character.";
    passwordError.style.display = "block";
    return;
  }

  // If validation passes, proceed with registration
  try {
    const response = await fetch("http://localhost:5000/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password }),
    });

    if (response.ok) {
      alert("Registration successful! Please login.");
      registerModal.style.display = "none";
    } else {
      const data = await response.json();
      alert(data.error || "Registration failed. Please try again.");
    }
  } catch (err) {
    alert("An error occurred. Please try again.");
  }
});

// Hamburger menu toggle
document.addEventListener("DOMContentLoaded", function () {
  const hamburgerMenu = document.getElementById("hamburger-menu");
  const navLinks = document.querySelector(".nav-links");

  hamburgerMenu.addEventListener("click", function () {
    navLinks.classList.toggle("active");
  });
});

// Call this function on page load
checkLoginStatus();

themeToggle.addEventListener("click", toggleTheme);
promptForm.addEventListener("submit", handleFormSubmit);
let currentUser = null;

document.addEventListener('DOMContentLoaded', function () {
  checkCurrentUser();
  setupEventListeners();
  loadSavedTheme();
});

// ✅ التحقق من المستخدم الحالي
function checkCurrentUser() {
  const user = JSON.parse(localStorage.getItem("currentUser") || "null");
  if (user) {
    currentUser = user;
    updateUIForLoggedInUser();
  }
}

function updateUIForLoggedInUser() {
  document.getElementById("user-info").style.display = "block";
  document.getElementById("guest-message").style.display = "none";
  document.getElementById("profile-username-info").textContent = currentUser.username;
  document.getElementById("profile-email-info").textContent = currentUser.email;
  document.getElementById("login-link").style.display = "none";
  document.getElementById("register-link").style.display = "none";
}

// ✅ event listeners
function setupEventListeners() {
  document.getElementById("login-form").addEventListener("submit", handleLogin);
  document.getElementById("register-form").addEventListener("submit", handleRegister);
}

// ✅ hash password
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

// ✅ login
async function handleLogin(e) {
  e.preventDefault();
  const username = document.getElementById("login-username").value;
  const password = document.getElementById("login-password").value;
  const errorDiv = document.getElementById("login-error");
  errorDiv.innerHTML = "";

  if (!username) return showError("login-error", "Please enter your username");
  if (!password) return showError("login-error", "Please enter your password");

  const savedUsers = JSON.parse(localStorage.getItem("userData")) || [];
  const user = savedUsers.find(u => u.username === username);
  if (!user) return showError("login-error", "User not found");

  const hashedPassword = user.password;
  if (hashedPassword !== await hashPassword(password)) return showError("login-error", "Incorrect password");

  currentUser = { username: user.username, email: user.email, password: hashedPassword, image: user.image || "" };
  localStorage.setItem("currentUser", JSON.stringify(currentUser));
  showSuccess("login-error", "Login successful!");

  setTimeout(() => {
    updateUIForLoggedInUser();
    window.location.hash = "home";
  }, 1000);
}

// ✅ register
async function handleRegister(e) {
  e.preventDefault();
  const username = document.getElementById("register-username").value;
  const email = document.getElementById("register-email").value;
  const password = document.getElementById("register-password").value;
  const confirmPassword = document.getElementById("confirm-password").value;

  let errors = [];
  if (!username) errors.push("Username is required");
  if (!email) errors.push("Email is required");
  else if (!email.includes("@")) errors.push("Email must include @");
  if (!password) errors.push("Password is required");
  else if (confirmPassword !== password) errors.push("Passwords do not match");
  else if (password.length < 6 || password.length > 20) errors.push("Password must be 6 to 20 characters");
  else if (!password.match(/[a-z]/)) errors.push("Password must contain lowercase");
  else if (!password.match(/[A-Z]/)) errors.push("Password must contain uppercase");
  else if (!password.match(/[0-9]/)) errors.push("Password must contain number");
  else if (!password.match(/[@$!%*?&]/)) errors.push("Password must contain special character");

  const savedUsers = JSON.parse(localStorage.getItem("userData")) || [];
  if (savedUsers.find(u => u.username === username)) errors.push("Username already exists");

  if (errors.length > 0) return showError("register-error", errors.join("<br>"));

  const hashedPassword = await hashPassword(password);
  const userData = { username: username, email: email, password: hashedPassword, image: "" };

  savedUsers.push(userData);
  localStorage.setItem("userData", JSON.stringify(savedUsers));
  showSuccess("register-error", "Registration successful!");
  document.getElementById("register-form").reset();

  setTimeout(() => (window.location.hash = "login"), 2000);
}

// ✅ show page - محسّنة لتجنب التكرار
function showPage(pageId) {
  document.querySelectorAll('.page').forEach(page => page.classList.remove('active'));
  document.querySelectorAll('nav a').forEach(link => link.classList.remove('active'));

  const targetPage = document.getElementById(pageId);
  if (targetPage) {
    targetPage.classList.add('active');
    const link = document.getElementById(pageId + '-link');
    if (link) link.classList.add('active');
  }

  // تحميل بيانات البروفايل عند دخول صفحة البروفايل
  if (pageId === "profile" && currentUser) {
    setTimeout(() => loadProfileInfo(), 100);
  }
}

// ✅ routing
function handleRouting() {
  const pageId = window.location.hash.replace("#", "");
  if (pageId) {
    if (document.getElementById(pageId)) showPage(pageId);
    else showPage("not-found");
  } else {
    showPage("home");
  }
}
window.addEventListener("load", handleRouting);
window.addEventListener("hashchange", handleRouting);

// ✅ show/hide password
function togglePasswordVisibility() {
  const passwordField = document.getElementById("register-password");
  const confirmPasswordField = document.getElementById("confirm-password");
  const showPasswordCheckbox = document.getElementById("show-password");
  if (showPasswordCheckbox.checked) {
    passwordField.type = "text";
    confirmPasswordField.type = "text";
  } else {
    passwordField.type = "password";
    confirmPasswordField.type = "password";
  }
}

// ✅ logout
function logout() {
  localStorage.removeItem("currentUser");
  currentUser = null;

  document.getElementById("user-info").style.display = "none";
  document.getElementById("guest-message").style.display = "block";
  document.getElementById("login-link").style.display = "";
  document.getElementById("register-link").style.display = "";

  const loginForm = document.getElementById("login-form");
  if (loginForm) loginForm.reset();

  const registerForm = document.getElementById("register-form");
  if (registerForm) registerForm.reset();

  // مسح بيانات البروفايل
  const profileElements = [
    { id: "profile-username-info", value: "" },
    { id: "profile-email-info", value: "" },
    { id: "profile-username", value: "" },
    { id: "profile-email", value: "" },
    { id: "profile-name", value: "" }
  ];
  
  profileElements.forEach(element => {
    const el = document.getElementById(element.id);
    if (el) el.textContent = element.value;
  });

  const profileImage = document.getElementById("profile-image");
  if (profileImage) {
    profileImage.classList.add("hidden");
    profileImage.src = "";
  }

  window.location.hash = "home";
}

// ✅ messages
function showError(elementId, message) {
  const element = document.getElementById(elementId);
  element.innerHTML = message;
  element.className = "error";
}

function showSuccess(elementId, message) {
  const element = document.getElementById(elementId);
  element.innerHTML = message;
  element.className = "success";
}

// ✅ profile image upload (profile page)
const uploadImage = document.getElementById("upload-image");
const profileImage = document.getElementById("profile-image");

if (uploadImage) {
  uploadImage.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        profileImage.src = e.target.result;
        profileImage.classList.remove("hidden");
        if (currentUser) {
          currentUser.image = e.target.result;
          localStorage.setItem("currentUser", JSON.stringify(currentUser));
        }
      };
      reader.readAsDataURL(file);
    }
  });
}

// ================== PROFILE FUNCTIONS - محسّنة ==================

// تحميل بيانات البروفايل - دمج النسختين
function loadProfileInfo() {
  const user = JSON.parse(localStorage.getItem("currentUser") || "null");
  if (!user) return;

  // تحديث جميع عناصر اسم المستخدم
  const usernameElements = [
    "profile-username",
    "profile-name", 
    "profile-username-info"
  ];
  
  usernameElements.forEach(elementId => {
    const element = document.getElementById(elementId);
    if (element) element.textContent = user.username;
  });

  // تحديث جميع عناصر الإيميل
  const emailElements = [
    "profile-email",
    "profile-email-info"
  ];
  
  emailElements.forEach(elementId => {
    const element = document.getElementById(elementId);
    if (element) element.textContent = user.email;
  });

  // عرض الصورة إذا كانت موجودة
  if (user.image) {
    const profileImg = document.getElementById("profile-image");
    if (profileImg) {
      profileImg.src = user.image;
      profileImg.classList.remove("hidden");
    }
  }
}

// تحديث البروفايل - دمج وتحسين
function updateProfileUI() {
  loadProfileInfo(); // استخدام الدالة المحسّنة
}

// تحديث صورة البروفايل
function updateProfileImage() {
  const user = JSON.parse(localStorage.getItem("currentUser") || "null");
  if (user && user.image) {
    const profileImg = document.getElementById("profile-image");
    if (profileImg) {
      profileImg.src = user.image;
      profileImg.classList.remove("hidden");
    }
  }
}

// تبديل نموذج التعديل
function toggleEditForm() {
  const editForm = document.getElementById("edit-profile-form");
  if (!editForm) return;
  
  editForm.classList.toggle("hidden");
  
  if (!editForm.classList.contains("hidden")) {
    const user = JSON.parse(localStorage.getItem("currentUser") || "null");
    if (user) {
      const editUsername = document.getElementById("edit-username");
      const editEmail = document.getElementById("edit-email");
      
      if (editUsername) editUsername.value = user.username;
      if (editEmail) editEmail.value = user.email;
    }
  }
}

// حفظ تعديلات البروفايل - دمج وتحسين
document.addEventListener('DOMContentLoaded', () => {
  const btnSave = document.querySelector('.btn-save');

  if (btnSave) {
    btnSave.addEventListener('click', (e) => {
      e.preventDefault();

      let user = JSON.parse(localStorage.getItem("currentUser") || "null");
      if (!user) {
        showProfileMessage("No user logged in", "error");
        return;
      }

      const previousUsername = user.username;
      const newUsername = document.getElementById("edit-username")?.value.trim();
      const newEmail = document.getElementById("edit-email")?.value.trim();
      const newImageFile = document.getElementById("edit-image")?.files[0];

      // التحقق من صحة الإيميل
      if (newEmail && !newEmail.includes("@")) {
        showProfileMessage("Invalid email format", "error");
        return;
      }

      // تحديث البيانات
      if (newUsername && newUsername !== user.username) user.username = newUsername;
      if (newEmail && newEmail !== user.email) user.email = newEmail;

      const finishSave = () => {
        // إخفاء نموذج التعديل
        const editForm = document.getElementById("edit-profile-form");
        if (editForm) editForm.classList.add("hidden");

        // حفظ المستخدم الحالي
        localStorage.setItem("currentUser", JSON.stringify(user));
        currentUser = user; // تحديث المتغير العام

        // تحديث قائمة المستخدمين
        const users = JSON.parse(localStorage.getItem("userData") || "[]");
        const userIndex = users.findIndex(u => u.username === previousUsername);
        if (userIndex !== -1) {
          users[userIndex] = { 
            ...users[userIndex], 
            username: user.username, 
            email: user.email, 
            image: user.image || users[userIndex].image 
          };
          localStorage.setItem("userData", JSON.stringify(users));
        }

        // تحديث واجهة المستخدم
        updateProfileUI();
        updateUIForLoggedInUser(); // تحديث الواجهة الرئيسية أيضاً
        showProfileMessage("Profile updated successfully", "success");
      };

      // معالجة الصورة
      if (newImageFile) {
        const reader = new FileReader();
        reader.onload = () => {
          user.image = reader.result;
          finishSave();
        };
        reader.readAsDataURL(newImageFile);
      } else {
        finishSave();
      }
    });
  }
});

// عرض رسائل البروفايل
function showProfileMessage(text, type) {
  const messageProfile = document.querySelector('.message-profile');
  if (!messageProfile) return;
  
  messageProfile.textContent = text;
  messageProfile.className = `message-profile message-${type}`;
  
  setTimeout(() => {
    messageProfile.textContent = '';
    messageProfile.className = 'message-profile';
  }, 4000);
}

// ================== TO-DO LIST FUNCTIONALITY ==================

let todoinput = document.getElementById("todo-input");
let addtodobtn = document.getElementById("add-todo-btn");
let pendingList = document.getElementById("pending-list");
let completedList = document.getElementById("completed-list");
let todoDate = document.getElementById("todo-date");

// Flatpickr initialization
if (todoDate) {
  flatpickr("#todo-date", {
    enableTime: true,
    dateFormat: "Y-m-d H:i",
    minDate: "today"
  });
  todoDate.style.border = "2px solid #007bff";
  todoDate.style.borderRadius = "12px";
}

// Load tasks from localStorage
let tasks = JSON.parse(localStorage.getItem("tasks")) || [];

// ✅ Render tasks
function renderTasks() {
  if (!pendingList || !completedList) return;
  
  pendingList.innerHTML = "";
  completedList.innerHTML = "";

  tasks.forEach(task => {
    const li = document.createElement("li");
    li.className = "todo-item area";
    if (task.completed) li.classList.add("completed");
    

    // Task text
    const span = document.createElement("span");
    span.textContent = task.text;

    // Task date
    const dateSpan = document.createElement("small");
    dateSpan.innerHTML = `<svg class="nav-icon" fill="#000000" viewBox="0 0 32 32" style="fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;" version="1.1" xml:space="preserve" xmlns="http://www.w3.org/2000/svg"><path d="M29,11l-26,0l0,13.009c-0,1.326 0.527,2.598 1.464,3.535c0.938,0.938 2.21,1.465 3.536,1.465c4.439,-0 11.561,-0 16,-0c1.326,-0 2.598,-0.527 3.536,-1.465c0.937,-0.937 1.464,-2.209 1.464,-3.535l-0,-13.009Zm-20,13l2,0c0.552,0 1,-0.448 1,-1c0,-0.552 -0.448,-1 -1,-1l-2,0c-0.552,0 -1,0.448 -1,1c0,0.552 0.448,1 1,1Zm6,0l2,0c0.552,0 1,-0.448 1,-1c0,-0.552 -0.448,-1 -1,-1l-2,0c-0.552,0 -1,0.448 -1,1c0,0.552 0.448,1 1,1Zm6,0l2,0c0.552,0 1,-0.448 1,-1c0,-0.552 -0.448,-1 -1,-1l-2,0c-0.552,0 -1,0.448 -1,1c0,0.552 0.448,1 1,1Zm-12,-4l2,0c0.552,0 1,-0.448 1,-1c0,-0.552 -0.448,-1 -1,-1l-2,0c-0.552,0 -1,0.448 -1,1c0,0.552 0.448,1 1,1Zm6,0l2,0c0.552,0 1,-0.448 1,-1c0,-0.552 -0.448,-1 -1,-1l-2,0c-0.552,0 -1,0.448 -1,1c0,0.552 0.448,1 1,1Zm6,0l2,0c0.552,0 1,-0.448 1,-1c0,-0.552 -0.448,-1 -1,-1l-2,0c-0.552,0 -1,0.448 -1,1c0,0.552 0.448,1 1,1Zm-12,-4l2,0c0.552,-0 1,-0.448 1,-1c-0,-0.552 -0.448,-1 -1,-1l-2,0c-0.552,-0 -1,0.448 -1,1c-0,0.552 0.448,1 1,1Zm6,0l2,0c0.552,-0 1,-0.448 1,-1c-0,-0.552 -0.448,-1 -1,-1l-2,0c-0.552,-0 -1,0.448 -1,1c-0,0.552 0.448,1 1,1Zm6,0l2,0c0.552,-0 1,-0.448 1,-1c-0,-0.552 -0.448,-1 -1,-1l-2,0c-0.552,-0 -1,0.448 -1,1c-0,0.552 0.448,1 1,1Zm-11,-12.991l0,2.991c-0,0.552 -0.448,1 -1,1c-0.552,-0 -1,-0.448 -1,-1l0,-2.991c-1.326,-0 -2.598,0.527 -3.536,1.464c-0.937,0.938 -1.464,2.21 -1.464,3.536l0,0.991l26,0l-0,-0.991c0,-1.326 -0.527,-2.598 -1.464,-3.536c-0.938,-0.937 -2.21,-1.464 -3.536,-1.464l0,2.991c-0,0.552 -0.448,1 -1,1c-0.552,-0 -1,-0.448 -1,-1l0,-2.991l-12,-0Z"></path></svg> ${task.date || "No date"}`;
    
    // Buttons container
    const actions = document.createElement("div");
    actions.className = "todo-actions";
    
    // Complete button
    const completeBtn = document.createElement("button");
    completeBtn.innerHTML = task.completed 
      ? '<i class="fa-solid fa-rotate-left"></i>'
      : '<i class="fa-solid fa-check"></i>';
    completeBtn.style.backgroundColor = task.completed ? "#f39c12" : "#2ecc71";
    completeBtn.className = "btn btn-complete";
    completeBtn.addEventListener("click", () => toggleTaskCompletion(task.id));

    // Edit button
    const editBtn = document.createElement("button");
    editBtn.innerHTML = '<i class="fa-solid fa-pen"></i>';
    editBtn.className = "btn btn-edit";
    editBtn.addEventListener("click", () => editTask(task.id));

    // Delete button
    const deleteBtn = document.createElement("button");
    deleteBtn.innerHTML = '<i class="fa-solid fa-trash"></i>';
    deleteBtn.className = "btn btn-delete";
    deleteBtn.addEventListener("click", () => deleteTask(task.id));

    // Append elements
    actions.appendChild(completeBtn);
    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);

    li.appendChild(dateSpan);
    li.appendChild(span);
    li.appendChild(actions);

    // Append to correct list
    if (task.completed) {
      completedList.appendChild(li);
    } else {
      pendingList.appendChild(li);
    }
  });

  localStorage.setItem("tasks", JSON.stringify(tasks));
}

// Add Task
if (addtodobtn) {
  addtodobtn.addEventListener("click", () => {
    const text = todoinput.value.trim();
    if (text === "") return;

    const newTask = {
      id: Date.now(),
      text: text,
      completed: false,
      date: todoDate?.value || new Date().toISOString().split('T')[0]
    };

    tasks.push(newTask);
    todoinput.value = "";
    if (todoDate) todoDate.value = "";
    renderTasks();
  });
}

// Toggle Complete
function toggleTaskCompletion(id) {
  tasks = tasks.map(task =>
    task.id === id ? { ...task, completed: !task.completed } : task
  );
  renderTasks();
}

// Edit Task
function editTask(id) {
  const task = tasks.find(t => t.id === id);
  if (!task) return;
  
  const newText = prompt("Edit task:", task.text);
  if (newText !== null && newText.trim() !== "") {
    task.text = newText.trim();
    renderTasks();
  }
}

// Delete Task
function deleteTask(id) {
  if (confirm("Are you sure you want to delete this task?")) {
    tasks = tasks.filter(task => task.id !== id);
    renderTasks();
  }
}

// Initial render
document.addEventListener('DOMContentLoaded', () => {
  renderTasks();
});

// ================== THEME FUNCTIONALITY ==================

// تحديث الألوان الديناميكية
function updateDynamicColors() {
  const todos = document.querySelectorAll('.todo-item');
  todos.forEach(todo => {
    if (todo.classList.contains('completed')) {
      todo.style.borderLeftColor = getComputedStyle(document.documentElement)
        .getPropertyValue('--success-color').trim();
    } else {
      todo.style.borderLeftColor = getComputedStyle(document.documentElement)
        .getPropertyValue('--primary-color').trim();
    }
  });
  
  const buttons = document.querySelectorAll('button:not(.theme-toggle)');
  buttons.forEach(button => {
    if (button.classList.contains('btn-complete')) {
      button.style.backgroundColor = getComputedStyle(document.documentElement)
        .getPropertyValue('--success-color').trim();
    } else if (button.classList.contains('btn-edit')) {
      button.style.backgroundColor = getComputedStyle(document.documentElement)
        .getPropertyValue('--info-color').trim();
    } else if (button.classList.contains('btn-delete')) {
      button.style.backgroundColor = getComputedStyle(document.documentElement)
        .getPropertyValue('--danger-color').trim();
    }
  });
}

// تحميل الثيم المحفوظ
function loadSavedTheme() {
  const savedTheme = localStorage.getItem("theme");
  const themeBtn = document.querySelector(".theme-toggle");
  
  if (savedTheme) {
    document.body.classList.toggle("dark-theme", savedTheme === "dark");
    if (themeBtn) themeBtn.textContent = savedTheme === "dark" ? "🌙" : "☀️";
    setTimeout(updateDynamicColors, 50);
  } else {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.body.classList.toggle("dark-theme", prefersDark);
    if (themeBtn) themeBtn.textContent = prefersDark ? "🌙" : "☀️";
    localStorage.setItem("theme", prefersDark ? "dark" : "light");
    setTimeout(updateDynamicColors, 50);
  }
}

// تبديل الثيم
function toggleTheme() {
  const body = document.body;
  body.classList.toggle("dark-theme");
  
  const isDark = body.classList.contains("dark-theme");
  localStorage.setItem("theme", isDark ? "dark" : "light");
  
  const themeBtn = document.querySelector(".theme-toggle");
  if (themeBtn) {
    themeBtn.style.transition = "transform 0.5s ease, background 0.3s ease";
    themeBtn.style.transform = "rotate(360deg)";
    
    setTimeout(() => {
      themeBtn.textContent = isDark ? "🌙" : "☀️";
      themeBtn.style.transform = "rotate(0deg)";
      updateDynamicColors();
    }, 250);
  }
}
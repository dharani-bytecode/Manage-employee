document.addEventListener('DOMContentLoaded', () => {
  const { db, ref, set, get, push, update, remove } = window;

  const ADMIN_USERNAME = "admin@example.com";
  const ADMIN_PASSWORD = "admin123";

  // Elements
  const loginForm = document.getElementById('loginForm');
  const signupForm = document.getElementById('signupForm');
  const loginError = document.getElementById('loginError');
  const signupError = document.getElementById('signupError');
  const showSignup = document.getElementById('showSignup');
  const showLogin = document.getElementById('showLogin');
  const mainHeader = document.getElementById('mainHeader');
  const loginPage = document.getElementById('loginPage');
  const logoutBtn = document.getElementById('logoutBtn');
  const userRoleLabel = document.getElementById('userRoleLabel');

  const employeeForm = document.getElementById('employeeForm');
  const salaryForm = document.getElementById('salaryForm');
  const leaveForm = document.getElementById('leaveForm');

  const employeeList = document.getElementById('employeeList');
  const salaryList = document.getElementById('salaryList');
  const leaveList = document.getElementById('leaveList');

  const employeeSearch = document.getElementById('employeeSearch');
  const salarySearch = document.getElementById('salarySearch');
  const leaveSearch = document.getElementById('leaveSearch');

  // Dashboard stats elements
  const totalEmployeesLabel = document.getElementById('totalEmployees');
  const totalSalariesLabel = document.getElementById('totalSalaries');
  const totalLeavesLabel = document.getElementById('totalLeaves');

  let currentUser = null;
  let currentRole = null;

  // Switch login/signup
  showSignup.addEventListener('click', e => {
    e.preventDefault();
    loginForm.style.display = 'none';
    signupForm.style.display = 'block';
  });

  showLogin.addEventListener('click', e => {
    e.preventDefault();
    signupForm.style.display = 'none';
    loginForm.style.display = 'block';
  });

  // Signup
  signupForm.addEventListener('submit', async e => {
    e.preventDefault();
    const username = signupEmail.value.trim();
    const password = signupPassword.value.trim();
    const role = 'employee';

    try {
      const usersRef = ref(db, 'users');
      const snapshot = await get(usersRef);
      if (snapshot.exists()) {
        const users = snapshot.val();
        for (const key in users) {
          if (users[key].username === username) {
            signupError.textContent = "❌ Username already exists!";
            return;
          }
        }
      }
      await push(usersRef, { username, password, role });
      signupError.textContent = "✅ Signup successful! Please login.";
      signupForm.reset();
      signupForm.style.display = 'none';
      loginForm.style.display = 'block';
    } catch (error) {
      signupError.textContent = error.message;
    }
  });

  // Login
  loginForm.addEventListener('submit', async e => {
    e.preventDefault();
    const username = loginEmail.value.trim();
    const password = loginPassword.value.trim();

    try {
      if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        currentUser = ADMIN_USERNAME;
        currentRole = 'admin';
      } else {
        const snapshot = await get(ref(db, 'users'));
        if (snapshot.exists()) {
          const users = snapshot.val();
          let found = false;
          for (const key in users) {
            const user = users[key];
            if (user.username === username && user.password === password) {
              found = true;
              currentUser = username;
              currentRole = 'employee';
              break;
            }
          }
          if (!found) {
            loginError.textContent = "❌ Invalid username or password.";
            return;
          }
        } else {
          loginError.textContent = "❌ No users found!";
          return;
        }
      }

      loginError.textContent = "";
      loginPage.style.display = 'none';
      mainHeader.style.display = 'flex';
      userRoleLabel.textContent = currentRole;
      showPage('dashboard');
      applyRoleAccess();
      loadAllData();
    } catch (error) {
      loginError.textContent = error.message;
    }
  });

  // Logout
  logoutBtn.addEventListener('click', () => {
    currentUser = null;
    currentRole = null;
    mainHeader.style.display = 'none';
    loginPage.style.display = 'flex';
  });

  // Page switching
  document.querySelectorAll('nav button').forEach(btn => {
    if (btn.id !== 'logoutBtn') {
      btn.addEventListener('click', () => showPage(btn.getAttribute('data-page')));
    }
  });

  function showPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.style.display = 'none');
    document.getElementById(pageId).style.display = 'flex';
  }

  function applyRoleAccess() {
    if (currentRole === 'employee') {
      employeeForm.style.display = 'none';
      salaryForm.style.display = 'none';
      leaveForm.style.display = 'none';
    } else {
      employeeForm.style.display = 'flex';
      salaryForm.style.display = 'flex';
      leaveForm.style.display = 'flex';
    }
  }

  async function loadAllData() {
  await loadEmployees();
  await loadSalaries();
  await loadLeaves();
  await updateDashboardStats();
}

// --- Dashboard Stats ---
async function updateDashboardStats() {
  try {
    const empSnapshot = await get(ref(db, 'employees'));
    const salSnapshot = await get(ref(db, 'salaries'));
    const leaveSnapshot = await get(ref(db, 'leaves'));

    // Employees count
    const totalEmployees = empSnapshot.exists() ? Object.keys(empSnapshot.val()).length : 0;

    // Salaries sum
    let totalSalaries = 0;
    if (salSnapshot.exists()) {
      const salaries = salSnapshot.val();
      for (const id in salaries) totalSalaries += Number(salaries[id].amount || 0);
    }

    // Leaves sum
    let totalLeaves = 0;
    if (leaveSnapshot.exists()) {
      const leaves = leaveSnapshot.val();
      for (const id in leaves) totalLeaves += Number(leaves[id].days || 0);
    }

    // Show stats
    totalEmployeesLabel.textContent = totalEmployees;
    totalSalariesLabel.textContent = `₹${totalSalaries}`;
    totalLeavesLabel.textContent = totalLeaves;

  } catch (err) {
    console.error("Error updating dashboard stats:", err);
    totalEmployeesLabel.textContent = 0;
    totalSalariesLabel.textContent = `₹0`;
    totalLeavesLabel.textContent = 0;
  }
}

// --- Load Employees ---
async function loadEmployees() {
  const snapshot = await get(ref(db, 'employees'));
  employeeList.innerHTML = '';
  if (snapshot.exists()) {
    const data = snapshot.val();
    for (const id in data) {
      const emp = data[id];
      const li = document.createElement('li');
      li.innerHTML = `<span>${emp.name} - ${emp.role}</span>` +
        (currentRole === 'admin' 
          ? `<div class="action-buttons">
               <button class="edit-btn" onclick="editEmployee('${id}','${emp.name}','${emp.role}')">Edit</button>
               <button class="delete-btn" onclick="deleteEmployee('${id}')">Delete</button>
             </div>` 
          : '');
      employeeList.appendChild(li);
    }
  }
}

// --- Load Salaries ---
async function loadSalaries() {
  const snapshot = await get(ref(db, 'salaries'));
  salaryList.innerHTML = '';
  if (snapshot.exists()) {
    const data = snapshot.val();
    for (const id in data) {
      const sal = data[id];
      const li = document.createElement('li');
      li.innerHTML = `<span>${sal.name} - ₹${sal.amount}</span>` +
        (currentRole === 'admin' 
          ? `<div class="action-buttons">
               <button class="edit-btn" onclick="editSalary('${id}','${sal.name}','${sal.amount}')">Edit</button>
               <button class="delete-btn" onclick="deleteSalary('${id}')">Delete</button>
             </div>` 
          : '');
      salaryList.appendChild(li);
    }
  }
}

// --- Load Leaves ---
async function loadLeaves() {
  const snapshot = await get(ref(db, 'leaves'));
  leaveList.innerHTML = '';
  if (snapshot.exists()) {
    const data = snapshot.val();
    for (const id in data) {
      const lv = data[id];
      const li = document.createElement('li');
      li.innerHTML = `<span>${lv.name} - ${lv.days} days</span>` +
        (currentRole === 'admin' 
          ? `<div class="action-buttons">
               <button class="edit-btn" onclick="editLeave('${id}','${lv.name}','${lv.days}')">Edit</button>
               <button class="delete-btn" onclick="deleteLeave('${id}')">Delete</button>
             </div>` 
          : '');
      leaveList.appendChild(li);
    }
  }
}


  // Edit/Delete functions
  // --- JS EDITED FOR CLEAN UI & FUNCTIONALITY ---
window.editEmployee = (id, name, role) => {
  employeeIndex.value = id;
  employeeName.value = name;
  employeeRole.value = role;
  employeeName.focus();
};

window.deleteEmployee = async id => {
  if (confirm('Are you sure you want to delete this employee?')) {
    await remove(ref(db, `employees/${id}`));
    loadEmployees();
    updateDashboardStats();
  }
};

window.editSalary = (id, name, amount) => {
  salaryIndex.value = id;
  salaryName.value = name;
  salaryAmount.value = amount;
  salaryName.focus();
};

window.deleteSalary = async id => {
  if (confirm('Are you sure you want to delete this salary entry?')) {
    await remove(ref(db, `salaries/${id}`));
    loadSalaries();
    updateDashboardStats();
  }
};

window.editLeave = (id, name, days) => {
  leaveIndex.value = id;
  leaveName.value = name;
  leaveDays.value = days;
  leaveName.focus();
};

window.deleteLeave = async id => {
  if (confirm('Are you sure you want to delete this leave entry?')) {
    await remove(ref(db, `leaves/${id}`));
    loadLeaves();
    updateDashboardStats();
  }
};


  // Add forms
  employeeForm.addEventListener('submit', async e => {
    e.preventDefault();
    if (currentRole !== 'admin') return;
    const name = employeeName.value.trim();
    const role = employeeRole.value.trim();
    if (!name || !role) return;
    if (employeeIndex.value) await update(ref(db, `employees/${employeeIndex.value}`), { name, role });
    else await push(ref(db, 'employees'), { name, role });
    employeeForm.reset();
    employeeIndex.value = '';
    loadEmployees();
    updateDashboardStats();
  });

  salaryForm.addEventListener('submit', async e => {
    e.preventDefault();
    if (currentRole !== 'admin') return;
    const name = salaryName.value.trim();
    const amount = salaryAmount.value.trim();
    if (!name || !amount) return;
    if (salaryIndex.value) await update(ref(db, `salaries/${salaryIndex.value}`), { name, amount });
    else await push(ref(db, 'salaries'), { name, amount });
    salaryForm.reset();
    salaryIndex.value = '';
    loadSalaries();
    updateDashboardStats();
  });

  leaveForm.addEventListener('submit', async e => {
    e.preventDefault();
    if (currentRole !== 'admin') return;
    const name = leaveName.value.trim();
    const days = leaveDays.value.trim();
    if (!name || !days) return;
    if (leaveIndex.value) await update(ref(db, `leaves/${leaveIndex.value}`), { name, days });
    else await push(ref(db, 'leaves'), { name, days });
    leaveForm.reset();
    leaveIndex.value = '';
    loadLeaves();
    updateDashboardStats();
  });

  // --- SEARCH FILTER ---
  employeeSearch.addEventListener('input', () => {
    const val = employeeSearch.value.toLowerCase();
    document.querySelectorAll('#employeeList li').forEach(li => {
      li.style.display = li.querySelector('span').textContent.toLowerCase().includes(val) ? 'flex' : 'none';
    });
  });

  salarySearch.addEventListener('input', () => {
    const val = salarySearch.value.toLowerCase();
    document.querySelectorAll('#salaryList li').forEach(li => {
      li.style.display = li.querySelector('span').textContent.toLowerCase().includes(val) ? 'flex' : 'none';
    });
  });

  leaveSearch.addEventListener('input', () => {
    const val = leaveSearch.value.toLowerCase();
    document.querySelectorAll('#leaveList li').forEach(li => {
      li.style.display = li.querySelector('span').textContent.toLowerCase().includes(val) ? 'flex' : 'none';
    });
  });

});

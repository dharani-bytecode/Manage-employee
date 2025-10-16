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

  // Hide header
  mainHeader.style.display = 'none';

  // Hide all pages
  document.querySelectorAll('.page').forEach(p => p.style.display = 'none');

  // Show only login page
  loginPage.style.display = 'flex';

  // Reset forms
  loginForm.reset();
  signupForm.reset();
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
  }

  // --- CRUD & Load Functions ---
  async function loadEmployees() {
    const snapshot = await get(ref(db, 'employees'));
    employeeList.innerHTML = '';
    if (snapshot.exists()) {
      const data = snapshot.val();
      for (const id in data) {
        const emp = data[id];
        const li = document.createElement('li');
        li.innerHTML = `<span>${emp.name} - ${emp.role}</span>` +
          (currentRole === 'admin' ? `<button onclick="editEmployee('${id}','${emp.name}','${emp.role}')">Edit</button>
          <button onclick="deleteEmployee('${id}')">Delete</button>` : '');
        employeeList.appendChild(li);
      }
    }
  }

  async function loadSalaries() {
    const snapshot = await get(ref(db, 'salaries'));
    salaryList.innerHTML = '';
    if (snapshot.exists()) {
      const data = snapshot.val();
      for (const id in data) {
        const sal = data[id];
        const li = document.createElement('li');
        li.innerHTML = `<span>${sal.name} - ₹${sal.amount}</span>` +
          (currentRole === 'admin' ? `<button onclick="editSalary('${id}','${sal.name}','${sal.amount}')">Edit</button>
          <button onclick="deleteSalary('${id}')">Delete</button>` : '');
        salaryList.appendChild(li);
      }
    }
  }

  async function loadLeaves() {
    const snapshot = await get(ref(db, 'leaves'));
    leaveList.innerHTML = '';
    if (snapshot.exists()) {
      const data = snapshot.val();
      for (const id in data) {
        const lv = data[id];
        const li = document.createElement('li');
        li.innerHTML = `<span>${lv.name} - ${lv.days} days</span>` +
          (currentRole === 'admin' ? `<button onclick="editLeave('${id}','${lv.name}','${lv.days}')">Edit</button>
          <button onclick="deleteLeave('${id}')">Delete</button>` : '');
        leaveList.appendChild(li);
      }
    }
  }

  // Edit/Delete functions
  window.editEmployee = (id, name, role) => { employeeIndex.value = id; employeeName.value = name; employeeRole.value = role; };
  window.deleteEmployee = async id => { await remove(ref(db, `employees/${id}`)); loadEmployees(); };

  window.editSalary = (id, name, amount) => { salaryIndex.value = id; salaryName.value = name; salaryAmount.value = amount; };
  window.deleteSalary = async id => { await remove(ref(db, `salaries/${id}`)); loadSalaries(); };

  window.editLeave = (id, name, days) => { leaveIndex.value = id; leaveName.value = name; leaveDays.value = days; };
  window.deleteLeave = async id => { await remove(ref(db, `leaves/${id}`)); loadLeaves(); };

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

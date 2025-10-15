// Await window setup for global firebase objects before running code
// This ensures that the global objects exported from the <script type="module"> in HTML are available.
document.addEventListener('DOMContentLoaded', () => {

    // Destructure global Firebase objects for cleaner use
    const { db, ref, set, push, get, update, remove } = window;

    // =========================================================
    //                      DOM ELEMENTS
    // =========================================================
    const loginForm = document.getElementById('loginForm');
    const loginError = document.getElementById('loginError');
    const mainHeader = document.getElementById('mainHeader');
    const loginPage = document.getElementById('loginPage');
    const logoutBtn = document.getElementById('logoutBtn');

    // Employee elements
    const employeeForm = document.getElementById('employeeForm');
    const employeeList = document.getElementById('employeeList');
    const employeeFilterInput = document.getElementById('employeeFilter');

    // Salary elements
    const salaryForm = document.getElementById('salaryForm');
    const salaryList = document.getElementById('salaryList');
    const salaryFilterInput = document.getElementById('salaryFilter');

    // Leave elements
    const leaveForm = document.getElementById('leaveForm');
    const leaveList = document.getElementById('leaveList');
    const leaveFilterInput = document.getElementById('leaveFilter');

    // =========================================================
    //                      LOGIN & NAVIGATION
    // =========================================================

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value.trim();

        // Basic client-side admin login check
        if (username === 'admin' && password === 'admin123') {
            loginPage.style.display = 'none';
            mainHeader.style.display = 'flex';
            loginError.textContent = '';
            showPage('dashboard');
        } else {
            loginError.textContent = "❌ Invalid username or password!";
        }
    });

    // Central function to control page visibility
    function showPage(pageId) {
        // Hide all pages
        document.querySelectorAll('.page').forEach(p => p.style.display = 'none');

        // Show the requested page
        const page = document.getElementById(pageId);
        if (page) {
            page.style.display = 'flex';
        }

        // Render data only when navigating to the respective management page
        switch (pageId) {
            case 'employees':
                renderEmployees();
                break;
            case 'salaries':
                renderSalary();
                break;
            case 'leaves':
                renderLeaves();
                break;
        }
    }

    function logout() {
        mainHeader.style.display = 'none';
        showPage('loginPage');
        // Reset forms/filters on logout for security/cleanliness
        employeeForm.reset(); salaryForm.reset(); leaveForm.reset();
        employeeFilterInput.value = ''; salaryFilterInput.value = ''; leaveFilterInput.value = '';
    }
    
    // Attach event listeners to all navigation buttons using data attributes
    document.querySelectorAll('nav button').forEach(button => {
        if (button.id === 'logoutBtn') {
            button.addEventListener('click', logout);
        } else {
            const pageId = button.getAttribute('data-page');
            button.addEventListener('click', () => showPage(pageId));
        }
    });

    // =========================================================
    //                     HELPER FUNCTION
    // =========================================================

    // Generic list item builder
    function buildListItem(key, displayContent, editFn, deleteFn) {
        const li = document.createElement('li');
        // NOTE: editFn and deleteFn are made globally available below to work with inline onclick
        li.innerHTML = `
            ${displayContent}
            <span>
                <button onclick="${editFn}('${key}')">Edit</button>
                <button onclick="${deleteFn}('${key}')">Delete</button>
            </span>
        `;
        return li;
    }

    // =========================================================
    //                       EMPLOYEES LOGIC
    // =========================================================

    // Expose CRUD functions globally for use in the list item buttons (onclick)
    window.editEmployee = editEmployee; 
    window.deleteEmployee = deleteEmployee;
    window.filterEmployees = filterEmployees; // Expose filter function for onkeyup

    employeeForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('employeeName').value.trim();
        const role = document.getElementById('employeeRole').value.trim();
        const index = document.getElementById('employeeIndex').value;

        if (!name || !role) return; // Basic validation

        try {
            const employeeData = { name, role };
            if (index) {
                // UPDATE
                await update(ref(db, `employees/${index}`), employeeData);
            } else {
                // CREATE
                const newRef = push(ref(db, "employees"));
                await set(newRef, employeeData);
            }
            employeeForm.reset();
            document.getElementById('employeeIndex').value = ''; // Clear index after save
            renderEmployees();
        } catch (error) {
            console.error("Error saving employee:", error);
            alert("Failed to save employee data. Check console for details.");
        }
    });

    async function renderEmployees(filter = '') {
        employeeList.innerHTML = '';
        try {
            const snapshot = await get(ref(db, "employees"));
            if (snapshot.exists()) {
                const data = snapshot.val();
                const lowerCaseFilter = filter.toLowerCase();

                Object.keys(data).forEach(key => {
                    const emp = data[key];
                    if (emp.name.toLowerCase().includes(lowerCaseFilter)) {
                        const content = `${emp.name} - ${emp.role}`;
                        const li = buildListItem(key, content, 'editEmployee', 'deleteEmployee');
                        employeeList.appendChild(li);
                    }
                });
            }
        } catch (error) {
            console.error("Error rendering employees:", error);
        }
    }

    async function editEmployee(id) {
        try {
            const snapshot = await get(ref(db, `employees/${id}`));
            if (snapshot.exists()) {
                const emp = snapshot.val();
                document.getElementById('employeeName').value = emp.name;
                document.getElementById('employeeRole').value = emp.role;
                document.getElementById('employeeIndex').value = id;
            }
        } catch (error) {
            console.error("Error fetching employee for edit:", error);
        }
    }

    async function deleteEmployee(id) {
        if (!confirm("Are you sure you want to delete this employee?")) return;
        try {
            await remove(ref(db, `employees/${id}`));
            renderEmployees();
        } catch (error) {
            console.error("Error deleting employee:", error);
            alert("Failed to delete employee.");
        }
    }

    function filterEmployees() {
        renderEmployees(employeeFilterInput.value);
    }

    // =========================================================
    //                       SALARIES LOGIC
    // =========================================================

    window.editSalary = editSalary;
    window.deleteSalary = deleteSalary;
    window.filterSalary = filterSalary;

    salaryForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('salaryName').value.trim();
        const amount = document.getElementById('salaryAmount').value.trim();
        const index = document.getElementById('salaryIndex').value;

        if (!name || !amount) return;

        try {
            // Convert amount to number (best practice for numeric data)
            const salaryData = { name, amount: parseFloat(amount) };
            if (index) {
                await update(ref(db, `salaries/${index}`), salaryData);
            } else {
                const newRef = push(ref(db, "salaries"));
                await set(newRef, salaryData);
            }
            salaryForm.reset();
            document.getElementById('salaryIndex').value = '';
            renderSalary();
        } catch (error) {
            console.error("Error saving salary:", error);
            alert("Failed to save salary data.");
        }
    });

    async function renderSalary(filter = '') {
        salaryList.innerHTML = '';
        try {
            const snapshot = await get(ref(db, "salaries"));
            if (snapshot.exists()) {
                const data = snapshot.val();
                const lowerCaseFilter = filter.toLowerCase();

                Object.keys(data).forEach(key => {
                    const s = data[key];
                    if (s.name.toLowerCase().includes(lowerCaseFilter)) {
                        // Use toLocaleString for currency formatting
                        const formattedAmount = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(s.amount);
                        const content = `${s.name} - ${formattedAmount}`;
                        const li = buildListItem(key, content, 'editSalary', 'deleteSalary');
                        salaryList.appendChild(li);
                    }
                });
            }
        } catch (error) {
            console.error("Error rendering salaries:", error);
        }
    }

    async function editSalary(id) {
        try {
            const snapshot = await get(ref(db, `salaries/${id}`));
            if (snapshot.exists()) {
                const s = snapshot.val();
                document.getElementById('salaryName').value = s.name;
                document.getElementById('salaryAmount').value = s.amount;
                document.getElementById('salaryIndex').value = id;
            }
        } catch (error) {
            console.error("Error fetching salary for edit:", error);
        }
    }

    async function deleteSalary(id) {
        if (!confirm("Are you sure you want to delete this salary record?")) return;
        try {
            await remove(ref(db, `salaries/${id}`));
            renderSalary();
        } catch (error) {
            console.error("Error deleting salary:", error);
            alert("Failed to delete salary record.");
        }
    }

    function filterSalary() {
        renderSalary(salaryFilterInput.value);
    }

    // =========================================================
    //                       LEAVES LOGIC
    // =========================================================

    window.editLeave = editLeave;
    window.deleteLeave = deleteLeave;
    window.filterLeaves = filterLeaves;

    leaveForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('leaveName').value.trim();
        const days = document.getElementById('leaveDays').value.trim();
        const index = document.getElementById('leaveIndex').value;

        if (!name || !days) return;
        
        try {
            // Convert days to integer
            const leaveData = { name, days: parseInt(days) };
            if (index) {
                await update(ref(db, `leaves/${index}`), leaveData);
            } else {
                const newRef = push(ref(db, "leaves"));
                await set(newRef, leaveData);
            }
            leaveForm.reset();
            document.getElementById('leaveIndex').value = '';
            renderLeaves();
        } catch (error) {
            console.error("Error saving leave:", error);
            alert("Failed to save leave data.");
        }
    });

    async function renderLeaves(filter = '') {
        leaveList.innerHTML = '';
        try {
            const snapshot = await get(ref(db, "leaves"));
            if (snapshot.exists()) {
                const data = snapshot.val();
                const lowerCaseFilter = filter.toLowerCase();

                Object.keys(data).forEach(key => {
                    const l = data[key];
                    if (l.name.toLowerCase().includes(lowerCaseFilter)) {
                        const content = `${l.name} - ${l.days} days`;
                        const li = buildListItem(key, content, 'editLeave', 'deleteLeave');
                        leaveList.appendChild(li);
                    }
                });
            }
        } catch (error) {
            console.error("Error rendering leaves:", error);
        }
    }

    async function editLeave(id) {
        try {
            const snapshot = await get(ref(db, `leaves/${id}`));
            if (snapshot.exists()) {
                const l = snapshot.val();
                document.getElementById('leaveName').value = l.name;
                document.getElementById('leaveDays').value = l.days;
                document.getElementById('leaveIndex').value = id;
            }
        } catch (error) {
            console.error("Error fetching leave for edit:", error);
        }
    }

    async function deleteLeave(id) {
        if (!confirm("Are you sure you want to delete this leave record?")) return;
        try {
            await remove(ref(db, `leaves/${id}`));
            renderLeaves();
        } catch (error) {
            console.error("Error deleting leave:", error);
            alert("Failed to delete leave record.");
        }
    }

    function filterLeaves() {
        renderLeaves(leaveFilterInput.value);
    }
    
    // =========================================================
    //                      INITIALIZATION
    // =========================================================
    // Ensure the login page is shown initially
    if (loginPage.style.display === 'none') {
        loginPage.style.display = 'flex';
        mainHeader.style.display = 'none';
    }
});
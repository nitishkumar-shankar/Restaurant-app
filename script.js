
const tables = document.querySelectorAll('.table');
const searchInput = document.getElementById('searchInput');
const clearMenuBtn = document.getElementById('clearMenuSearch');
const tableSearchInput = document.getElementById('tableSearch');
const clearTableBtn = document.getElementById('clearTableSearch');
const modal = document.getElementById('modal');
const closeModal = document.getElementById('closeModal');
const orderTableBody = document.querySelector('#orderTable tbody');
const modalTotal = document.getElementById('modalTotal');
const modalTitle = document.getElementById('modalTitle');
const generateBill = document.getElementById('generateBill');
const menuContainer = document.getElementById('menuItems');

let draggedItem = null;
const tableOrders = {};
let allMenuItems = [];

fetch('menu.json')
  .then(response => response.json())
  .then(data => {
    allMenuItems = data;
    renderMenu(allMenuItems);
  })
  .catch(err => console.error('Error loading menu:', err));

function renderMenu(items) {
  menuContainer.innerHTML = '';
  items.forEach(item => {
    const div = document.createElement('div');
    div.className = 'menu-item';
    div.setAttribute('draggable', 'true');
    div.dataset.name = item.name;
    div.dataset.price = item.price;
    div.dataset.course = item.course;
    div.innerHTML = `<h3>${item.name}</h3><p>${item.price.toFixed(2)}</p>`;
    menuContainer.appendChild(div);

    div.addEventListener('dragstart', () => {
      draggedItem = {
        name: item.name,
        price: parseFloat(item.price)
      };
    });
  });
}

searchInput.addEventListener('input', function () {
  const query = this.value.toLowerCase().trim();
  clearMenuBtn.style.display = query ? 'block' : 'none';

  const filtered = allMenuItems.filter(item =>
    item.name.toLowerCase().includes(query) || item.course.toLowerCase().includes(query)
  );
  renderMenu(filtered);
});

clearMenuBtn.addEventListener('click', () => {
  searchInput.value = '';
  clearMenuBtn.style.display = 'none';
  renderMenu(allMenuItems);
});

tableSearchInput.addEventListener('input', function () {
  const query = this.value.trim();
  clearTableBtn.style.visibility = query ? 'block' : 'none';

  tables.forEach(table => {
    const id = table.dataset.id;
    table.style.display = id.includes(query) ? '' : 'none';
  });
});

clearTableBtn.addEventListener('click', () => {
  tableSearchInput.value = '';
  clearTableBtn.style.visibility = 'none';
  tableSearchInput.dispatchEvent(new Event('input'));
});

tables.forEach(table => {
  table.addEventListener('dragover', e => e.preventDefault());

  table.addEventListener('drop', () => {
    const id = table.dataset.id;
    if (!draggedItem) return;

    if (!tableOrders[id]) tableOrders[id] = [];

    const existing = tableOrders[id].find(order => order.id === draggedItem.id);
    if (existing) {
      existing.count++;
    } else {
      tableOrders[id].push({ ...draggedItem, count: 1 });
    }

    updateTableDisplay(id);
    draggedItem = null;
  });

  table.addEventListener('click', () => {
    showModal(table);
  });
});

function updateTableDisplay(id) {
  const table = document.querySelector(`.table[data-id="${id}"]`);
  const totalSpan = table.querySelector('.total');
  const countSpan = table.querySelector('.count');

  const orders = tableOrders[id] || [];
  const total = orders.reduce((acc, item) => acc + item.price * item.count, 0);
  const count = orders.reduce((acc, item) => acc + item.count, 0);

  totalSpan.textContent = total.toFixed(2);
  countSpan.textContent = count;
}

function showModal(table) {
  tables.forEach(t => t.classList.remove('active'));
  table.classList.add('active');

  const id = table.dataset.id;
  modalTitle.textContent = `Table - ${id} | Order Details`;
  orderTableBody.innerHTML = '';

  const orders = tableOrders[id] || [];
  orders.forEach((item, index) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${index + 1}</td>
      <td>${item.name}</td>
      <td>${item.price.toFixed(2)}</td>
      <td><input type="number" min="1" value="${item.count}" data-index="${index}" data-id="${id}" class="serving-input"></td>
      <td><button class="delete-btn" data-index="${index}" data-id="${id}">🗑</button></td>
    `;
    orderTableBody.appendChild(row);
  });

  updateModalTotal(id);
  modal.classList.remove('hidden');
}

closeModal.addEventListener('click', () => {
  modal.classList.add('hidden');
  tables.forEach(t => t.classList.remove('active'));
});

orderTableBody.addEventListener('input', (e) => {
  if (e.target.classList.contains('serving-input')) {
    const id = e.target.dataset.id;
    const index = e.target.dataset.index;
    tableOrders[id][index].count = parseInt(e.target.value) || 1;
    updateTableDisplay(id);
    updateModalTotal(id);
  }
});

orderTableBody.addEventListener('click', (e) => {
  if (e.target.classList.contains('delete-btn')) {
    const id = e.target.dataset.id;
    const index = e.target.dataset.index;
    tableOrders[id].splice(index, 1);
    updateTableDisplay(id);
    showModal(document.querySelector(`.table[data-id="${id}"]`));
  }
});

generateBill.addEventListener('click', () => {
  const id = modalTitle.textContent.match(/\d+/)[0];
  const total = tableOrders[id]?.reduce((acc, item) => acc + item.price * item.count, 0) || 0;
  alert(`Total Bill for Table ${id}: ₹${total.toFixed(2)}`);
  tableOrders[id] = [];
  updateTableDisplay(id);
  modal.classList.add('hidden');
  tables.forEach(t => t.classList.remove('active'));
});

function updateModalTotal(id) {
  const total = tableOrders[id]?.reduce((acc, item) => acc + item.price * item.count, 0) || 0;
  modalTotal.textContent = total.toFixed(2);
}

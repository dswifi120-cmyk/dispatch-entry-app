/* =====================================================
   DISPATCH ENTRY APP
   ===================================================== */


/* ================= GLOBAL ================= */

let editingId = null;

let deferredPrompt = null;


/* ================= START ================= */

document.addEventListener("DOMContentLoaded", function () {

  addProduct();

  registerServiceWorker();

});


/* ================= PRODUCT ================= */

function addProduct(name = "", quantity = "") {

  const container = document.getElementById("productsContainer");

  const row = document.createElement("div");

  row.className = "product-row";

  row.innerHTML = `
    
    <input
      type="text"
      class="product-name"
      placeholder="Product name"
      value="${escapeHTML(name)}"
    >

    <input
      type="number"
      class="product-quantity"
      placeholder="Qty"
      min="0"
      value="${escapeHTML(quantity)}"
    >

    <button
      type="button"
      class="remove-product"
      onclick="removeProduct(this)"
    >
      ×
    </button>

  `;

  container.appendChild(row);
}


function removeProduct(button) {

  const rows =
    document.querySelectorAll(".product-row");

  if (rows.length <= 1) {

    showToast("At least one product is required.");

    return;
  }

  button.parentElement.remove();
}


/* ================= SAVE ================= */

function saveEntry() {

  const storeName =
    document.getElementById("storeName").value.trim();

  const address =
    document.getElementById("address").value.trim();

  const phone =
    document.getElementById("phone").value.trim();

  const courier =
    document.getElementById("courier").value;

  const note =
    document.getElementById("note").value.trim();


  if (!storeName) {

    showToast("Please enter store name.");

    return;
  }

  if (!phone) {

    showToast("Please enter phone number.");

    return;
  }

  if (!courier) {

    showToast("Please select courier.");

    return;
  }


  /* PRODUCTS */

  const productRows =
    document.querySelectorAll(".product-row");

  const products = [];


  productRows.forEach(row => {

    const name =
      row.querySelector(".product-name").value.trim();

    const quantity =
      row.querySelector(".product-quantity").value.trim();


    if (name) {

      products.push({
        name: name,
        quantity: quantity
      });

    }

  });


  if (products.length === 0) {

    showToast("Please add at least one product.");

    return;
  }


  /* DATA */

  const entry = {

    id: editingId || Date.now(),

    storeName: storeName,

    address: address,

    phone: phone,

    courier: courier,

    products: products,

    note: note,

    date: editingId
      ? getExistingDate(editingId)
      : new Date().toISOString()

  };


  let history = getHistory();


  /* EDIT */

  if (editingId) {

    history = history.map(item => {

      if (item.id === editingId) {

        return entry;

      }

      return item;

    });

    showToast("Entry updated successfully.");

  }


  /* NEW */

  else {

    history.unshift(entry);

    showToast("Entry saved successfully.");

  }


  localStorage.setItem(
    "dispatchHistory",
    JSON.stringify(history)
  );


  resetForm();

  editingId = null;


  setTimeout(() => {

    showEntryPage();

  }, 600);

}


/* ================= HISTORY ================= */

function getHistory() {

  try {

    return JSON.parse(
      localStorage.getItem("dispatchHistory")
    ) || [];

  } catch (error) {

    return [];

  }

}


function showHistoryPage() {

  document.getElementById("entryPage")
    .classList.add("hidden");

  document.getElementById("historyPage")
    .classList.remove("hidden");

  document.getElementById("pageTitle")
    .textContent = "History Records";

  renderHistory();

}


function renderHistory() {

  const list =
    document.getElementById("historyList");

  const search =
    document.getElementById("searchPhone")
      .value
      .trim()
      .toLowerCase();


  let history = getHistory();


  if (search) {

    history = history.filter(item =>
      item.phone
        .toLowerCase()
        .includes(search)
    );

  }


  if (history.length === 0) {

    list.innerHTML = `
      <div class="empty-history">
        <div style="font-size:45px;">📭</div>
        <p>No history found.</p>
      </div>
    `;

    return;
  }


  list.innerHTML = "";


  history.forEach(item => {

    const div = document.createElement("div");

    div.className = "history-item";


    const productsHTML =
      item.products.map(product => {

        return `
          <div class="product-line">
            <span>${escapeHTML(product.name)}</span>
            <strong>${escapeHTML(product.quantity)} pcs</strong>
          </div>
        `;

      }).join("");


    div.innerHTML = `

      <div class="history-header">

        <div class="store-title">
          🏪 ${escapeHTML(item.storeName)}
        </div>

        <div class="date">
          ${formatDate(item.date)}
        </div>

      </div>


      <div class="history-info">

        📞 ${escapeHTML(item.phone)}
        <br>

        📍 ${escapeHTML(item.address || "No address")}
        <br>

        🚚 ${escapeHTML(item.courier)}

      </div>


      <div class="product-list">

        <strong>📦 Products (${item.products.length})</strong>

        ${productsHTML}

      </div>


      ${
        item.note
          ? `
            <div style="margin-top:10px;">
              📝 ${escapeHTML(item.note)}
            </div>
          `
          : ""
      }


      <div class="action-buttons">

        <button
          class="edit-btn"
          onclick="editEntry(${item.id})"
        >
          ✏️ Edit
        </button>

        <button
          class="delete-btn"
          onclick="deleteEntry(${item.id})"
        >
          🗑️ Delete
        </button>

      </div>

    `;


    list.appendChild(div);

  });

}


/* ================= EDIT ================= */

function editEntry(id) {

  const history = getHistory();

  const item =
    history.find(entry => entry.id === id);


  if (!item) {

    showToast("Entry not found.");

    return;
  }


  editingId = id;


  document.getElementById("storeName").value =
    item.storeName;

  document.getElementById("address").value =
    item.address;

  document.getElementById("phone").value =
    item.phone;

  document.getElementById("courier").value =
    item.courier;

  document.getElementById("note").value =
    item.note || "";


  const container =
    document.getElementById("productsContainer");

  container.innerHTML = "";


  item.products.forEach(product => {

    addProduct(
      product.name,
      product.quantity
    );

  });


  document.getElementById("pageTitle")
    .textContent = "Edit Dispatch Entry";


  document.getElementById("historyPage")
    .classList.add("hidden");

  document.getElementById("entryPage")
    .classList.remove("hidden");


  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });

}


/* ================= DELETE ================= */

function deleteEntry(id) {

  const confirmDelete =
    confirm(
      "Are you sure you want to delete this entry?"
    );


  if (!confirmDelete) {

    return;

  }


  let history = getHistory();


  history =
    history.filter(item => item.id !== id);


  localStorage.setItem(
    "dispatchHistory",
    JSON.stringify(history)
  );


  renderHistory();


  showToast("Entry deleted.");

}


/* ================= PAGE ================= */

function showEntryPage() {

  document.getElementById("historyPage")
    .classList.add("hidden");

  document.getElementById("entryPage")
    .classList.remove("hidden");

  document.getElementById("pageTitle")
    .textContent =
      editingId
        ? "Edit Dispatch Entry"
        : "New Dispatch Entry";

}


/* ================= RESET ================= */

function resetForm() {

  document.getElementById("storeName").value = "";

  document.getElementById("address").value = "";

  document.getElementById("phone").value = "";

  document.getElementById("courier").value = "";

  document.getElementById("note").value = "";


  document.getElementById("productsContainer")
    .innerHTML = "";


  addProduct();

  editingId = null;

  document.getElementById("pageTitle")
    .textContent = "New Dispatch Entry";

}


/* ================= DATE ================= */

function formatDate(dateString) {

  const date =
    new Date(dateString);


  return date.toLocaleDateString(
    "en-GB",
    {
      day: "2-digit",
      month: "short",
      year: "numeric"
    }
  );

}


function getExistingDate(id) {

  const history = getHistory();

  const item =
    history.find(entry => entry.id === id);

  return item
    ? item.date
    : new Date().toISOString();

}


/* ================= TOAST ================= */

function showToast(message) {

  const toast =
    document.getElementById("toast");

  toast.textContent = message;

  toast.style.display = "block";


  setTimeout(() => {

    toast.style.display = "none";

  }, 2500);

}


/* ================= SECURITY ================= */

function escapeHTML(value) {

  if (value === undefined || value === null) {

    return "";

  }


  return String(value)

    .replace(/&/g, "&amp;")

    .replace(/</g, "&lt;")

    .replace(/>/g, "&gt;")

    .replace(/"/g, "&quot;")

    .replace(/'/g, "&#039;");

}


/* ================= PWA INSTALL ================= */

window.addEventListener(
  "beforeinstallprompt",
  event => {

    event.preventDefault();

    deferredPrompt = event;

    document
      .getElementById("installButton")
      .classList.remove("hidden");

  }
);


async function installApp() {

  if (!deferredPrompt) {

    showToast(
      "Use browser menu → Add to Home Screen"
    );

    return;

  }


  deferredPrompt.prompt();


  const result =
    await deferredPrompt.userChoice;


  deferredPrompt = null;


  document
    .getElementById("installButton")
    .classList.add("hidden");

}


/* ================= SERVICE WORKER ================= */

function registerServiceWorker() {

  if ("serviceWorker" in navigator) {

    navigator.serviceWorker
      .register("sw.js")
      .catch(error => {

        console.log(
          "Service Worker error:",
          error
        );

      });

  }

}

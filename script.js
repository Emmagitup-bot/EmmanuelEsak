// ==================================================
// STUDENT ASSIGNMENT: CART FLOW AND INTERFACE BINDING
// ==================================================

// Plain application array store to trace added items
let myShoppingBasket = [];

// DOM Reference handles
const emptyBasketView = document.getElementById('empty-basket-view');
const activeBasketView = document.getElementById('active-basket-view');
const basketItemsList = document.getElementById('basket-items-list');
const totalQtyBadge = document.getElementById('total-qty-badge');
const basketGrandTotal = document.getElementById('basket-grand-total');

// Confirmation Overlay references
const modalOverlay = document.getElementById('modal-overlay');
const receiptItemsList = document.getElementById('receipt-items-list');
const receiptGrandTotal = document.getElementById('receipt-grand-total');

// Action buttons
const checkoutBtn = document.getElementById('checkout-btn');
const restartAppBtn = document.getElementById('restart-app-btn');
const toastAlert = document.getElementById('toast-alert');

document.addEventListener('DOMContentLoaded', () => {
  loadSavedCartCache();
  syncEntireInterface();
  bindStaticListeners();
});

function bindStaticListeners() {
  checkoutBtn.addEventListener('click', generateReceiptModal);
  restartAppBtn.addEventListener('click', resetAllSystemData);
}

/**
 * Fires when clicking the initial 'Add to Cart' pill button
 */
function runBasketInsertion(itemId) {
  const targetCard = document.querySelector(`[data-id="${itemId}"]`);
  const productName = targetCard.getAttribute('data-name');
  const productPrice = parseFloat(targetCard.getAttribute('data-price'));

  const itemAlreadyAdded = myShoppingBasket.find(item => item.id === itemId);

  if (!itemAlreadyAdded) {
    myShoppingBasket.push({
      id: itemId,
      name: productName,
      price: productPrice,
      quantity: 1
    });

    triggerAlertToast(`Added ${productName} to your list`);
    saveCartCache();
    syncEntireInterface();
  }
}

/**
 * Handles modifying item volume using the plus and minus icons
 */
function shiftItemQuantity(itemId, numericStep) {
  const matchingEntry = myShoppingBasket.find(item => item.id === itemId);

  if (matchingEntry) {
    matchingEntry.quantity += numericStep;

    // Remove item completely if count drops to zero or below
    if (matchingEntry.quantity <= 0) {
      myShoppingBasket = myShoppingBasket.filter(item => item.id !== itemId);
    }

    saveCartCache();
    syncEntireInterface();
  }
}

/**
 * Triggered by the small X circle button inside the sidebar list rows
 */
function completelyRemoveItem(itemId) {
  myShoppingBasket = myShoppingBasket.filter(item => item.id !== itemId);
  saveCartCache();
  syncEntireInterface();
}

/**
 * Loops over the product list to sync the UI states
 */
function syncEntireInterface() {
  let combinedUnitCount = 0;
  let combinedCashSum = 0;

  // Clear previous sidebar row structures
  basketItemsList.innerHTML = '';

  // 1. EVALUATE SIDEBAR RENDER STATES
  if (myShoppingBasket.length === 0) {
    emptyBasketView.classList.remove('hidden');
    activeBasketView.classList.add('hidden');
  } else {
    emptyBasketView.classList.add('hidden');
    activeBasketView.classList.remove('hidden');

    myShoppingBasket.forEach(entry => {
      combinedUnitCount += entry.quantity;
      const lineTotal = entry.price * entry.quantity;
      combinedCashSum += lineTotal;

      const lineNode = document.createElement('li');
      lineNode.className = 'basket-item';
      lineNode.innerHTML = `
        <div>
          <p style="font-weight: 600; font-size: 0.95rem;">${entry.name}</p>
          <div style="margin-top: 4px; font-size: 0.9rem;">
            <span class="math-qty">${entry.quantity}x</span>
            <span class="math-each">@ $${entry.price.toFixed(2)}</span>
            <span style="color: var(--text-muted); font-weight:600;">$${lineTotal.toFixed(2)}</span>
          </div>
        </div>
        <button class="remove-item-btn" onclick="completelyRemoveItem('${entry.id}')">✕</button>
      `;
      basketItemsList.appendChild(lineNode);
    });
  }

  // Update totals text markers
  totalQtyBadge.innerText = combinedUnitCount;
  basketGrandTotal.innerText = `$${combinedCashSum.toFixed(2)}`;

  // 2. SYNCHRONIZE BUTTONS AND BORDERS IN THE GRID
  const allCardsOnPage = document.querySelectorAll('.product-card');
  allCardsOnPage.forEach(card => {
    const cardId = card.getAttribute('data-id');
    const imageElement = card.querySelector('.product-img');
    const buttonZone = card.querySelector('.action-btn-placeholder');
    
    const activeCartMatch = myShoppingBasket.find(item => item.id === cardId);

    if (activeCartMatch) {
      // Image 2 State: Add active border class to image and show counter control button
      imageElement.classList.add('active-border');
      buttonZone.innerHTML = `
        <div class="quantity-control-panel">
          <button onclick="shiftItemQuantity('${cardId}', -1)">-</button>
          <span>${activeCartMatch.quantity}</span>
          <button onclick="shiftItemQuantity('${cardId}', 1)">+</button>
        </div>
      `;
    } else {
      // Image 1 State: Remove border ring and restore plain white button option
      imageElement.classList.remove('active-border');
      buttonZone.innerHTML = `
        <button class="add-to-basket-btn" onclick="runBasketInsertion('${cardId}')">Add to Cart</button>
      `;
    }
  });
}

/**
 * Builds the text rows to confirm final purchase totals
 */
function generateReceiptModal() {
  receiptItemsList.innerHTML = '';
  let receiptTotalCounter = 0;

  myShoppingBasket.forEach(purchasedItem => {
    const rowCost = purchasedItem.price * purchasedItem.quantity;
    receiptTotalCounter += rowCost;

    const receiptLi = document.createElement('li');
    receiptLi.className = 'receipt-item';
    receiptLi.innerHTML = `
      <div>
        <span class="math-qty">${purchasedItem.quantity}x</span>
        <span style="font-weight: 600;">${purchasedItem.name}</span>
      </div>
      <span style="font-weight: 700;">$${rowCost.toFixed(2)}</span>
    `;
    receiptItemsList.appendChild(receiptLi);
  });

  receiptGrandTotal.innerText = `$${receiptTotalCounter.toFixed(2)}`;
  modalOverlay.classList.remove('hidden');
}

/**
 * Clears arrays and cache values completely
 */
function resetAllSystemData() {
  myShoppingBasket = [];
  localStorage.removeItem('studentBasketCache');
  modalOverlay.classList.add('hidden');
  syncEntireInterface();
}

/**
 * LocalStorage management
 */
function saveCartCache() {
  localStorage.setItem('studentBasketCache', JSON.stringify(myShoppingBasket));
}

function loadSavedCartCache() {
  const memoryCache = localStorage.getItem('studentBasketCache');
  if (memoryCache) {
    try {
      myShoppingBasket = JSON.parse(memoryCache);
    } catch (e) {
      myShoppingBasket = [];
    }
  }
}

/**
 * Toast alert handler
 */
function triggerAlertToast(messageText) {
  toastAlert.innerText = messageText;
  toastAlert.classList.remove('hidden');
  setTimeout(() => {
    toastAlert.classList.add('hidden');
  }, 2000);
}
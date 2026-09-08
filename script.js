const cartKey = "luxewear-cart";
let cart = JSON.parse(localStorage.getItem(cartKey) || "[]");
let activeFilter = "All";
let toastTimer;

const money = (value) => value.toLocaleString("en-NG");
const get = (selector) => document.querySelector(selector);

function saveCart() {
    localStorage.setItem(cartKey, JSON.stringify(cart));
}

function showToast(message) {
    const toast = get("#toast");
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 2600);
}

function updateCart() {
    const cartItems = get("#cartItems");
    const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    get("#cartCount").textContent = itemCount;
    get("#cartTotal").textContent = money(total);

    if (!cart.length) {
        cartItems.innerHTML = '<p class="empty-cart">Your bag is waiting for something special.</p>';
        return;
    }

    cartItems.innerHTML = cart.map((item) => `
        <div class="cart-item">
            <div class="cart-item-info">
                <h3>${item.name}</h3>
                <p>₦${money(item.price)} each</p>
                <div class="quantity-controls">
                    <button type="button" aria-label="Decrease ${item.name} quantity" onclick="changeQuantity('${item.name}', -1)">−</button>
                    <span>${item.quantity}</span>
                    <button type="button" aria-label="Increase ${item.name} quantity" onclick="changeQuantity('${item.name}', 1)">+</button>
                    <button type="button" class="remove-item" onclick="removeFromCart('${item.name}')">Remove</button>
                </div>
            </div>
            <strong>₦${money(item.price * item.quantity)}</strong>
        </div>
    `).join("");
}

function addToCart(name, price) {
    const existingItem = cart.find((item) => item.name === name);
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ name, price, quantity: 1 });
    }
    saveCart();
    updateCart();
    showToast(`${name} added to your bag`);
}

function changeQuantity(name, amount) {
    const item = cart.find((cartItem) => cartItem.name === name);
    if (!item) return;
    item.quantity += amount;
    if (item.quantity <= 0) cart = cart.filter((cartItem) => cartItem.name !== name);
    saveCart();
    updateCart();
}

function removeFromCart(name) {
    cart = cart.filter((item) => item.name !== name);
    saveCart();
    updateCart();
    showToast(`${name} removed from your bag`);
}

function showCart() {
    updateCart();
    get("#cartBox").classList.add("open");
    get("#cartOverlay").classList.add("open");
    get("#cartBox").setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
}

function closeCart() {
    get("#cartBox").classList.remove("open");
    get("#cartOverlay").classList.remove("open");
    get("#cartBox").setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
}

function checkout() {
    if (!cart.length) {
        showToast("Your bag is empty");
        return;
    }
    showToast("Checkout will be connected to payments soon");
}

function focusSearch() {
    document.querySelector("#shop").scrollIntoView({ behavior: "smooth" });
    setTimeout(() => get("#productSearch").focus(), 500);
}

function filterProducts() {
    const query = get("#productSearch").value.toLowerCase().trim();
    const products = document.querySelectorAll(".product");
    let visibleCount = 0;
    products.forEach((product) => {
        const matchesCategory = activeFilter === "All" || product.dataset.category === activeFilter;
        const matchesSearch = product.dataset.name.toLowerCase().includes(query);
        const visible = matchesCategory && matchesSearch;
        product.hidden = !visible;
        if (visible) visibleCount += 1;
    });
    get("#resultsCount").textContent = `${visibleCount} ${visibleCount === 1 ? "piece" : "pieces"}`;
    get("#emptyState").hidden = visibleCount !== 0;
}

document.querySelectorAll(".add-cart").forEach((button) => {
    button.addEventListener("click", () => addToCart(button.dataset.name, Number(button.dataset.price)));
});

document.querySelectorAll(".filter-button").forEach((button) => {
    button.addEventListener("click", () => {
        document.querySelector(".filter-button.active").classList.remove("active");
        button.classList.add("active");
        activeFilter = button.dataset.filter;
        filterProducts();
    });
});

document.querySelector("#productSearch").addEventListener("input", filterProducts);
document.querySelectorAll("[data-category-link]").forEach((link) => {
    link.addEventListener("click", () => {
        activeFilter = link.dataset.categoryLink;
        document.querySelectorAll(".filter-button").forEach((button) => button.classList.toggle("active", button.dataset.filter === activeFilter));
        filterProducts();
    });
});

document.querySelectorAll(".wishlist").forEach((button) => {
    button.addEventListener("click", () => {
        button.classList.toggle("active");
        button.textContent = button.classList.contains("active") ? "♥" : "♡";
        showToast(button.classList.contains("active") ? "Added to your wishlist" : "Removed from your wishlist");
    });
});

const menuToggle = get(".menu-toggle");
menuToggle.addEventListener("click", () => {
    const nav = get(".main-nav");
    const isOpen = nav.classList.toggle("open");
    menuToggle.setAttribute("aria-expanded", String(isOpen));
});
document.querySelectorAll(".main-nav a").forEach((link) => link.addEventListener("click", () => get(".main-nav").classList.remove("open")));

document.querySelector("#newsletterForm").addEventListener("submit", (event) => {
    event.preventDefault();
    event.currentTarget.reset();
    showToast("Welcome to the LuxeWear list");
});

document.querySelector("#contactForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const name = get("#name").value.trim();
    const email = get("#email").value.trim();
    const message = get("#message").value.trim();
    const form = event.currentTarget;
    const submitButton = form.querySelector("button[type='submit']");
    submitButton.disabled = true;
    submitButton.textContent = "Sending...";

    try {
        const response = await fetch("https://formsubmit.co/ajax/ogundayomubaraq9@gmail.com", {
            method: "POST",
            headers: { "Content-Type": "application/json", Accept: "application/json" },
            body: JSON.stringify({
                name,
                email,
                message,
                _subject: `LuxeWear contact message from ${name}`,
                _replyto: email,
                _captcha: "false"
            })
        });

        const result = await response.json();
        if (!response.ok || result.success !== "true") {
            throw new Error(result.message || "Message delivery failed");
        }
        form.reset();
        showToast("Message sent successfully");
    } catch (error) {
        console.error("Contact form delivery error:", error);
        const subject = `LuxeWear contact message from ${name}`;
        const body = `Name: ${name}\nCustomer email: ${email}\n\nMessage:\n${message}`;
        window.location.href = `mailto:ogundayomubaraq9@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        showToast("Automatic delivery failed; opening your email app");
    } finally {
        submitButton.disabled = false;
        submitButton.innerHTML = "Send message <span>→</span>";
    }
});

document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeCart();
});

updateCart();

import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { db } from "./firebase";
import { ref, push, onValue } from "firebase/database";
import Merchant from "./Merchant";

function CustomerApp() {
  const foods = [
    {
      id: 1,
      name: "Chicken Biryani",
      price: 180,
      category: "Non-Veg",
      image: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500"
    },
    {
      id: 2,
      name: "Chicken Roll",
      price: 100,
      category: "Non-Veg",
      image: "https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=500"
    },
    {
      id: 3,
      name: "Veg Burger",
      price: 120,
      category: "Veg",
      image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500"
    },
    {
      id: 4,
      name: "Paneer Pizza",
      price: 220,
      category: "Veg",
      image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500"
    }
  ];

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const [cart, setCart] = useState(() => {
    const savedCart = localStorage.getItem("cart");
    return savedCart ? JSON.parse(savedCart) : [];
  });

  const [orderPlaced, setOrderPlaced] = useState(false);
  const [activeOrderId, setActiveOrderId] = useState(null);
  const [orderStatus, setOrderStatus] = useState("Placed");
  const [customer, setCustomer] = useState({ name: "", phone: "", pickupTime: "20 mins" });

  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

  // Live order status tracking from Firebase
  useEffect(() => {
    if (activeOrderId) {
      const orderRef = ref(db, "orders/" + activeOrderId);
      const unsubscribe = onValue(orderRef, (snapshot) => {
        const data = snapshot.val();
        if (data && data.status) {
          setOrderStatus(data.status);
        }
      });
      return () => unsubscribe();
    }
  }, [activeOrderId]);

  const filteredFoods = foods.filter((food) => {
    const matchesSearch = food.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || food.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  function addToCart(food) {
    const existingItem = cart.find((item) => item.id === food.id);

    if (existingItem) {
      setCart(
        cart.map((item) =>
          item.id === food.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      setCart([...cart, { ...food, quantity: 1 }]);
    }
  }

  function increaseQuantity(id) {
    setCart(
      cart.map((item) =>
        item.id === id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      )
    );
  }

  function decreaseQuantity(id) {
    setCart(
      cart
        .map((item) =>
          item.id === id
            ? { ...item, quantity: item.quantity - 1 }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  }

  const handleInputChange = (e) => {
    setCustomer({ ...customer, [e.target.name]: e.target.value });
  };

  const handlePlaceOrder = () => {
    if (cart.length === 0) {
      alert("Cart empty! Age food add kor.");
      return;
    }
    if (!customer.name || !customer.phone) {
      alert("Name and Phone Number puron kor!");
      return;
    }

    const ordersRef = ref(db, "orders");
    const newOrderRef = push(ordersRef, {
      customerName: customer.name,
      customerPhone: customer.phone,
      pickupTime: customer.pickupTime,
      cartItems: cart,
      totalAmount: total,
      status: "Placed",
      createdAt: new Date().toISOString()
    });

    setActiveOrderId(newOrderRef.key);
    setOrderPlaced(true);
    setOrderStatus("Placed");
  };

  const total = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  return (
    <div style={{ maxWidth: "700px", margin: "0 auto", padding: "20px", fontFamily: "sans-serif" }}>
      <h1 style={{ textAlign: "center" }}>QuickDrop 🍔 <br /><span style={{ fontSize: "14px", color: "#888" }}>Self-Pickup Ordering</span></h1>

      {/* SEARCH & FILTER */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
        <input
          type="text"
          placeholder="Search food (e.g. Biryani)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ flex: 2, padding: "10px", borderRadius: "6px", border: "1px solid #444" }}
        />
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          style={{ flex: 1, padding: "10px", borderRadius: "6px", border: "1px solid #444" }}
        >
          <option value="All">All Categories</option>
          <option value="Veg">Veg Only</option>
          <option value="Non-Veg">Non-Veg Only</option>
        </select>
      </div>

      <h2>Popular Dishes</h2>

      {/* MENU GRID */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "15px" }}>
        {filteredFoods.map((food) => (
          <div key={food.id} style={{ border: "1px solid #333", padding: "12px", borderRadius: "8px", textAlign: "center" }}>
            <img
              src={food.image}
              alt={food.name}
              style={{ width: "100%", height: "130px", objectFit: "cover", borderRadius: "6px" }}
            />
            <h3 style={{ margin: "10px 0 4px 0" }}>{food.name}</h3>
            <span style={{ fontSize: "12px", color: food.category === "Veg" ? "green" : "red" }}>
              ● {food.category}
            </span>
            <p style={{ margin: "6px 0", fontWeight: "bold" }}>₹{food.price}</p>
            <button
              onClick={() => addToCart(food)}
              style={{ padding: "8px 12px", background: "#ff4757", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer" }}
            >
              Add to Cart
            </button>
          </div>
        ))}
      </div>

      <hr style={{ margin: "30px 0" }} />

      {/* CART SECTION */}
      <div>
        <h2>Cart 🛒</h2>
        <p>Total Items: {cart.reduce((sum, item) => sum + item.quantity, 0)}</p>

        {cart.length === 0 && <p style={{ color: "#888" }}>Cart is currently empty!</p>}

        {cart.map((item) => (
          <div key={item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <span>{item.name} - ₹{item.price} × {item.quantity}</span>
            <div>
              <button onClick={() => decreaseQuantity(item.id)}>−</button>
              <span style={{ margin: "0 8px" }}>{item.quantity}</span>
              <button onClick={() => increaseQuantity(item.id)}>+</button>
            </div>
          </div>
        ))}

        <h3>Total Bill: ₹{total}</h3>
      </div>

      <hr style={{ margin: "30px 0" }} />

      {/* CHECKOUT SECTION */}
      {!orderPlaced ? (
        <div>
          <h2>Takeaway Details 🛍️</h2>
          <input
            type="text"
            name="name"
            placeholder="Your Name"
            value={customer.name}
            onChange={handleInputChange}
            style={{ width: "100%", padding: "10px", marginBottom: "10px", boxSizing: "border-box" }}
          />
          <input
            type="text"
            name="phone"
            placeholder="Phone Number"
            value={customer.phone}
            onChange={handleInputChange}
            style={{ width: "100%", padding: "10px", marginBottom: "10px", boxSizing: "border-box" }}
          />
          <label style={{ display: "block", marginBottom: "5px", fontSize: "14px" }}>Estimated Pickup Time:</label>
          <select
            name="pickupTime"
            value={customer.pickupTime}
            onChange={handleInputChange}
            style={{ width: "100%", padding: "10px", marginBottom: "15px", boxSizing: "border-box" }}
          >
            <option value="15 mins">In 15 mins</option>
            <option value="25 mins">In 25 mins</option>
            <option value="40 mins">In 40 mins</option>
          </select>

          <button
            onClick={handlePlaceOrder}
            style={{ width: "100%", padding: "12px", background: "#2ed573", color: "#fff", border: "none", borderRadius: "6px", fontWeight: "bold", cursor: "pointer" }}
          >
            Place Takeaway Order (Pay ₹{total} at Store)
          </button>
        </div>
      ) : (
        /* LIVE TRACKING */
        <div style={{ background: "#222", color: "#fff", padding: "15px", borderRadius: "8px" }}>
          <h2>🎉 Order Placed with Restaurant!</h2>
          <p>Customer: <strong>{customer.name}</strong> ({customer.phone})</p>
          <p>Pickup: <i>{customer.pickupTime}</i></p>
          <h3>Status: <span style={{ color: "#2ed573", fontWeight: "bold" }}>{orderStatus}</span></h3>

          <button 
            onClick={() => { setOrderPlaced(false); setCart([]); localStorage.removeItem("cart"); }}
            style={{ padding: "8px 16px", marginTop: "10px", cursor: "pointer" }}
          >
            Order More Food
          </button>
        </div>
      )}
    </div>
  );
}

function App() {
  return (
    <Router>
      <nav style={{ background: "#111", padding: "10px", textAlign: "center", display: "flex", justifyContent: "center", gap: "20px" }}>
        <Link to="/" style={{ color: "#fff", textDecoration: "none", fontWeight: "bold" }}>📱 Customer App</Link>
        <Link to="/merchant" style={{ color: "#2ed573", textDecoration: "none", fontWeight: "bold" }}>🏪 Merchant Dashboard</Link>
      </nav>

      <Routes>
        <Route path="/" element={<CustomerApp />} />
        <Route path="/merchant" element={<Merchant />} />
      </Routes>
    </Router>
  );
}

export default App;

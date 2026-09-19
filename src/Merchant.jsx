import { useState, useEffect, useRef } from "react";
import { db } from "./firebase";
import { ref, onValue, update, remove } from "firebase/database";

// Keep audio persistent outside component render
const orderAudio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");

function Merchant() {
  const [orders, setOrders] = useState({});
  const [soundEnabled, setSoundEnabled] = useState(false);
  const isFirstLoad = useRef(true);
  const previousOrderKeys = useRef([]);

  const enableSound = () => {
    orderAudio.play().then(() => {
      setSoundEnabled(true);
    }).catch(e => console.log("Audio play error:", e));
  };

  useEffect(() => {
    const ordersRef = ref(db, "orders");
    const unsubscribe = onValue(ordersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const currentKeys = Object.keys(data);

        // Ignore first load trigger
        if (isFirstLoad.current) {
          isFirstLoad.current = false;
          previousOrderKeys.current = currentKeys;
        } else {
          // Check if a NEW order key was added
          const hasNewOrder = currentKeys.some(key => !previousOrderKeys.current.includes(key));
          
          if (hasNewOrder) {
            orderAudio.currentTime = 0;
            orderAudio.play().catch(e => console.log("Sound play error:", e));
          }
          previousOrderKeys.current = currentKeys;
        }

        setOrders(data);
      } else {
        setOrders({});
        previousOrderKeys.current = [];
      }
    });

    return () => unsubscribe();
  }, []);

  const updateStatus = (orderId, newStatus) => {
    const orderRef = ref(db, `orders/${orderId}`);
    update(orderRef, { status: newStatus });
  };

  // Order Complete / Delete function
  const deleteOrder = (orderId) => {
    if (window.confirm("Are you sure you want to complete and remove this order?")) {
      const orderRef = ref(db, `orders/${orderId}`);
      remove(orderRef);
    }
  };

  const orderKeys = Object.keys(orders);

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "20px", fontFamily: "sans-serif" }}>
      <h1 style={{ textAlign: "center", color: "#ff4757" }}>
        🏪 Restaurant Dashboard
      </h1>

      {/* Sound Status Banner */}
      <div style={{ textAlign: "center", marginBottom: "20px" }}>
        <button
          onClick={enableSound}
          style={{
            padding: "10px 20px",
            background: soundEnabled ? "#2ed573" : "#ff4757",
            color: "#fff",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
            fontWeight: "bold"
          }}
        >
          {soundEnabled ? "🔔 Sound Active" : "🔔 Click Once to Enable Sound Alerts"}
        </button>
      </div>

      {orderKeys.length === 0 ? (
        <p style={{ textAlign: "center", marginTop: "40px" }}>No active orders right now.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "15px", marginTop: "20px" }}>
          {orderKeys.map((key) => {
            const order = orders[key];
            return (
              <div
                key={key}
                style={{
                  border: "1px solid #444",
                  padding: "15px",
                  borderRadius: "8px",
                  background: order.status === "Ready for Pickup" ? "#1e3a1e" : "#222",
                  color: "#fff"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <h3>Customer: {order.customerName} ({order.customerPhone})</h3>
                  <span
                    style={{
                      padding: "4px 8px",
                      borderRadius: "4px",
                      fontWeight: "bold",
                      background:
                        order.status === "Placed"
                          ? "#eccc68"
                          : order.status === "Preparing"
                          ? "#70a1ff"
                          : "#2ed573",
                      color: "#000"
                    }}
                  >
                    {order.status}
                  </span>
                </div>

                <p><strong>Pickup Time:</strong> {order.pickupTime}</p>
                
                <h4>Items Ordered:</h4>
                <ul>
                  {order.cartItems &&
                    order.cartItems.map((item, index) => (
                      <li key={index}>
                        {item.name} × {item.quantity} (₹{item.price * item.quantity})
                      </li>
                    ))}
                </ul>

                <p><strong>Total Bill:</strong> ₹{order.totalAmount}</p>

                <div style={{ display: "flex", gap: "10px", marginTop: "10px", flexWrap: "wrap" }}>
                  <button
                    onClick={() => updateStatus(key, "Preparing")}
                    style={{
                      padding: "8px 12px",
                      background: "#70a1ff",
                      border: "none",
                      borderRadius: "4px",
                      fontWeight: "bold",
                      cursor: "pointer"
                    }}
                  >
                    Accept & Prepare 🍳
                  </button>
                  
                  <button
                    onClick={() => updateStatus(key, "Ready for Pickup")}
                    style={{
                      padding: "8px 12px",
                      background: "#2ed573",
                      border: "none",
                      borderRadius: "4px",
                      fontWeight: "bold",
                      cursor: "pointer"
                    }}
                  >
                    Mark Ready for Pickup 🛍️
                  </button>

                  <button
                    onClick={() => deleteOrder(key)}
                    style={{
                      padding: "8px 12px",
                      background: "#ff4757",
                      color: "#fff",
                      border: "none",
                      borderRadius: "4px",
                      fontWeight: "bold",
                      cursor: "pointer"
                    }}
                  >
                    Complete / Clear Order ✅
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Merchant;
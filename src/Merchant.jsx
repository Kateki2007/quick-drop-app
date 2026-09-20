import { useEffect, useRef, useState } from "react";
import { db } from "./firebase";
import { ref, onValue, update, remove } from "firebase/database";

// Global audio context - re-render-e reset hobe na
let audioCtx = null;

function playBeepSound() {
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === "suspended") {
      audioCtx.resume();
    }
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(587.33, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + 0.3);
  } catch (err) {
    console.log("Audio play error:", err);
  }
}

function Merchant() {
  const [orders, setOrders] = useState({});
  const [soundEnabled, setSoundEnabled] = useState(false);
  
  const knownOrders = useRef(new Set());
  const isInitialLoad = useRef(true);

  useEffect(() => {
    const ordersRef = ref(db, "orders");

    const unsubscribe = onValue(ordersRef, (snapshot) => {
      const data = snapshot.val() || {};
      setOrders(data);

      const currentIds = Object.keys(data);

      // App open-er prothom bar purono order-er jonno sound bajbe na
      if (isInitialLoad.current) {
        currentIds.forEach((id) => knownOrders.current.add(id));
        isInitialLoad.current = false;
        return;
      }

      // Check purely NOTUN order ashlo kina
      let hasNewOrder = false;
      currentIds.forEach((id) => {
        if (!knownOrders.current.has(id)) {
          hasNewOrder = true;
          knownOrders.current.add(id);
        }
      });

      // Sound SHUDHU notun order ashlei 1 bar bajbe
      if (hasNewOrder && soundEnabled) {
        playBeepSound();
      }
    });

    return () => unsubscribe();
  }, [soundEnabled]);

  const enableAudio = () => {
    setSoundEnabled(true);
    playBeepSound();
  };

  const updateStatus = (orderId, newStatus) => {
    const orderRef = ref(db, `orders/${orderId}`);
    update(orderRef, { status: newStatus });
  };

  const deleteOrder = (orderId) => {
    if (window.confirm("Are you sure you want to remove this order?")) {
      const orderRef = ref(db, `orders/${orderId}`);
      remove(orderRef);
    }
  };

  return (
    <div style={{ maxWidth: "800px", margin: "20px auto", padding: "20px", color: "#fff", fontFamily: "sans-serif" }}>
      <h2>🏪 Restaurant Dashboard</h2>

      {!soundEnabled ? (
        <button 
          onClick={enableAudio} 
          style={{ background: "#ff4757", color: "#fff", padding: "10px 15px", border: "none", borderRadius: "6px", cursor: "pointer", marginBottom: "20px", fontWeight: "bold" }}
        >
          🔔 Click to Enable Sound Notifications
        </button>
      ) : (
        <p style={{ color: "#2ed573", fontSize: "14px", marginBottom: "20px" }}>✅ Sound Notifications Active</p>
      )}

      {Object.keys(orders).length === 0 ? (
        <p>No orders yet!</p>
      ) : (
        Object.entries(orders).map(([id, order]) => (
          <div key={id} style={{ background: "#333", padding: "15px", borderRadius: "8px", marginBottom: "15px", border: "1px solid #444" }}>
            <h3>Customer: {order.customerName} ({order.customerPhone})</h3>
            <p>Pickup Time: <strong>{order.pickupTime}</strong></p>
            <h4>Items Ordered:</h4>
            <ul>
              {order.cartItems && order.cartItems.map((item, index) => (
                <li key={index}>{item.name} × {item.quantity} (₹{item.price})</li>
              ))}
            </ul>
            <p><strong>Total Bill: ₹{order.totalAmount}</strong></p>
            <p>Current Status: <span style={{ color: "#2ed573" }}>{order.status}</span></p>
            
            <div style={{ display: "flex", gap: "10px", marginTop: "10px", flexWrap: "wrap" }}>
              <button onClick={() => updateStatus(id, "Preparing")} style={{ padding: "8px", background: "#ffa500", color: "#000", border: "none", cursor: "pointer", borderRadius: "4px", fontWeight: "bold" }}>
                Mark Preparing
              </button>
              <button onClick={() => updateStatus(id, "Ready for Pickup")} style={{ padding: "8px", background: "#2ed573", color: "#000", border: "none", cursor: "pointer", borderRadius: "4px", fontWeight: "bold" }}>
                Mark Ready
              </button>
              <button onClick={() => updateStatus(id, "Completed")} style={{ padding: "8px", background: "#70a1ff", color: "#000", border: "none", cursor: "pointer", borderRadius: "4px", fontWeight: "bold" }}>
                Mark Completed
              </button>
              <button onClick={() => deleteOrder(id)} style={{ padding: "8px", background: "#ff4757", color: "#fff", border: "none", cursor: "pointer", borderRadius: "4px", fontWeight: "bold", marginLeft: "auto" }}>
                🗑️ Delete Order
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export default Merchant;

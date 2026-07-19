"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Home, PlusCircle, LineChart, Scale } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import toast from "react-hot-toast";

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile } = useAuth();

  const [showWeightModal, setShowWeightModal] = useState(false);
  const [weightInput, setWeightInput] = useState("");

  const handleLogWeight = async () => {
    if (!user || !weightInput) return;
    try {
      await addDoc(collection(db, "users", user.uid, "weights"), {
        weight: parseFloat(weightInput),
        createdAt: serverTimestamp()
      });
      setShowWeightModal(false);
      setWeightInput("");
      toast.success("Weight logged successfully!");
    } catch (e) {
      toast.error("Failed to save weight.");
    }
  };

  const navItems = [
    { label: "Dashboard", path: "/", icon: Home },
    { label: "Log Meal", path: "/log", icon: PlusCircle },
    { label: "Log Weight", action: () => { setWeightInput(profile?.weight?.toString() || ""); setShowWeightModal(true); }, icon: Scale },
    { label: "History", path: "/history", icon: LineChart },
  ];

  return (
    <>
      <nav style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: 'var(--bg-secondary)',
        borderTop: 'var(--glass-border)',
        padding: '12px 24px',
        paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center',
        zIndex: 100,
      }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.path ? pathname === item.path : false;
          return (
            <button
              key={item.label}
              onClick={item.path ? () => router.push(item.path) : item.action}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
                color: isActive ? 'var(--accent-primary)' : 'var(--text-muted)',
                transition: 'color 0.2s',
              }}
            >
              <div style={{
                 background: isActive ? 'rgba(0, 230, 118, 0.1)' : 'transparent',
                 padding: '8px',
                 borderRadius: '12px',
                 transition: 'background 0.2s'
              }}>
                <Icon size={24} />
              </div>
              <span style={{ fontSize: '0.75rem', fontWeight: isActive ? 600 : 400 }}>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Global Weight Modal */}
      {showWeightModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="glass-panel" style={{ padding: '2rem', width: '90%', maxWidth: '400px' }}>
            <h3 style={{ marginBottom: '1rem' }}>Log Weight</h3>
            <input 
              type="number" 
              step="0.1"
              value={weightInput}
              onChange={e => setWeightInput(e.target.value)}
              className="input-field" 
              placeholder="Enter weight in lbs"
              style={{ marginBottom: '1.5rem' }}
            />
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button onClick={() => setShowWeightModal(false)} className="btn-secondary" style={{ flex: 1, padding: '12px' }}>Cancel</button>
              <button onClick={handleLogWeight} className="btn-primary" style={{ flex: 1, padding: '12px' }}>Save</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

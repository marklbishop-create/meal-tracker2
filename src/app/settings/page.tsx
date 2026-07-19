"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import BottomNav from "@/components/BottomNav";
import { Check, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function Settings() {
  const { user, profile } = useAuth();
  const router = useRouter();
  
  const [loading, setLoading] = useState(false);

  const [weight, setWeight] = useState<string>("");
  const [targetWeight, setTargetWeight] = useState<string>("");
  const [calories, setCalories] = useState<string>("");
  const [protein, setProtein] = useState<string>("");
  const [carbs, setCarbs] = useState<string>("");
  const [fat, setFat] = useState<string>("");
  const [theme, setTheme] = useState<string>("dark");

  useEffect(() => {
    if (profile) {
      setWeight(profile.weight?.toString() || "");
      setTargetWeight(profile.goals?.targetWeight?.toString() || "");
      setCalories(profile.goals?.calories?.toString() || "");
      setProtein(profile.goals?.protein?.toString() || "");
      setCarbs(profile.goals?.carbs?.toString() || "");
      setFat(profile.goals?.fat?.toString() || "");
      setTheme(profile.theme || "dark");
    }
  }, [profile]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setLoading(true);
    
    try {
      const userRef = doc(db, "users", user.uid);
      
      await updateDoc(userRef, {
        weight: parseFloat(weight),
        "goals.targetWeight": parseFloat(targetWeight),
        "goals.calories": parseInt(calories),
        "goals.protein": parseInt(protein),
        "goals.carbs": parseInt(carbs),
        "goals.fat": parseInt(fat),
        theme: theme,
      });
      
      alert("Settings saved successfully!");
      router.push('/');
    } catch (error) {
      console.error("Error saving settings", error);
      alert("Failed to save settings. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!profile) return null;

  return (
    <>
      <div className="container page-enter" style={{ paddingTop: '2rem', paddingBottom: '100px' }}>
        
        <header style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
          <button onClick={() => router.back()} className="btn-secondary" style={{ padding: '8px', borderRadius: '50%' }}>
            <ArrowLeft size={20} />
          </button>
          <h2 className="text-gradient" style={{ fontSize: '1.8rem' }}>Settings & Goals</h2>
        </header>
        
        <div className="glass-panel" style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
          
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>


            
            <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '0.5rem', marginTop: '1rem' }}>Body & Targets</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Current Weight (lbs)</label>
                <input type="number" required min="50" step="0.1" className="input-field" value={weight} onChange={(e) => setWeight(e.target.value)} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Target Weight (lbs)</label>
                <input type="number" required min="50" step="0.1" className="input-field" value={targetWeight} onChange={(e) => setTargetWeight(e.target.value)} />
              </div>
            </div>

            <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '0.5rem', marginTop: '1rem' }}>Macro Goals</h3>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Daily Calories (kcal)</label>
              <input type="number" required min="1000" className="input-field" style={{ fontSize: '1.2rem', color: 'var(--accent-primary)', fontWeight: 'bold' }} value={calories} onChange={(e) => setCalories(e.target.value)} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Protein (g)</label>
                <input type="number" required min="0" className="input-field" value={protein} onChange={(e) => setProtein(e.target.value)} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Carbs (g)</label>
                <input type="number" required min="0" className="input-field" value={carbs} onChange={(e) => setCarbs(e.target.value)} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Fat (g)</label>
                <input type="number" required min="0" className="input-field" value={fat} onChange={(e) => setFat(e.target.value)} />
              </div>
            </div>

            <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '0.5rem', marginTop: '1rem' }}>Appearance</h3>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>App Theme</label>
              <select className="input-field" value={theme} onChange={(e) => setTheme(e.target.value)}>
                <option value="dark">Midnight Eclipse</option>
                <option value="light">Crisp Horizon</option>
                <option value="earthy">Terrane</option>
              </select>
            </div>

            <button type="submit" disabled={loading} className="btn-primary" style={{ marginTop: '1.5rem', padding: '14px', fontSize: '1.1rem', width: '100%', justifyContent: 'center' }}>
              {loading ? "Saving..." : (
                <>
                  Save Changes
                  <Check size={20} />
                </>
              )}
            </button>

          </form>
        </div>
      </div>
      <BottomNav />
    </>
  );
}

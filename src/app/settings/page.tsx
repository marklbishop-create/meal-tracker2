"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import BottomNav from "@/components/BottomNav";
import { Check, ArrowLeft, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

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

  const [presets, setPresets] = useState<any[]>([]);
  const [newPreset, setNewPreset] = useState({ name: "", description: "", calories: "", protein: "", carbs: "", fat: "", fiber: "" });

  useEffect(() => {
    if (profile) {
      setWeight(profile.weight?.toString() || "");
      setTargetWeight(profile.goals?.targetWeight?.toString() || "");
      setCalories(profile.goals?.calories?.toString() || "");
      setProtein(profile.goals?.protein?.toString() || "");
      setCarbs(profile.goals?.carbs?.toString() || "");
      setFat(profile.goals?.fat?.toString() || "");
      setTheme(profile.theme || "dark");
      setPresets(profile.presets || []);
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
        "goals.fat": parseInt(fat) || 0,
        theme: theme,
        presets: presets,
      });
      
      toast.success("Settings updated!");
    } catch (error) {
      console.error("Error saving settings", error);
      toast.error("Failed to save settings. Please try again.");
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

            <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1rem', marginTop: '1.5rem' }}>Preset Meals</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
              {presets.map((p, i) => (
                <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--bg-secondary)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{p.name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {p.calories}kcal • {p.protein}g P • {p.carbs}g C • {p.fat}g F{p.fiber ? ` • ${p.fiber}g Fiber` : ''}
                    </div>
                  </div>
                  <button type="button" onClick={() => setPresets(presets.filter((_, idx) => idx !== i))} style={{ color: 'var(--accent-danger)', background: 'transparent', border: 'none', cursor: 'pointer' }}>
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}

              <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px dashed var(--border-color)' }}>
                <h4 style={{ marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Create New Preset</h4>
                <input type="text" className="input-field" placeholder="Meal Name (e.g. Oatmeal)" value={newPreset.name} onChange={e => setNewPreset({...newPreset, name: e.target.value})} style={{ marginBottom: '0.5rem' }} />
                <input type="text" className="input-field" placeholder="Description (Optional)" value={newPreset.description} onChange={e => setNewPreset({...newPreset, description: e.target.value})} style={{ marginBottom: '0.5rem' }} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <input type="number" className="input-field" placeholder="Calories" value={newPreset.calories} onChange={e => setNewPreset({...newPreset, calories: e.target.value})} />
                  <input type="number" className="input-field" placeholder="Protein (g)" value={newPreset.protein} onChange={e => setNewPreset({...newPreset, protein: e.target.value})} />
                  <input type="number" className="input-field" placeholder="Carbs (g)" value={newPreset.carbs} onChange={e => setNewPreset({...newPreset, carbs: e.target.value})} />
                  <input type="number" className="input-field" placeholder="Fat (g)" value={newPreset.fat} onChange={e => setNewPreset({...newPreset, fat: e.target.value})} />
                  <input type="number" className="input-field" placeholder="Fiber (g)" value={newPreset.fiber} onChange={e => setNewPreset({...newPreset, fiber: e.target.value})} style={{ gridColumn: 'span 2' }} />
                </div>
                <button type="button" className="btn-secondary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => {
                  if (!newPreset.name || !newPreset.calories) return toast.error("Name and Calories required.");
                  setPresets([...presets, { 
                    id: Date.now().toString(), 
                    name: newPreset.name, 
                    description: newPreset.description,
                    calories: parseInt(newPreset.calories) || 0, 
                    protein: parseInt(newPreset.protein) || 0, 
                    carbs: parseInt(newPreset.carbs) || 0, 
                    fat: parseInt(newPreset.fat) || 0, 
                    fiber: parseInt(newPreset.fiber) || 0 
                  }]);
                  setNewPreset({ name: "", description: "", calories: "", protein: "", carbs: "", fat: "", fiber: "" });
                }}>
                  <Plus size={18} /> Add Preset
                </button>
              </div>
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

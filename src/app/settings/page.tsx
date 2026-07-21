"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/AuthContext";
import { doc, updateDoc, collection, writeBatch, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import BottomNav from "@/components/BottomNav";
import { Check, ArrowLeft, Plus, Trash2, LogOut, FileText } from "lucide-react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";

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

  const csvInputRef = useRef<HTMLInputElement>(null);
  const [importingCsv, setImportingCsv] = useState(false);

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
        
        <header style={{ marginBottom: '2rem' }}>
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
                  <button 
                    type="button" 
                    onClick={async () => {
                      const newPresets = presets.filter((_, idx) => idx !== i);
                      setPresets(newPresets);
                      if (user) {
                        try {
                          await updateDoc(doc(db, "users", user.uid), { presets: newPresets });
                          toast.success("Preset deleted");
                        } catch (e) {
                          toast.error("Failed to delete preset");
                        }
                      }
                    }} 
                    style={{ color: 'var(--accent-danger)', background: 'transparent', border: 'none', cursor: 'pointer' }}
                  >
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

            <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '0.5rem', marginTop: '1.5rem' }}>Appearance</h3>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>App Theme</label>
              <select className="input-field" value={theme} onChange={(e) => setTheme(e.target.value)}>
                <option value="dark">Midnight Eclipse</option>
                <option value="light">Crisp Horizon</option>
                <option value="earthy">Terrane</option>
              </select>
            </div>

            <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '0.5rem', marginTop: '1.5rem' }}>Import Historical Data</h3>
            <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.75rem', lineHeight: '1.4' }}>
                Upload a CSV file of your historical meal logs (Calories, Protein, Carbs, Fats, AI Breakdown, Timestamp).
              </p>
              <input 
                type="file" 
                accept=".csv,.tsv,.txt" 
                ref={csvInputRef} 
                style={{ display: 'none' }} 
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file || !user) return;

                  setImportingCsv(true);
                  const toastId = toast.loading("Parsing CSV data...");

                  try {
                    const text = await file.text();
                    
                    // Simple CSV/TSV parser supporting quoted fields
                    const parseCSV = (str: string) => {
                      const lines: string[][] = [];
                      let currentRow: string[] = [];
                      let currentVal = '';
                      let inQuotes = false;
                      const delimiter = str.includes('\t') && (!str.includes(',') || str.indexOf('\t') < str.indexOf(',')) ? '\t' : ',';

                      for (let i = 0; i < str.length; i++) {
                        const char = str[i];
                        const nextChar = str[i + 1];

                        if (char === '"') {
                          if (inQuotes && nextChar === '"') {
                            currentVal += '"';
                            i++;
                          } else {
                            inQuotes = !inQuotes;
                          }
                        } else if (char === delimiter && !inQuotes) {
                          currentRow.push(currentVal.trim());
                          currentVal = '';
                        } else if ((char === '\r' || char === '\n') && !inQuotes) {
                          if (char === '\r' && nextChar === '\n') i++;
                          currentRow.push(currentVal.trim());
                          if (currentRow.some(cell => cell.length > 0)) lines.push(currentRow);
                          currentRow = [];
                          currentVal = '';
                        } else {
                          currentVal += char;
                        }
                      }
                      if (currentVal || currentRow.length > 0) {
                        currentRow.push(currentVal.trim());
                        if (currentRow.some(cell => cell.length > 0)) lines.push(currentRow);
                      }
                      if (lines.length < 2) return [];

                      const headers = lines[0].map(h => h.toLowerCase().trim());
                      return lines.slice(1).map(row => {
                        const obj: Record<string, string> = {};
                        headers.forEach((h, idx) => { obj[h] = row[idx] || ''; });
                        return obj;
                      });
                    };

                    const rows = parseCSV(text);

                    if (rows.length === 0) {
                      toast.error("No valid meal rows found in CSV.", { id: toastId });
                      setImportingCsv(false);
                      return;
                    }

                    toast.loading(`Importing ${rows.length} historical meals...`, { id: toastId });

                    const mealsRef = collection(db, "users", user.uid, "meals");
                    const BATCH_SIZE = 400;
                    let importedCount = 0;

                    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
                      const chunk = rows.slice(i, i + BATCH_SIZE);
                      const batch = writeBatch(db);

                      chunk.forEach(row => {
                        const rawTime = row['timestamp'] || row['date'] || row['time'] || row['createdat'];
                        const parsedDate = rawTime ? new Date(rawTime) : new Date();
                        const validDate = !isNaN(parsedDate.getTime()) ? parsedDate : new Date();

                        const foodName = row['what did you eat?'] || row['what did you eat'] || row['name'] || row['meal'] || row['meal type'] || 'Imported Meal';
                        const mealType = row['meal type'] && row['meal type'] !== foodName ? ` (${row['meal type']})` : '';

                        const newDocRef = doc(mealsRef);
                        batch.set(newDocRef, {
                          name: `${foodName}${mealType}`.trim(),
                          calories: parseInt(row['calories'] || '0') || 0,
                          protein: parseInt(row['protien'] || row['protein'] || '0') || 0,
                          carbs: parseInt(row['carbs'] || row['carbohydrates'] || '0') || 0,
                          fat: parseInt(row['fats'] || row['fat'] || '0') || 0,
                          fiber: parseInt(row['fiber'] || '0') || 0,
                          rationale: row['ai breakdown'] || row['rationale'] || row['notes'] || '',
                          createdAt: Timestamp.fromDate(validDate)
                        });
                      });

                      await batch.commit();
                      importedCount += chunk.length;
                    }

                    toast.success(`Successfully imported ${importedCount} meals!`, { id: toastId });
                    if (csvInputRef.current) csvInputRef.current.value = "";
                  } catch (err: any) {
                    console.error("CSV Import Error:", err);
                    toast.error("Failed to import CSV data.", { id: toastId });
                  } finally {
                    setImportingCsv(false);
                  }
                }} 
              />
              <button 
                type="button" 
                disabled={importingCsv} 
                className="btn-secondary" 
                style={{ width: '100%', justifyContent: 'center', gap: '8px' }} 
                onClick={() => csvInputRef.current?.click()}
              >
                <FileText size={18} />
                <span>{importingCsv ? "Importing Data..." : "Upload Historical CSV"}</span>
              </button>
            </div>

            <button type="submit" disabled={loading} className="btn-primary" style={{ marginTop: '1.5rem', padding: '14px', fontSize: '1.1rem', width: '100%', justifyContent: 'center' }}>
              {loading ? "Saving..." : (
                <>
                  Save Changes
                  <Check size={20} />
                </>
              )}
            </button>
            
            <button 
              type="button" 
              onClick={async () => {
                await signOut(auth);
                router.push('/');
              }} 
              className="btn-secondary" 
              style={{ marginTop: '1rem', padding: '14px', fontSize: '1.1rem', width: '100%', justifyContent: 'center', color: 'var(--accent-danger)' }}
            >
              Sign Out
              <LogOut size={20} />
            </button>

          </form>
        </div>
      </div>
      <BottomNav />
    </>
  );
}

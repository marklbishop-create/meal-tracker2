"use client";

import { useState, useRef, useEffect } from "react";
import BottomNav from "@/components/BottomNav";
import { Camera, Check, Upload, X, Sparkles, ImageIcon } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { format } from "date-fns";

export default function LogMeal() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'meal' | 'weight'>('meal');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [weightInput, setWeightInput] = useState("");
  const [weightDate, setWeightDate] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [weightHistory, setWeightHistory] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    const weightsRef = collection(db, "users", user.uid, "weights");
    const qWeights = query(weightsRef, orderBy("createdAt", "asc"));
    const unsubscribe = onSnapshot(qWeights, (snapshot) => {
      const wData = snapshot.docs.map(doc => {
        const data = doc.data();
        return { 
          id: doc.id, 
          weight: data.weight, 
          date: data.createdAt ? format(data.createdAt.toDate(), 'MMM d') : '' 
        };
      });
      setWeightHistory(wData);
    });
    return () => unsubscribe();
  }, [user]);

  // Form State
  const [name, setName] = useState("");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [fiber, setFiber] = useState("");
  const [rationale, setRationale] = useState("");

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = document.createElement("img");
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const MAX_DIM = 800;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_DIM) {
              height = Math.round((height * MAX_DIM) / width);
              width = MAX_DIM;
            }
          } else {
            if (height > MAX_DIM) {
              width = Math.round((width * MAX_DIM) / height);
              height = MAX_DIM;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL("image/jpeg", 0.8));
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const compressedBase64 = await compressImage(file);
      setPhotoPreview(compressedBase64);
    } catch {
      const reader = new FileReader();
      reader.onload = (event) => {
        setPhotoPreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (!photoPreview && !description) {
      toast.error("Please provide a photo or a description first.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/analyze-food', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: photoPreview, description })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setName(data.name || "");
        setCalories(data.calories?.toString() || "");
        setProtein(data.protein?.toString() || "");
        setCarbs(data.carbs?.toString() || "");
        setFat(data.fat?.toString() || "");
        setFiber(data.fiber?.toString() || "");
        setRationale(data.rationale || "");
        toast.success("AI successfully estimated your meal!");
      } else {
        toast.error(data.error || "Could not analyze. You can still enter manually.");
      }
    } catch (e) {
      toast.error("Something went wrong analyzing your meal.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveMeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setLoading(true);
    
    try {
      const mealsRef = collection(db, "users", user.uid, "meals");
      await addDoc(mealsRef, {
        name: name || description || "Unknown Meal",
        calories: parseInt(calories || "0"),
        protein: parseInt(protein || "0"),
        carbs: parseInt(carbs || "0"),
        fat: parseInt(fat || "0"),
        fiber: parseInt(fiber || "0"),
        rationale: rationale,
        photoUrl: photoPreview, 
        createdAt: serverTimestamp()
      });
      
      toast.success("Meal logged successfully!");
      router.push('/');
    } catch (e) {
      console.error(e);
      toast.error("Failed to save meal.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogWeight = async () => {
    if (!user || !weightInput) return;
    setLoading(true);
    try {
      const selectedDate = weightDate ? new Date(weightDate + 'T12:00:00') : new Date();
      await addDoc(collection(db, "users", user.uid, "weights"), {
        weight: parseFloat(weightInput),
        createdAt: Timestamp.fromDate(selectedDate)
      });
      toast.success("Weight logged successfully!");
      router.push('/history');
    } catch (e) {
      toast.error("Failed to save weight.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="container page-enter" style={{ paddingTop: '2rem', paddingBottom: '100px' }}>
        
        <header style={{ marginBottom: '2rem' }}>
          <h2 className="text-gradient" style={{ fontSize: '1.8rem' }}>Record Entry</h2>
        </header>

        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', background: 'rgba(0,0,0,0.2)', padding: '6px', borderRadius: 'var(--radius-md)' }}>
          <button 
            className={activeTab === 'meal' ? 'btn-primary' : 'btn-secondary'} 
            style={{ flex: 1, padding: '10px', justifyContent: 'center' }}
            onClick={() => setActiveTab('meal')}
          >
            Log Meal
          </button>
          <button 
            className={activeTab === 'weight' ? 'btn-primary' : 'btn-secondary'} 
            style={{ flex: 1, padding: '10px', justifyContent: 'center' }}
            onClick={() => {
              setActiveTab('weight');
              if (!weightInput) setWeightInput(profile?.weight?.toString() || "");
            }}
          >
            Log Weight
          </button>
        </div>

        {activeTab === 'meal' ? (
          <div className="glass-panel" style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
          
          {/* Input Section */}
          <div style={{ marginBottom: '2rem' }}>
            

            
            <textarea 
               className="input-field" 
               placeholder="What did you eat? (e.g. 'A bowl of oatmeal with a sliced banana and a tablespoon of peanut butter')" 
               value={description}
               onChange={(e) => setDescription(e.target.value)}
               rows={3}
               style={{ marginBottom: '1rem', resize: 'vertical' }}
            />

            <input 
              type="file" 
              accept="image/*" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              onChange={handlePhotoUpload}
            />
            <input 
              type="file" 
              accept="image/*" 
              capture="environment"
              ref={cameraInputRef} 
              style={{ display: 'none' }} 
              onChange={handlePhotoUpload}
            />
            
            {photoPreview ? (
              <div style={{ position: 'relative', display: 'inline-block', width: '100%', marginBottom: '1rem' }}>
                 <img src={photoPreview} alt="Meal Preview" style={{ width: '100%', maxHeight: '300px', objectFit: 'cover', borderRadius: 'var(--radius-md)' }} />
                 <button 
                   type="button"
                   onClick={() => setPhotoPreview(null)}
                   style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(0,0,0,0.6)', color: '#fff', borderRadius: '50%', padding: '8px' }}
                 >
                   <X size={20} />
                 </button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                <button 
                  type="button" 
                  className="btn-secondary" 
                  onClick={() => cameraInputRef.current?.click()}
                  style={{ flex: 1, padding: '16px', display: 'flex', gap: '10px', justifyContent: 'center' }}
                >
                  <Camera size={20} />
                  <span>Take Photo</span>
                </button>
                <button 
                  type="button" 
                  className="btn-secondary" 
                  onClick={() => fileInputRef.current?.click()}
                  style={{ flex: 1, padding: '16px', display: 'flex', gap: '10px', justifyContent: 'center' }}
                >
                  <ImageIcon size={20} />
                  <span>Upload Photo</span>
                </button>
              </div>
            )}
            
            <button 
               type="button" 
               onClick={handleAnalyze} 
               disabled={loading || (!photoPreview && !description)}
               className="btn-ai"
               style={{ width: '100%', padding: '16px', display: 'flex', gap: '10px', justifyContent: 'center' }}
            >
               <Sparkles size={24} />
               <span>{loading ? "Analyzing..." : "Estimate with AI"}</span>
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', margin: '1rem 0', gap: '1rem' }}>
             <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
             <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>OR</span>
             <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
          </div>

          {profile?.presets && profile.presets.length > 0 && (
            <div style={{ marginBottom: '1rem', padding: '0.85rem 1rem', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
              <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Use a Preset Meal</label>
              <select className="input-field" style={{ padding: '10px 12px' }} onChange={(e) => {
                const p = profile?.presets?.find(x => x.id === e.target.value);
                if (p) {
                  setName(p.name);
                  setDescription(p.description || "");
                  setCalories(p.calories.toString());
                  setProtein(p.protein.toString());
                  setCarbs(p.carbs.toString());
                  setFat(p.fat.toString());
                  setFiber(p.fiber?.toString() || "");
                }
              }}>
                <option value="">Select a preset...</option>
                {profile.presets.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.calories}kcal)</option>
                ))}
              </select>
            </div>
          )}
          
          <div style={{ display: 'flex', alignItems: 'center', margin: '1rem 0', gap: '1rem' }}>
             <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
             <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Estimated Results</span>
             <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
          </div>

          {/* Verification Form */}
          <form onSubmit={handleSaveMeal} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Meal Name</label>
              <input type="text" required className="input-field" value={name} onChange={(e) => setName(e.target.value)} placeholder="Auto-generated or enter manually" />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Calories (kcal)</label>
              <input type="number" required className="input-field" style={{ fontSize: '1.2rem', color: 'var(--accent-primary)', fontWeight: 'bold' }} value={calories} onChange={(e) => setCalories(e.target.value)} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Protein (g)</label>
                <input type="number" required min="0" className="input-field" value={protein} onChange={(e) => setProtein(e.target.value)} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Carbs (g)</label>
                <input type="number" required min="0" className="input-field" value={carbs} onChange={(e) => setCarbs(e.target.value)} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Fat (g)</label>
                <input type="number" required min="0" className="input-field" value={fat} onChange={(e) => setFat(e.target.value)} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Fiber (g)</label>
                <input type="number" required min="0" className="input-field" value={fiber} onChange={(e) => setFiber(e.target.value)} />
              </div>
            </div>

            {rationale && (
              <div style={{ marginTop: '0.5rem', padding: '1rem', background: 'rgba(0,0,0,0.15)', borderRadius: 'var(--radius-sm)' }}>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontStyle: 'italic', lineHeight: '1.4' }}>
                  <Sparkles size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
                  {rationale}
                </p>
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary" style={{ marginTop: '1rem', padding: '14px', fontSize: '1.1rem', justifyContent: 'center' }}>
              <Upload size={20} />
              Save Meal
            </button>
          </form>
          
        </div>
        ) : (
          <div className="glass-panel" style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
            <h3 style={{ marginBottom: '1.5rem', fontSize: '1.2rem', color: 'var(--text-secondary)' }}>Log Weight</h3>
            
            <div style={{ marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.35rem' }}>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Date</label>
              <input
                type="date"
                className="input-field"
                value={weightDate}
                onChange={(e) => setWeightDate(e.target.value)}
                style={{ width: '180px', textAlign: 'center', padding: '8px 12px' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', justifyContent: 'center', alignItems: 'center' }}>
              <input
                type="number"
                step="0.1"
                className="input-field"
                placeholder="Weight"
                value={weightInput}
                onChange={(e) => setWeightInput(e.target.value)}
                style={{ width: '150px', textAlign: 'center', fontSize: '1.5rem', padding: '1rem' }}
                autoFocus
              />
              <span style={{ fontSize: '1.2rem', color: 'var(--text-muted)' }}>lbs</span>
            </div>
            
            <button type="button" onClick={handleLogWeight} disabled={loading || !weightInput} className="btn-primary" style={{ width: '100%', padding: '14px', fontSize: '1.1rem', justifyContent: 'center' }}>
              {loading ? "Saving..." : (
                <>
                  Save Weight
                  <Check size={20} />
                </>
              )}
            </button>

            {weightHistory.length > 0 && (
              <div style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid var(--border-color)' }}>
                <h4 style={{ color: 'var(--text-primary)', marginBottom: '1.5rem', fontSize: '1.1rem' }}>Weight Trends</h4>
                <div style={{ height: 250, width: '100%' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={weightHistory}>
                      <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={12} tickMargin={10} />
                      <YAxis domain={['auto', 'auto']} stroke="var(--text-muted)" fontSize={12} width={40} />
                      <Tooltip 
                        contentStyle={{ background: 'var(--bg-secondary)', border: 'none', borderRadius: '8px', color: 'var(--text-primary)' }}
                        itemStyle={{ color: 'var(--accent-primary)' }}
                      />
                      {profile?.goals?.targetWeight && (
                        <ReferenceLine y={profile.goals.targetWeight} stroke="var(--accent-secondary)" strokeDasharray="3 3" label={{ position: 'top', value: 'Target', fill: 'var(--text-muted)' }} />
                      )}
                      <Line type="monotone" dataKey="weight" stroke="var(--accent-primary)" strokeWidth={3} dot={{ r: 4, fill: 'var(--bg-primary)', strokeWidth: 2 }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
      <BottomNav />
    </>
  );
}

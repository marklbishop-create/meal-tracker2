"use client";

import { useState, useRef } from "react";
import BottomNav from "@/components/BottomNav";
import { Camera, Check, Upload, X, Sparkles } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function LogMeal() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [description, setDescription] = useState("");

  // Form State
  const [name, setName] = useState("");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [fiber, setFiber] = useState("");

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64String = event.target?.result as string;
      setPhotoPreview(base64String);
    };
    reader.readAsDataURL(file);
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
        photoUrl: photoPreview, 
        createdAt: serverTimestamp()
      });
      
      toast.success("Meal logged successfully!");
      router.push('/history');
    } catch (e) {
      console.error(e);
      toast.error("Failed to save meal.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="container page-enter" style={{ paddingTop: '2rem', paddingBottom: '100px' }}>
        <h2 className="text-gradient" style={{ fontSize: '1.8rem', marginBottom: '1.5rem' }}>Log a Meal</h2>
        
        <div className="glass-panel" style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
          
          {/* Input Section */}
          <div style={{ marginBottom: '2rem' }}>
            
            {profile?.presets && profile.presets.length > 0 && (
              <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Use a Preset Meal</label>
                <select className="input-field" onChange={(e) => {
                  const p = profile.presets?.find(x => x.id === e.target.value);
                  if (p) {
                    setName(p.name);
                    setDescription(p.description || "");
                    setCalories(p.calories.toString());
                    setProtein(p.protein.toString());
                    setCarbs(p.carbs.toString());
                    setFat(p.fat.toString());
                    setFiber(p.fiber.toString());
                  }
                }}>
                  <option value="">Select a preset...</option>
                  {profile.presets.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.calories}kcal)</option>
                  ))}
                </select>
              </div>
            )}
            
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
              capture="environment" 
              ref={fileInputRef} 
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
              <button 
                type="button" 
                className="btn-secondary" 
                onClick={() => fileInputRef.current?.click()}
                style={{ width: '100%', padding: '16px', display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '1rem' }}
              >
                <Camera size={24} />
                <span>Add a Photo (Optional)</span>
              </button>
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

          <div style={{ display: 'flex', alignItems: 'center', margin: '2rem 0', gap: '1rem' }}>
             <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
             <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Estimated Results</span>
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

            <button type="submit" disabled={loading} className="btn-primary" style={{ marginTop: '1rem', padding: '14px', fontSize: '1.1rem', justifyContent: 'center' }}>
              <Upload size={20} />
              Save Meal
            </button>
          </form>
          
        </div>
      </div>
      <BottomNav />
    </>
  );
}

"use client";

import { useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ChevronRight, Check } from "lucide-react";

export default function Onboarding() {
  const { user, profile } = useAuth();
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Step 1 State
  const [age, setAge] = useState<string>("");
  const [gender, setGender] = useState<"male" | "female">("male");
  const [weight, setWeight] = useState<string>("");
  const [heightFeet, setHeightFeet] = useState<string>("");
  const [heightInches, setHeightInches] = useState<string>("");
  const [targetWeight, setTargetWeight] = useState<string>("");

  // Step 2 State (Goals)
  const [calories, setCalories] = useState<string>("");
  const [protein, setProtein] = useState<string>("");
  const [carbs, setCarbs] = useState<string>("");
  const [fat, setFat] = useState<string>("");
  
  const calculateGoals = () => {
    const wKg = parseFloat(weight) * 0.453592;
    const totalInches = (parseInt(heightFeet || "0") * 12) + parseInt(heightInches || "0");
    const hCm = totalInches * 2.54;
    const a = parseInt(age);
    
    // Mifflin-St Jeor BMR
    let bmr = (10 * wKg) + (6.25 * hCm) - (5 * a);
    bmr = gender === "male" ? bmr + 5 : bmr - 161;
    
    // Assuming Lightly Active multiplier
    let tdee = bmr * 1.375;
    
    // Adjust for weight loss/gain
    const currentW = parseFloat(weight);
    const targetW = parseFloat(targetWeight);
    
    if (targetW < currentW) {
      tdee -= 500; // standard deficit
    } else if (targetW > currentW) {
      tdee += 300; // surplus
    }
    
    const calcCals = Math.round(tdee);
    const calcProtein = Math.round((calcCals * 0.3) / 4);
    const calcCarbs = Math.round((calcCals * 0.35) / 4);
    const calcFat = Math.round((calcCals * 0.35) / 9);

    setCalories(calcCals.toString());
    setProtein(calcProtein.toString());
    setCarbs(calcCarbs.toString());
    setFat(calcFat.toString());
  };

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    calculateGoals();
    setStep(2);
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setLoading(true);
    
    try {
      const totalInches = (parseInt(heightFeet) * 12) + parseInt(heightInches);
      const userRef = doc(db, "users", user.uid);
      
      await updateDoc(userRef, {
        age: parseInt(age),
        gender,
        weight: parseFloat(weight),
        height: totalInches,
        setupComplete: true,
        goals: {
          calories: parseInt(calories),
          protein: parseInt(protein),
          carbs: parseInt(carbs),
          fat: parseInt(fat),
          fiber: 30, // Default fiber
          targetWeight: parseFloat(targetWeight)
        }
      });
      
    } catch (error) {
      console.error("Error saving onboarding data", error);
      alert("Failed to save data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container page-enter" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', paddingTop: '2rem' }}>
      
      <div className="glass-panel" style={{ padding: '2.5rem', maxWidth: '500px', width: '100%' }}>
        
        {step === 1 ? (
          <>
            <h2 className="text-gradient" style={{ fontSize: '2rem', marginBottom: '0.5rem', textAlign: 'center' }}>
              Welcome, {profile?.name?.split(' ')[0] || 'User'}!
            </h2>
            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '2rem' }}>
              Let's build your profile. Tell us about yourself so we can calculate your ideal macros.
            </p>
            
            <form onSubmit={handleStep1Submit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Age</label>
                  <input type="number" required min="10" max="120" className="input-field" value={age} onChange={(e) => setAge(e.target.value)} placeholder="Years" />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Biological Sex</label>
                  <select className="input-field" value={gender} onChange={(e) => setGender(e.target.value as any)}>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                 <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Height (Feet)</label>
                    <input type="number" required min="3" max="8" className="input-field" value={heightFeet} onChange={(e) => setHeightFeet(e.target.value)} placeholder="ft" />
                 </div>
                 <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Height (Inches)</label>
                    <input type="number" required min="0" max="11" className="input-field" value={heightInches} onChange={(e) => setHeightInches(e.target.value)} placeholder="in" />
                 </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Current Weight (lbs)</label>
                  <input type="number" required min="50" max="800" step="0.1" className="input-field" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="lbs" />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Target Weight (lbs)</label>
                  <input type="number" required min="50" max="800" step="0.1" className="input-field" value={targetWeight} onChange={(e) => setTargetWeight(e.target.value)} placeholder="lbs" />
                </div>
              </div>

              <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '1rem', padding: '14px', fontSize: '1.1rem' }}>
                Continue to Goals
                <ChevronRight size={20} />
              </button>
            </form>
          </>
        ) : (
          <div className="page-enter">
            <h2 className="text-gradient" style={{ fontSize: '2rem', marginBottom: '0.5rem', textAlign: 'center' }}>
              Your Recommended Goals
            </h2>
            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '2rem' }}>
              We've calculated a baseline for you. Feel free to adjust these numbers to match your preferences!
            </p>

            <form onSubmit={handleFinalSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Daily Calories (kcal)</label>
                <input type="number" required min="1000" max="10000" className="input-field" style={{ fontSize: '1.2rem', color: 'var(--accent-primary)', fontWeight: 'bold' }} value={calories} onChange={(e) => setCalories(e.target.value)} />
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

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setStep(1)} className="btn-secondary" style={{ flex: 1, padding: '14px' }}>
                  Back
                </button>
                <button type="submit" disabled={loading} className="btn-primary" style={{ flex: 2, padding: '14px', fontSize: '1.1rem' }}>
                  {loading ? "Saving..." : (
                    <>
                      Save Profile
                      <Check size={20} />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

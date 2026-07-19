"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import BottomNav from "@/components/BottomNav";
import Onboarding from "@/components/Onboarding";
import { LogOut, Plus, Settings } from "lucide-react";
import { useRouter } from "next/navigation";
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function Dashboard() {
  const { user, profile, logout } = useAuth();
  const router = useRouter();
  const [meals, setMeals] = useState<any[]>([]);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    if (!user) return;

    // Listen to today's meals
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const mealsRef = collection(db, "users", user.uid, "meals");
    const qToday = query(
      mealsRef,
      where("createdAt", ">=", today),
      where("createdAt", "<", tomorrow),
      orderBy("createdAt", "desc")
    );

    const unsubscribeToday = onSnapshot(qToday, (snapshot) => {
      const mealsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMeals(mealsData);
    });
    
    // Calculate streak (fetch all meals for prototype)
    const qAll = query(mealsRef, orderBy("createdAt", "desc"));
    const unsubscribeAll = onSnapshot(qAll, (snapshot) => {
       const dates = new Set<string>();
       snapshot.docs.forEach(doc => {
         const data = doc.data();
         if (data.createdAt) {
            // Store as YYYY-MM-DD string
            dates.add(data.createdAt.toDate().toISOString().split('T')[0]);
         }
       });
       
       let currentStreak = 0;
       const todayStr = new Date().toISOString().split('T')[0];
       const yesterdayDate = new Date();
       yesterdayDate.setDate(yesterdayDate.getDate() - 1);
       const yesterdayStr = yesterdayDate.toISOString().split('T')[0];
       
       let checkDate = new Date();
       
       if (dates.has(todayStr)) {
         // Started today
         checkDate = new Date();
       } else if (dates.has(yesterdayStr)) {
         // Hasn't logged today yet, but streak is alive
         checkDate = yesterdayDate;
       } else {
         // Streak broken
         setStreak(0);
         return;
       }
       
       while (true) {
         const dStr = checkDate.toISOString().split('T')[0];
         if (dates.has(dStr)) {
           currentStreak++;
           checkDate.setDate(checkDate.getDate() - 1);
         } else {
           break;
         }
       }
       
       setStreak(currentStreak);
    });

    return () => {
       unsubscribeToday();
       unsubscribeAll();
    };
  }, [user]);

  if (!profile?.setupComplete) {
    return <Onboarding />;
  }

  // Calculate macro progress
  const caloriesTarget = profile.goals?.calories || 2000;
  const proteinTarget = profile.goals?.protein || 150;
  const carbsTarget = profile.goals?.carbs || 200;
  const fatTarget = profile.goals?.fat || 70;
  const fiberTarget = profile.goals?.fiber || 25; // Default fiber target
  
  const calsConsumed = meals.reduce((sum, meal) => sum + (meal.calories || 0), 0);
  const proteinConsumed = meals.reduce((sum, meal) => sum + (meal.protein || 0), 0);
  const carbsConsumed = meals.reduce((sum, meal) => sum + (meal.carbs || 0), 0);
  const fatConsumed = meals.reduce((sum, meal) => sum + (meal.fat || 0), 0);
  const fiberConsumed = meals.reduce((sum, meal) => sum + (meal.fiber || 0), 0);

  return (
    <>
      <div className="container page-enter" style={{ paddingTop: '2rem', paddingBottom: '100px' }}>
        
        {/* Header */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h2 style={{ fontSize: '1.5rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              Welcome, <span className="text-gradient">{profile?.name?.split(' ')[0] || 'User'}</span>
              {streak > 0 && (
                <span style={{ fontSize: '0.9rem', background: 'rgba(255, 100, 0, 0.1)', color: '#FF6B00', padding: '4px 10px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  🔥 {streak} {streak === 1 ? 'Day' : 'Days'}
                </span>
              )}
            </h2>
            <p style={{ color: 'var(--text-muted)' }}>Ready to crush your goals today?</p>
          </div>
          
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            {profile?.photoURL ? (
               <img src={profile.photoURL} alt="Profile" style={{ width: '40px', height: '40px', borderRadius: '50%', border: '2px solid var(--accent-primary)' }} />
            ) : (
               <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
            )}
          </div>
        </header>

        {/* Main Content Area */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
          
          {/* Daily Summary */}
          <div className="glass-panel" style={{ padding: '1.5rem', gridColumn: '1 / -1' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3>Today's Overview</h3>
                <button onClick={() => router.push('/log')} className="btn-primary" style={{ padding: '8px 16px', fontSize: '0.9rem' }}>
                  <Plus size={16} />
                  Log Meal
                </button>
             </div>
             
             <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
               <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                 <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>Calories</p>
                 <h2 style={{ fontSize: '2.0rem', color: 'var(--accent-primary)' }}>{calsConsumed}</h2>
                 <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>of {caloriesTarget} kcal</p>
               </div>
               
               <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                 <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>Protein</p>
                 <h2 style={{ fontSize: '2.0rem', color: 'var(--accent-secondary)' }}>{proteinConsumed}g</h2>
                 <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>of {proteinTarget}g</p>
               </div>
             </div>

             <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
               <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                 <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '0.25rem' }}>Carbs</p>
                 <h3 style={{ fontSize: '1.25rem', color: '#ffb703' }}>{carbsConsumed}g</h3>
                 <p style={{ color: 'var(--text-secondary)', fontSize: '0.7rem' }}>of {carbsTarget}g</p>
               </div>
               <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                 <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '0.25rem' }}>Fat</p>
                 <h3 style={{ fontSize: '1.25rem', color: '#fb8500' }}>{fatConsumed}g</h3>
                 <p style={{ color: 'var(--text-secondary)', fontSize: '0.7rem' }}>of {fatTarget}g</p>
               </div>
               <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                 <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '0.25rem' }}>Fiber</p>
                 <h3 style={{ fontSize: '1.25rem', color: '#8ecae6' }}>{fiberConsumed}g</h3>
                 <p style={{ color: 'var(--text-secondary)', fontSize: '0.7rem' }}>of {fiberTarget}g</p>
               </div>
             </div>
          </div>

          {/* Meals List */}
          <div className="glass-panel" style={{ padding: '1.5rem', gridColumn: '1 / -1' }}>
            <h3 style={{ marginBottom: '1rem' }}>Today's Meals</h3>
            
            {meals.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-sm)' }}>
                  <p style={{ color: 'var(--text-muted)' }}>No meals logged yet today.</p>
               </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {meals.map(meal => (
                  <div key={meal.id} style={{ display: 'flex', gap: '1rem', padding: '1rem', background: 'rgba(0,0,0,0.1)', borderRadius: 'var(--radius-sm)', alignItems: 'center' }}>
                    {meal.photoUrl ? (
                      <img src={meal.photoUrl} alt={meal.name} style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px' }} />
                    ) : (
                      <div style={{ width: '60px', height: '60px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                         <span style={{ fontSize: '1.5rem' }}>🍽️</span>
                      </div>
                    )}
                    
                    <div style={{ flex: 1 }}>
                      <h4 style={{ fontSize: '1.0rem', marginBottom: '0.25rem' }}>{meal.name}</h4>
                      <p style={{ fontSize: '0.80rem', color: 'var(--text-secondary)' }}>
                        {meal.calories} kcal • {meal.protein}g P • {meal.carbs}g C • {meal.fat}g F • {meal.fiber || 0}g Fiber
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>
      
      <BottomNav />
    </>
  );
}

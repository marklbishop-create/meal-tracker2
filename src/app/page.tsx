"use client";

import { useAuth } from "@/lib/AuthContext";
import { LogIn, Activity, Utensils, Target } from "lucide-react";
import Dashboard from "@/components/Dashboard"; // We will create this

export default function Home() {
  const { user, loading, signInWithGoogle } = useAuth();

  if (loading) {
    return (
      <main className="container page-enter" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div className="loader" style={{ fontSize: '1.5rem', color: 'var(--text-muted)' }}>Loading...</div>
      </main>
    );
  }

  if (user) {
    return <Dashboard />;
  }

  return (
    <main className="container page-enter" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', textAlign: 'center' }}>
      
      <div style={{ marginBottom: '2rem' }}>
        <h1 className="text-gradient" style={{ fontSize: '3rem', marginBottom: '1rem' }}>MacroTracker AI</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem', maxWidth: '500px', margin: '0 auto' }}>
          Your premium, AI-powered companion for tracking nutrition, hitting goals, and staying consistent.
        </p>
      </div>

      <div className="glass-panel" style={{ padding: '2.5rem', maxWidth: '400px', width: '100%' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', textAlign: 'left' }}>
             <div style={{ background: 'rgba(0,230,118,0.1)', padding: '10px', borderRadius: '12px', color: 'var(--accent-primary)' }}>
                <Activity size={24} />
             </div>
             <div>
               <h3 style={{ fontSize: '1.1rem' }}>Smart Tracking</h3>
               <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Log meals instantly with AI photo analysis.</p>
             </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', textAlign: 'left' }}>
             <div style={{ background: 'rgba(179,136,255,0.1)', padding: '10px', borderRadius: '12px', color: 'var(--accent-secondary)' }}>
                <Target size={24} />
             </div>
             <div>
               <h3 style={{ fontSize: '1.1rem' }}>Hit Your Goals</h3>
               <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Personalized macro and calorie targets.</p>
             </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', textAlign: 'left' }}>
             <div style={{ background: 'rgba(41,121,255,0.1)', padding: '10px', borderRadius: '12px', color: 'var(--accent-blue)' }}>
                <Utensils size={24} />
             </div>
             <div>
               <h3 style={{ fontSize: '1.1rem' }}>7-Day Reviews</h3>
               <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Get AI insights on your weekly eating habits.</p>
             </div>
          </div>
        </div>

        <button onClick={signInWithGoogle} className="btn-primary" style={{ width: '100%', fontSize: '1.1rem', padding: '14px' }}>
          <LogIn size={20} />
          Continue with Google
        </button>
      </div>

    </main>
  );
}

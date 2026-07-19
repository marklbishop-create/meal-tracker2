"use client";

import { useState, useEffect, useMemo } from "react";
import BottomNav from "@/components/BottomNav";
import { useAuth } from "@/lib/AuthContext";
import { collection, query, orderBy, onSnapshot, deleteDoc, doc, addDoc, serverTimestamp, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { format, subDays, subMonths, subYears, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, getDay } from "date-fns";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, ReferenceLine, Legend } from 'recharts';
import { Sparkles, Calendar as CalendarIcon, TrendingUp, Trash2, Scale, Plus, Activity } from "lucide-react";
import toast from "react-hot-toast";

type TimeRange = '1w' | '1m' | '6m' | '1y';

export default function History() {
  const { user, profile } = useAuth();
  const [meals, setMeals] = useState<any[]>([]);
  const [weights, setWeights] = useState<any[]>([]);
  const [timeRange, setTimeRange] = useState<TimeRange>('1w');
  const [aiReview, setAiReview] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  // Interaction State
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [weightInput, setWeightInput] = useState(profile?.weight?.toString() || "");

  useEffect(() => {
    if (!user) return;
    const mealsRef = collection(db, "users", user.uid, "meals");
    const qMeals = query(mealsRef, orderBy("createdAt", "desc"));

    const unsubscribeMeals = onSnapshot(qMeals, (snapshot) => {
      const mealsData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          date: data.createdAt ? data.createdAt.toDate() : new Date()
        };
      });
      setMeals(mealsData);
    });

    const weightsRef = collection(db, "users", user.uid, "weights");
    const qWeights = query(weightsRef, orderBy("createdAt", "desc"));
    const unsubscribeWeights = onSnapshot(qWeights, (snapshot) => {
      const wData = snapshot.docs.map(doc => {
        const data = doc.data();
        return { id: doc.id, ...data, date: data.createdAt ? data.createdAt.toDate() : new Date() };
      });
      setWeights(wData);
    });

    return () => {
      unsubscribeMeals();
      unsubscribeWeights();
    };
  }, [user]);

  // Aggregate Data for Charts
  const chartData = useMemo(() => {
    const now = new Date();
    let startDate = now;
    
    if (timeRange === '1w') startDate = subDays(now, 7);
    else if (timeRange === '1m') startDate = subMonths(now, 1);
    else if (timeRange === '6m') startDate = subMonths(now, 6);
    else if (timeRange === '1y') startDate = subYears(now, 1);

    const filteredMeals = meals.filter(m => m.date >= startDate && m.date <= now);
    const filteredWeights = weights.filter(w => w.date >= startDate && w.date <= now);
    
    const dailyMap: Record<string, { calories: number, weight: number | null, protein: number, carbs: number, fat: number, fiber: number }> = {};
    
    filteredMeals.forEach(m => {
      const dayStr = format(m.date, 'MMM dd');
      if (!dailyMap[dayStr]) dailyMap[dayStr] = { calories: 0, weight: null, protein: 0, carbs: 0, fat: 0, fiber: 0 };
      dailyMap[dayStr].calories += (m.calories || 0);
      dailyMap[dayStr].protein += (m.protein || 0);
      dailyMap[dayStr].carbs += (m.carbs || 0);
      dailyMap[dayStr].fat += (m.fat || 0);
      dailyMap[dayStr].fiber += (m.fiber || 0);
    });

    filteredWeights.forEach(w => {
      const dayStr = format(w.date, 'MMM dd');
      if (!dailyMap[dayStr]) dailyMap[dayStr] = { calories: 0, weight: null, protein: 0, carbs: 0, fat: 0, fiber: 0 };
      dailyMap[dayStr].weight = w.weight;
    });

    // Backfill weight so the chart doesn't have gaps
    let lastKnownWeight = weights.length > 0 ? weights[weights.length - 1].weight : profile?.weight || 0;

    const daysInterval = eachDayOfInterval({ start: startDate, end: now });
    return daysInterval.map(d => {
      const dayStr = format(d, 'MMM dd');
      const data = dailyMap[dayStr];
      if (data?.weight) {
        lastKnownWeight = data.weight;
      }
      return {
        dateStr: dayStr,
        calories: data?.calories || 0,
        protein: data?.protein || 0,
        carbs: data?.carbs || 0,
        fat: data?.fat || 0,
        fiber: data?.fiber || 0,
        weight: lastKnownWeight
      };
    });
  }, [meals, weights, timeRange, profile]);

  // Calendar Logic
  const calendarDays = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start, end });
    const prefixDays = Array.from({ length: getDay(start) }).map(() => null);
    
    return [...prefixDays, ...days];
  }, [currentMonth]);

  const getDayMeals = (date: Date) => meals.filter(m => isSameDay(m.date, date));
  const getDayCalories = (date: Date) => getDayMeals(date).reduce((sum, m) => sum + (m.calories || 0), 0);

  const handleDeleteMeal = async (mealId: string) => {
    if (!user) return;
    if (confirm("Are you sure you want to delete this meal?")) {
      await deleteDoc(doc(db, "users", user.uid, "meals", mealId));
    }
  };

  const handleLogWeight = async () => {
    if (!user || !weightInput) return;
    try {
      await addDoc(collection(db, "users", user.uid, "weights"), {
        weight: parseFloat(weightInput),
        createdAt: serverTimestamp()
      });
      setShowWeightModal(false);
    } catch (e) {
      toast.error("Failed to save weight.");
    }
  };

  const handleGenerateReview = async () => {
    setLoadingAi(true);
    try {
      const oneWeekAgo = subDays(new Date(), 7);
      const recentMeals = meals.filter(m => m.date >= oneWeekAgo);
      const recentWeights = weights.filter(w => w.date >= oneWeekAgo);
      
      const payload = recentMeals.map(m => ({
        name: m.name,
        calories: m.calories,
        protein: m.protein,
        date: format(m.date, 'yyyy-MM-dd')
      }));

      const res = await fetch('/api/ai-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          meals: payload, 
          weights: recentWeights.map(w => w.weight),
          goals: profile?.goals 
        })
      });
      
      if (!res.ok) {
        toast.error("Failed to generate review.");
        return;
      }
      
      const data = await res.json();
      setAiReview(data.review);
    } catch (err) {
      console.error(err);
      toast.error("Error contacting AI.");
    } finally {
      setLoadingAi(false);
    }
  };

  return (
    <>
      <div className="container page-enter" style={{ paddingTop: '2rem', paddingBottom: '100px' }}>
        <h2 className="text-gradient" style={{ fontSize: '1.8rem', marginBottom: '1.5rem' }}>History & Trends</h2>

        {/* Weekly AI Review */}
        <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1.5rem', border: '1px solid var(--accent-primary)' }}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
            <div style={{ background: 'rgba(0, 102, 255, 0.1)', padding: '12px', borderRadius: '50%', color: 'var(--accent-primary)' }}>
              <Sparkles size={24} />
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ marginBottom: '0.5rem', fontSize: '1.2rem' }}>Weekly AI Review</h3>
              
              {!aiReview && (
                <>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '1rem' }}>
                    Get a personalized analysis of your eating habits over the last 7 days.
                  </p>
                  <button onClick={handleGenerateReview} disabled={loadingAi} className="btn-primary" style={{ padding: '8px 16px', fontSize: '0.9rem' }}>
                    {loadingAi ? "Generating..." : "Generate Review"}
                  </button>
                </>
              )}
              
              {aiReview && (
                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '8px', fontSize: '0.95rem', lineHeight: 1.6 }}>
                  {aiReview}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TrendingUp size={20} color="var(--accent-primary)" />
              Calorie Trends
            </h3>
            
            <div style={{ display: 'flex', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', padding: '4px' }}>
              {(['1w', '1m', '6m', '1y'] as TimeRange[]).map(tr => (
                <button
                  key={tr}
                  onClick={() => setTimeRange(tr)}
                  style={{
                    padding: '4px 12px',
                    borderRadius: '6px',
                    background: timeRange === tr ? 'var(--accent-primary)' : 'transparent',
                    color: timeRange === tr ? '#fff' : 'var(--text-muted)',
                    border: 'none',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    transition: 'var(--transition-fast)'
                  }}
                >
                  {tr.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div style={{ height: '250px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCals" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--accent-primary)" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="var(--accent-primary)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                <XAxis dataKey="dateStr" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ background: 'var(--bg-secondary)', border: 'var(--glass-border)', borderRadius: '8px' }}
                  itemStyle={{ color: 'var(--text-primary)' }}
                />
                <Area type="monotone" dataKey="calories" stroke="var(--accent-primary)" fillOpacity={1} fill="url(#colorCals)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Macro Trends */}
        <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={20} color="#ff9800" />
              Macro Trends vs Goals
            </h3>
          </div>

          <div style={{ height: '300px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                <XAxis dataKey="dateStr" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ background: 'var(--bg-secondary)', border: 'var(--glass-border)', borderRadius: '8px' }}
                  itemStyle={{ color: 'var(--text-primary)' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                
                {/* Lines */}
                <Line type="monotone" dataKey="protein" name="Protein (g)" stroke="#ff9800" strokeWidth={3} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="carbs" name="Carbs (g)" stroke="#2196f3" strokeWidth={3} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="fat" name="Fat (g)" stroke="#f44336" strokeWidth={3} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="fiber" name="Fiber (g)" stroke="#4caf50" strokeWidth={3} dot={{ r: 3 }} />
                
                {/* Goal Reference Lines */}
                {profile?.goals?.protein && <ReferenceLine y={profile.goals.protein} stroke="#ff9800" strokeDasharray="3 3" label={{ position: 'insideTopLeft', value: 'Protein Goal', fill: '#ff9800', fontSize: 10 }} />}
                {profile?.goals?.carbs && <ReferenceLine y={profile.goals.carbs} stroke="#2196f3" strokeDasharray="3 3" label={{ position: 'insideTopLeft', value: 'Carbs Goal', fill: '#2196f3', fontSize: 10 }} />}
                {profile?.goals?.fat && <ReferenceLine y={profile.goals.fat} stroke="#f44336" strokeDasharray="3 3" label={{ position: 'insideTopLeft', value: 'Fat Goal', fill: '#f44336', fontSize: 10 }} />}
                {profile?.goals?.fiber && <ReferenceLine y={profile.goals.fiber} stroke="#4caf50" strokeDasharray="3 3" label={{ position: 'insideBottomLeft', value: 'Fiber Goal', fill: '#4caf50', fontSize: 10 }} />}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Weight Trends */}
        <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Scale size={20} color="var(--accent-secondary)" />
              Weight Trends
            </h3>
            
            <button onClick={() => setShowWeightModal(true)} className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.85rem' }}>
              <Plus size={16} /> Log Weight
            </button>
          </div>

          <div style={{ height: '200px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                <XAxis dataKey="dateStr" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis domain={['dataMin - 5', 'dataMax + 5']} stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ background: 'var(--bg-secondary)', border: 'var(--glass-border)', borderRadius: '8px' }}
                  itemStyle={{ color: 'var(--text-primary)' }}
                />
                <Line type="monotone" dataKey="weight" stroke="var(--accent-secondary)" strokeWidth={3} dot={{ r: 4, fill: 'var(--accent-secondary)' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Calendar View */}
        <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CalendarIcon size={20} color="var(--accent-secondary)" />
              Calendar View
            </h3>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="btn-secondary" style={{ padding: '4px 8px' }}>&lt;</button>
              <span style={{ fontWeight: 'bold' }}>{format(currentMonth, 'MMMM yyyy')}</span>
              <button onClick={() => setCurrentMonth(subMonths(currentMonth, -1))} className="btn-secondary" style={{ padding: '4px 8px' }}>&gt;</button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px', textAlign: 'center', marginBottom: '8px' }}>
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
              <div key={d} style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 'bold' }}>{d}</div>
            ))}
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px' }}>
            {calendarDays.map((day, i) => {
              if (!day) return <div key={`empty-${i}`} />;
              
              const cals = getDayCalories(day);
              const hasLogged = cals > 0;
              const isToday = isSameDay(day, new Date());
              
              const isSelected = isSameDay(day, selectedDate);
              
              return (
                <div 
                  key={day.toISOString()} 
                  onClick={() => setSelectedDate(day)}
                  style={{ 
                    aspectRatio: '1', 
                    borderRadius: '8px', 
                    background: isSelected ? 'var(--accent-primary)' : (isToday ? 'rgba(255,255,255,0.1)' : 'transparent'),
                    border: isToday && !isSelected ? '1px solid var(--accent-primary)' : '1px solid transparent',
                    display: 'flex', 
                    flexDirection: 'column',
                    alignItems: 'center', 
                    justifyContent: 'center',
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'var(--transition-fast)'
                  }}
                >
                  <span style={{ fontSize: '0.9rem', color: isSelected ? '#fff' : (isToday ? 'var(--accent-primary)' : 'var(--text-primary)') }}>
                    {format(day, 'd')}
                  </span>
                  {hasLogged && !isSelected && (
                    <div style={{ 
                      width: '6px', 
                      height: '6px', 
                      borderRadius: '50%', 
                      background: 'var(--accent-secondary)', 
                      marginTop: '2px',
                      boxShadow: '0 0 5px var(--accent-secondary)'
                    }} />
                  )}
                  {hasLogged && isSelected && (
                    <div style={{ 
                      width: '6px', 
                      height: '6px', 
                      borderRadius: '50%', 
                      background: '#fff', 
                      marginTop: '2px'
                    }} />
                  )}
                </div>
              );
            })}
          </div>
          
          {/* Selected Date Meals */}
          <div style={{ marginTop: '2rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
            <h4 style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>
              Meals for {format(selectedDate, 'MMM do, yyyy')}
            </h4>
            
            {getDayMeals(selectedDate).length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No meals logged on this date.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {getDayMeals(selectedDate).map(meal => (
                  <div key={meal.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'rgba(0,0,0,0.1)', borderRadius: 'var(--radius-sm)' }}>
                    <div>
                      <h4 style={{ fontSize: '1.1rem', marginBottom: '0.25rem' }}>{meal.name}</h4>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        {meal.calories} kcal • {meal.protein}g P • {meal.carbs}g C • {meal.fat}g F
                      </p>
                    </div>
                    <button onClick={() => handleDeleteMeal(meal.id)} style={{ background: 'transparent', border: 'none', color: 'var(--accent-primary)', cursor: 'pointer', padding: '8px' }}>
                      <Trash2 size={20} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Weight Modal */}
      {showWeightModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
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

      <BottomNav />
    </>
  );
}

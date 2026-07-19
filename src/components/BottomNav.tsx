"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Home, PlusCircle, LineChart, Settings } from "lucide-react";

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const navItems = [
    { label: "Dashboard", path: "/", icon: Home },
    { label: "Log", path: "/log", icon: PlusCircle },
    { label: "History", path: "/history", icon: LineChart },
    { label: "Settings", path: "/settings", icon: Settings },
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
    </>
  );
}

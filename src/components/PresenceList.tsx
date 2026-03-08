"use client";

import { PresenceData } from "@/types/spreadsheet";
import { useAuth } from "@/context/AuthContext";

export function PresenceList({ collaborators }: { collaborators: PresenceData[] }) {
  const { user } = useAuth();
  
  return (
    <div className="flex items-center -space-x-2 overflow-hidden">
      {/* Current User */}
      <div 
        className="inline-block h-8 w-8 rounded-full ring-2 ring-white bg-blue-500 flex items-center justify-center text-[10px] text-white font-bold relative group cursor-default"
        title={`You (${user?.displayName})`}
      >
        {user?.photoURL ? (
          <img src={user.photoURL} alt="Me" className="h-full w-full rounded-full" />
        ) : (
          <span>{user?.displayName?.charAt(0) || "U"}</span>
        )}
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-800 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
          You ({user?.displayName})
        </div>
      </div>

      {/* Collaborators */}
      {collaborators.map((p) => (
        <div 
          key={p.userId}
          className="inline-block h-8 w-8 rounded-full ring-2 ring-white flex items-center justify-center text-[10px] text-white font-bold relative group cursor-default"
          style={{ backgroundColor: p.color }}
        >
          <span>{p.name.charAt(0)}</span>
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-800 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
            {p.name}
          </div>
        </div>
      ))}

      {collaborators.length > 5 && (
        <div className="flex items-center justify-center h-8 w-8 rounded-full ring-2 ring-white bg-slate-100 text-[10px] text-slate-500 font-bold tracking-tighter">
          +{collaborators.length - 5}
        </div>
      )}
    </div>
  );
}

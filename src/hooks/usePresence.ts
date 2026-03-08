"use client";

import { useState, useEffect } from "react";
import { 
  collection, 
  doc, 
  onSnapshot, 
  setDoc, 
  serverTimestamp, 
  deleteDoc,
  query,
  where
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { PresenceData } from "@/types/spreadsheet";
import { useAuth } from "@/context/AuthContext";

const USER_COLORS = [
  "#ef4444", "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", 
  "#ec4899", "#06b6d4", "#f97316", "#a855f7", "#14b8a6"
];

export function usePresence(docId: string) {
  const { user } = useAuth();
  const [collaborators, setCollaborators] = useState<PresenceData[]>([]);
  const [userColor] = useState(() => USER_COLORS[Math.floor(Math.random() * USER_COLORS.length)]);

  useEffect(() => {
    if (!user || !docId) return;

    const presenceRef = doc(db, "documents", docId, "presence", user.uid);
    
    // Set presence on mount
    const updatePresence = async (selection: string | null = null) => {
      await setDoc(presenceRef, {
        userId: user.uid,
        name: user.displayName || "Anonymous",
        color: userColor,
        lastActive: serverTimestamp(),
        selection: selection,
      }, { merge: true });
    };

    updatePresence();

    // Listen for others (filtering out stale sessions > 5 mins could be added here)
    const presenceColRef = collection(db, "documents", docId, "presence");
    const unsubscribe = onSnapshot(presenceColRef, (snapshot) => {
      const others = snapshot.docs
        .map(doc => doc.data() as PresenceData)
        .filter(p => p.userId !== user.uid);
      setCollaborators(others);
    });

    // Cleanup on unmount
    return () => {
      unsubscribe();
      deleteDoc(presenceRef).catch(console.error);
    };
  }, [user, docId, userColor]);

  const updateSelection = async (selection: string | null) => {
    if (!user || !docId) return;
    const presenceRef = doc(db, "documents", docId, "presence", user.uid);
    await setDoc(presenceRef, { selection, lastActive: serverTimestamp() }, { merge: true });
  };

  return { collaborators, userColor, updateSelection };
}

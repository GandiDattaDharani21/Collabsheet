"use client";

import { useAuth } from "@/context/AuthContext";
import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, deleteDoc, doc } from "firebase/firestore";
import { SpreadsheetDocument } from "@/types/spreadsheet";
import Link from "next/link";
import { Plus, FileText, Layout, LogOut, Loader2, Trash2 } from "lucide-react";

export default function Home() {
  const { user, loading, signInWithGoogle, logout } = useAuth();
  const [documents, setDocuments] = useState<SpreadsheetDocument[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, "documents"), orderBy("lastModified", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as SpreadsheetDocument[];
      setDocuments(docs);
    });

    return () => unsubscribe();
  }, [user]);

  const handleCreateDocument = async () => {
    if (!user) return;
    setIsCreating(true);
    try {
      await addDoc(collection(db, "documents"), {
        title: "Untitled Spreadsheet",
        author: user.displayName || "Anonymous",
        authorId: user.uid,
        lastModifiedBy: user.displayName || "Anonymous",
        lastModified: serverTimestamp(),
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error creating document", error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteDocument = async (e: React.MouseEvent, docId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!docId || !confirm("Are you sure you want to delete this spreadsheet? This action cannot be undone.")) return;

    try {
      await deleteDoc(doc(db, "documents", docId));
    } catch (error) {
      console.error("Error deleting document", error);
      alert("Failed to delete document. You might not have permission.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border border-slate-200">
          <div className="bg-blue-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-200">
            <Layout className="text-white w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">CollabSheet</h1>
          <p className="text-slate-600 mb-8 text-balance">
            Real-time collaborative spreadsheets for your team. Clean, fast, and secure.
          </p>
          <button
            onClick={signInWithGoogle}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-slate-50 text-slate-700 font-semibold py-3 px-4 rounded-xl border-2 border-slate-200 transition-all active:scale-95 shadow-sm"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
            Sign in with Google
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 p-1.5 rounded-lg">
            <Layout className="text-white w-5 h-5" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">CollabSheet</h1>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-full border border-slate-200">
            {user.photoURL ? (
              <img src={user.photoURL} alt={user.displayName || ""} className="w-6 h-6 rounded-full border border-white" />
            ) : (
              <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-[10px] text-white font-bold">
                {user.displayName?.charAt(0) || "U"}
              </div>
            )}
            <span className="text-sm font-medium text-slate-700 max-w-[120px] truncate">
              {user.displayName}
            </span>
          </div>
          <button 
            onClick={logout}
            className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Logout"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Your Spreadsheets</h2>
            <p className="text-slate-500">Manage and create your collaborative documents</p>
          </div>
          <button
            onClick={handleCreateDocument}
            disabled={isCreating}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-2.5 px-6 rounded-xl transition-all shadow-md shadow-blue-200 active:scale-95"
          >
            {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-5 h-5" />}
            New Spreadsheet
          </button>
        </div>

        {documents.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-slate-200 rounded-2xl py-20 flex flex-col items-center justify-center text-center">
            <div className="bg-slate-50 p-4 rounded-full mb-4">
              <FileText className="w-10 h-10 text-slate-300" />
            </div>
            <p className="text-slate-500 text-lg mb-4">No spreadsheets yet. Create one to get started!</p>
            <button
              onClick={handleCreateDocument}
              className="text-blue-600 font-semibold hover:underline"
            >
              Create your first document
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {documents.map((doc) => (
              <Link 
                key={doc.id} 
                href={`/editor/${doc.id}`}
                className="group bg-white border border-slate-200 rounded-2xl p-6 hover:border-blue-500 transition-all hover:shadow-xl hover:shadow-blue-500/5 relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-1 bg-transparent group-hover:bg-blue-600 h-full transition-colors" />
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-blue-50 rounded-xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <Layout className="w-6 h-6" />
                  </div>
                  <button
                    onClick={(e) => handleDeleteDocument(e, doc.id)}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100 z-20"
                    title="Delete Spreadsheet"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate mb-1">
                  {doc.title}
                </h3>
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    Author: <span className="text-slate-700 font-medium">{doc.author}</span>
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Last modified: {doc.lastModified?.toDate()?.toLocaleDateString() || "Just now"}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
      
      <footer className="py-8 text-center text-slate-400 text-xs border-t border-slate-200 mt-auto bg-white/50 backdrop-blur-sm">
        CollabSheet &copy; 2026 • Production Quality Spreadsheet Engine
      </footer>
    </div>
  );
}

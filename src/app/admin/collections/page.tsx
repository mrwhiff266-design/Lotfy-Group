"use client";

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Plus, Trash, Folder, Pencil, X } from "lucide-react";

interface Collection {
  _id: string;
  name: string;
  slug: string;
  description: string;
}

export default function CollectionsPage() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    fetchCollections();
  }, []);

  const fetchCollections = async () => {
    try {
      const res = await fetch('/api/collections');
      if (res.ok) {
        const data = await res.json();
        setCollections(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateOrUpdate = async () => {
    if (!newCollectionName.trim()) return;
    setLoading(true);

    try {
      if (editingId) {
        // Update (PUT)
        const res = await fetch(`/api/collections/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: newCollectionName }),
        });
        if (res.ok) {
          setNewCollectionName('');
          setEditingId(null);
          fetchCollections();
        } else {
          alert("Failed to update collection");
        }
      } else {
        // Create (POST)
        const res = await fetch('/api/collections', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: newCollectionName }),
        });
        if (res.ok) {
          setNewCollectionName('');
          fetchCollections();
        } else {
          const err = await res.json();
          alert(err.error || "Failed to create collection");
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (c: Collection) => {
    setNewCollectionName(c.name);
    setEditingId(c._id);
  };
  
  const handleCancelEdit = () => {
    setNewCollectionName('');
    setEditingId(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure? This will delete the collection (but not products in it).")) return;
    try {
      // Using DELETE method on the API route (I need to add this route too)
      await fetch(`/api/collections/${id}`, { method: 'DELETE' });
      fetchCollections();
    } catch (e) { console.error(e); }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Manage Collections</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Create Form */}
        <Card>
          <CardHeader>
            <CardTitle>Create New Collection</CardTitle>
            <CardDescription>Enter a name (e.g., "Summer 2026")</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input 
                placeholder={editingId ? "Edit Collection Name" : "Collection Name"} 
                value={newCollectionName} 
                onChange={(e) => setNewCollectionName(e.target.value)} 
                onKeyDown={(e) => e.key === 'Enter' && handleCreateOrUpdate()}
              />
              <Button onClick={handleCreateOrUpdate} disabled={loading}>
                {editingId ? <Pencil className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                {editingId ? "Update" : "Add"}
              </Button>
              {editingId && (
                <Button variant="ghost" size="icon" onClick={handleCancelEdit}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Existing Collections List */}
        <Card>
          <CardHeader>
            <CardTitle>Existing Collections ({collections.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 max-h-[400px] overflow-y-auto">
            {collections.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">No collections yet.</p>
            ) : (
              collections.map((c) => (
                <div key={c._id} className={`flex items-center justify-between p-3 border rounded-lg ${editingId === c._id ? 'bg-blue-50 border-blue-200' : 'bg-slate-50'}`}>
                  <div className="flex items-center gap-3">
                    <Folder className={`h-4 w-4 ${editingId === c._id ? 'text-blue-500' : 'text-slate-400'}`} />
                    <div>
                      <p className="font-medium text-sm">{c.name}</p>
                      <p className="text-xs text-slate-500 font-mono">/{c.slug}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(c)} className="text-slate-500 hover:text-blue-600 h-8 w-8">
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(c._id)} className="text-slate-500 hover:text-red-600 h-8 w-8 hover:bg-red-50">
                      <Trash className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

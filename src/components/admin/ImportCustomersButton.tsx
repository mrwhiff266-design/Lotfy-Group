"use client";

import React, { useRef, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Upload, Download, Loader2, CheckCircle, AlertTriangle } from "lucide-react";
import Papa from "papaparse";
import { useRouter } from 'next/navigation';

export default function ImportCustomersButton() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<null | { success: number; errors: string[] }>(null);

  const downloadTemplate = () => {
    const csvContent = "name,email,phone,companyName,status\nAhmed Ali,ahmed@example.com,01234567890,Tech Corp,Approved";
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "customers_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setStatus(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results: { data: unknown[] }) => {
        try {
          const res = await fetch('/api/admin/customers/import', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ customers: results.data }),
          });
          
          const data = await res.json();
          setStatus(data);
          
          if (data.success > 0) {
            router.refresh();
            // Force reload list if needed, or dispatch event
            window.location.reload(); 
          }
        } catch (error) {
          console.error("Import failed", error);
          setStatus({ success: 0, errors: ["Network error"] });
        } finally {
          setLoading(false);
          if (fileInputRef.current) fileInputRef.current.value = ""; 
        }
      },
      error: (err: Error) => {
        console.error("CSV Parse Error", err);
        setLoading(false);
        alert("Failed to read CSV.");
      }
    });
  };

  return (
    <div className="flex gap-2 items-center">
      <input type="file" accept=".csv" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />

      <Button variant="outline" onClick={downloadTemplate} title="Download Template">
        <Download className="mr-2 h-4 w-4" /> Template
      </Button>
      
      <Button 
        variant="outline" 
        onClick={() => fileInputRef.current?.click()} 
        disabled={loading}
        className="bg-white hover:bg-slate-50 border-slate-300"
      >
        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
        Import CSV
      </Button>

      {status && (
        <div className="fixed bottom-4 right-4 bg-white border shadow-lg p-4 rounded-md z-50 max-w-sm animate-in slide-in-from-bottom-2">
          <div className="flex items-center gap-2 mb-2">
            {status.errors.length === 0 ? <CheckCircle className="text-green-500 h-5 w-5" /> : <AlertTriangle className="text-amber-500 h-5 w-5" />}
            <span className="font-bold text-sm">Import Complete</span>
            <button onClick={() => setStatus(null)} className="ml-auto text-slate-400 hover:text-slate-600">×</button>
          </div>
          <p className="text-sm text-slate-600 mb-1">
            Added: <span className="font-bold text-green-600">{status.success}</span> customers.
          </p>
          {status.errors.length > 0 && (
            <div className="mt-2 pt-2 border-t max-h-32 overflow-y-auto">
              <p className="text-xs font-bold text-red-500 mb-1">Errors:</p>
              <ul className="list-disc pl-4 space-y-1">
                {status.errors.map((err, i) => <li key={i} className="text-xs text-slate-500">{err}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

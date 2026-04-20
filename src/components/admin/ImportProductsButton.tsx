"use client";

import React, { useRef, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Upload, Download, Loader2, CheckCircle, AlertTriangle, FileDown } from "lucide-react";
import Papa from "papaparse";
import { useRouter } from 'next/navigation';

export default function ImportProductsButton() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [status, setStatus] = useState<null | { success: number; updated?: number; created?: number; errors: string[] }>(null);

  // --- 1. Download Template ---
  const downloadTemplate = () => {
    const csvContent = "name,sku,price,stock,category,description,imageUrl,feature1,feature2,feature3,feature4\nExample Product,EX-001,150.00,10,Electronics,Description here,https://example.com/image.jpg,Wireless,2 Year Warranty,RGB Lighting,Long Battery Life";
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "products_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- 2. Export Products ---
  const exportProducts = async () => {
    setExporting(true);
    try {
      const res = await fetch('/api/products');
      if (!res.ok) throw new Error("Failed to fetch data");
      const products = await res.json();

      if (products.length === 0) {
        alert("No products to export.");
        setExporting(false);
        return;
      }

      // Convert to flat object for CSV (handle features array)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const flattenedData = products.map((p: any) => {
        const { _id, createdAt, updatedAt, __v, features, ...rest } = p; // Remove DB fields
        
        // Flatten features into feature1, feature2...
        const featureCols: Record<string, string> = {};
        if (Array.isArray(features)) {
          features.forEach((f, i) => {
            featureCols[`feature${i + 1}`] = f;
          });
        }

        return { ...rest, ...featureCols };
      });

      const csv = Papa.unparse(flattenedData);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `products_export_${new Date().toISOString().slice(0,10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

    } catch (error) {
      console.error("Export failed", error);
      alert("Failed to export products.");
    } finally {
      setExporting(false);
    }
  };

  // --- 3. Handle File Upload (Import) ---
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
          const res = await fetch('/api/products/import', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ products: results.data }),
          });
          
          const data = await res.json();
          setStatus(data);
          
          if (data.success > 0) {
            router.refresh(); 
          }
        } catch (error) {
          console.error("Import failed", error);
          setStatus({ success: 0, errors: ["Network error or server crash."] });
        } finally {
          setLoading(false);
          if (fileInputRef.current) fileInputRef.current.value = ""; 
        }
      },
      error: (err: Error) => {
        console.error("CSV Parse Error", err);
        setLoading(false);
        alert("Failed to read CSV file.");
      }
    });
  };

  return (
    <div className="flex gap-2 items-center">
      {/* Hidden File Input */}
      <input 
        type="file" 
        accept=".csv" 
        ref={fileInputRef} 
        onChange={handleFileUpload} 
        className="hidden" 
      />

      {/* Button Group */}
      <div className="flex gap-2">
        <Button variant="outline" onClick={downloadTemplate} title="Download Empty Template">
          <Download className="mr-2 h-4 w-4" /> Template
        </Button>

        <Button variant="outline" onClick={exportProducts} disabled={exporting}>
          {exporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileDown className="mr-2 h-4 w-4" />}
          Export All
        </Button>
        
        <Button 
          variant="outline" 
          onClick={() => fileInputRef.current?.click()} 
          disabled={loading}
          className="bg-white hover:bg-slate-50 border-slate-300"
        >
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
          Import / Update
        </Button>
      </div>

      {/* Status Message (Temporary Popup) */}
      {status && (
        <div className="fixed bottom-4 right-4 bg-white border shadow-lg p-4 rounded-md z-50 max-w-sm animate-in slide-in-from-bottom-2">
          <div className="flex items-center gap-2 mb-2">
            {status.errors.length === 0 ? (
               <CheckCircle className="text-green-500 h-5 w-5" />
            ) : (
               <AlertTriangle className="text-amber-500 h-5 w-5" />
            )}
            <span className="font-bold text-sm">Import Complete</span>
            <button onClick={() => setStatus(null)} className="ml-auto text-slate-400 hover:text-slate-600">×</button>
          </div>
          
          <div className="text-sm text-slate-600 mb-1 space-y-1">
            <p>Total Processed: <span className="font-bold">{status.success}</span></p>
            {status.created !== undefined && <p className="text-xs text-green-600">New: {status.created}</p>}
            {status.updated !== undefined && <p className="text-xs text-blue-600">Updated: {status.updated}</p>}
          </div>
          
          {status.errors.length > 0 && (
            <div className="mt-2 pt-2 border-t max-h-32 overflow-y-auto">
              <p className="text-xs font-bold text-red-500 mb-1">Errors ({status.errors.length}):</p>
              <ul className="list-disc pl-4 space-y-1">
                {status.errors.map((err, i) => (
                  <li key={i} className="text-xs text-slate-500">{err}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

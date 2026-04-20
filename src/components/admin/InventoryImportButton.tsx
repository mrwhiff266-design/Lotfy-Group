"use client";

import React, { useRef, useState } from 'react';
import Papa from 'papaparse';
import { Button } from "@/components/ui/button";
import { Download, FileDown, Loader2, Upload, CheckCircle, AlertTriangle } from "lucide-react";

interface ProductRow {
  sku: string;
  name: string;
  stock: number;
}

interface ImportStatus {
  success: number;
  updated: number;
  unchanged: number;
  errors: string[];
}

interface InventoryImportButtonProps {
  products: ProductRow[];
  onComplete?: () => void | Promise<void>;
}

export default function InventoryImportButton({ products, onComplete }: InventoryImportButtonProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [status, setStatus] = useState<ImportStatus | null>(null);

  const downloadTemplate = () => {
    const csvContent = "sku,quantity,reason,note\nEX-001,25,Correction,April count";
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'inventory_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportInventory = async () => {
    setExporting(true);
    try {
      if (products.length === 0) {
        alert('No inventory records to export.');
        return;
      }

      const csv = Papa.unparse(
        products.map((product) => ({
          sku: product.sku,
          name: product.name,
          quantity: product.stock,
        }))
      );

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `inventory_export_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } finally {
      setExporting(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setStatus(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const adminUser = localStorage.getItem('adminUser') || 'Bulk Import';
          const res = await fetch('/api/inventory/import', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ rows: results.data, adminUser }),
          });

          const data = await res.json();
          setStatus(data);

          if (data.updated > 0 && onComplete) {
            await onComplete();
          }
        } catch (error) {
          console.error('Inventory import failed', error);
          setStatus({ success: 0, updated: 0, unchanged: 0, errors: ['Network error or server crash.'] });
        } finally {
          setLoading(false);
          if (fileInputRef.current) fileInputRef.current.value = '';
        }
      },
      error: (error) => {
        console.error('CSV parse error', error);
        setLoading(false);
        alert('Failed to read CSV file.');
      },
    });
  };

  return (
    <div className="flex gap-2 items-center">
      <input
        type="file"
        accept=".csv"
        ref={fileInputRef}
        onChange={handleFileUpload}
        className="hidden"
      />

      <Button variant="outline" onClick={downloadTemplate}>
        <Download className="mr-2 h-4 w-4" /> Template
      </Button>

      <Button variant="outline" onClick={exportInventory} disabled={exporting}>
        {exporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileDown className="mr-2 h-4 w-4" />}
        Export
      </Button>

      <Button
        variant="outline"
        onClick={() => fileInputRef.current?.click()}
        disabled={loading}
        className="bg-white hover:bg-slate-50 border-slate-300"
      >
        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
        Import Excel CSV
      </Button>

      {status && (
        <div className="fixed bottom-4 right-4 bg-white border shadow-lg p-4 rounded-md z-50 max-w-sm animate-in slide-in-from-bottom-2">
          <div className="flex items-center gap-2 mb-2">
            {status.errors.length === 0 ? (
              <CheckCircle className="text-green-500 h-5 w-5" />
            ) : (
              <AlertTriangle className="text-amber-500 h-5 w-5" />
            )}
            <span className="font-bold text-sm">Inventory Import Complete</span>
            <button onClick={() => setStatus(null)} className="ml-auto text-slate-400 hover:text-slate-600">x</button>
          </div>

          <div className="text-sm text-slate-600 mb-1 space-y-1">
            <p>Processed: <span className="font-bold">{status.success}</span></p>
            <p className="text-xs text-blue-600">Updated: {status.updated}</p>
            <p className="text-xs text-slate-500">Unchanged: {status.unchanged}</p>
          </div>

          {status.errors.length > 0 && (
            <div className="mt-2 pt-2 border-t max-h-32 overflow-y-auto">
              <p className="text-xs font-bold text-red-500 mb-1">Errors ({status.errors.length}):</p>
              <ul className="list-disc pl-4 space-y-1">
                {status.errors.map((error, index) => (
                  <li key={index} className="text-xs text-slate-500">{error}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

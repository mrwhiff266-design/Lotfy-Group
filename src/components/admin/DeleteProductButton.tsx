"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { usePermission } from '@/lib/permissions';

interface DeleteProductButtonProps {
  id: string;
}

export default function DeleteProductButton({ id }: DeleteProductButtonProps) {
  const router = useRouter();
  const [canDelete, setCanDelete] = useState(false);

  useEffect(() => {
    // Check permissions only on client side to avoid hydration mismatch
    setCanDelete(usePermission('products', 'delete'));
  }, []);

  if (!canDelete) return null;

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this product?")) return;

    try {
      const res = await fetch(`/api/products/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        alert("Product deleted successfully");
        router.refresh();
      } else {
        alert("Failed to delete product");
      }
    } catch (error) {
      console.error(error);
      alert("Error deleting product");
    }
  };

  return (
    <Button variant="ghost" size="icon" className="text-red-500 hover:bg-red-50" onClick={handleDelete}>
      <Trash2 className="h-4 w-4" />
    </Button>
  );
}
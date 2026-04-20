"use client";

import React, { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { useRouter } from 'next/navigation';
import { usePermission } from '@/lib/permissions';

interface DeleteOrderButtonProps {
  orderId: string;
}

export default function DeleteOrderButton({ orderId }: DeleteOrderButtonProps) {
  const router = useRouter();
  const [canDelete, setCanDelete] = useState(false);

  useEffect(() => {
    // Check permissions only on client side to avoid hydration mismatch
    setCanDelete(usePermission('orders', 'delete'));
  }, []);

  if (!canDelete) return null;

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to permanently delete this order?")) return;

    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        router.refresh();
        alert("Order successfully deleted.");
      } else {
        const errorData = await response.json();
        alert(`Failed to delete: ${errorData.error}`);
      }
    } catch (error) {
      alert("Network error");
    }
  };

  return (
    <Button 
      variant="ghost" 
      size="icon" 
      className="text-red-500 hover:bg-red-50" 
      onClick={handleDelete}
      title="Delete Order"
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  );
}
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2, UserPlus, Shield, Save } from "lucide-react";
import { useRouter } from "next/navigation";

// Define the permissions structure
const defaultPermissions = {
  products: { view: false, create: false, edit: false, delete: false },
  inventory: { view: false, create: false, edit: false, delete: false }, // NEW
  orders: { view: false, create: false, edit: false, delete: false },
  customers: { view: false, create: false, edit: false, delete: false },
  team: { view: false, create: false, edit: false, delete: false },
  settings: { view: false, create: false, edit: false, delete: false },
};

type Permissions = typeof defaultPermissions;

type AdminUser = {
  _id: string;
  name: string;
  username: string;
  role: string;
  permissions?: Permissions;
  active: boolean;
};

export default function TeamPage() {
  const router = useRouter();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [formData, setFormData] = useState({ 
    name: "", 
    username: "", 
    password: "", 
    role: "Custom" 
  });
  
  // State for the checkboxes
  const [permissions, setPermissions] = useState<Permissions>(defaultPermissions);
  
  const [loading, setLoading] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/admin/team");
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (error) {
      console.error("Failed to fetch users", error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePermissionChange = (section: keyof Permissions, action: 'view' | 'create' | 'edit' | 'delete') => {
    setPermissions(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [action]: !prev[section][action]
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      ...formData,
      permissions: formData.role === 'SuperAdmin' ? undefined : permissions // Only send perms if not SuperAdmin
    };

    try {
      const url = editingUser ? `/api/admin/team/${editingUser._id}` : "/api/admin/team";
      const method = editingUser ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        await fetchUsers();
        resetForm();
        alert(editingUser ? "User updated!" : "User created!");
      } else {
        const data = await res.json();
        alert(data.error || "Operation failed");
      }
    } catch (error) {
      console.error("Error submitting user:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user: AdminUser) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      username: user.username,
      password: "", 
      role: user.role === 'SuperAdmin' ? 'SuperAdmin' : 'Custom'
    });
    
    // Merge with defaults to ensure new keys (like inventory) exist
    const mergedPermissions = { ...defaultPermissions, ...(user.permissions || {}) };
    setPermissions(mergedPermissions);
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    try {
      const res = await fetch(`/api/admin/team/${id}`, { method: "DELETE" });
      if (res.ok) {
        setUsers(users.filter((user) => user._id !== id));
      } else {
        alert("Failed to delete user");
      }
    } catch (error) {
      console.error("Error deleting user:", error);
    }
  };

  const resetForm = () => {
    setEditingUser(null);
    setFormData({ name: "", username: "", password: "", role: "Custom" });
    setPermissions(defaultPermissions);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Team Management</h1>
        {editingUser && (
          <Button variant="outline" onClick={resetForm}>Cancel Edit</Button>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Form Card */}
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {editingUser ? <Save className="h-5 w-5" /> : <UserPlus className="h-5 w-5" />}
              {editingUser ? "Edit User" : "Add New User"}
            </CardTitle>
            <CardDescription>
              Create accounts with custom permissions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Basic Info */}
              <div className="grid gap-2">
                <Label>Full Name</Label>
                <Input name="name" value={formData.name} onChange={handleInputChange} required />
              </div>
              <div className="grid gap-2">
                <Label>Username</Label>
                <Input name="username" value={formData.username} onChange={handleInputChange} required disabled={!!editingUser} />
              </div>
              <div className="grid gap-2">
                <Label>Password {editingUser && "(Leave blank to keep current)"}</Label>
                <Input name="password" type="password" value={formData.password} onChange={handleInputChange} required={!editingUser} />
              </div>
              
              {/* Role Selection */}
              <div className="grid gap-2">
                <Label>Role Type</Label>
                <select
                  name="role"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={formData.role}
                  onChange={handleInputChange}
                >
                  <option value="Custom">Custom Permissions</option>
                  <option value="SuperAdmin">Super Admin (Full Access)</option>
                </select>
              </div>

              {/* PERMISSIONS MATRIX */}
              {formData.role === 'Custom' && (
                <div className="mt-4 border rounded-md p-4 bg-slate-50">
                  <h3 className="font-semibold mb-3 text-sm">Access Control</h3>
                  <div className="space-y-3">
                    {Object.keys(permissions).map((section) => (
                      <div key={section} className="flex items-center justify-between border-b pb-2 last:border-0">
                        <span className="capitalize text-sm font-medium w-24">{section}</span>
                        <div className="flex gap-4">
                          {['view', 'create', 'edit', 'delete'].map((action) => (
                            <label key={action} className="flex items-center gap-1 cursor-pointer">
                              <Checkbox 
                                checked={(permissions as any)[section]?.[action]}
                                onCheckedChange={() => handlePermissionChange(section as keyof Permissions, action as any)}
                              />
                              <span className="text-xs capitalize text-slate-600">{action}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Button type="submit" className="w-full bg-slate-900 text-white" disabled={loading}>
                {loading ? "Saving..." : (editingUser ? "Update User" : "Create User")}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* User List */}
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Access</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user._id}>
                    <TableCell>
                      <div className="font-medium">{user.name}</div>
                      <div className="text-xs text-muted-foreground">{user.username}</div>
                    </TableCell>
                    <TableCell>
                      {user.role === 'SuperAdmin' ? (
                        <span className="inline-flex items-center rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-800">
                          Super Admin
                        </span>
                      ) : (
                        <span className="text-xs text-slate-500">Custom Role</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(user)}>
                        Edit
                      </Button>
                      <Button variant="ghost" size="sm" className="text-red-600" onClick={() => handleDelete(user._id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
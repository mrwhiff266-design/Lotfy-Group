// Helper to check permissions on the client side
export const usePermission = (section: string, action: 'view' | 'create' | 'edit' | 'delete') => {
  if (typeof window === 'undefined') return false;
  
  try {
    const role = localStorage.getItem('adminRole');
    if (role === 'SuperAdmin') return true; // SuperAdmin bypasses all checks

    const permissions = JSON.parse(localStorage.getItem('adminPermissions') || '{}');
    return permissions[section]?.[action] === true;
  } catch (e) {
    return false;
  }
};
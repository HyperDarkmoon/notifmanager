// Debug utility to check current user details
export const debugCurrentUser = () => {
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  
  if (!user) {
    console.log('No user found in localStorage');
    return null;
  }
  
  console.log('Current user details:', {
    username: user.username,
    role: user.role,
    // Don't log password for security
    hasPassword: !!user.password
  });
  
  return user;
};

// Check if user is admin
export const isCurrentUserAdmin = () => {
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  return user && (user.role === 'ADMIN' || user.role === 'admin');
};

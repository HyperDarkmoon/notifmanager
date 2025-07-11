// Debug utility for API calls
export const debugApiCall = async (url, options = {}) => {
  const user = JSON.parse(localStorage.getItem('user'));
  
  console.log('Debug API Call:', {
    url,
    user: user ? { username: user.username, hasPassword: !!user.password } : null,
    options
  });
  
  if (!user) {
    console.error('No user found for API call');
    return null;
  }
  
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Basic ${btoa(`${user.username}:${user.password}`)}`,
    ...options.headers
  };
  
  try {
    const response = await fetch(url, {
      ...options,
      headers
    });
    
    console.log('API Response:', {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries())
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error Response:', errorText);
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    
    const data = await response.json();
    console.log('API Success Response:', data);
    return data;
  } catch (error) {
    console.error('API Call Failed:', error);
    throw error;
  }
};

// Event ID validation
export const validateEventId = (eventId) => {
  if (!eventId || typeof eventId !== 'string') {
    return { valid: false, error: 'Event ID is required' };
  }

  if (eventId.length < 6) {
    return { valid: false, error: 'Event ID must be at least 6 characters' };
  }

  // Allow alphanumeric and hyphens
  const validPattern = /^[a-zA-Z0-9-]+$/;
  if (!validPattern.test(eventId)) {
    return { valid: false, error: 'Event ID can only contain letters, numbers, and hyphens' };
  }

  return { valid: true };
};

// Display name validation
export const validateDisplayName = (name) => {
  if (!name || typeof name !== 'string') {
    return { valid: false, error: 'Display name is required' };
  }

  const trimmed = name.trim();
  
  if (trimmed.length < 2) {
    return { valid: false, error: 'Display name must be at least 2 characters' };
  }

  if (trimmed.length > 50) {
    return { valid: false, error: 'Display name must be less than 50 characters' };
  }

  return { valid: true, value: trimmed };
};

// Email validation
export const validateEmail = (email) => {
  if (!email || typeof email !== 'string') {
    return { valid: false, error: 'Email is required' };
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email)) {
    return { valid: false, error: 'Invalid email format' };
  }

  return { valid: true };
};

// Sanitize text input (prevent XSS)
export const sanitizeText = (text) => {
  if (!text) return '';
  
  return text
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

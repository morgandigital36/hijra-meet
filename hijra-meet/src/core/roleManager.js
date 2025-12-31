// Role Manager with persistent host identity

export const roleManager = {
  // Get host ID from localStorage
  getHostId: () => {
    return localStorage.getItem('hijra_host_id');
  },

  // Set host ID
  setHostId: (hostId) => {
    localStorage.setItem('hijra_host_id', hostId);
  },

  // Get host name
  getHostName: () => {
    return localStorage.getItem('hijra_host_name');
  },

  // Set host name
  setHostName: (name) => {
    localStorage.setItem('hijra_host_name', name);
  },

  // Determine role based on URL and save to localStorage
  setRoleFromUrl: () => {
    const isHost = window.location.pathname.includes('/host');
    const role = isHost ? 'host' : 'participant';
    localStorage.setItem('user_role', role);
    return role;
  },

  // Set role explicitly
  setRole: (role) => {
    localStorage.setItem('user_role', role);
  },

  // Get current role from localStorage
  getRole: () => {
    return localStorage.getItem('user_role') || 'participant';
  },

  // Check if current user is host
  isHost: () => {
    return roleManager.getRole() === 'host';
  },

  // Check if current user is the owner of an event
  isEventOwner: (eventHostId) => {
    const currentHostId = roleManager.getHostId();
    return currentHostId && currentHostId === eventHostId;
  },

  // Clear host identity (logout)
  clearIdentity: () => {
    localStorage.removeItem('user_role');
    // Don't clear host_id and host_name to maintain identity
  },

  // Get participant name (for non-host)
  getParticipantName: () => {
    return sessionStorage.getItem('hijra_participant_name');
  },

  // Set participant name (for non-host, session-only)
  setParticipantName: (name) => {
    sessionStorage.setItem('hijra_participant_name', name);
  },

  // Get display name (host or participant)
  getDisplayName: () => {
    if (roleManager.isHost()) {
      return roleManager.getHostName();
    }
    return roleManager.getParticipantName();
  }
};

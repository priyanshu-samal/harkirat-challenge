export const state = {
  activeSession: null
};

// Helper to reset session
export const resetSession = () => {
  state.activeSession = null;
};

// Helper to start session
export const startSession = (classId) => {
  state.activeSession = {
    classId,
    startedAt: new Date().toISOString(),
    attendance: {}
  };
  return state.activeSession;
};

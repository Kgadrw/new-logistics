// Utility functions for generating IDs (matching frontend)

export const makeId = () => {
  return Math.random().toString(36).substring(2, 9);
};

export const makeShipmentId = () => {
  const num = Math.floor(Math.random() * 9000) + 1000;
  return `SH-${num}`;
};

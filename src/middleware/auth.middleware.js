// Authentication middleware (to be implemented)
export const authenticate = (req, res, next) => {
  // TODO: Implement JWT token verification
  // For now, allow all requests
  next();
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    // TODO: Implement role-based authorization
    // For now, allow all requests
    next();
  };
};

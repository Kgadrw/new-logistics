// Type definitions matching frontend types

export const Role = {
  CLIENT: 'client',
  WAREHOUSE: 'warehouse',
  ADMIN: 'admin'
};

export const ShipmentStatus = {
  DRAFT: 'Draft',
  SUBMITTED: 'Submitted',
  RECEIVED: 'Received',
  LEFT_WAREHOUSE: 'Left Warehouse',
  IN_TRANSIT: 'In Transit',
  DELIVERED: 'Delivered'
};

export const TransportMethod = {
  TRUCK: 'Truck',
  AIR: 'Air',
  BIKE: 'Bike',
  SHIP: 'Ship'
};

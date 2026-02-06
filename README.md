# UZA Logistics Backend API

Backend API server for the UZA Logistics Dashboard application.

## Structure

```
backend/
├── src/
│   ├── server.js              # Main server file
│   ├── config/
│   │   └── database.js        # MongoDB connection
│   ├── models/                # Mongoose models
│   │   ├── User.js
│   │   ├── Shipment.js
│   │   ├── Notification.js
│   │   ├── PricingRules.js
│   │   └── AuditEvent.js
│   ├── routes/                # API route definitions
│   │   ├── auth.routes.js
│   │   ├── client.routes.js
│   │   ├── warehouse.routes.js
│   │   └── admin.routes.js
│   ├── controllers/           # Request handlers
│   │   ├── auth.controller.js
│   │   ├── client.controller.js
│   │   ├── warehouse.controller.js
│   │   └── admin.controller.js
│   ├── middleware/           # Middleware functions
│   │   ├── auth.middleware.js
│   │   └── validation.middleware.js
│   └── utils/                 # Utility functions
│       └── idGenerator.js
├── package.json
├── .env.example
└── README.md
```

## Installation

```bash
cd backend
npm install
```

## Configuration

1. Create a `.env` file in the backend directory:
```bash
# Copy from .env.example or create manually
```

2. Add your MongoDB connection string:
```env
MONGODB_URI=mongodb+srv://username:password@cluster0.anfwvi8.mongodb.net/uzalogistics?retryWrites=true&w=majority&appName=Cluster0
PORT=3001
NODE_ENV=development
```

**Note**: Replace `username` and `password` with your MongoDB Atlas credentials.

## Running the Server

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

The server will run on `http://localhost:3001` by default.

## Creating Admin Account

To create the default admin account:

```bash
npm run create-admin
```

This will create an admin user with:
- Email: `admin@uzalogistics.com`
- Password: `admin123`

**⚠️ Important**: Change the password after first login!

See `ADMIN_CREDENTIALS.md` for more details.

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/verify` - Verify authentication token

### Client Dashboard
- `GET /api/client/dashboard` - Get client dashboard data
- `GET /api/client/profile` - Get client profile
- `PUT /api/client/profile` - Update client profile
- `GET /api/client/shipments` - Get all client shipments
- `GET /api/client/shipments/:id` - Get shipment by ID
- `POST /api/client/shipments` - Create new shipment
- `PUT /api/client/shipments/:id` - Update shipment
- `DELETE /api/client/shipments/:id` - Delete shipment
- `POST /api/client/shipments/:id/submit` - Submit shipment

### Warehouse Dashboard
- `GET /api/warehouse/dashboard` - Get warehouse dashboard data
- `GET /api/warehouse/profile` - Get warehouse profile
- `PUT /api/warehouse/profile` - Update warehouse profile
- `GET /api/warehouse/incoming` - Get incoming shipments
- `GET /api/warehouse/outgoing` - Get outgoing shipments
- `GET /api/warehouse/history` - Get shipment history
- `GET /api/warehouse/shipments/:id` - Get shipment by ID
- `POST /api/warehouse/shipments/:id/receive` - Receive shipment
- `POST /api/warehouse/shipments/:id/dispatch` - Dispatch shipment
- `PUT /api/warehouse/shipments/:id/status` - Update shipment status
- `PUT /api/warehouse/shipments/:id/remarks` - Add warehouse remarks

### Admin Dashboard
- `GET /api/admin/dashboard` - Get admin dashboard data
- `GET /api/admin/statistics` - Get statistics
- `GET /api/admin/profile` - Get admin profile
- `PUT /api/admin/profile` - Update admin profile
- `GET /api/admin/shipments` - Get all shipments
- `GET /api/admin/shipments/:id` - Get shipment by ID
- `PUT /api/admin/shipments/:id` - Update shipment
- `DELETE /api/admin/shipments/:id` - Delete shipment
- `GET /api/admin/users` - Get all users
- `GET /api/admin/users/:id` - Get user by ID
- `POST /api/admin/users` - Create user
- `PUT /api/admin/users/:id` - Update user
- `DELETE /api/admin/users/:id` - Delete user
- `GET /api/admin/pricing` - Get pricing rules
- `PUT /api/admin/pricing` - Update pricing rules
- `GET /api/admin/audit` - Get audit logs

## Health Check

- `GET /health` - Check if the server is running

## Database

The backend uses **MongoDB** with **Mongoose** ODM. The following models are available:

- **User**: User accounts (client, warehouse, admin)
- **Shipment**: Shipment records with products and status
- **Notification**: System notifications
- **PricingRules**: Pricing configuration
- **AuditEvent**: Audit logs

The database connection is automatically established when the server starts.

## Next Steps

1. ✅ **Database Integration**: MongoDB with Mongoose ODM
2. **Authentication**: Implement JWT-based authentication
3. **Validation**: Add request validation middleware
4. **Error Handling**: Enhance error handling and logging
5. **Testing**: Add unit and integration tests
6. **Documentation**: Add API documentation (Swagger/OpenAPI)
7. **Implement Controllers**: Connect controllers to database models
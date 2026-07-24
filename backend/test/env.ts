process.env.DATABASE_URL = "postgresql://nuzuljo:nuzuljo@localhost:5432/nuzuljo_test?schema=public";
process.env.NODE_ENV = "test";
process.env.JWT_ACCESS_SECRET = "test_access_secret";
process.env.JWT_REFRESH_SECRET = "test_refresh_secret";
process.env.JWT_ACCESS_EXPIRES_IN = "15m";
process.env.JWT_REFRESH_EXPIRES_IN = "7d";
process.env.CORS_ORIGIN = "http://localhost:5173";
process.env.PORT = "4001";

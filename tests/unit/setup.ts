// Environment the backend modules read at import time (see backend/config/env.ts)
process.env.NODE_ENV = "test";
process.env.JWT_ACCESS_SECRET_KEY = "unit-test-access-secret";
process.env.JWT_REFRESH_SECRET_KEY = "unit-test-refresh-secret";
process.env.MONGO_URI = "mongodb://localhost:27017";
process.env.DOMAIN = "http://localhost:8080";
process.env.SMTP_USER = "tester@gmail.com";
process.env.SMTP_PASS = "app-password";
process.env.OTEL_SDK_DISABLED = "true";
process.env.LOG_LEVEL = "error"; // keep test output quiet

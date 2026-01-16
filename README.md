# QR Code Backend API

A robust Node.js/Express backend API for QR code generation and analytics tracking.

## Features

- **QR Code Generation**: Generate unique QR codes with custom URLs and UTM parameters
- **Short URL Redirect**: Slug-based redirect system for easy sharing
- **Analytics Tracking**: Track scans with device, browser, and timing data
- **Privacy-First**: IP address hashing for anonymous analytics
- **Rate Limiting**: Built-in protection against abuse
- **Security**: CORS, Helmet, input validation, and prepared SQL statements

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL (Neon)
- **QR Generation**: qrcode library
- **User Agent Parsing**: ua-parser-js
- **Security**: Helmet, express-rate-limit

## API Endpoints

### QR Codes

#### Create QR Code

```http
POST /api/qrcodes
Content-Type: application/json

{
  "destinationUrl": "https://example.com",
  "utmSource": "newsletter",
  "utmMedium": "email",
  "utmCampaign": "summer2026"
}
```

**Response:**

```json
{
  "id": 1,
  "slug": "abc123xyz",
  "destinationUrl": "https://example.com",
  "finalUrl": "https://example.com?utm_source=newsletter&utm_medium=email&utm_campaign=summer2026",
  "createdAt": "2026-01-15T23:00:00.000Z",
  "qrCodeUrl": "/api/qrcodes/1/qrcode"
}
```

#### Get All QR Codes

```http
GET /api/qrcodes
```

**Response:**

```json
{
  "qrCodes": [
    {
      "id": 1,
      "slug": "abc123xyz",
      "destinationUrl": "https://example.com",
      "finalUrl": "https://example.com?utm_source=newsletter",
      "createdAt": "2026-01-15T23:00:00.000Z",
      "qrCodeUrl": "/api/qrcodes/1/qrcode"
    }
  ]
}
```

#### Get QR Code by ID

```http
GET /api/qrcodes/:id
```

#### Update QR Code

```http
PUT /api/qrcodes/:id
Content-Type: application/json

{
  "destinationUrl": "https://new-url.com",
  "utmSource": "social",
  "utmMedium": "twitter"
}
```

#### Delete QR Code

```http
DELETE /api/qrcodes/:id
```

#### Get QR Code Image

```http
GET /api/qrcodes/:id/qrcode
```

Returns a PNG image of the QR code.

### Redirects

#### Public Redirect Endpoint

```http
GET /r/:slug
```

Redirects to the destination URL with UTM parameters and tracks the scan.

### Analytics

#### Get Statistics for QR Code

```http
GET /api/qrcodes/:id/stats?fromDate=2026-01-01&toDate=2026-01-15
```

**Response:**

```json
{
  "qrCodeId": 1,
  "totalScans": 234,
  "uniqueScans": 187,
  "timeSeries": [
    { "date": "2026-01-15", "scans": 45 },
    { "date": "2026-01-14", "scans": 38 }
  ],
  "deviceBreakdown": [
    { "device": "mobile", "scans": 140 },
    { "device": "desktop", "scans": 82 }
  ],
  "browserBreakdown": [
    { "browser": "Chrome", "scans": 120 },
    { "browser": "Safari", "scans": 80 }
  ]
}
```

## Database Schema

```sql
-- QR Codes Table
CREATE TABLE qr_codes (
  id SERIAL PRIMARY KEY,
  slug VARCHAR(255) UNIQUE NOT NULL,
  destination_url TEXT NOT NULL,
  final_url TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Scan Events Table
CREATE TABLE scan_events (
  id SERIAL PRIMARY KEY,
  qr_code_id INTEGER REFERENCES qr_codes(id) ON DELETE CASCADE,
  scanned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ip_hash VARCHAR(64) NOT NULL,
  device VARCHAR(50),
  browser VARCHAR(50),
  os VARCHAR(50)
);

-- Indexes for performance
CREATE INDEX idx_qrcodes_slug ON qr_codes(slug);
CREATE INDEX idx_scan_events_qr_code_id ON scan_events(qr_code_id);
CREATE INDEX idx_scan_events_scanned_at ON scan_events(scanned_at);
CREATE INDEX idx_scan_events_composite ON scan_events(qr_code_id, scanned_at);
```

## Setup Instructions

### Prerequisites

- Node.js 18+
- PostgreSQL database (Neon account)

### Installation

1. **Clone the repository**

```bash
git clone <repository-url>
cd qr-backend
```

2. **Install dependencies**

```bash
npm install
```

3. **Set up environment variables**
   Create a `.env` file:

```env
DATABASE_URL=postgresql://user:password@host:port/database?sslmode=require
PORT=3000
NODE_ENV=development
IP_SALT=your-secret-salt-here
```

4. **Initialize database**

```bash
npm run db:init
```

5. **Start development server**

```bash
npm run dev
```

The API will be available at `http://localhost:3000`

## Docker Deployment

### Using Docker Compose

```bash
docker-compose up -d
```

The service will be available at `http://localhost:3000`

### Manual Docker Build

```bash
docker build -t qr-backend .
docker run -p 3000:3000 \
  -e DATABASE_URL=$DATABASE_URL \
  -e IP_SALT=$IP_SALT \
  qr-backend
```

## Project Structure

```
qr-backend/
├── src/
│   ├── index.ts              # Main application entry point
│   ├── db/
│   │   ├── database.ts       # Database connection
│   │   ├── init.ts           # Database initialization
│   │   └── schema.sql        # SQL schema
│   ├── routes/
│   │   ├── qrcodes.ts        # QR code CRUD endpoints
│   │   └── redirect.ts       # Public redirect endpoint
│   ├── services/
│   │   ├── qrcode.service.ts # QR code generation logic
│   │   ├── stats.service.ts  # Statistics aggregation
│   │   └── url.service.ts    # URL composition and validation
│   └── utils/
│       ├── slugGenerator.ts  # Unique slug generation
│       ├── uaParser.ts       # User agent parsing
│       └── ipHash.ts         # IP address hashing
├── Dockerfile
├── docker-compose.yml
├── package.json
├── tsconfig.json
└── .env
```

## Security Features

- **IP Hashing**: SHA-256 hashing of IP addresses for privacy
- **Rate Limiting**:
  - API: 100 requests per 15 minutes
  - Redirects: 60 requests per minute
- **CORS**: Configured for specific origins
- **Helmet**: Security headers for Express
- **Input Validation**: URL validation (http/https only)
- **SQL Injection Prevention**: Prepared statements
- **Secret Key**: IP_SALT for hashing operations

## Rate Limits

| Endpoint          | Limit   | Window |
| ----------------- | ------- | ------ |
| All API routes    | 100 req | 15 min |
| Redirect endpoint | 60 req  | 1 min  |

## Environment Variables

| Variable       | Required | Description                          |
| -------------- | -------- | ------------------------------------ |
| `DATABASE_URL` | Yes      | PostgreSQL connection string         |
| `PORT`         | No       | Server port (default: 3000)          |
| `NODE_ENV`     | No       | Environment (development/production) |
| `IP_SALT`      | Yes      | Secret salt for IP hashing           |

## Available Scripts

```bash
npm run dev          # Start development server with hot reload
npm run build        # Build TypeScript to JavaScript
npm run start        # Start production server
npm run db:init      # Initialize database schema
npm run lint         # Run ESLint
```

## API Examples

### Creating a QR Code with UTM Parameters

```bash
curl -X POST http://localhost:3000/api/qrcodes \
  -H "Content-Type: application/json" \
  -d '{
    "destinationUrl": "https://example.com",
    "utmSource": "newsletter",
    "utmMedium": "email",
    "utmCampaign": "summer2026"
  }'
```

### Getting Statistics

```bash
curl http://localhost:3000/api/qrcodes/1/stats?fromDate=2026-01-01&toDate=2026-01-15
```

### Testing Redirect

```bash
# This will redirect and track the scan
curl -L http://localhost:3000/r/abc123xyz
```

## Error Handling

The API returns standard HTTP status codes:

- `200 OK`: Successful GET/PUT
- `201 Created`: Successful POST
- `400 Bad Request`: Invalid input
- `404 Not Found`: Resource not found
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error

Error response format:

```json
{
  "error": "Error message here"
}
```

## Performance Considerations

- Database indexes on frequently queried columns
- Composite indexes for time-based queries
- Connection pooling via pg library
- Prepared SQL statements for query optimization

## Testing

To test the API:

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests
5. Submit a pull request

## License

MIT

## Support

For issues and questions, please open an issue on GitHub.

# Ragnar's Mark v4.0 - Community Sharing Backend

**Complete infrastructure for sharing presets, plugins, and game data**

---

## Overview

The Community Sharing Backend enables Ragnar's Mark users to:

- Share custom presets and configurations
- Collaborate on plugin development
- Contribute game system configurations
- Vote on popular presets
- Manage versions and updates
- Build a thriving community ecosystem

---

## Architecture

### Technology Stack

- **Backend:** Node.js + Express.js
- **Database:** MongoDB (with Redis caching)
- **Authentication:** JWT + OAuth 2.0
- **Storage:** AWS S3 for presets/files
- **Real-time:** WebSocket support
- **Search:** Elasticsearch for discovery

### System Design

```
┌─────────────────────────────────────────┐
│  Foundry VTT Client (Module)            │
│  ┌───────────────────────────────────┐  │
│  │ RagnaroksMarkAPI                  │  │
│  │ - Upload preset                   │  │
│  │ - Download preset                 │  │
│  │ - Rate/vote                       │  │
│  └───────────────────────────────────┘  │
└──────────────────┬──────────────────────┘
                   │ HTTPS
                   ▼
┌─────────────────────────────────────────┐
│  API Gateway (Load Balanced)            │
│  ┌───────────────────────────────────┐  │
│  │ Authentication Middleware         │  │
│  │ Rate Limiting                     │  │
│  │ CORS Management                   │  │
│  └───────────────────────────────────┘  │
└──────────────────┬──────────────────────┘
                   │
        ┌──────────┼──────────┬────────────┐
        │          │          │            │
        ▼          ▼          ▼            ▼
    ┌────┐    ┌────┐    ┌────┐       ┌────┐
    │ v1 │    │ v2 │    │ v3 │       │ v4 │
    └────┘    └────┘    └────┘       └────┘
    Presets   Plugins   Systems    Users/Auth
        │          │          │            │
        └──────────┼──────────┴────────────┘
                   │
                   ▼
        ┌─────────────────────┐
        │ Database Layer      │
        │ ┌─────────────────┐ │
        │ │ MongoDB         │ │
        │ │ Collections:    │ │
        │ │ - presets       │ │
        │ │ - plugins       │ │
        │ │ - users         │ │
        │ │ - reviews       │ │
        │ │ - stats         │ │
        │ └─────────────────┘ │
        │ ┌─────────────────┐ │
        │ │ Redis Cache     │ │
        │ │ - Hot presets   │ │
        │ │ - Leaderboards  │ │
        │ └─────────────────┘ │
        └─────────────────────┘
```

---

## API Endpoints

### Authentication

#### `POST /api/v4/auth/register`

Register a new user account.

**Request:**
```json
{
  "username": "username",
  "email": "user@example.com",
  "password": "secure_password",
  "discordId": "optional_discord_id"
}
```

**Response:**
```json
{
  "success": true,
  "token": "jwt_token",
  "user": {
    "id": "user_id",
    "username": "username",
    "email": "user@example.com"
  }
}
```

**Status Codes:**
- `201` - User created successfully
- `400` - Invalid input
- `409` - Username/email already exists

---

#### `POST /api/v4/auth/login`

Authenticate user and get JWT token.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password"
}
```

**Response:**
```json
{
  "success": true,
  "token": "jwt_token",
  "expiresIn": 3600
}
```

---

#### `POST /api/v4/auth/oauth`

Authenticate via OAuth (Discord, GitHub, Google).

**Request:**
```json
{
  "provider": "discord",
  "code": "oauth_code"
}
```

**Response:**
```json
{
  "success": true,
  "token": "jwt_token",
  "isNewUser": false
}
```

---

### Presets

#### `POST /api/v4/presets`

Upload a new preset to community.

**Request:**
```json
{
  "name": "Fire Spell Effects",
  "description": "Comprehensive fire spell condition presets",
  "category": "spells",
  "gameSystem": "dnd5e",
  "data": { /* preset configuration */ },
  "version": "1.0.0",
  "tags": ["fire", "spells", "effects"],
  "isPublic": true
}
```

**Response:**
```json
{
  "success": true,
  "preset": {
    "id": "preset_id",
    "name": "Fire Spell Effects",
    "slug": "fire-spell-effects",
    "author": { "id": "user_id", "username": "username" },
    "created": "2024-01-15T10:30:00Z",
    "downloads": 0,
    "rating": 0,
    "status": "published"
  }
}
```

**Headers:** Authorization: Bearer {token}

**Status Codes:**
- `201` - Preset created
- `400` - Invalid data
- `401` - Unauthorized
- `413` - File too large (max 5MB)

---

#### `GET /api/v4/presets`

Browse and search presets.

**Query Parameters:**
- `category` - Filter by category
- `gameSystem` - Filter by game system
- `tag` - Filter by tag
- `search` - Full-text search
- `sort` - Sort by: 'rating', 'downloads', 'recent', 'trending'
- `page` - Page number (default: 1)
- `limit` - Results per page (default: 20, max: 100)

**Example:**
```
GET /api/v4/presets?category=spells&gameSystem=dnd5e&sort=rating&limit=10
```

**Response:**
```json
{
  "success": true,
  "presets": [
    {
      "id": "preset_id",
      "name": "Fire Spell Effects",
      "description": "...",
      "author": { "id": "user_id", "username": "username" },
      "rating": 4.8,
      "downloads": 1523,
      "tags": ["fire", "spells"],
      "version": "1.0.0",
      "updated": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 156,
    "pages": 16
  }
}
```

---

#### `GET /api/v4/presets/{id}`

Get detailed preset information.

**Response:**
```json
{
  "success": true,
  "preset": {
    "id": "preset_id",
    "name": "Fire Spell Effects",
    "description": "Full description...",
    "author": { "id": "user_id", "username": "username", "avatar": "url" },
    "data": { /* full preset configuration */ },
    "version": "1.0.0",
    "rating": 4.8,
    "downloads": 1523,
    "tags": ["fire", "spells", "effects"],
    "gameSystem": "dnd5e",
    "requirements": ["v4.0.0"],
    "changelog": ["Initial release", "Added fire particle effects"],
    "reviews": [
      {
        "id": "review_id",
        "author": "reviewer",
        "rating": 5,
        "comment": "Excellent preset!",
        "helpful": 12,
        "created": "2024-01-10T08:00:00Z"
      }
    ],
    "stats": {
      "created": "2024-01-15T10:30:00Z",
      "updated": "2024-01-20T14:22:00Z",
      "viewCount": 3421,
      "downloadCount": 1523,
      "reviewCount": 23
    }
  }
}
```

---

#### `PUT /api/v4/presets/{id}`

Update an existing preset.

**Request:**
```json
{
  "name": "Fire Spell Effects Enhanced",
  "description": "Updated description",
  "data": { /* updated configuration */ },
  "version": "1.1.0"
}
```

**Headers:** Authorization: Bearer {token}

**Response:**
```json
{
  "success": true,
  "preset": { /* updated preset */ }
}
```

---

#### `DELETE /api/v4/presets/{id}`

Delete a preset (owner only).

**Headers:** Authorization: Bearer {token}

**Response:**
```json
{
  "success": true,
  "message": "Preset deleted successfully"
}
```

---

#### `POST /api/v4/presets/{id}/download`

Download a preset file.

**Headers:** Authorization: Bearer {token}

**Response:** Binary preset file (application/json)

---

#### `POST /api/v4/presets/{id}/rate`

Rate a preset (1-5 stars).

**Request:**
```json
{
  "rating": 5
}
```

**Headers:** Authorization: Bearer {token}

**Response:**
```json
{
  "success": true,
  "averageRating": 4.8,
  "totalRatings": 124
}
```

---

#### `POST /api/v4/presets/{id}/review`

Post a review for a preset.

**Request:**
```json
{
  "rating": 5,
  "comment": "Amazing preset! Really enhanced my gameplay.",
  "version": "1.0.0"
}
```

**Headers:** Authorization: Bearer {token}

**Response:**
```json
{
  "success": true,
  "review": {
    "id": "review_id",
    "author": "username",
    "rating": 5,
    "comment": "Amazing preset!",
    "created": "2024-01-20T14:22:00Z"
  }
}
```

---

### Plugins

#### `POST /api/v4/plugins`

Submit a new plugin.

**Request:**
```json
{
  "name": "Combat Automation",
  "description": "Automatically manage combat conditions",
  "code": "base64_encoded_plugin_code",
  "version": "1.0.0",
  "author": "author_name",
  "tags": ["automation", "combat", "conditions"],
  "repository": "https://github.com/user/repo",
  "documentation": "https://github.com/user/repo/wiki"
}
```

**Response:**
```json
{
  "success": true,
  "plugin": {
    "id": "plugin_id",
    "name": "Combat Automation",
    "status": "pending_review",
    "submittedAt": "2024-01-20T14:22:00Z"
  }
}
```

---

#### `GET /api/v4/plugins`

Search and browse plugins.

**Query Parameters:**
- `category` - Filter by category
- `search` - Full-text search
- `sort` - 'rating', 'downloads', 'recent'
- `featured` - Show featured plugins only

**Response:**
```json
{
  "success": true,
  "plugins": [
    {
      "id": "plugin_id",
      "name": "Combat Automation",
      "description": "...",
      "author": "username",
      "version": "1.0.0",
      "rating": 4.9,
      "downloads": 2341,
      "status": "approved"
    }
  ]
}
```

---

### Leaderboards

#### `GET /api/v4/leaderboards`

Get community leaderboards.

**Query Parameters:**
- `type` - 'presets', 'plugins', 'contributors', 'reviewers'
- `timeframe` - 'all-time', 'year', 'month', 'week'

**Response:**
```json
{
  "success": true,
  "leaderboard": [
    {
      "rank": 1,
      "user": "top_contributor",
      "score": 2541,
      "presets": 12,
      "plugins": 3,
      "reviews": 89
    }
  ]
}
```

---

### Statistics

#### `GET /api/v4/stats`

Get community statistics.

**Response:**
```json
{
  "success": true,
  "stats": {
    "totalUsers": 1523,
    "totalPresets": 456,
    "totalPlugins": 89,
    "totalDownloads": 45231,
    "averageRating": 4.6,
    "activeToday": 231,
    "newThisWeek": 23
  }
}
```

---

## Database Schema

### Collections

#### Users Collection

```javascript
{
  _id: ObjectId,
  username: String,
  email: String,
  passwordHash: String,
  avatar: String,
  bio: String,
  discordId: String,
  githubId: String,
  verified: Boolean,
  verificationToken: String,
  roles: [String], // ['user', 'moderator', 'admin']
  preferences: {
    notifications: Boolean,
    newsletter: Boolean,
    publicProfile: Boolean
  },
  stats: {
    presetsCreated: Number,
    pluginsCreated: Number,
    downloadsReceived: Number,
    reviewsWritten: Number,
    reputation: Number
  },
  createdAt: Date,
  updatedAt: Date,
  lastLogin: Date
}
```

#### Presets Collection

```javascript
{
  _id: ObjectId,
  name: String,
  slug: String,
  description: String,
  author: ObjectId, // Reference to Users
  category: String,
  gameSystem: String,
  tags: [String],
  data: Object, // Actual preset configuration
  version: String,
  requirements: [String],
  isPublic: Boolean,
  isDraft: Boolean,
  downloads: Number,
  viewCount: Number,
  rating: {
    average: Number,
    count: Number,
    ratings: [{ userId: ObjectId, score: Number }]
  },
  reviews: [ObjectId], // References to Reviews
  changelog: [String],
  fileUrl: String, // S3 URL
  createdAt: Date,
  updatedAt: Date,
  publishedAt: Date
}
```

#### Plugins Collection

```javascript
{
  _id: ObjectId,
  name: String,
  description: String,
  author: ObjectId,
  tags: [String],
  version: String,
  code: String, // Actual plugin code
  codeUrl: String, // GitHub/CDN URL
  repository: String,
  documentation: String,
  status: String, // 'pending', 'approved', 'rejected'
  reviewedBy: ObjectId,
  reviewComment: String,
  downloads: Number,
  rating: {
    average: Number,
    count: Number
  },
  compatibility: {
    minVersion: String,
    maxVersion: String
  },
  createdAt: Date,
  updatedAt: Date,
  approvedAt: Date
}
```

#### Reviews Collection

```javascript
{
  _id: ObjectId,
  author: ObjectId,
  presetId: ObjectId,
  rating: Number, // 1-5
  comment: String,
  helpful: Number, // Helpful vote count
  version: String, // Version reviewed
  createdAt: Date,
  updatedAt: Date
}
```

---

## Authentication & Security

### JWT Structure

```javascript
{
  header: {
    alg: "HS256",
    typ: "JWT"
  },
  payload: {
    userId: "user_id",
    username: "username",
    roles: ["user"],
    iat: 1234567890,
    exp: 1234571490
  },
  signature: "encoded_signature"
}
```

### Security Measures

1. **Password Security**
   - Bcrypt hashing with salt rounds: 12
   - Minimum 8 characters, uppercase, lowercase, number, symbol
   - Password reset via email verification

2. **Rate Limiting**
   - 100 requests per minute per IP
   - 1000 requests per hour per user
   - Exponential backoff on login failures

3. **Input Validation**
   - XSS protection with input sanitization
   - SQL injection prevention (MongoDB injection)
   - File upload scanning

4. **CORS & Origin**
   - Whitelist approved Foundry VTT instances
   - Origin validation on all requests
   - HTTPS enforced

---

## Deployment Guide

### Prerequisites

- Node.js 18+
- MongoDB 5.0+
- Redis 6.0+
- AWS S3 bucket
- SSL certificate

### Environment Variables

```env
# Server
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# Database
MONGODB_URI=mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@YOUR_CLUSTER.mongodb.net/ragnaroks-mark
REDIS_URI=redis://localhost:6379

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRY=3600

# AWS S3
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_S3_BUCKET=presets-bucket
AWS_REGION=us-east-1

# OAuth
DISCORD_CLIENT_ID=your_id
DISCORD_CLIENT_SECRET=your_secret
GITHUB_CLIENT_ID=your_id
GITHUB_CLIENT_SECRET=your_secret

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email
SMTP_PASS=your_password

# Admin
ADMIN_EMAIL=admin@example.com
ADMIN_USERNAME=admin
```

### Docker Setup

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000

CMD ["node", "server.js"]
```

### Docker Compose

```yaml
version: '3.8'

services:
  api:
    build: .
    ports:
      - "3000:3000"
    environment:
  - MONGODB_URI=mongodb://mongo:27017/ragnaroks-mark
      - REDIS_URI=redis://redis:6379
    depends_on:
      - mongo
      - redis

  mongo:
    image: mongo:5.0
    volumes:
      - mongo_data:/data/db

  redis:
    image: redis:6-alpine
    volumes:
      - redis_data:/data

volumes:
  mongo_data:
  redis_data:
```

### Installation

```bash
# Clone repository
git clone https://github.com/ragnaroks-mark/community-backend.git
cd community-backend

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your settings

# Start server
npm start

# For development with auto-reload
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

---

## Integration with Module

### Client-Side Upload

```javascript
async function uploadPreset(presetData, token) {
  const response = await fetch('https://api.ragnaroksmark.com/api/v4/presets', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      name: presetData.name,
      description: presetData.description,
      data: presetData.config,
      category: presetData.category,
      gameSystem: presetData.system,
      tags: presetData.tags,
      isPublic: true
    })
  });

  return response.json();
}

async function downloadPreset(presetId, token) {
  const response = await fetch(
  `https://api.ragnaroksmark.com/api/v4/presets/${presetId}/download`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );

  return response.json();
}
```

### Module API Integration

```javascript
// Register community API
RagnaroksMarkAPI.registerCommunityBackend({
  baseUrl: 'https://api.ragnaroksmark.com',
  apiVersion: 'v4',
  clientId: 'module-client-id'
});

// Upload current preset
await RagnaroksMarkAPI.uploadPreset({
  name: 'My Preset',
  description: 'Great preset',
  isPublic: true
});

// Download community preset
const preset = await RagnaroksMarkAPI.downloadPreset('preset-id');

// Rate preset
await RagnaroksMarkAPI.ratePreset('preset-id', 5);
```

---

## Community Guidelines

1. **Content Quality**
   - Presets must be functional and well-documented
   - Plugins must follow code standards
   - Descriptions must be accurate

2. **Respect**
   - No spam or duplicate content
   - Respect intellectual property
   - Constructive reviews only

3. **Security**
   - No malicious code
   - No personal data collection
   - Plugins reviewed before publishing

4. **Attribution**
   - Credit original authors
   - Request permission for modifications
   - Maintain changelog

---

**Complete community sharing infrastructure ready to deploy!** 🌐

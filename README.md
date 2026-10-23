# Campus Lost & Found Portal

A full stack web application where students can report items they have lost or found on campus, search through reports, find likely matches between lost and found items, and mark items as claimed once they are returned.

Built for the Portfolio-Driven Assessment in Full Stack Technologies.

## Features

- **Create**: report a lost or found item with name, category, location, date, description, contact details, and an optional photo link.
- **Read**: browse all items as claim tags, filter by Lost / Found and by category, and search by name, description, or place.
- **Update**: edit an item's details, or mark it as claimed (and reopen it if needed).
- **Delete**: remove an item with a confirmation step.
- **Match finder**: for any item, the app suggests open reports of the opposite type in the same category within 30 days, ranked by matching location and shared words.
- **Live stats**: counts of items still lost, items waiting to be picked up, and items returned.
- Server-side validation with clear error messages (for example, the date cannot be in the future).

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | HTML, CSS, JavaScript (Fetch API) |
| Backend | Node.js, Express.js |
| Database | MongoDB with Mongoose |
| API | REST (JSON) |
| Version control | Git and GitHub |

## Project structure

```
campus-lost-found/
├── backend/
│   ├── config/db.js               # MongoDB connection
│   ├── models/Item.js             # Mongoose schema and validation
│   ├── controllers/itemController.js  # CRUD logic, stats, match finder
│   ├── routes/itemRoutes.js       # REST API routes
│   ├── middleware/errorHandler.js # Async wrapper, 404 and error handling
│   ├── seed.js                    # Sample data
│   ├── server.js                  # Express app entry point
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── index.html
│   ├── styles.css
│   └── app.js
├── .gitignore
└── README.md
```

## Getting started

### Prerequisites

- Node.js 18 or newer
- MongoDB, either installed locally (MongoDB Community Server) or a free MongoDB Atlas cluster

### Steps

```bash
cd backend
npm install
cp .env.example .env      # on Windows: copy .env.example .env
```

Edit `.env` if you're using MongoDB Atlas, and paste your connection string into `MONGO_URI`.

Add sample data (optional):

```bash
npm run seed
```

Start the server:

```bash
npm start          # or: npm run dev  (auto-restarts on changes)
```

Open **http://localhost:5000** in your browser. The Express server serves both the API and the frontend.

## REST API

Base URL: `http://localhost:5000/api/items`

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/items` | List items. Optional query: `type`, `category`, `status`, `q` |
| GET | `/api/items/:id` | Get one item |
| POST | `/api/items` | Create an item |
| PUT | `/api/items/:id` | Update an item |
| PATCH | `/api/items/:id/status` | Set status, body `{ "status": "claimed" }` or `"open"` |
| DELETE | `/api/items/:id` | Delete an item |
| GET | `/api/items/:id/matches` | Possible matches for an item |
| GET | `/api/items/stats` | Counts of open lost, open found, and claimed items |
| GET | `/api/items/categories` | List of allowed categories |

Example request body for `POST /api/items`:

```json
{
  "type": "lost",
  "title": "Black steel water bottle",
  "description": "Cricket sticker on the side",
  "category": "Water Bottles",
  "location": "Central Library",
  "date": "2026-10-10",
  "contactName": "Ananya R",
  "contactInfo": "ananya@college.edu"
}
```

You can test every endpoint with Postman or Thunder Client, which also makes for good screenshots in the report.

## Database schema (Item)

| Field | Type | Notes |
|---|---|---|
| type | String | `lost` or `found`, required |
| title | String | 3 to 80 characters, required |
| description | String | up to 500 characters |
| category | String | one of the fixed categories, required |
| location | String | required |
| date | Date | required, not in the future |
| contactName | String | required |
| contactInfo | String | phone or email, required |
| imageUrl | String | optional, must start with http(s) |
| status | String | `open` (default) or `claimed` |
| claimedAt | Date | set when marked as claimed |
| createdAt, updatedAt | Date | added automatically |

## Pushing to GitHub

```bash
git init
git add .
git commit -m "Campus Lost & Found Portal: full stack CRUD app"
git branch -M main
git remote add origin https://github.com/<your-username>/campus-lost-found.git
git push -u origin main
```

`.env` and `node_modules` are excluded by `.gitignore`, so your database credentials stay private.

## Screenshots

Add screenshots to a `screenshots/` folder and link them here, for example:

- Home page with item tags
- Report item form
- Edit form
- Possible matches dialog
- Filtered and search results
- Claimed item with the stamp
- Postman requests for each API endpoint
- MongoDB Compass showing the `items` collection

## Future scope

- Student login so only the person who posted an item can edit or delete it
- Image upload instead of photo links
- Email notification when a possible match is posted
- Admin dashboard for the campus security office

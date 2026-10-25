const Item = require('../models/Item');
const { CATEGORIES } = require('../models/Item');

// Only these fields can be set by the client on create/update
const EDITABLE_FIELDS = [
  'type', 'title', 'description', 'category', 'location',
  'date', 'contactName', 'contactInfo', 'imageUrl',
];

function pickFields(body) {
  const data = {};
  EDITABLE_FIELDS.forEach((f) => {
    if (body[f] !== undefined) data[f] = body[f];
  });
  return data;
}

function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function httpError(statusCode, message) {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
}

// GET /api/items?type=lost&category=Keys&status=open&q=bottle
exports.getItems = async (req, res) => {
  const { type, category, status, q } = req.query;
  const filter = {};
  if (type) filter.type = type;
  if (category) filter.category = category;
  if (status) filter.status = status;
  if (q && q.trim()) {
    const regex = new RegExp(escapeRegex(q.trim()), 'i');
    filter.$or = [{ title: regex }, { description: regex }, { location: regex }];
  }
  const items = await Item.find(filter).sort({ date: -1, createdAt: -1 });
  res.json(items);
};

// GET /api/items/:id
exports.getItem = async (req, res) => {
  const item = await Item.findById(req.params.id);
  if (!item) throw httpError(404, 'Item not found');
  res.json(item);
};

// POST /api/items
exports.createItem = async (req, res) => {
  const item = await Item.create(pickFields(req.body));
  res.status(201).json(item);
};

// PUT /api/items/:id
exports.updateItem = async (req, res) => {
  const item = await Item.findByIdAndUpdate(req.params.id, pickFields(req.body), {
    new: true,
    runValidators: true,
  });
  if (!item) throw httpError(404, 'Item not found');
  res.json(item);
};

// PATCH /api/items/:id/status   body: { "status": "claimed" | "open" }
exports.updateStatus = async (req, res) => {
  const { status } = req.body;
  if (!['open', 'claimed'].includes(status)) {
    throw httpError(400, 'Status must be either open or claimed');
  }
  const item = await Item.findByIdAndUpdate(
    req.params.id,
    { status, claimedAt: status === 'claimed' ? new Date() : null },
    { new: true }
  );
  if (!item) throw httpError(404, 'Item not found');
  res.json(item);
};

// DELETE /api/items/:id
exports.deleteItem = async (req, res) => {
  const item = await Item.findByIdAndDelete(req.params.id);
  if (!item) throw httpError(404, 'Item not found');
  res.json({ message: 'Item deleted', id: item._id });
};

// GET /api/items/categories
exports.getCategories = (req, res) => {
  res.json(CATEGORIES);
};

// GET /api/items/stats
exports.getStats = async (req, res) => {
  const [lostOpen, foundOpen, claimed] = await Promise.all([
    Item.countDocuments({ type: 'lost', status: 'open' }),
    Item.countDocuments({ type: 'found', status: 'open' }),
    Item.countDocuments({ status: 'claimed' }),
  ]);
  res.json({ lostOpen, foundOpen, claimed });
};

// ---------- Match finder ----------
const STOP_WORDS = new Set([
  'the', 'and', 'with', 'for', 'near', 'from', 'lost', 'found', 'my', 'a', 'an', 'of', 'in', 'on',
]);

function keywords(text) {
  return new Set(
    String(text || '')
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((w) => w.length > 2 && !STOP_WORDS.has(w))
  );
}

// GET /api/items/:id/matches
// Finds open items of the opposite type in the same category within 30 days,
// then scores them by location and shared words.
exports.getMatches = async (req, res) => {
  const item = await Item.findById(req.params.id);
  if (!item) throw httpError(404, 'Item not found');

  const windowMs = 30 * 24 * 60 * 60 * 1000;
  const candidates = await Item.find({
    _id: { $ne: item._id },
    type: item.type === 'lost' ? 'found' : 'lost',
    category: item.category,
    status: 'open',
    date: {
      $gte: new Date(item.date.getTime() - windowMs),
      $lte: new Date(item.date.getTime() + windowMs),
    },
  });

  const itemWords = keywords(`${item.title} ${item.description}`);
  const itemLocation = item.location.toLowerCase();

  const matches = candidates
    .map((c) => {
      const reasons = ['Same category'];
      let score = 1;

      const loc = c.location.toLowerCase();
      if (loc === itemLocation || loc.includes(itemLocation) || itemLocation.includes(loc)) {
        score += 2;
        reasons.push('Same location');
      }

      const shared = [...keywords(`${c.title} ${c.description}`)].filter((w) => itemWords.has(w));
      if (shared.length) {
        score += shared.length;
        reasons.push(`Shared words: ${shared.join(', ')}`);
      }
      return { item: c, score, reasons };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  res.json(matches);
};

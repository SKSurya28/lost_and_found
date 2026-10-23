const mongoose = require('mongoose');

const CATEGORIES = [
  'Electronics',
  'ID & Cards',
  'Books & Stationery',
  'Bags',
  'Clothing',
  'Keys',
  'Water Bottles',
  'Accessories',
  'Other',
];

const itemSchema = new mongoose.Schema(
  {
    // "lost" = someone lost it, "found" = someone found it
    type: {
      type: String,
      enum: { values: ['lost', 'found'], message: 'Type must be either lost or found' },
      required: [true, 'Type is required'],
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      minlength: [3, 'Title must be at least 3 characters'],
      maxlength: [80, 'Title must be at most 80 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description must be at most 500 characters'],
      default: '',
    },
    category: {
      type: String,
      enum: { values: CATEGORIES, message: 'Please choose a valid category' },
      required: [true, 'Category is required'],
    },
    location: {
      type: String,
      required: [true, 'Location is required'],
      trim: true,
      maxlength: [100, 'Location must be at most 100 characters'],
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
      validate: {
        // Allow up to the end of today to avoid timezone issues
        validator: (v) => v.getTime() <= Date.now() + 24 * 60 * 60 * 1000,
        message: 'Date cannot be in the future',
      },
    },
    contactName: {
      type: String,
      required: [true, 'Contact name is required'],
      trim: true,
      maxlength: [60, 'Contact name must be at most 60 characters'],
    },
    contactInfo: {
      type: String,
      required: [true, 'Phone number or email is required'],
      trim: true,
      maxlength: [80, 'Contact info must be at most 80 characters'],
    },
    imageUrl: {
      type: String,
      trim: true,
      default: '',
      validate: {
        validator: (v) => v === '' || /^https?:\/\/.+/i.test(v),
        message: 'Image URL must start with http:// or https://',
      },
    },
    // "open" = still waiting, "claimed" = returned to its owner
    status: {
      type: String,
      enum: ['open', 'claimed'],
      default: 'open',
    },
    claimedAt: { type: Date, default: null },
  },
  { timestamps: true } // adds createdAt and updatedAt automatically
);

itemSchema.index({ type: 1, category: 1, status: 1 });

module.exports = mongoose.model('Item', itemSchema);
module.exports.CATEGORIES = CATEGORIES;

// Adds sample data so the app isn't empty on first run: npm run seed
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const Item = require('./models/Item');

const daysAgo = (n) => new Date(Date.now() - n * 24 * 60 * 60 * 1000);

const samples = [
  { type: 'lost', title: 'Black steel water bottle', description: 'Milton bottle with a cricket sticker on the side.', category: 'Water Bottles', location: 'Central Library', date: daysAgo(2), contactName: 'Ananya R', contactInfo: 'ananya@college.edu' },
  { type: 'found', title: 'Black water bottle with sticker', description: 'Left on the second floor reading table.', category: 'Water Bottles', location: 'Central Library', date: daysAgo(1), contactName: 'Library desk', contactInfo: '98765 43210' },
  { type: 'lost', title: 'College ID card', description: 'Name: Karthik S, 3rd year CSE.', category: 'ID & Cards', location: 'Canteen', date: daysAgo(3), contactName: 'Karthik S', contactInfo: '91234 56789' },
  { type: 'found', title: 'Set of two keys on a red keychain', description: 'One bike key and one small locker key.', category: 'Keys', location: 'Parking lot B', date: daysAgo(4), contactName: 'Security office', contactInfo: 'security@college.edu' },
  { type: 'lost', title: 'Boat wireless earbuds', description: 'White case, slightly scratched.', category: 'Electronics', location: 'Lab 204', date: daysAgo(5), contactName: 'Priya M', contactInfo: 'priya.m@college.edu' },
  { type: 'found', title: 'Data Structures textbook', description: 'Has notes in pencil and a name on the first page.', category: 'Books & Stationery', location: 'Seminar hall', date: daysAgo(6), contactName: 'Rahul V', contactInfo: '99887 66554' },
  { type: 'lost', title: 'Grey hoodie', description: 'Plain grey, size M.', category: 'Clothing', location: 'Sports ground', date: daysAgo(10), contactName: 'Vikram T', contactInfo: 'vikram@college.edu', status: 'claimed', claimedAt: daysAgo(8) },
];

(async () => {
  await connectDB();
  await Item.deleteMany({});
  await Item.insertMany(samples);
  console.log(`Inserted ${samples.length} sample items`);
  await mongoose.disconnect();
})();

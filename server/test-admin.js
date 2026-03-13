const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const User = require('./models/User');

async function test() {
    await mongoose.connect(process.env.MONGO_URI);
    
    const admin = await User.findOne({ isAdmin: true });
    if (!admin) {
        console.log('No admin found');
        process.exit(1);
    }
    
    console.log('Admin found:', admin.email);
    
    const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    
    try {
        const response = await fetch('http://localhost:5000/api/admin/stats', {
            headers: { Authorization: `Bearer ${token}` }
        });
        const data = await response.json();
        console.log('Status:', response.status);
        console.log('Success!', Object.keys(data));
    } catch (e) {
        console.error('Error fetching stats:', e.message);
    }
    process.exit(0);
}

test();

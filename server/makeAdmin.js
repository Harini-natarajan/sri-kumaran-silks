const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
    console.log('Connected to MongoDB');

    // Make all users admin
    const result = await mongoose.connection.db.collection('users').updateMany(
        {},
        { $set: { isAdmin: true } }
    );

    console.log('Made', result.modifiedCount, 'user(s) admin');

    // List users
    const users = await mongoose.connection.db.collection('users').find({}).toArray();
    console.log('\nAdmin users:');
    users.forEach(u => console.log('- Email:', u.email, '| isAdmin:', u.isAdmin));

    mongoose.disconnect();
    process.exit(0);
}).catch(err => {
    console.error('Error:', err);
    process.exit(1);
});

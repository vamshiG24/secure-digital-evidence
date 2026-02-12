require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const connectDB = require('./config/db');

connectDB();

const importData = async () => {
    try {
        await User.deleteMany();

        const adminUser = new User({
            name: 'Admin User',
            email: 'admin@secureevidence.com',
            password: 'password123', // Will be hashed by pre-save hook
            role: 'admin'
        });

        const investigator = new User({
            name: 'John Doe',
            email: 'investigator@secureevidence.com',
            password: 'password123',
            role: 'investigator'
        });

        const analyst = new User({
            name: 'Jane Smith',
            email: 'analyst@secureevidence.com',
            password: 'password123',
            role: 'analyst'
        });

        await adminUser.save();
        await investigator.save();
        await analyst.save();

        console.log('Data Imported!');
        console.log('Admin: admin@secureevidence.com / password123');
        console.log('Investigator: investigator@secureevidence.com / password123');
        console.log('Analyst: analyst@secureevidence.com / password123');
        process.exit();
    } catch (error) {
        console.error(`${error}`);
        process.exit(1);
    }
};

importData();

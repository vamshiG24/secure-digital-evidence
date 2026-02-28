require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Case = require('./models/Case');
const connectDB = require('./config/db');

connectDB();

const importData = async () => {
    try {
        await User.deleteMany();
        await Case.deleteMany(); // Clear existing cases

        // 1. Create Users First
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

        // 2. Create Cases
        const cases = [
            {
                title: 'Financial Fraud Investigation - Titan Corp',
                description: 'Investigation into alleged embezzlement and falsified financial records at Titan Corp. Initial audit shows discrepancies of over $2.5M.',
                status: 'Open',
                priority: 'High',
                createdBy: adminUser._id,
                assignedTo: investigator._id
            },
            {
                title: 'Data Breach Response - Server Alpha',
                description: 'Unauthorized access detected on Server Alpha containing customer PII. Suspected phishing campaign led to compromised credentials.',
                status: 'In Progress',
                priority: 'Critical',
                createdBy: adminUser._id,
                assignedTo: analyst._id
            },
            {
                title: 'Intellectual Property Theft',
                description: 'Former employee suspected of exfiltrating proprietary source code before resignation. Review of network logs required.',
                status: 'Open',
                priority: 'Medium',
                createdBy: investigator._id,
                assignedTo: investigator._id
            },
            {
                title: 'Closed: Malware Analysis - Ransom.WannaCry.v2',
                description: 'Analysis of a new ransomware variant found on a workstation. System was isolated before network propagation.',
                status: 'Closed',
                priority: 'Low',
                createdBy: analyst._id,
                assignedTo: analyst._id
            }
        ];

        await Case.insertMany(cases);

        console.log('Data Imported!');
        console.log('Admin: admin@secureevidence.com / password123');
        console.log('Investigator: investigator@secureevidence.com / password123');
        console.log('Analyst: analyst@secureevidence.com / password123');
        console.log(`Cases created: ${cases.length}`);
        process.exit();
    } catch (error) {
        console.error(`${error}`);
        process.exit(1);
    }
};

importData();

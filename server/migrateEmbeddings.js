/**
 * Migration script to generate embeddings for existing cases
 * Run this once after implementing AI features
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Case = require('./models/Case');
const { generateEmbedding } = require('./services/aiService');

const migrateEmbeddings = async () => {
    try {
        // Connect to database
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // Get all cases without embeddings
        const cases = await Case.find({
            $or: [
                { embedding: { $exists: false } },
                { embedding: null },
                { embedding: [] }
            ]
        });

        console.log(`Found ${cases.length} cases without embeddings`);

        let processed = 0;
        let failed = 0;

        for (const caseItem of cases) {
            try {
                const textToEmbed = `${caseItem.title}. ${caseItem.description}`;
                const embedding = await generateEmbedding(textToEmbed);

                caseItem.embedding = embedding;
                await caseItem.save();

                processed++;
                console.log(`✓ Processed case ${caseItem._id} (${processed}/${cases.length})`);
            } catch (error) {
                failed++;
                console.error(`✗ Failed to process case ${caseItem._id}:`, error.message);
            }
        }

        console.log('\n=== Migration Complete ===');
        console.log(`Successfully processed: ${processed}`);
        console.log(`Failed: ${failed}`);
        console.log(`Total: ${cases.length}`);

        process.exit(0);
    } catch (error) {
        console.error('Migration error:', error);
        process.exit(1);
    }
};

migrateEmbeddings();

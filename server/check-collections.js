const mongoose = require('mongoose');

const checkCollections = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/fitness-app');
    console.log('✅ Connected to MongoDB');

    const collections = await mongoose.connection.db.listCollections().toArray();
    
    console.log(`\n📊 Total collections found: ${collections.length}\n`);
    
    console.log('🗂️ Available collections:');
    for (const collection of collections) {
      console.log(`   - ${collection.name}`);
      
      // Get document count for each collection
      try {
        const count = await mongoose.connection.db.collection(collection.name).countDocuments();
        console.log(`     └─ Documents: ${count}`);
        
        // For booking-related collections, show sample documents
        if (collection.name.toLowerCase().includes('booking')) {
          const samples = await mongoose.connection.db.collection(collection.name).find().limit(3).toArray();
          if (samples.length > 0) {
            console.log(`     └─ Sample documents:`);
            samples.forEach((doc, index) => {
              console.log(`        ${index + 1}. ID: ${doc._id}, Status: ${doc.status || 'N/A'}, Created: ${doc.createdAt || 'N/A'}`);
            });
          }
        }
      } catch (err) {
        console.log(`     └─ Error counting documents: ${err.message}`);
      }
      console.log('');
    }

  } catch (error) {
    console.error('💥 Error checking collections:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
};

checkCollections();

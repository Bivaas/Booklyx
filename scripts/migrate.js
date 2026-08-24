/**
 * MongoDB Migration Script
 * 
 * Run this script to migrate existing data and create required indexes.
 * 
 * Usage:
 * 1. Connect to your MongoDB database
 * 2. Copy and paste this into MongoDB shell or use mongosh
 * 3. Or save as migrate.js and run: mongosh <connection-string> migrate.js
 */

// Switch to your database
// use booklyx; // Change to your database name (run in MongoDB shell separately)

print("===================================");
print("Booklyx Migration Script");
print("===================================\n");

// 1. Create TTL Indexes
print("Creating TTL indexes...");

// Verified users auto-deletion (24 hours)
db.verifiedusers.createIndex(
  { "verifiedAt": 1 },
  { expireAfterSeconds: 86400 }
);
print("✓ Verified users TTL index created (24 hours)");

// 2. Create Performance Indexes
print("\nCreating performance indexes...");

db.businesses.createIndex({ "status": 1 });
print("✓ Business status index created");

db.businesses.createIndex({ "status": 1, "createdAt": -1 });
print("✓ Business status + createdAt index created");

db.bookings.createIndex({ "businessId": 1, "startTime": 1 });
print("✓ Bookings businessId + startTime index created");

db.bookings.createIndex({ "customerId": 1 });
print("✓ Bookings customerId index created");

db.bookings.createIndex({ "startTime": 1 });
print("✓ Bookings startTime index created");

// 3. Migrate Existing Businesses (if they exist)
print("\nMigrating existing businesses...");

const businessesWithoutStatus = db.businesses.find({ status: { $exists: false } }).count();

if (businessesWithoutStatus > 0) {
  const result = db.businesses.updateMany(
    { status: { $exists: false } },
    {
      $set: {
        status: "approved",
        approvedAt: new Date(),
        approvedBy: "migration-script"
      }
    }
  );
  
  print(`✓ Migrated ${result.modifiedCount} businesses to APPROVED status`);
} else {
  print("✓ No businesses to migrate (all have status)");
}

// 4. Verify Indexes
print("\nVerifying indexes...");
const indexes = db.otps.getIndexes();
print(`Total indexes on 'otps': ${indexes.length}`);
const ttlIndex = indexes.find(idx => idx.expireAfterSeconds === 300);
if (ttlIndex) {
  print("✓ OTP TTL index verified");
} else {
  print("⚠ OTP TTL index not found!");
}

// 5. Summary
print("\n===================================");
print("Migration Summary");
print("===================================");

const stats = {
  businesses: db.businesses.countDocuments(),
  bookings: db.bookings.countDocuments(),
  services: db.services.countDocuments(),
  staff: db.staff.countDocuments(),
  otps: db.otps.countDocuments(),
  verifiedUsers: db.verifiedusers.countDocuments()
};

print(`Total businesses: ${stats.businesses}`);
print(`Total bookings: ${stats.bookings}`);
print(`Total services: ${stats.services}`);
print(`Total staff: ${stats.staff}`);
print(`Current OTPs: ${stats.otps}`);
print(`Verified users: ${stats.verifiedUsers}`);

// 6. Business Status Breakdown
print("\nBusiness Status Breakdown:");
const statusCounts = db.businesses.aggregate([
  { $group: { _id: "$status", count: { $sum: 1 } } }
]).toArray();

statusCounts.forEach(stat => {
  print(`  ${stat._id || 'undefined'}: ${stat.count}`);
});

print("\n===================================");
print("Migration Complete!");
print("===================================");
print("\nNext steps:");
print("1. Verify indexes in MongoDB Compass or admin panel");
print("2. Test OTP flow in your application");
print("3. Test business approval workflow");
print("4. Check that approved businesses appear in listings");
print("\nFor questions, see IMPLEMENTATION.md");

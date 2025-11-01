/**
 * Seed Default Admin User
 * Creates a default admin account for easy testing
 * 
 * Usage: node seed-default-admin.js
 */

const Auth = require('./auth/auth');

async function seedDefaultAdmin() {
  console.log('\n🌱 Seeding Default Admin Account...\n');
  console.log('═'.repeat(50));

  const defaultAdmin = {
    name: 'Admin',
    email: 'admin@123',
    password: '123456',
    role: 'admin'
  };

  try {
    console.log('\n⏳ Creating default admin user...');
    
    // Create admin
    const result = await Auth.createFirstAdmin(
      defaultAdmin.email,
      defaultAdmin.password,
      defaultAdmin.name
    );

    if (result.success) {
      console.log('\n' + '═'.repeat(50));
      console.log('✅ Default admin created successfully!');
      console.log('═'.repeat(50));
      console.log('\n📋 Default Admin Credentials:');
      console.log('   Email:', defaultAdmin.email);
      console.log('   Password:', defaultAdmin.password);
      console.log('   Role: admin');
      console.log('\n💡 Login Instructions:');
      console.log('   1. Go to: http://localhost:3000/admin-login.html');
      console.log('   2. Email: admin@123');
      console.log('   3. Password: 123456');
      console.log('\n⚠️  IMPORTANT: Change this password in production!');
      console.log('═'.repeat(50) + '\n');
    } else {
      if (result.error && result.error.includes('already exists')) {
        console.log('\n⚠️  Admin account already exists!');
        console.log('\n📋 Use these credentials to login:');
        console.log('   Email: admin@123');
        console.log('   Password: 123456');
        console.log('\n💡 Go to: http://localhost:3000/admin-login.html\n');
      } else {
        console.log('\n❌ Error:', result.error);
      }
    }
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.log('\nTry running this after starting the server.\n');
  }
}

// Run
seedDefaultAdmin().then(() => {
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});

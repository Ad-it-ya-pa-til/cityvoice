/**
 * Create First Admin User
 * Run this script once to create your admin account
 * 
 * Usage: node create-admin.js
 */

const readline = require('readline');
const Auth = require('./auth/auth');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function createAdmin() {
  console.log('\n🔐 Create Admin User for CityVoice\n');
  console.log('═'.repeat(50));

  try {
    // Get admin details
    const name = await question('\n👤 Admin Name: ');
    const email = await question('📧 Admin Email: ');
    const password = await question('🔑 Password (min 6 chars): ');
    const confirmPassword = await question('🔑 Confirm Password: ');

    // Validate
    if (!name || !email || !password) {
      console.log('\n❌ All fields are required!');
      rl.close();
      return;
    }

    if (password !== confirmPassword) {
      console.log('\n❌ Passwords do not match!');
      rl.close();
      return;
    }

    if (password.length < 6) {
      console.log('\n❌ Password must be at least 6 characters!');
      rl.close();
      return;
    }

    console.log('\n⏳ Creating admin user...');

    // Create admin
    const result = await Auth.createFirstAdmin(email, password, name);

    if (result.success) {
      console.log('\n' + '═'.repeat(50));
      console.log('✅ Admin user created successfully!');
      console.log('═'.repeat(50));
      console.log('\n📋 Your Admin Credentials:');
      console.log('   Name:', name);
      console.log('   Email:', email);
      console.log('   Role: admin');
      console.log('\n🔐 Login Token:', result.token);
      console.log('\n💡 Next Steps:');
      console.log('   1. Start server: node index.js');
      console.log('   2. Go to: http://localhost:3000/auth.html');
      console.log('   3. Login with email:', email);
      console.log('   4. Access admin: http://localhost:3000/admin.html');
      console.log('\n🔒 Keep your credentials safe!');
      console.log('═'.repeat(50) + '\n');
    } else {
      console.log('\n❌ Error:', result.error);
    }
  } catch (error) {
    console.error('\n❌ Error:', error.message);
  } finally {
    rl.close();
  }
}

// Run
createAdmin();

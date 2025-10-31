/**
 * Quick Setup Script for JWT Authentication
 * Run: node setup-auth.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

console.log('\n🔐 CityVoice JWT Authentication Setup\n');
console.log('═'.repeat(60));

// Step 1: Install packages
console.log('\n📦 Step 1: Installing required packages...');
try {
  execSync('npm install jsonwebtoken bcryptjs better-sqlite3 express-rate-limit', {
    stdio: 'inherit'
  });
  console.log('✅ Packages installed successfully');
} catch (error) {
  console.error('❌ Error installing packages:', error.message);
  process.exit(1);
}

// Step 2: Generate JWT secret
console.log('\n🔑 Step 2: Generating JWT secret...');
const jwtSecret = crypto.randomBytes(64).toString('hex');
console.log('✅ JWT secret generated');

// Step 3: Create/update .env file
console.log('\n📝 Step 3: Updating .env file...');
const envPath = path.join(__dirname, '.env');
let envContent = '';

if (fs.existsSync(envPath)) {
  envContent = fs.readFileSync(envPath, 'utf8');
  console.log('   Found existing .env file');
}

// Add or update JWT settings
if (!envContent.includes('JWT_SECRET')) {
  envContent += `\n# JWT Authentication\nJWT_SECRET=${jwtSecret}\nJWT_EXPIRE=7d\n`;
  fs.writeFileSync(envPath, envContent);
  console.log('✅ .env file updated');
} else {
  console.log('⚠️  JWT_SECRET already exists in .env');
  console.log('   If you want a new secret, update it manually');
}

// Step 4: Create .gitignore entry
console.log('\n🔒 Step 4: Updating .gitignore...');
const gitignorePath = path.join(__dirname, '.gitignore');
let gitignoreContent = '';

if (fs.existsSync(gitignorePath)) {
  gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
}

const entriesToAdd = [
  '.env',
  '.env.local',
  'users.db',
  'users.db-journal'
];

let updated = false;
entriesToAdd.forEach(entry => {
  if (!gitignoreContent.includes(entry)) {
    gitignoreContent += `\n${entry}`;
    updated = true;
  }
});

if (updated) {
  fs.writeFileSync(gitignorePath, gitignoreContent);
  console.log('✅ .gitignore updated');
} else {
  console.log('✅ .gitignore already configured');
}

// Summary
console.log('\n' + '═'.repeat(60));
console.log('✅ JWT Authentication Setup Complete!');
console.log('═'.repeat(60));

console.log('\n📋 What was done:');
console.log('   1. ✅ Installed: jsonwebtoken, bcryptjs, better-sqlite3');
console.log('   2. ✅ Generated secure JWT secret');
console.log('   3. ✅ Created/updated .env file');
console.log('   4. ✅ Updated .gitignore');

console.log('\n🔐 Your JWT Secret:');
console.log(`   ${jwtSecret}`);
console.log('   (Saved in .env file)');

console.log('\n🚀 Next Steps:');
console.log('   1. Create admin user:');
console.log('      node create-admin.js');
console.log('\n   2. Start server:');
console.log('      node index.js');
console.log('\n   3. See full guide:');
console.log('      INSTALL_JWT_AUTH.md');

console.log('\n💡 Note: You still need to update index.js with new auth routes');
console.log('   See INSTALL_JWT_AUTH.md for code examples');

console.log('\n' + '═'.repeat(60) + '\n');

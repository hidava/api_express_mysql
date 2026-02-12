// scripts/test-find-user.js
// Script para reproducir y debuggear User.findByEmailWithPassword
const { connectDB } = require('../config/database');
const User = require('../models/User');

(async function test() {
  try {
    await connectDB();
    const email = process.argv[2] || 'nhidalgovalverde@gmail.com';
    console.log('Buscando usuario por email:', email);
    const user = await User.findByEmailWithPassword(email);
    console.log('Usuario encontrado:', user);
  } catch (err) {
    console.error('ERROR en test-find-user:', err.stack || err);
  } finally {
    process.exit(0);
  }
})();

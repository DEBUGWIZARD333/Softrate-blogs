require('dotenv').config();
const dns = require('dns');
const net = require('net');
const mongoose = require('mongoose');

console.log('=== MONGO ATLAS DIAGNOSTIC TEST ===\n');

const uri = process.env.MONGO_URI;
console.log('1. Checking Connection String:');
console.log('URI format valid:', uri && uri.startsWith('mongodb+srv://') ? 'YES' : 'NO');

// Extract host from URI
const hostMatch = uri.match(/@([^/?]+)/);
const host = hostMatch ? hostMatch[1] : null;
console.log('Target Atlas Host:', host);

if (!host) {
  console.error('Invalid connection string. Could not parse host.');
  process.exit(1);
}

// 2. DNS SRV check
console.log('\n2. Testing DNS SRV lookup for:', `_mongodb._tcp.${host}`);
dns.resolveSrv(`_mongodb._tcp.${host}`, (err, addresses) => {
  if (err) {
    console.error('DNS SRV Resolution FAILED:', err.message);
    console.log('\n=> DIAGNOSIS: Your ISP / Wi-Fi is blocking MongoDB Atlas DNS lookups.');
    console.log('=> FIX: Try switching to your mobile hotspot Wi-Fi or check if cluster is paused in Atlas.');
    return;
  }

  console.log('DNS SRV Resolution SUCCESS! Found cluster nodes:');
  addresses.forEach((addr, i) => {
    console.log(` Node ${i + 1}: ${addr.name}:${addr.port}`);
  });

  // 3. Test TCP connection to Node 1 on port 27017
  const targetNode = addresses[0];
  console.log(`\n3. Testing TCP connection to ${targetNode.name}:${targetNode.port}...`);
  const socket = new net.Socket();
  socket.setTimeout(5000);

  socket.connect(targetNode.port, targetNode.name, () => {
    console.log('TCP Port 27017 connection SUCCESS! Outbound traffic is allowed.');
    socket.destroy();

    // 4. Test Mongoose Authentication
    console.log('\n4. Testing Full Mongoose Authentication...');
    mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 })
      .then(conn => {
        console.log('\n SUCCESS: FULL ATLAS CONNECTION ESTABLISHED!');
        console.log(`Connected to host: ${conn.connection.host}`);
        process.exit(0);
      })
      .catch(authErr => {
        console.error('Mongoose Connection Error:', authErr.message);
        if (authErr.message.includes('Authentication failed') || authErr.message.includes('auth error')) {
          console.log('\n=> DIAGNOSIS: Wrong username or password for database user.');
          console.log('=> FIX: In Atlas -> Database Access, reset the password for user arun2k07_db_user.');
        } else if (authErr.message.includes('whitelisted')) {
          console.log('\n=> DIAGNOSIS: IP Access rule is still deploying in Atlas, or cluster is paused.');
        }
        process.exit(1);
      });
  });

  socket.on('error', (netErr) => {
    console.error('TCP Connection FAILED:', netErr.message);
    console.log('\n=> DIAGNOSIS: Your current Wi-Fi network (college/office) is BLOCKING Port 27017.');
    console.log('=> FIX: Connect your laptop to your Phone Mobile Hotspot and try again.');
    process.exit(1);
  });

  socket.on('timeout', () => {
    console.error('TCP Connection TIMED OUT (Port 27017 blocked or cluster paused).');
    socket.destroy();
    process.exit(1);
  });
});

const fs = require('fs');
const { Client } = require('ssh2');

const localEnv = fs.readFileSync('.env.production', 'utf8');
const modifiedEnv = localEnv.replace(
  /NEXT_PUBLIC_APP_URL=.*/,
  'NEXT_PUBLIC_APP_URL=https://m-academy.mabotargagh.online'
);
const base64Env = Buffer.from(modifiedEnv).toString('base64');

const conn = new Client();
conn.on('ready', () => {
  console.log('Client :: ready');
  const cmd = `echo "${base64Env}" | base64 -d > /var/www/www/Music-academy/.env && cd /var/www/www/Music-academy && (docker compose down || docker-compose down) && (docker compose up -d --build || docker-compose up -d --build)`;
  console.log('Running remote build...');
  
  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    stream.on('close', (code, signal) => {
      console.log('Docker build complete. Exit code:', code);
      conn.end();
    }).on('data', (data) => {
      process.stdout.write(data.toString());
    }).stderr.on('data', (data) => {
      process.stderr.write(data.toString());
    });
  });
}).connect({
  host: '76.13.40.119',
  port: 22,
  username: 'root',
  password: 'Zezo#2412251'
});

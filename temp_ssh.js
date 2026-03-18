const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('Client :: ready');
  conn.exec('cat /var/www/frontend/m-academy/.env 2>/dev/null; echo "====="; cat /var/www/www/Music-academy/.env 2>/dev/null', (err, stream) => {
    if (err) throw err;
    let out = '';
    stream.on('close', (code, signal) => {
      console.log('--- OUTPUT ---');
      console.log(out);
      conn.end();
    }).on('data', (data) => {
      out += data.toString();
    }).stderr.on('data', (data) => {
      console.error('STDERR: ' + data);
    });
  });
}).connect({
  host: '76.13.40.119',
  port: 22,
  username: 'root',
  password: 'Zezo#2412251'
});

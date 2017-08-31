const http = require('http');

module.exports = {
  httpGet: (url, callback) => {
    console.log(`URL: ${url}`);

    const req = http.get(url, (res) => {
      let body = '';

      res.on('data', (d) => {
        body += d;
      });

      res.on('end', () => {
        callback(body);
      });
    });
    req.end();

    req.on('error', (e) => {
      console.error(e);
    });
  },
};

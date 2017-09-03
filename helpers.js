const https = require('https');
const parseDomain = require('parse-domain');

module.exports = {
  httpsGet: (url, callback) => {
    console.log(`URL: ${url}`);

    const req = https.get(url, (res) => {
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
  extractRootDomain: (input) => {
    // get only the url portion of the input
    let url = input;
    const urlArr = input.split(' ');
    if (urlArr.length > 1) {
      for (let i = 0; i < urlArr.length; i += 1) {
        if (urlArr[i].indexOf('.') > -1) {
          url = urlArr[i];
          break;
        }
      }
    }
    const parsed = parseDomain(url);
    const domain = `${parsed.domain}.${parsed.tld}`;

    return domain;
  },
  extractEmail: (input) => {
    let email = input;
    const emailArr = input.split(' ');
    if (emailArr.length > 1) {
      for (let i = 0; i < emailArr.length; i += 1) {
        if (emailArr[i].indexOf('@') > -1) {
          email = emailArr[i];
          break;
        }
      }
    }
    return email;
  },
};


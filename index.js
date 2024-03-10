require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const dns = require('dns');
const app = express();
let mongoose;

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.urlencoded({extended: false}));

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});


// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

function isValidHttpUrl(str) {
  const pattern = new RegExp(
    '^(https?:\\/\\/)' + // protocol
      '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name
      '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
      '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
      '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
      '(\\#[-a-z\\d_]*)?$', // fragment locator
    'i'
  );
  return pattern.test(str);
}

app.route('/api/shorturl')
.post((req, res) => {
  const inputUrl = req.body.url;
  const invalidUrl = {error: 'invalid url'};
  const validUrl = {
    original_url: inputUrl,
    short_url: 1
  };
  if (isValidHttpUrl(inputUrl)) {
    dns.lookup(inputUrl.hostname, (err) => {
      if (err) return res.json(invalidUrl);
      return res.json(validUrl);
    })
  } else {
    return res.json(invalidUrl);
  }
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});

require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const dns = require('dns');
const app = express();
let mongoose = require("mongoose");

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false
});

const urlSchema = new mongoose.Schema({
  original: {
    type: String,
    required: true
  },
  short: Number
});

let ShortUrl = mongoose.model('ShortUrl', urlSchema);

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.urlencoded({extended: false}));

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
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

let responseObj = {};

app.route('/api/shorturl')
.post((req, res) => {
  const inputUrl = req.body.url;
  let entryCount = 1;
  const invalidUrl = {error: 'invalid url'};
  let responseObj = {'original_url': inputUrl, 'short_url': entryCount};

  if (isValidHttpUrl(inputUrl)) {
    const url = new URL(inputUrl).hostname;
    dns.lookup(url.hostname, (err) => {
      if (err) return res.json(invalidUrl);
      ShortUrl
      .findOne({original: inputUrl})
      .sort({short: -1})
      .exec((err, result) => {
        if (err) return res.json(invalidUrl);
        if (result == undefined || result == null) {
          ShortUrl.countDocuments({}, (err, count)=> {
            entryCount = count + 1;
            responseObj['short_url'] = entryCount;
            if (!err) {
              ShortUrl.create({
                original: inputUrl,
                short: entryCount
              });
              res.json(responseObj);
            }
          });
        } else {
          responseObj['original_url'] = result.original;
          responseObj['short_url'] = result.short;
          res.json(responseObj);
        }
      });
      
    })
  } else {
    return res.json(invalidUrl);
  }

});

app.get('/api/shorturl/:shorturl', (req, res) => {
  ShortUrl.findOne({short: req.params.shorturl}, (err, result) => {
    if (!err) {
      res.json({
        original: result.original,
        short: result.short
      })
      
    }
  })
})

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});

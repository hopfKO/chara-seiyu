var express = require('express');
var router = express.Router();
const fs = require('fs-extra');
const request = require('request');
const R = require('ramda');

const mapIndexed = R.addIndex(R.map);

router.get('/', function (req, res, next) {
  res.render('seiyu');
});

router.post('/createImg', function (req, res, next) {
  var title = req.body['title'];
  var chara = req.body['chara'];
  if (existFile("public/img/chara/" + title + "/" + chara + "/")) {
    // res.send("existed!");
    res.end();
  }
  searchGoogleImage(title, chara, req.body['imgCount'])
    .then(items => Promise.all(mapIndexed((item, idx) => promisifyItems(item.link, title, chara, idx), items)))
    .then(_ => { res.end(); });
});

function existFile(file) {
  return R.tryCatch(() => { fs.statSync(file); return true }, err => err.code === 'ENOENT' ? false : true)();
}

function searchGoogleImage(title, chara, imgCount) {
  return new Promise(res => {
    const options = {
      uri: "https://www.googleapis.com/customsearch/v1",
      method: "GET",
      json: true,
      timeout: 30 * 1000, // タイムアウト指定しないと帰ってこない場合がある
      qs: {
        key: process.env.GOOGLE_API_KEY,
        q: title + " " + chara,
        cx: process.env.GOOGLE_API_CX,
        lr: "lang_ja",
        num: imgCount,
        start: 1,
        searchType: "image"
      }
    };

    request(
      options,
      (err, response, data) => {
        if (!err && response.statusCode === 200) {
          res(data.items);
        }
      }
    );
  })

}

function promisifyItems(url, title, chara, index) {
  var fileSubPath = title + "/" + chara + "/";
  var fileName = index + ".jpg";
  return downloadImg(url, fileSubPath, fileName);
}

function downloadImg(url, fileSubPath, fileName) {
  return new Promise(res => {
    request(
      { url: url, method: "GET", encoding: null },
      (err, response, body) => {
        if (!err && response.statusCode === 200) {
          fs.mkdirs('public/img/chara/' + fileSubPath, (err => {
            var imgPath = 'public/img/chara/' + fileSubPath + fileName;
            fs.writeFile(imgPath, body, "binary");
          }));
        }
        res();
      }
    );
  })

}

module.exports = router;

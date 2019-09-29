var express = require('express');
var router = express.Router();
const fs = require('fs-extra');
const request = require('request');
const R = require('ramda');

router.get('/', function (req, res, next) {
  res.render('seiyu');
});

router.post('/createImg', function (req, res, next) {
  var title = req.body['title'];
  var chara = req.body['chara'];
  if (existFile("public/img/chara/" + title + "/" + chara + "/")) {
    return;
  }
  searchGoogleImage(title, chara, req.body['imgCount'])
    .then(items => Promise.all(R.map(item => promisifyItems(item.link, title, chara), items)))
    .then(_ => { res.send("うんこ") });
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
          res(data.items); F
        }
      }
    );
  })

}

function promisifyItems(url, title, chara) {
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

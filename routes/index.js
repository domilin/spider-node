const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const router = express.Router();

/* GET home page. */
let stop = false;
router.get('/', function (req, res, next) {
    res.render('index');
});

let listArr = [],
    urlTemp = [];
router.get('/list', function (req, res) {
    res.json({
        success: true,
        stop: stop,
        data: listArr
    });
});

router.get('/stop', function (req, res) {
    stop = true;
    listArr = [];
    urlTemp = [];
    res.json({
        success: true
    })
});

let timer;
router.get('/search', function (req, res, next) {
    stop = false;
    listArr = [];
    urlTemp = [];

    let keywords = req.query.keywords,
        website = req.query.website;

    let ip = req.headers['x-real-ip'] ? req.headers['x-real-ip'] : req.ip.replace(/::ffff:/, '');

    let urlArr;
    if (website.length !== 0) {
        urlArr = website.replace(/\n/g, '').split(';');
    }

    for (let i in urlArr) {
        urlTemp[i] = [];
        urlTemp[i].push(urlArr[i]);
        checkKeywords(keywords, urlArr[i], urlTemp[i], ip);
    }

    res.send({
        success: true,
        msg: '搜索中'
    });

    function checkKeywords(keywords, url, arr, ip) {
        if (stop === false) {
            axios.get(url)
                .then(function (response) {
                    const $ = cheerio.load(response.data);
                    let exist = $('body').html().toString().indexOf(keywords) > -1 ? true : false;
                    listArr.push({
                        url: url,
                        exist: exist
                    });

                    if(!exist){
                        $('a').each(function () {
                            let aUrl = $(this).attr('href');

                            if (arr.indexOf(aUrl) === -1) {
                                if (aUrl.indexOf('http://') > -1 || aUrl.indexOf('https://') > -1) {
                                    if (aUrl.indexOf(url.split('/')[2]) > -1 || aUrl.indexOf(ip) > -1) {
                                        arr.push(aUrl);
                                        checkKeywords(keywords, aUrl, arr, ip);
                                    }
                                } else {
                                    let lastUrl = aUrl.indexOf('/') === 0 ? '' : '/';
                                    let host = url.split('/')[0] + '//' + url.split('/')[1] + url.split('/')[2] + lastUrl;

                                    arr.push(host + aUrl);
                                    checkKeywords(keywords, host + aUrl, arr, ip);
                                }
                            }
                        });
                    }
                })
                .catch(function (error) {
                    console.log('error');
                });
        } else {
            return false;
        }
    }
});


module.exports = router;

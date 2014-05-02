var fs      = require('fs');
var express = require('express');
var request = require('request');
var cheerio = require('cheerio');

var app = express();

app.listen('8081');
console.log('Listening on port 8081');
exports = module.exports = app;

app.get('/scrape', function(req, res){

  var url = 'http://themeforest.net/category/all';

  scrapeStart(url);

  res.send('Scraping!');

});

var scrapeStart = function(url, callback) {

  // Begins scraping process

  request(url, function(error, response, body) {

    if(!error && response.statusCode == 200) {
      scrapeTotalPages(body, function(themes, pages) {
        console.log('Beginning scraping ' + themes + ' themes in ' + pages + ' pages...');
        processPages(1, pages);
      })
    }
  });
};

var scrapeTotalPages = function(body, callback) {

  // Finds total number of pages and themes to scrape

  var $ = cheerio.load(body);
  var themes = parseInt($('.page-title__result-count p').text().match(/\d+/)[0]);
  var pages = parseInt($('.pagination__list').first().children().last().prev().find('a').text());

  callback(themes, pages);
};

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

var processPages = function(page, pages){

  // Controls scraping process

  if(page <= pages) {
    scrapePage(page, function(page) {
      console.log('Finished scraping page ' + page + ' of ' + pages + ' pages...')
      return processPages(++page, pages);
    })
  } else {
    return 'Finished scraping!';
  }
};

var scrapePage = function(page, callback) {

  // Gets theme page

  var url = 'http://themeforest.net/category/all?page=' + page;

  request(url, function(err, res, body) {
    scrapeThemes(body, function(themes) {
      console.log('Finished scraping ' + themes + ' themes...');
      callback(page);
    });
  });
};

var scrapeThemes = function(body, callback) {

  // Scrapes a theme page

  var $ = cheerio.load(body);

  var themes = $('.item-list').children();

  processThemes(themes, function(){
    callback(themes.length);
  });
};

var processThemes = function (themes, callback) {

  var $ = cheerio.load(themes);

  themes.each(function(index, element) {
    var theme = $(this);
    scrapeTheme(theme, $, function(themeJSON) {
      writeTheme(themeJSON, function(){
        processThemes(themes);
      });
    });
  });
};

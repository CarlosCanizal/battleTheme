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

var scrapeTheme = function(theme, $, callback) {

  // Scrapes a theme

  var themeJSON = {
    itemId:         theme.data('itemId'),
    category:       theme.attr('class'),
    name:           theme.find('h3', 'item-info').find('a').text().trim(),
    author:         theme.find('.author', 'a').text().trim(),
    themeURL:       theme.find('h3', 'item-info').find('a').attr('href'),
    authorURL:      'http://themeforest.net' + theme.find('.author', 'a').attr('href'),
    previewURL:     theme.find('a[title="Open live preview"]').attr('href') ?
                      'http://themeforest.net' + theme.find('a[title="Open live preview"]').attr('href') :
                      undefined,
    tags:           [],
    description:    '',
    thumbnail:      theme.find('.thumbnail img').attr('src'),
    poster:         theme.find('.thumbnail img').data('previewUrl'),
    sales:          theme.find('.sale-count').text().match(/\d+/)[0],
    price:          theme.find('.price').text().match(/\d+/)[0]
  };

  // Pushes tags into tag property

  theme.find('.meta-categories').children().each(function(index, element){
    var tag = $(this);
    themeJSON.tags.push(tag.text());
  });

  // Processes description

  themeJSON.description = theme.find('.meta').clone();
  $('span', themeJSON.description).remove();
  themeJSON.description = themeJSON.description.text().trim();

  if(themeJSON.previewURL !== undefined) {
    getPreview(themeJSON.previewURL, function(previewURL) {
      themeJSON.previewURL = previewURL;
      callback(themeJSON);
    });
  } else {
    callback(themeJSON);
  }
};

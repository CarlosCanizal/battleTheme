var fs      = require('fs');
var express = require('express');
var request = require('request');
var cheerio = require('cheerio');

var app = express();

app.listen('8081');
console.log('Listening on port 8081');
exports = module.exports = app;

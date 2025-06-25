const Handlebars = require('handlebars');

// Register a concat helper for URLs
Handlebars.registerHelper('concat', function() {
  return Array.from(arguments).slice(0, -1).join('');
});

module.exports = Handlebars;

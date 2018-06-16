const path = require('path');

const config = {
  entry: './public/src/client_game.js',
  output: {
    path: path.resolve(__dirname, 'public'),
    filename: 'bundle.js'
  }
};

module.exports = config;

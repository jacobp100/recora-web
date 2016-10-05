/* eslint-disable max-len */
/* eslint-disable flowtype/require-valid-file-annotation */
const autoprefixer = require('autoprefixer');
const path = require('path');
const ExtractTextPlugin = require('extract-text-webpack-plugin');


module.exports = {
  context: __dirname,
  entry: './src/index',
  devtool: 'source-map',
  output: {
    path: path.join(__dirname, '/dist'),
    filename: 'recora-app.js',
    library: 'recoraApp',
    libraryTarget: 'umd',
    publicPath: '/dist',
  },
  module: {
    loaders: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel',
      },
      {
        test: /\.json$/,
        loader: 'json',
      },
      {
        test: /\.css$/,
        loader: ExtractTextPlugin.extract(
          'style-loader',
          'css-loader?modules&importLoaders=1&localIdentName=[name]__[local]___[hash:base64:5]!postcss-loader'
        ),
      },
      {
        test: /\.(jpe?g|png|gif|svg)$/i,
        loader: 'url',
      },
    ],
  },
  postcss: [
    autoprefixer,
  ],
  plugins: [
    new ExtractTextPlugin('style.css', { allChunks: true }),
  ],
};

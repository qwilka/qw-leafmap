const path = require('path');

const HtmlWebpackPlugin = require('html-webpack-plugin');
const WebpackCdnPlugin = require('webpack-cdn-plugin');

// const webpack = require('webpack');
//   new webpack.ProvidePlugin({
//     "window.L": "leaflet"
//   }),

const mode = process.env.NODE_ENV || 'development';

module.exports = {
  entry: path.join(__dirname, 'src/index.js'),
  mode,
  output: {
    path: path.join(__dirname, 'gis/assets'),
    publicPath: '/gis/assets',
    filename: 'qwleaf.js',
  },
  externals: {
    'leaflet': 'L'
  },
  module: {
    rules: [
        { test: /\.css$/, use: ['style-loader', 'css-loader'] }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({ 
      filename: '../qwleaf.html',
      template: "./index.html"
    }), // output file relative to output.path
    new WebpackCdnPlugin({
      modules: [

      ],
      publicPath: '/node_modules', // override when prod is false
    }),
  ],
};

// new WebpackCdnPlugin({
//   modules: [
//     { 
//       name: 'leaflet',
//       style: '',
//       path: 'dist/leaflet.js'
//     }
//   ],
//   publicPath: '/node_modules', // override when prod is false
// }),
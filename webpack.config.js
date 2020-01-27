const path = require('path');

const HtmlWebpackPlugin = require('html-webpack-plugin');
const WebpackCdnPlugin = require('webpack-cdn-plugin');

// const webpack = require('webpack');
//   new webpack.ProvidePlugin({
//     "window.L": "leaflet"
//   }),

const mode = process.env.NODE_ENV || 'development';

module.exports = {
  entry: path.join(__dirname, 'qwgis/app.js'),
  mode,
  output: {
    path: path.join(__dirname, 'dist/gis/assets'),
    publicPath: '/gis/assets',
    filename: 'qwgis.js',
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
      filename: '../1/index.html',
      template: "./index.html"
    }), // output file relative to output.path
    new WebpackCdnPlugin({
      modules: [
        { 
          name: 'leaflet',
          style: '',
          path: 'dist/leaflet.js'
        },
        {
          name: 'geodesy',
          var: 'geodesy',
          paths: [
              'utm.min.js'
          ],
          prodUrl: "//cdn.jsdelivr.net/npm/:name@:version/:path"
        }
    ],

      publicPath: '/node_modules', // override when prod is false
    }),
  ],
};
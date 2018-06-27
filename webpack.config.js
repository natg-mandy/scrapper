const path = require('path');
const fs = require('fs');
var webpack = require("webpack");
var nodeExternals = require('webpack-node-externals');


//snagged from http://jlongster.com/Backend-Apps-with-Webpack--Part-I
// const nodeModules = {};
// fs.readdirSync('node_modules')
// .filter(function(x) {
//   return ['.bin'].indexOf(x) === -1;
// })
// .forEach(function(mod) {
//   nodeModules[mod] = 'commonjs ' + mod;
// });


module.exports = {
  entry: './src/index.ts',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js'
  },
  resolve: {
    // Add `.ts` and `.tsx` as a resolvable extension.
    extensions: ['.ts', '.tsx', '.js', '.json'],
    modules: [
      path.resolve(__dirname, 'src'),
      'node_modules'
    ],
    mainFiles: ['index']
  },
  externals: [nodeExternals()],
  module: {
    rules: [
      {
        test: /\.ts(x?)$/,
        use: 'ts-loader',
        include: [
          path.resolve(__dirname, 'src')
        ]
      },
      {
        test: /\.json$/,
        use: 'json-loader'
      }
    ]
  },
  plugins: [
    new webpack.DefinePlugin({ "global.GENTLY": false })
  ],
  stats: {
    colors: true,
    modules: true,
    reasons: true,
    errorDetails: true,
    warnings: true,
    assets: true
  },
  target: "node",
  devtool: 'source-map'
}
'use strict';

const path = require('path');
const webpack = require('webpack');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');

module.exports = function(env) {
  let plugins = [
    new webpack.ProvidePlugin({
      THREE: 'three',
    }),
    // clean export folder
    new CleanWebpackPlugin(),
    // create styles css
    new MiniCssExtractPlugin({
      filename: env == 'prod' ? '[name].[contenthash].css' : '[name].css'
    }),
    // create vendor bundle with all imported node_modules
    // create html
    new HtmlWebpackPlugin({
      template: 'index.html',
      chunksSortMode: 'dependency'
    }),
  ];

  if (env == 'dev') {

  }
  else {

    // uglify
    plugins.push(new UglifyJSPlugin());
  }

  return {
    context: path.resolve(__dirname, 'app'),
    devServer: {
      host: "0.0.0.0",
      disableHostCheck: true
    },
    entry: {
      main: './index.js'
    },
    output: {
      path: path.resolve(__dirname, 'docs'),
      filename: env == 'prod' ? '[name].[chunkhash].js' : '[name].js',
    },
    module: {
      rules: [{
        test: /\.js$/,
        exclude: /(node_modules|bower_components)/,
        use: {
           loader: 'babel-loader',
           options: {
             presets: ['@babel/preset-env']
          }
        }
      },{
        test: /\.css$/,
        use: [
          {
            loader: MiniCssExtractPlugin.loader,
            options: { hmr: env === 'dev' }
          },
          'css-loader',
        ]
      },{
        test: [/\.mp3$/, /\.dae$/, /\.jpg$/, /\.obj$/, /\.fbx$/],
        use: ['file-loader?name=[path][name].[hash].[ext]']
      },{
          test: [/\.vert$/, /\.frag$/],
          loader: 'webpack-glsl-loader'
      }]
    },
    devtool: env == 'dev' ? 'cheap-eval-source-map' : '',
    plugins: plugins,
  }
};

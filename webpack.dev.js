const path = require('path');
const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');
const Dotenv = require('dotenv-webpack');
const dotenv = require('dotenv');
const envFile = process.env.NODE_ENV ? `./.env.${process.env.NODE_ENV}` : './.env.development';
const webpack = require('webpack');

dotenv.config({ path: envFile });

module.exports = merge(common, {
    mode: 'development',
    devtool: 'inline-source-map',
    plugins: [
        new Dotenv({
            path: path.resolve(__dirname, './.env.development'), // Path to .env file (this is the default)
            safe: true, // load .env.example (defaults to "false" which does not use dotenv-safe)
        }),
    ],
})
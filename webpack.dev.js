const path = require('path');
const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const Dotenv = require('dotenv-webpack');
const dotenv = require('dotenv');
const envFile = process.env.NODE_ENV ? `./.env.${process.env.NODE_ENV}` : './.env.development';
const webpack = require('webpack');

dotenv.config({ path: envFile });

module.exports = merge(common, {
    mode: 'development',
    entry: {
        home: [
            './frontend/js/home.js',
            './frontend/js/octree.js'
        ]
    },
    output: {
        path: path.resolve(__dirname + '/dist'),
        filename: '[name].bundle.js',
        clean: true,
        publicPath: '/',
    },
    devtool: 'inline-source-map',
    devServer: {
        static: './dist'
    },
    module: {
        rules: [
            {
                test: /\.css$/i,
                use: ['style-loader', 'css-loader'],
            },
            {
                test: /\.(png|svg|jpg|jpeg|gif)$/i,
                type: 'asset/resource',
            },
            {
                test: /\.(woff|woff2|eot|ttf|otf)$/i,
                type: 'asset/resource',
            },
        ],
    },
    plugins: [
        new HtmlWebpackPlugin({
            title: 'Development',
            template: './frontend/html/home.html'
        }),
        new Dotenv({
            path: path.resolve(__dirname, process.env.NODE_ENV ? `./.env.${process.env.NODE_ENV}` : './.env.development'), // Path to .env file (this is the default)
            safe: true, // load .env.example (defaults to "false" which does not use dotenv-safe)
        }),
    ],
})
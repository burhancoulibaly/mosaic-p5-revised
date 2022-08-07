const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
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
    plugins: [
        new HtmlWebpackPlugin({
            template: './frontend/html/home.html'
        }),
    ]
};
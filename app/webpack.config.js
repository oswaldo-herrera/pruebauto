const path = require('path');

module.exports = {
  entry: [
    './src/index.js'
  ],
  mode: 'development',
  output: {
    path: path.resolve(__dirname,'temp'),
      filename: 'main.js'
  },
  module: {
    rules: [
      {
        test: /\.html$/i,
        use: ['html-loader'],
      },
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: ["babel-loader"]
      },
      {
        test: /\.css$/,
        use: ["style-loader", {
          loader: "css-loader",
          options: {
            modules: true,
          },
        }]
      },
      {
        test: /\.s[ac]ss$/i,
        use: [
            "style-loader",
            "css-loader",
            "sass-loader",
        ]
      },
      {
        test: /\.(png|ico|webmanifest|jpe?g|gif)$/i,
        use: [{
          loader: "file-loader",
          options: {
            name: '[name].[ext]',
            publicPath: '/static/',
          }
        }],
      },
      {
        test: /\.svg$/,
        use: [
          {
            loader: 'svg-url-loader',
          },
        ],
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/i,
        type: "asset/inline",
      },
    ]
  },
  resolve: {
    extensions: ['.ts', '.tsx','.js','.jsx','.png'],
  },
};
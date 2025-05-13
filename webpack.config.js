const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { InjectManifest } = require('workbox-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';

  return {
    entry: './src/js/index.js',

    output: {
      filename: 'bundle.js',
      path: path.resolve(__dirname, 'dist'),
      clean: true,
    },

    devServer: {
      static: {
        directory: path.join(__dirname, 'dist'),
      },
      compress: true,
      port: 9000,
      open: true,
      headers: {
        'Cache-Control': 'no-store',
      },
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
          generator: {
            filename: 'assets/images/[hash][ext][query]'
          }
        },
      ],
    },

    plugins: [
      new HtmlWebpackPlugin({
        template: './src/index.html',
        filename: 'index.html',
      }),
      new CopyWebpackPlugin({
        patterns: [
          { from: 'src/assets', to: 'assets' },
          { from: 'src/manifest.json', to: 'manifest.json' },
          { from: 'src/offline.html', to: 'offline.html' },
        ],
      }),
      new InjectManifest({
        swSrc: './src/js/sw.js',
        swDest: 'sw.js',
        exclude: [
          /\.map$/,
          /manifest\.json$/,
        ],
      }),
    ],
    devtool: isProduction ? 'source-map' : 'eval-source-map',
  };
};
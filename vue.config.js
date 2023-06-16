/* eslint-disable */
const MonacoWebpackPlugin = require("monaco-editor-webpack-plugin");

module.exports = {
  productionSourceMap: false,
  // publicPath: '/insdot-web/dist/',
  publicPath: "/test-js-editor/dist/",
  devServer: {
    https: true,
    port: 8088,
    disableHostCheck: true,
    headers: {
      "Access-Control-Allow-Origin": "*",
    },
  },
  chainWebpack: (config) => {
    config.module
      .rule(".text")
      .test(/\.xml$/)
      .test(/\.jo$/)
      .use("text-loader")
      .loader("text-loader")
      .end();
  },
  configureWebpack: {
    plugins: [new MonacoWebpackPlugin()],
  },
};

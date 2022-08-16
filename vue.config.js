/* eslint-disable @typescript-eslint/no-var-requires */

module.exports = {
  productionSourceMap: false,
  publicPath: '/insdot-web/dist/',
  devServer: {
    https: true,
    disableHostCheck: true,
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
  },

}

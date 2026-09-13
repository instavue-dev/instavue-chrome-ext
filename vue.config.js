// Builds src/ into a single unhashed insta-vue.js + insta-vue.css in ext/.
// Static extension files (manifest.json, popup.*, icon-128.png) live in public/
// and are copied into ext/ on every build, so ext/ is fully generated.
module.exports = {
  outputDir: 'ext',
  filenameHashing: false,
  productionSourceMap: true,

  css: {
    extract: {
      filename: 'insta-vue.css',
    },
  },

  configureWebpack: {
    output: {
      filename: 'insta-vue.js',
    },
    optimization: {
      // Keep everything in one file - no vendor chunk
      splitChunks: false,
    },
  },

  chainWebpack: config => {
    // Not a web page - no index.html or preload hints
    config.plugins.delete('html');
    config.plugins.delete('preload');
    config.plugins.delete('prefetch');

    // Template whitespace handling of the original (Vue CLI 3 era) build
    config.module
      .rule('vue')
      .use('vue-loader')
      .tap(options => {
        const {whitespace, ...rest} = options.compilerOptions || {};
        options.compilerOptions = {...rest, preserveWhitespace: false};
        return options;
      });
  },
};

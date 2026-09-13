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
    // fonts and icons are inlined on purpose
    performance: {
      hints: false,
    },
  },

  chainWebpack: config => {
    // The CSS is injected into arbitrary pages, so fonts and icons can not be
    // referenced by path - inline everything as data URIs.
    config.module.rule('fonts').use('url-loader').tap(options => ({...options, limit: Infinity}));
    config.module.rule('images').use('url-loader').tap(options => ({...options, limit: Infinity}));
    config.module.rule('svg').uses.clear();
    config.module.rule('svg').use('url-loader').loader('url-loader').options({limit: Infinity, esModule: false});

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

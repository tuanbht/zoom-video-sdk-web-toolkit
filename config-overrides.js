module.exports = function override(config, env) {
  config.output = {
    ...config.output,
    filename: 'static/index.js',
    chunkFilename: 'static/index.chunk.js'
  };
  config.plugins.map((plugin, i) => {
    if (plugin.options && plugin.options.filename && plugin.options.filename.includes('static/css')) {
      config.plugins[i].options = {
        ...config.plugins[i].options,
        filename: 'static/styles.css',
        chunkFilename: 'static/styles.css'
      };
    }
  });
  console.log('Additional config was applied through config-overrides.js');
  return config;
};

// ***********************************************************
// This example plugins/index.js can be used to load plugins
//
// You can change the location of this file or turn off loading
// the plugins file with the 'pluginsFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/plugins-guide
// ***********************************************************

// This function is called when a project is opened or re-opened (e.g. due to
// the project's config changing)

const webpack = require("@cypress/webpack-preprocessor");

module.exports = (on, config) => {
  const options = {
    webpackOptions: {
      module: {
        rules: [
          {
            loader: "ts-loader",
            options: { transpileOnly: true },
            test: /\.tsx?$/,
          },
        ],
      },
      resolve: {
        extensions: [".ts", ".tsx", ".js"],
      },
    },
  };

  // `on` is used to hook into various events Cypress emits
  // `config` is the resolved Cypress config
  on("file:preprocessor", webpack(options));
};

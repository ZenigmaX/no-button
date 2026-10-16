// Marks the iMessage target as a real Messages extension
// (productType com.apple.product-type.app-extension.messages, as Xcode's iMessage template does).
// @bacons/apple-targets creates it as a plain app-extension.
const { withXcodeProjectBeta } = require('@bacons/apple-targets/build/with-bacons-xcode');

const MESSAGES = 'com.apple.product-type.app-extension.messages';

module.exports = function withMessagesExtensionType(config, { targetName = 'NOButtonMessages' } = {}) {
  return withXcodeProjectBeta(config, (config) => {
    const project = config.modResults;
    let found = false;
    for (const target of project.rootObject.props.targets) {
      if (target.props.name === targetName) {
        target.props.productType = MESSAGES;
        found = true;
      }
    }
    if (!found) console.warn(`[withMessagesExtensionType] target ${targetName} not found`);
    return config;
  });
};

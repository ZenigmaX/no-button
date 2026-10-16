/** @type {import('@bacons/apple-targets/app.plugin').ConfigFunction} */
module.exports = (config) => ({
  type: 'imessage',
  name: 'NOButtonMessages',
  displayName: 'NO Button',
  bundleIdentifier: 'com.eugeneproskuryn.nobutton.messages',
  deploymentTarget: '15.1',
  frameworks: ['Messages', 'AVFoundation', 'UIKit'],
});

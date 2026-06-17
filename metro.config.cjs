const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// Configure Closure Compiler to suppress warnings about undeclared variables
// These are globals provided by React Native runtime that don't need warnings
config.transformer = config.transformer || {};
config.transformer.minifierConfig = config.transformer.minifierConfig || {};
config.transformer.minifierConfig.suppress = [
  "undefinedVar",
  "undefinedVars"
];

module.exports = withNativeWind(config, { input: "./global.css" });
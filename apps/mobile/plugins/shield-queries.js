/**
 * Adds a narrow `<queries>` block so the app can see launcher apps
 * (for the Shield app picker, icons, and labels) without the broad
 * QUERY_ALL_PACKAGES permission.
 */
const { withAndroidManifest } = require('@expo/config-plugins');

const LAUNCHER_INTENT = {
  intent: [
    {
      action: [{ $: { 'android:name': 'android.intent.action.MAIN' } }],
      category: [{ $: { 'android:name': 'android.intent.category.LAUNCHER' } }],
    },
  ],
};

function withShieldQueries(config) {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults.manifest;
    manifest.queries = manifest.queries || [];
    const alreadyAdded = manifest.queries.some(
      (entry) =>
        entry &&
        entry.intent &&
        JSON.stringify(entry.intent) === JSON.stringify(LAUNCHER_INTENT.intent),
    );
    if (!alreadyAdded) {
      manifest.queries.push(LAUNCHER_INTENT);
    }
    return config;
  });
}

module.exports = withShieldQueries;

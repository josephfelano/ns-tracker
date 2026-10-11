// Loads the tracker as an app on the shared shell (shell/). index.html lists this file in
// HUB_CONFIG; it writes the tracker's stylesheet and scripts, in dependency order, relative to
// wherever this file sits.
(function () {
  'use strict';
  const base = document.currentScript.src.replace(/[^/]*$/, '');
  const files = ['bank.js', 'core.js', 'store.js', 'ui.js', 'views-core.js', 'xlsx.js', 'import-prework.js', 'views-work.js', 'app.js'];
  document.write('<link rel="stylesheet" href="' + base + 'app/styles.css">');
  files.forEach((f) => document.write('<script src="' + base + 'app/' + f + '"></scr' + 'ipt>'));
})();

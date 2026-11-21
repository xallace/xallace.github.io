/* xallace type system: canvas text is drawn with whatever font is loaded at that moment.
   Load the faces canvases use, then send one resize so the apps redraw with them. */
(function () {
  if (!document.fonts || !document.fonts.load) return;
  var want = ['400 12px "Iosevka Charon Mono"', '500 12px "Iosevka Charon Mono"', '700 12px "Iosevka Charon Mono"',
              '400 12px "Iosevka Charon"', '700 12px "Iosevka Charon"', '400 12px "Libre Caslon Text"'];
  Promise.all(want.map(function (f) { return document.fonts.load(f); })).then(function () {
    setTimeout(function () { window.dispatchEvent(new Event('resize')); }, 0);
  }).catch(function () {});
})();

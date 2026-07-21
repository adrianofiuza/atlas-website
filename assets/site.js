/* Atlas — collapse the phantom blank space that Chrome on iOS (and other
   browsers that open the App Store sheet in-page) leaves below the footer
   after the sheet is dismissed.

   Observed behaviour: it's fine on load; tapping a Download link opens the
   native App Store sheet; after dismissing it the browser inflates the page's
   scrollable height by roughly one screen. A full reload clears it (so a fresh
   layout collapses it too), and it only becomes visible once you scroll — and
   the sheet fires no reliable focus/visibility event — so we also watch scroll
   and touch. When a real, large gap is detected we force a full relayout, which
   collapses the scrollable area back to the content height. */
(function () {
  function viewH() { return window.innerHeight || document.documentElement.clientHeight || 0; }

  function docH() {
    var d = document.documentElement, b = document.body;
    return Math.max(d.scrollHeight || 0, d.offsetHeight || 0, b ? b.scrollHeight || 0 : 0);
  }

  function gapBelowFooter() {
    var f = document.querySelector('footer');
    if (!f) return 0;
    var bottom = f.getBoundingClientRect().bottom + (window.pageYOffset || 0);
    return docH() - bottom;
  }

  var busy = false, misses = 0;
  function collapse() {
    if (busy) return;
    if (gapBelowFooter() < 64) return;          // no real gap -> leave the page alone
    if (misses >= 4) return;                    // relayout isn't helping -> stop, avoid a jank loop
    busy = true;
    var b = document.body, y = window.pageYOffset || 0;
    b.style.display = 'none';
    void b.offsetHeight;                         // force a full relayout while hidden...
    b.style.display = '';                        // ...restored before any paint, so no visible flash
    var maxY = Math.max(0, docH() - viewH());
    window.scrollTo(0, Math.min(y, maxY));       // keep the scroll position within the corrected height
    misses = gapBelowFooter() < 64 ? 0 : misses + 1;
    busy = false;
  }

  var t;
  function schedule() { clearTimeout(t); t = setTimeout(collapse, 50); }

  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('touchmove', schedule, { passive: true });
  window.addEventListener('touchend', schedule, { passive: true });
  window.addEventListener('resize', schedule);
  window.addEventListener('focus', schedule);
  window.addEventListener('pageshow', schedule);
  document.addEventListener('visibilitychange', function () { if (!document.hidden) schedule(); });
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', schedule);
    window.visualViewport.addEventListener('scroll', schedule);
  }
})();

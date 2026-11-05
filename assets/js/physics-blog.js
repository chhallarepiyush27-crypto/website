
(() => {
  'use strict';
  const article = document.querySelector('.blog-article-body');
  const bar = document.querySelector('.read-progress');
  function progress() {
    if (!article || !bar) return;
    const rect = article.getBoundingClientRect();
    const distance = Math.max(1, article.offsetHeight - window.innerHeight);
    bar.style.width = Math.min(100, Math.max(0, -rect.top / distance * 100)) + '%';
  }
  addEventListener('scroll', progress, {passive:true});
  addEventListener('resize', progress);
  progress();

})();

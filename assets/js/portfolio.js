    const header=document.querySelector('#site-header');
    const toggle=document.querySelector('.menu-toggle');
    const links=document.querySelector('#nav-links');
    const updateHeader=()=>header.classList.toggle('scrolled',window.scrollY>24);
    updateHeader();window.addEventListener('scroll',updateHeader,{passive:true});
    toggle.addEventListener('click',()=>{const open=links.classList.toggle('open');toggle.setAttribute('aria-expanded',String(open));toggle.setAttribute('aria-label',open?'Close menu':'Open menu');header.classList.toggle('menu-open',open)});
    links.querySelectorAll('a').forEach(link=>link.addEventListener('click',()=>{links.classList.remove('open');header.classList.remove('menu-open');toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-label','Open menu')}));
    document.querySelector('#year').textContent=new Date().getFullYear();
    if('IntersectionObserver' in window){const observer=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('visible');observer.unobserve(entry.target)}})},{threshold:.1});document.querySelectorAll('.reveal').forEach(el=>observer.observe(el))}else document.querySelectorAll('.reveal').forEach(el=>el.classList.add('visible'));

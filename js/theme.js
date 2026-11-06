/* Biz Matrix light/dark theme: follows the system until the visitor picks one. Load in <head> to avoid a flash. */
(function(){
  var KEY="bm_theme",root=document.documentElement,mq=window.matchMedia?matchMedia("(prefers-color-scheme: dark)"):null;
  function saved(){try{return localStorage.getItem(KEY)}catch(e){return null}}
  function current(){return saved()||(mq&&mq.matches?"dark":"light")}
  function apply(t){root.setAttribute("data-theme",t);root.style.colorScheme=t;var b=document.getElementById("bmThemeBtn");if(b){b.setAttribute("aria-pressed",t==="dark");b.setAttribute("aria-label",t==="dark"?"Switch to light mode":"Switch to dark mode");b.title=b.getAttribute("aria-label");b.innerHTML=t==="dark"?SUN:MOON}}
  var MOON='<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>';
  var SUN='<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4.5"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>';
  apply(current());
  if(mq&&mq.addEventListener)mq.addEventListener("change",function(){if(!saved())apply(current())});
  function mount(){
    if(document.getElementById("bmThemeBtn"))return;
    var b=document.createElement("button");b.id="bmThemeBtn";b.type="button";b.className="bm-theme-btn";
    b.onclick=function(){var t=root.getAttribute("data-theme")==="dark"?"light":"dark";try{localStorage.setItem(KEY,t)}catch(e){}apply(t)};
    document.body.appendChild(b);apply(current());
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",mount);else mount();
})();

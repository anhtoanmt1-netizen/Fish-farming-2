/* OCEAN LIFE – khởi động bản độc lập (web/PWA và APK Capacitor) */
(function(){
  'use strict';
  var root = document.documentElement;
  function layout(){ root.classList.toggle('ls', innerWidth > innerHeight); }
  layout(); addEventListener('resize', layout); addEventListener('orientationchange', function(){ setTimeout(layout, 250); });

  var def = window.__oceanDef;
  if(!def){ document.getElementById('boot').textContent = 'Lỗi tải trò chơi. Hãy mở lại ứng dụng.'; return; }
  var boot = document.getElementById('boot'); if(boot) boot.remove();
  def.mount(document.createElement('div'));
  def.show();

  var cap = window.Capacitor, native = !!(cap && cap.isNativePlatform && cap.isNativePlatform());
  if(native){
    /* Nút Back của Android: đóng lớp trên cùng; nhấn hai lần để thoát */
    var App = cap.Plugins && cap.Plugins.App, last = 0;
    if(App && App.addListener){
      App.addListener('backButton', function(){
        if(window.OC && OC.ui && OC.ui.back && OC.ui.back()) return;
        var t = Date.now();
        if(t - last < 2000){ if(OC.save) OC.save(); App.exitApp(); return; }
        last = t; if(OC.toast) OC.toast('Nhấn Back lần nữa để thoát', 'info');
      });
      App.addListener('pause', function(){ if(window.OC){ if(OC.save) OC.save(); if(OC.audioHold) OC.audioHold(); } });
      App.addListener('resume', function(){ if(window.OC && OC.audioRelease && OC.running) OC.audioRelease(); });
      App.addListener('appStateChange', function(st){ if(!window.OC) return; if(st && st.isActive === false){ if(OC.save) OC.save(); if(OC.audioHold) OC.audioHold(); } else if(OC.audioRelease && OC.running) OC.audioRelease(); });
    }
  } else if('serviceWorker' in navigator && /^https?:$/.test(location.protocol)){
    navigator.serviceWorker.register('sw.js').catch(function(){});
  }
})();

chrome.tabs.query({'active': true, 'lastFocusedWindow': true}, function (tabs) {
  console.log("Injecting the script from file");
  let tabId = tabs[0].id;

  chrome.scripting.executeScript({
    target: {tabId},
    func: function () {
      const head = (document.head || document.documentElement);
      const script = document.createElement('script');
      script.src = chrome.runtime.getURL('insta-vue.js');
      head.appendChild(script);
    }
  })
  ;
  chrome.scripting.insertCSS({
    target: {tabId},
    files: ['insta-vue.css']
  });
});

setTimeout(() => {
  window.close();
}, 100);

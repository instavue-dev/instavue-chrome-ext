// $vnode.componentOptions.Ctor.extendOptions.name

const urls = ["insta-vue.js", "insta-vue.css"];

urls.map(url => {
  return fetch(chrome.runtime.getURL(url)).then(result => {
    return result.text().then(result => {
      if (/\.js$/.test(url)) {
        return injectScript(result);
      } else {
        return injectStyle(result);
      }
    });
  });
});

function injectScript(content) {
  const code = `
  (function() {
    const head = (document.head||document.documentElement);
    const script = document.createElement('script');
    script.textContent = \`${content.replace(/\\/g, '\\\\').replace(/\$/g, '\\$').replace(/`/g, '\\`')}\`;
    head.appendChild(script);
  }())
  `;

  execute(code);
}

function execute(code) {
  chrome.tabs.query({'active': true, 'lastFocusedWindow': true}, function (tabs) {
    console.log("Injecting the script from file");
    chrome.tabs.executeScript(tabs[0].id, {code}, () => {
    });
  });
}

function injectStyle(content) {
  const code = `
  (function() {
    const head = (document.head||document.documentElement);
    const style = document.createElement('style');
    style.textContent = \`${content}\`;
    head.appendChild(style);
  }())
  `;

  execute(code);
}

setTimeout(() => {
  window.close();
}, 100);

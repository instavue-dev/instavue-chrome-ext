import InstaVue from "./InstaVue";

export default function(canvas) {
  if (window.quickVue) {
    // TODO: also destroy Vue instance
    window.quickVue.destroy();
  }

  function walk(node, fn) {
    if (node.childNodes) {
      for (let i = 0, l = node.childNodes.length; i < l; i++) {
        const child = node.childNodes[i];
        const stop = fn(child);

        if (!stop) {
          walk(child, fn);
        }
      }
    }

    // also walk shadow DOM
    if (node.shadowRoot) {
      walk(node.shadowRoot, fn)
    }
  }

  const roots = [];
  walk(document.body, node => {
    if ('insta_vue_container' === node.id) {
      return true;
    }

    if (node.__vue__) {
      roots.push(node.__vue__);

      return true;
    }
  });

  const insta = window.quickVue = new InstaVue(roots);
  insta.install(canvas);

  insta.render();

  console.log("QuickVue injected");

  return insta;
};

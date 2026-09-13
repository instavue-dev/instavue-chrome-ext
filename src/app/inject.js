import InstaVue from "./InstaVue";
import {rootFromNode} from "./adapters";

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

  const adapters = {};
  const roots = [];
  walk(document.body, node => {
    if ('insta_vue_container' === node.id) {
      return true;
    }

    const root = rootFromNode(node, adapters);
    if (root) {
      roots.push(root);

      return true;
    }
  });

  const insta = window.quickVue = new InstaVue(roots, adapters);
  insta.install(canvas);

  insta.render();

  console.log("QuickVue injected");

  return insta;
};

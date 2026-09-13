import Vue2Adapter from "./Vue2Adapter";
import Vue3Adapter from "./Vue3Adapter";

export const ADAPTERS = [Vue2Adapter, Vue3Adapter];

/**
 * Find the framework root mounted on a DOM node, if any.
 *
 * @param {Node} node
 * @param {Object} adapters live adapter instances keyed by adapter id
 * @return {{adapter, instance}|null}
 */
export function rootFromNode(node, adapters) {
  for (const Adapter of ADAPTERS) {
    const instance = Adapter.rootFromNode(node);
    if (instance) {
      const adapter = adapters[Adapter.id] || (adapters[Adapter.id] = new Adapter());

      return {adapter, instance};
    }
  }

  return null;
}

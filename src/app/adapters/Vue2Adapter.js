import {markRaw} from 'vue';
import InstaComponent from "../model/InstaComponent";
import {classify, camelize, basename, getPropType, processRouteContext, unionRect} from "./shared";

/**
 * Data collection for Vue 2 apps (`el.__vue__` roots, `$children` tree).
 * This is the original InstaVue collection code, only wrapped into the
 * adapter interface shared with Vue3Adapter.
 */
export default class Vue2Adapter {

  static get id() {
    return 'vue2';
  }

  static get label() {
    return 'Vue 2';
  }

  /**
   * @param {Node} node
   * @return {Object|null} root Vue instance mounted on this node
   */
  static rootFromNode(node) {
    return node.__vue__ || null;
  }

  constructor() {
    this._byInstance = new WeakMap();

    markRaw(this);
  }

  getVersion(instance) {
    const Vue = instance.constructor;
    // instance.constructor is a Vue.extend() subclass, walk to the base Vue
    return (Vue && Vue.version) || (Vue && Vue.super && Vue.super.version) || (window.Vue && window.Vue.version) || null;
  }

  /**
   * InstaComponent for the component that owns a DOM node, if known.
   * Vue 2 stores the instance on the component's root element.
   */
  resolveNode(node) {
    return node.__vue__ ? (this._byInstance.get(node.__vue__) || null) : null;
  }

  getInstanceName(instance) {
    const name = this.getComponentName(instance.$options || instance.fnOptions || {});
    if (name) {
      return name;
    }

    return instance.$root === instance ? 'Root' : 'Anonymous Component';
  }

  getComponentName(options) {
    const name = options.name || options._componentTag;
    if (name) {
      return name;
    }

    const file = options.__file; // injected by vue-loader
    if (file) {
      return classify(basename(file, '.vue'));
    }
  }

  getInstancesList(root) {
    const children = [];

    this._walkComponent(root, children);

    return children;
  }

  _walkComponent(instance, children, level = 0, parent = null) {
    const component = new InstaComponent({
      adapter: this,
      instance,
      parent,
      name: this.getInstanceName(instance),
      level: level,
      area: this._getComponentArea(instance),
    });

    this._byInstance.set(instance, component);
    if (instance.$el) {
      instance.$el.__insta_vue__ = component;
    }

    children.push(component);

    component.children = instance.$children.map(child => this._walkComponent(
      child,
      children,
      level + 1,
      component,
    ));


    return component;
  }

  _getComponentArea(instance) {
    const rect = this.getRect(instance);

    return rect ? rect.width * rect.height : 0;
  }

  getRootElements(instance) {
    return instance.$el && 1 === instance.$el.nodeType ? [instance.$el] : [];
  }

  getElement(instance) {
    return instance.$el || null;
  }

  getRect(instance) {
    return unionRect(this.getRootElements(instance));
  }

  getUid(instance) {
    return instance._uid;
  }

  forceUpdate(instance) {
    instance.$forceUpdate();
  }

  /**
   * Write a value into the instance by path (['todo', 'text']).
   */
  setValue(instance, path, value) {
    path = path.slice();
    const last = path.pop();

    let data = instance;
    path.forEach(p => data = data[p]);

    data[last] = value;
  }

  getInstanceState(instance) {
    return processProps(instance).concat(
      processState(instance),
      // processRefs(instance),
      processComputed(instance),
      processInjected(instance),
      processRouteContext(instance),
      processVuexGetters(instance),
      // processFirebaseBindings(instance),
      // processObservables(instance),
      processAttrs(instance),
    );
  }
}

const isLegacy = false;
const propModes = ['default', 'sync', 'once'];

/**
 * Process the props of an instance.
 * Make sure return a plain object because window.postMessage()
 * will throw an Error if the passed object contains Functions.
 *
 * @param {Vue} instance
 * @return {Array}
 */

function processProps(instance) {
  let props;
  if (isLegacy && (props = instance._props)) {
    // 1.x
    return Object.keys(props).map(key => {
      const prop = props[key];
      const options = prop.options;
      return {
        type: 'props',
        key: prop.path,
        value: instance[prop.path],
        meta: options ? {
          type: options.type ? getPropType(options.type) : 'any',
          required: !!options.required,
          mode: propModes[prop.mode]
        } : {}
      }
    })
  } else if ((props = instance.$options.props)) {
    // 2.0
    const propsData = [];
    for (let key in props) {
      const prop = props[key];
      key = camelize(key);
      propsData.push({
        type: 'props',
        key,
        value: instance[key],
        meta: prop ? {
          type: prop.type ? getPropType(prop.type) : 'any',
          required: !!prop.required
        } : {
          type: 'invalid'
        },
        editable: false,
        // editable: SharedData.editableProps,
      });
    }

    return propsData;
  } else {
    return []
  }
}

function processAttrs(instance) {
  return Object.entries(instance.$attrs || {}).map(([key, value]) => {
    return {
      type: '$attrs',
      key,
      value
    }
  })
}

/**
 * Process state, filtering out props and "clean" the result
 * with a JSON dance. This removes functions which can cause
 * errors during structured clone used by window.postMessage.
 *
 * @param {Vue} instance
 * @return {Array}
 */

function processState(instance) {
  const props = isLegacy ? instance._props : instance.$options.props;
  const getters = instance.$options.vuex && instance.$options.vuex.getters;

  return Object.keys(instance._data)
    .filter(key => (
      !(props && key in props) &&
      !(getters && key in getters)
    ))
    .map(key => ({
      type: 'data',
      key,
      value: instance._data[key],
      editable: true
    }));
}

/**
 * Process the computed properties of an instance.
 *
 * @param {Vue} instance
 * @return {Array}
 */

function processComputed(instance) {
  const computed = [];
  const defs = instance.$options.computed || {};
  // use for...in here because if 'computed' is not defined
  // on component, computed properties will be placed in prototype
  // and Object.keys does not include
  // properties from object's prototype
  for (const key in defs) {
    const def = defs[key];
    const type = typeof def === 'function' && def.vuex ? 'vuex bindings' : 'computed';
    // use try ... catch here because some computed properties may
    // throw error during its evaluation
    let computedProp = null;
    try {
      computedProp = {
        type,
        key,
        value: instance[key]
      };
    } catch (e) {
      computedProp = {
        type,
        key,
        value: '(error during evaluation)'
      };
    }

    computed.push(computedProp);
  }

  return computed;
}

/**
 * Process injected values.
 *
 * @param {Vue} instance
 * @return {Array}
 */

function processInjected(instance) {
  const injected = instance.$options.inject;

  if (injected) {
    return Object.keys(injected).map(key => {
      return {
        type: 'injected',
        key,
        value: instance[key]
      }
    });
  } else {
    return [];
  }
}

/**
 * Process Vuex getters.
 *
 * @param {Vue} instance
 * @return {Array}
 */

function processVuexGetters(instance) {
  const getters = instance.$options.vuex && instance.$options.vuex.getters;
  if (getters) {
    return Object.keys(getters).map(key => {
      return {
        type: 'vuex getters',
        key,
        value: instance[key]
      }
    });
  } else {
    return [];
  }
}

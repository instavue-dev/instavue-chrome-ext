import {markRaw} from 'vue';
import InstaComponent from "../model/InstaComponent";
import {classify, camelize, basename, getPropType, processRouteContext, unionRect} from "./shared";

/**
 * Data collection for Vue 3 apps.
 *
 * Works on production builds too: `el.__vue_app__`, `container._vnode`,
 * `instance.subTree`, `instance.parent`, `instance.props/data/setupState/proxy`
 * are always present. Things that only exist in dev (or with
 * `__VUE_PROD_DEVTOOLS__`) - `app._instance`, `el.__vueParentComponent`,
 * `devtoolsRawSetupState`, `type.__file` - are used opportunistically.
 *
 * See docs/vue3.md for what a production build hides and how to expose it
 * in a staging build.
 */

// Duck-typed @vue/reactivity checks - we can not import the page's Vue.
const isRef = v => !!(v && true === v.__v_isRef);
const isComputedRef = v => isRef(v) && 'effect' in v;
const isReactive = v => !!(v && (v.__v_isReactive || v.__v_isReadonly));
const toRaw = v => (v && v.__v_raw) ? toRaw(v.__v_raw) : v;

const isComponentDefinition = v => !!v && 'object' === typeof v && !isRef(v) && !isReactive(v)
  && ('render' in v || 'setup' in v || '__name' in v || '__file' in v || 'template' in v);

export default class Vue3Adapter {

  static get id() {
    return 'vue3';
  }

  static get label() {
    return 'Vue 3';
  }

  /**
   * @param {Node} node
   * @return {Object|null} internal instance of the root component mounted on this node
   */
  static rootFromNode(node) {
    const app = node.__vue_app__;
    if (!app) {
      return null;
    }

    // app._instance is only set in dev / with __VUE_PROD_DEVTOOLS__,
    // container._vnode is always set by the renderer.
    return app._instance
      || (node._vnode && node._vnode.component)
      || (app._container && app._container._vnode && app._container._vnode.component)
      || null;
  }

  constructor() {
    this._byInstance = new WeakMap();

    markRaw(this);
  }

  getVersion(instance) {
    const app = instance.appContext && instance.appContext.app;
    return (app && app.version) || null;
  }

  /**
   * InstaComponent for the component that owns a DOM node, if known.
   * `__vueParentComponent` is set on every element in dev builds only.
   */
  resolveNode(node) {
    const owner = node.__vueParentComponent;
    return owner ? (this._byInstance.get(owner) || null) : null;
  }

  getInstanceName(instance) {
    const type = instance.type || {};

    const name = type.name || type.__name || type.displayName
      || this._registeredName(instance)
      || (type.__file && classify(basename(type.__file, '.vue')));

    if (name) {
      return name;
    }

    return instance.parent ? 'Anonymous Component' : 'Root';
  }

  /**
   * Name under which the component was registered (locally in the parent or
   * globally on the app). Recovers names of production-minified components.
   */
  _registeredName(instance) {
    const type = instance.type;
    const registries = [
      instance.parent && instance.parent.type && instance.parent.type.components,
      instance.appContext && instance.appContext.components,
    ];

    for (const registry of registries) {
      if (!registry) {
        continue;
      }

      for (const key in registry) {
        const definition = registry[key];
        if (definition === type || (definition && definition.__asyncResolved === type)) {
          return key;
        }
      }
    }

    return null;
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
    this.getRootElements(instance).forEach(el => el.__insta_vue__ = component);

    children.push(component);

    component.children = getChildInstances(instance.subTree)
      .filter(child => !child.isUnmounted)
      .map(child => this._walkComponent(
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

  /**
   * All top-level DOM elements rendered by the component
   * (several for fragment / multi-root components).
   */
  getRootElements(instance) {
    const elements = [];
    collectElements(instance.subTree, elements);

    return elements;
  }

  getElement(instance) {
    return this.getRootElements(instance)[0] || (instance.subTree && instance.subTree.el) || null;
  }

  getRect(instance) {
    return unionRect(this.getRootElements(instance));
  }

  getUid(instance) {
    return instance.uid;
  }

  forceUpdate(instance) {
    if (instance.proxy && instance.proxy.$forceUpdate) {
      instance.proxy.$forceUpdate();
    } else if (instance.update) {
      instance.update();
    }
  }

  /**
   * Write a value into the instance by path (['todo', 'text']).
   *
   * Setup bindings are written on `setupState` itself: its proxyRefs wrapper
   * assigns through refs, and the public proxy refuses writes to
   * `<script setup>` bindings. Everything else (data, props, ...) goes through
   * the public proxy like `this.x = value` would.
   */
  setValue(instance, path, value) {
    path = path.slice();
    const last = path.pop();
    const first = path.length ? path[0] : last;

    const state = instance.setupState;
    let data = state && Object.prototype.hasOwnProperty.call(state, first)
      ? state
      : (instance.proxy || instance.ctx);

    path.forEach(p => data = data[p]);

    data[last] = value;
  }

  getInstanceState(instance) {
    return processProps(instance).concat(
      processData(instance),
      processSetupState(instance),
      processComputed(instance),
      processInjected(instance),
      processRouteContext(instance.proxy || {}),
      processAttrs(instance),
    );
  }
}

/**
 * Child component instances of a vnode subtree, skipping non-component
 * vnodes (elements, fragments, teleports, suspense boundaries).
 * Same walk as the one in vue-devtools' Vue 3 backend.
 */
function getChildInstances(vnode) {
  const list = [];

  if (!vnode) {
    return list;
  }

  if (vnode.component) {
    list.push(vnode.component);
  } else if (vnode.suspense) {
    list.push(...getChildInstances(vnode.suspense.activeBranch));
  } else if (Array.isArray(vnode.children)) {
    vnode.children.forEach(child => {
      if (child && 'object' === typeof child) {
        list.push(...getChildInstances(child));
      }
    });
  }

  return list;
}

function collectElements(vnode, out) {
  if (!vnode || 'object' !== typeof vnode) {
    return;
  }

  if (vnode.component) {
    return collectElements(vnode.component.subTree, out);
  }

  if (vnode.suspense) {
    return collectElements(vnode.suspense.activeBranch, out);
  }

  if (vnode.el && 1 === vnode.el.nodeType) {
    out.push(vnode.el);
    return;
  }

  // Fragment / Teleport: `el` is an anchor text or comment node
  if (Array.isArray(vnode.children)) {
    vnode.children.forEach(child => collectElements(child, out));
  }
}

/**
 * Process the props of an instance.
 *
 * @return {Array}
 */
function processProps(instance) {
  const props = instance.props || {};
  const propsDef = (instance.propsOptions && instance.propsOptions[0]) || {};

  return Object.keys(props).map(key => {
    const prop = propsDef[camelize(key)];

    return {
      type: 'props',
      key,
      value: props[key],
      meta: prop ? {
        type: prop.type ? getPropType(prop.type) : 'any',
        required: !!prop.required
      } : {
        type: 'invalid'
      },
      editable: false,
    };
  });
}

/**
 * Options API `data()`.
 */
function processData(instance) {
  const data = instance.data;
  if (!data || 'object' !== typeof data) {
    return [];
  }

  return Object.keys(data).map(key => ({
    type: 'data',
    key,
    value: data[key],
    editable: true
  }));
}

/**
 * Bindings returned from `setup()` / declared in `<script setup>`.
 *
 * In production, `<script setup>` components with an inlined template return
 * nothing from setup() - their state lives in closure variables and can not
 * be reached. See docs/vue3.md.
 */
function processSetupState(instance) {
  const state = instance.setupState;
  if (!state || 'object' !== typeof state) {
    return [];
  }

  // Raw object still holding the refs, to tell refs / computed apart.
  // `__v_raw` is answered by proxyRefs() in every build.
  const raw = instance.devtoolsRawSetupState || state.__v_raw || state;

  return Object.keys(raw)
    .filter(key => !key.startsWith('__') && !key.startsWith('$'))
    .reduce((result, key) => {
      const rawValue = raw[key];

      // methods, imported components, the `props` object from defineProps()
      if ('function' === typeof rawValue || isComponentDefinition(toRaw(rawValue)) || toRaw(rawValue) === toRaw(instance.props)) {
        return result;
      }

      let value;
      try {
        value = state[key];
      } catch (e) {
        value = '(error during evaluation)';
      }

      result.push({
        type: isComputedRef(rawValue) ? 'computed' : 'setup',
        key,
        value,
        editable: !isComputedRef(rawValue),
      });

      return result;
    }, []);
}

/**
 * Options API computed properties.
 */
function processComputed(instance) {
  const computed = [];
  const defs = (instance.type && instance.type.computed) || {};

  for (const key in defs) {
    let computedProp = null;
    try {
      computedProp = {
        type: 'computed',
        key,
        value: instance.proxy[key]
      };
    } catch (e) {
      computedProp = {
        type: 'computed',
        key,
        value: '(error during evaluation)'
      };
    }

    computed.push(computedProp);
  }

  return computed;
}

/**
 * Options API `inject`. Values are resolved onto `instance.ctx` by Vue.
 * (`inject()` calls in setup() land in the setup state.)
 */
function processInjected(instance) {
  let injected = instance.type && instance.type.inject;
  if (!injected) {
    return [];
  }

  const keys = Array.isArray(injected) ? injected : Object.keys(injected);

  return keys.map(key => {
    let value;
    try {
      value = instance.ctx && key in instance.ctx ? instance.ctx[key] : instance.proxy[key];
    } catch (e) {
      value = '(error during evaluation)';
    }

    return {
      type: 'injected',
      key,
      value
    };
  });
}

function processAttrs(instance) {
  return Object.entries(instance.attrs || {}).map(([key, value]) => {
    return {
      type: '$attrs',
      key,
      value
    }
  })
}

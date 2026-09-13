import InstaComponent from "../model/InstaComponent";
import path from "path";

function toUpper(_, c) {
  return c ? c.toUpperCase() : ''
}

function cached(fn) {
  const cache = Object.create(null)
  return function cachedFn(str) {
    const hit = cache[str];
    return hit || (cache[str] = fn(str))
  }
}

const classifyRE = /(?:^|[-_/])(\w)/g;
export const classify = cached((str) => {
  return str && str.replace(classifyRE, toUpper);
});

const camelizeRE = /-(\w)/g;
export const camelize = cached((str) => {
  return str.replace(camelizeRE, toUpper)
})

// Use a custom basename functions instead of the shimed version
// because it doesn't work on Windows
function basename(filename, ext) {
  return path.basename(
    filename.replace(/^[a-zA-Z]:/, '').replace(/\\/g, '/'),
    ext
  )
}


export class VueUtil {

  static getInstanceName(instance) {
    const name = VueUtil.getComponentName(instance.$options || instance.fnOptions || {});
    if (name) {
      return name;
    }

    return instance.$root === instance ? 'Root' : 'Anonymous Component';
  }

  static getComponentName(options) {
    const name = options.name || options._componentTag;
    if (name) {
      return name;
    }

    const file = options.__file; // injected by vue-loader
    if (file) {
      return classify(basename(file, '.vue'));
    }
  }

  static getInstancesList(root) {
    const children = [];

    VueUtil._walkComponent(root, children);

    return children;
  }

  static _walkComponent(instance, children, level = 0) {
    const component = new InstaComponent({
      instance,
      name: VueUtil.getInstanceName(instance),
      level: level,
      area: this._getComponentArea(instance),
    });

    instance.$el.__insta_vue__ = component;

    children.push(component);

    component.children = instance.$children.map(child => VueUtil._walkComponent(
      child,
      children,
      level + 1,
    ));


    return component;
  }

  static _getComponentArea(instance) {
    if (!instance.$el.getBoundingClientRect) {
      return 0;
    }

    const rect = instance.$el.getBoundingClientRect();

    return rect.width * rect.height;
  }
}

const isLegacy = false;
const propModes = ['default', 'sync', 'once'];

export function getInstanceState(instance) {
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
 * Convert prop type constructor to string.
 *
 * @param {Function} fn
 */

const fnTypeRE = /^(?:function|class) (\w+)/;

function getPropType(type) {
  const match = type.toString().match(fnTypeRE);
  return typeof type === 'function'
    ? (match && match[1]) || 'any'
    : 'any'
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
 * Process refs
 *
 * @param {Vue} instance
 * @return {Array}
 */

function processRefs(instance) {
  return Object.keys(instance.$refs)
    .filter(key => instance.$refs[key])
    .map(key => getCustomRefDetails(instance, key, instance.$refs[key]));
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
 * Process Vuex getters.
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
 * Process possible vue-router $route context
 *
 * @param {Vue} instance
 * @return {Array}
 */

function processRouteContext(instance) {
  try {
    const route = instance.$route;
    if (route) {
      const {path, query, params} = route;
      const value = {path, query, params};
      if (route.fullPath) {
        value.fullPath = route.fullPath;
      }
      if (route.hash) {
        value.hash = route.hash;
      }
      if (route.name) {
        value.name = route.name;
      }
      if (route.meta) {
        value.meta = route.meta;
      }
      return [{
        type: 'route',
        key: '$route',
        value: {
          _custom: {
            type: 'router',
            abstract: true,
            value
          }
        }
      }];
    }
  } catch (e) {
    // Invalid $router
  }
  return [];
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

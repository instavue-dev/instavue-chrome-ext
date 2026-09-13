// Helpers shared by the Vue 2 and Vue 3 adapters.

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

// Basename that also works for Windows paths (the shimmed `path` doesn't)
export function basename(filename, ext) {
  const name = filename.replace(/^[a-zA-Z]:/, '').replace(/\\/g, '/').split('/').pop();
  return ext && name.endsWith(ext) ? name.slice(0, -ext.length) : name;
}

/**
 * Convert prop type constructor (or array of them) to string.
 *
 * @param {Function|Function[]} type
 */
const fnTypeRE = /^(?:function|class) (\w+)/;

export function getPropType(type) {
  if (Array.isArray(type)) {
    return type.map(getPropType).join(' | ');
  }

  const match = typeof type === 'function' && type.toString().match(fnTypeRE);
  return typeof type === 'function'
    ? (match && match[1]) || 'any'
    : 'any'
}

/**
 * Process possible vue-router $route context
 *
 * @param {Object} proxy public instance (`this` of the component)
 * @return {Array}
 */
export function processRouteContext(proxy) {
  try {
    const route = proxy.$route;
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
 * Bounding rect of a single element, or the union of several
 * (multi-root / fragment components).
 *
 * @param {Element[]} elements
 * @return {{x, y, left, top, right, bottom, width, height}|null}
 */
export function unionRect(elements) {
  let left = Infinity, top = Infinity, right = -Infinity, bottom = -Infinity;

  elements.forEach(el => {
    if (!el || !el.getBoundingClientRect) {
      return;
    }

    const r = el.getBoundingClientRect();
    if (0 === r.width && 0 === r.height) {
      return;
    }

    left = Math.min(left, r.left);
    top = Math.min(top, r.top);
    right = Math.max(right, r.right);
    bottom = Math.max(bottom, r.bottom);
  });

  if (left === Infinity) {
    return null;
  }

  return {x: left, y: top, left, top, right, bottom, width: right - left, height: bottom - top};
}

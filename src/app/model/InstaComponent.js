import {markRaw} from 'vue';

/**
 * Framework-agnostic view of a component instance. Everything the UI and the
 * renderer need goes through here; the adapter knows how to read the
 * underlying Vue 2 / Vue 3 instance.
 *
 * Instances are marked raw: InstaVue's own UI is a Vue 2 app and would
 * otherwise deep-observe `instance` - i.e. rewrite the inspected app's
 * internals (Vue 3 refs, vnodes, ...) with Vue 2 reactive accessors.
 */
export default class InstaComponent {

  constructor({
    adapter = null,
    instance = null,
    name = null,
    type = null,
    children = [],
    parent = null,
    level = 0,
    area = 0,
  } = {}) {
    this.adapter = adapter;
    this.instance = instance;
    this.name = name;
    this.type = type;
    this.parent = parent;
    this.level = level;
    this.area = area;

    this.children = children;

    markRaw(this);
  }

  get isInvisible() {
    return this.area < 100;
  }

  get children() {
    return this._children;
  }

  set children(value) {
    this._children = value;
    this._children.forEach(child => child.parent = this);
  }

  get _uid() {
    return this.adapter.getUid(this.instance);
  }

  /** First root DOM node of the component (may be a text/comment node) */
  get $el() {
    return this.adapter.getElement(this.instance);
  }

  /** All root elements (several for Vue 3 fragment components) */
  get $els() {
    return this.adapter.getRootElements(this.instance);
  }

  /** Union bounding rect of the root elements, or null if nothing is rendered */
  getRect() {
    return this.adapter.getRect(this.instance);
  }

  getState() {
    return this.adapter.getInstanceState(this.instance);
  }

  forceUpdate() {
    this.adapter.forceUpdate(this.instance);
  }

  setValue(path, value) {
    this.adapter.setValue(this.instance, path, value);
  }
}

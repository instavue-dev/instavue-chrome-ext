export default class InstaComponent {

  constructor({
    instance = null,
    name = null,
    type = null,
    children = [],
    parent = null,
    level = 0,
    area = 0,
  } = {}) {
    this.instance = instance;
    this.name = name;
    this.type = type;
    this.parent = parent;
    this.level = level;
    this.area = area;

    this.children = children;

    this._children.forEach(child => child.parent = this);
  }

  get isInvisible() {
    return this.area < 100;
  }

  get children() {
    return this._children;
  }

  set children(value) {
    this._children = value;
  }

  get _uid() {
    return this.instance._uid;
  }

  get $el() {
    return this.instance.$el;
  }

  get $root() {
    return this.instance.$root;
  }

  get $parent() {
    return this.instance.$parent;
  }
}
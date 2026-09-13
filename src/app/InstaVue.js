import {COLORS, TEXT_ALIGNMENT} from "./constants";
import {RenderUtil, TextStyle, floor} from "./util/RenderUtil";


export default class InstaVue {

  /**
   * @param {{adapter, instance}[]} roots framework roots found on the page
   * @param {Object} adapters live adapter instances keyed by adapter id
   */
  constructor(roots, adapters = {}) {
    this.adapters = Object.values(adapters);
    this.roots = roots.map(({adapter, instance}) => {
      const instances = adapter.getInstancesList(instance);

      return {
        root: instances[0],
        name: instances[0].name,
        framework: adapter.constructor.label,
        version: adapter.getVersion(instance),
        instances,
      };
    });
    this.instances = null;

    this.hoveredInstance = null;
    this._selectedInstance = null;

    this._$renderInterval = null;
    this._$renderRequired = true;

    this._$renderUtil = new RenderUtil();

    this.showInvisibleComponents = false;
    this.showIgnoredComponents = false;
    this.ignoredComponents = [];
  }

  install(canvas) {
    this._canvas = canvas;

    this.adjustCanvas();

    this._attachListeners();

    this._$renderInterval = setInterval(() => {
      if (this._$renderRequired) {
        this.render();
      }

      this._$renderRequired = false;
    }, 50);
  }

  adjustCanvas() {
    this._canvas.style.position = 'absolute';
    this._canvas.style.left = '0';
    this._canvas.style.top = '0';
    this._canvas.style.zIndex = 100000;

    this.setDimension(
      Math.max(document.body.scrollWidth, document.body.clientWidth, window.innerWidth),
      Math.max(document.body.scrollHeight, document.body.clientHeight, window.innerHeight),
    );
  }

  setDimension(w, h) {
    this._canvas.width = w * 2;
    this._canvas.height = h * 2;

    if (this._canvas.style) {
      this._canvas.style.width = w + 'px';
      this._canvas.style.height = h + 'px';
    }

    this._canvas.getContext('2d').scale(2, 2);
  }

  /**
   * @return {InstaComponent|null|undefined} undefined when the point is over InstaVue's own panel
   */
  instanceUnderMouse(x, y) {
    let node = document.elementsFromPoint(x, y)[1];

    if (this.isOwnNode(node)) {
      return undefined;
    }

    while (node && 'BODY' !== node.tagName) {
      const component = this.componentForNode(node);
      if (component && !this.ignoredComponents.includes(component.name)) {
        return component;
      }

      node = node.parentNode;
    }

    return null;
  }

  /**
   * Whether the node belongs to InstaVue's own panel (its events are handled by the panel itself).
   */
  isOwnNode(node) {
    return !!(node && node.closest && node.closest('#insta_vue_container'));
  }

  /**
   * Component whose root element is the node (marked while walking the tree),
   * or the one the framework says owns the node.
   *
   * @return {InstaComponent|null}
   */
  componentForNode(node) {
    if (node.__insta_vue__) {
      return node.__insta_vue__;
    }

    for (const adapter of this.adapters) {
      const component = adapter.resolveNode(node);
      if (component) {
        return component;
      }
    }

    return null;
  }

  destroy() {
    console.log("Destroying instance");

    this._canvas.remove();
    window.quickVue = null;

    this._detachListeners();

    clearInterval(this._$renderInterval);
  }

  _attachListeners() {
    // Mouse move listener
    this._mouseMoveListener = event => {
      const instance = this.instanceUnderMouse(event.clientX, event.clientY);

      if (undefined === instance) {
        // over InstaVue's own panel
        return true;
      }

      this.hoveredInstance = instance;

      document.body.style.cursor = this.hoveredInstance ? 'pointer' : 'default';

      this._$renderRequired = true;
    };
    document.addEventListener('mousemove', this._mouseMoveListener);

    // Click listener
    this._clickListener = event => {
      let instance = this.instanceUnderMouse(event.clientX, event.clientY);

      if (undefined === instance) {
        // over InstaVue's own panel
        return;
      }

      if (instance === this.selectedInstance) {
        instance = null;
      }

      this.selectedInstance = instance;

      this._$renderRequired = true;
    };
    document.addEventListener('click', this._clickListener);

    // Scroll listener
    this._scrollListener = () => {
      this._$renderRequired = true;
    };
    window.addEventListener('scroll', this._scrollListener);
  }

  _detachListeners() {
    document.removeEventListener('mousemove', this._mouseMoveListener);
    document.removeEventListener('click', this._clickListener);
    window.removeEventListener('scroll', this._scrollListener);
  }

  render() {
    if (!this.instances) {
      return;
    }

    const components = this.instances;

    // console.log("Render");
    const ctx = this._canvas.getContext("2d");

    ctx.beginPath();
    ctx.clearRect(0, 0, this._canvas.width, this._canvas.height);
    ctx.closePath();


    const canvasRect = this._canvas.getBoundingClientRect();

    const basePadding = 5;

    components.forEach(component => {
      if (!this.showInvisibleComponents && component.isInvisible) {
        return;
      }

      if (!this.showIgnoredComponents && this.ignoredComponents.includes(component.name)) {
        return;
      }

      const rect = component.getRect();
      if (!rect) {
        return;
      }

      const padding = this._$renderUtil._calculatePadding(basePadding, component);

      ctx.beginPath();
      ctx.setLineDash([10, 7]);
      ctx.strokeWidth = 3;
      const COLOR = COLORS[this._$renderUtil._getNestingLevel(component)];
      ctx.strokeStyle = `rgba(${COLOR}, 0.9)`;

      const x = rect.left - canvasRect.left;
      const y = rect.top - canvasRect.top;

      this._$renderUtil._roundedRect(
        ctx,
        floor(x - padding),
        floor(y - padding),
        floor(rect.width + padding * 2),
        floor(rect.height + padding * 2),
        5,
      );
      ctx.stroke();
    });

    const hoveredRect = this.hoveredInstance && this.hoveredInstance.getRect();
    if (hoveredRect && this.selectedInstance !== this.hoveredInstance) {
      const rect = hoveredRect;

      const COLOR = COLORS[this._$renderUtil._getNestingLevel(this.hoveredInstance)];

      ctx.fillStyle = `rgba(${COLOR}, 0.4)`;
      ctx.setLineDash([]);

      ctx.beginPath();
      const x = rect.left - canvasRect.left;
      const y = rect.top - canvasRect.top;

      const padding = this._$renderUtil._calculatePadding(basePadding, this.hoveredInstance);

      this._$renderUtil._roundedRect(
        ctx,
        floor(x - padding),
        floor(y - padding),
        floor(rect.width + padding * 2),
        floor(rect.height + padding * 2),
        5,
      );

      ctx.stroke();
      ctx.fill();

      ctx.beginPath();
      ctx.strokeWidth = 2;
      ctx.strokeStyle = `rgba(${COLOR}, 1)`;

      ctx.moveTo(x, y);
      ctx.lineTo(x + rect.width, y + rect.height);

      ctx.moveTo(x + rect.width, y);
      ctx.lineTo(x, y + rect.height);
      ctx.stroke();
    }

    const selectedRect = this.selectedInstance && this.selectedInstance.getRect();
    if (selectedRect) {
      const rect = selectedRect;
      ctx.setLineDash([]);

      const COLOR = COLORS[this._$renderUtil._getNestingLevel(this.selectedInstance)];
      ctx.fillStyle = `rgba(${COLOR}, 0.7)`;
      ctx.strokeWidth = 2;
      ctx.strokeStyle = `rgba(${COLOR}, 1)`;

      const padding = this._$renderUtil._calculatePadding(basePadding, this.selectedInstance);

      ctx.beginPath();
      this._$renderUtil._roundedRect(
        ctx,
        floor(rect.left - canvasRect.left - padding),
        floor(rect.top - canvasRect.top - padding),
        floor(rect.width + padding * 2),
        floor(rect.height + padding * 2),
        5,
      );

      ctx.stroke();
      ctx.fill();
    }

    const style = new TextStyle({size: 14, color: 'rgba(255, 255, 255, 1)', strokeColor: 'rgba(50, 50, 50, 0.6)'});
    const styleHovered = new TextStyle({size: 16, color: 'rgba(255, 255, 255, 1)', strokeColor: 'rgba(50, 50, 50, 0.6)'});
    const styleSelected = new TextStyle({size: 18, color: 'rgba(255, 255, 255, 1)', strokeColor: 'rgba(50, 50, 50, 0.6)'});

    // Render labels
    components.forEach(component => {
      if (!this.showInvisibleComponents && component.isInvisible) {
        return;
      }

      if (!this.showIgnoredComponents && this.ignoredComponents.includes(component.name)) {
        return;
      }

      const rect = component.getRect();
      if (!rect) {
        return;
      }

      const name = component.name;

      const canvasRect = this._canvas.getBoundingClientRect();
      const componentNode = component.$els[0] || component.$el;

      const x = rect.left - canvasRect.left;
      const y = rect.top - canvasRect.top;

      const styleComponent = component === this.selectedInstance ? styleSelected : (component === this.hoveredInstance ? styleHovered : style);

      const displayName = "<" + name + ">";
      this._$renderUtil._renderText(ctx, displayName, floor(x + rect.width / 2), y, styleComponent);

      if (component === this.selectedInstance || component === this.hoveredInstance) {
        const tag = (componentNode && componentNode.tagName) || '#text';
        const multiRoot = component.$els.length > 1 ? ' +' + (component.$els.length - 1) : '';
        this._$renderUtil._renderText(ctx, "(" + tag + (componentNode && componentNode.id ? '#' + componentNode.id : '') + multiRoot + ")", floor(x + rect.width / 2), y + styleComponent.size, styleComponent);
      }
    });
  }

  get selectedInstance() {
    return this._selectedInstance;
  }

  set selectedInstance(value) {
    if (value) {
      console.log(`Selected '${value.name}' instance:`);
      console.log(value);
    }

    this._selectedInstance = value;
  }
}

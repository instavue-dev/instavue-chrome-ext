import {TEXT_ALIGNMENT} from "../constants";

export class TextStyle {
  constructor({size = 12, color = '#000', strokeColor = null} = {}) {
    this.size = size;
    this.color = color;
    this.strokeColor = strokeColor;
  }
}

export const floor = v => Math.floor(v);


const defaultStyle = new TextStyle();

export class RenderUtil {

  _roundedRect(ctx, x, y, width, height, radius) {
    ctx.moveTo(x, y + radius);
    ctx.lineTo(x, y + height - radius);
    ctx.quadraticCurveTo(x, y + height, x + radius, y + height);
    ctx.lineTo(x + width - radius, y + height);
    ctx.quadraticCurveTo(x + width, y + height, x + width, y + height - radius);
    ctx.lineTo(x + width, y + radius);
    ctx.quadraticCurveTo(x + width, y, x + width - radius, y);
    ctx.lineTo(x + radius, y);
    ctx.quadraticCurveTo(x, y, x, y + radius);
  }


  _calculatePadding(basePadding, component) {
    const rect = component.$el.getBoundingClientRect();

    let padding = basePadding;
    let parent = component.$parent;

    while (parent && padding > 0) {
      if (!parent || !parent.$el.getBoundingClientRect) {
        break;
      }

      const rectParent = parent.$el.getBoundingClientRect();
      if (
        rectParent.x === rect.x
        || rectParent.y === rect.y
        || rectParent.x + rectParent.width === rect.x + rect.width
        || rectParent.y + rectParent.height === rect.y + rect.height
      ) {
        padding -= 2;
        parent = parent.$parent;
      } else {
        break;
      }
    }

    return padding;
  }

  /**
   * @param {CanvasRenderingContext2D} ctx
   * @param {string} text
   * @param {number} x
   * @param {number} y
   * @param {TextStyle} style
   * @param {string} alignment
   */
  _renderText(ctx, text, x, y, style = defaultStyle, alignment = TEXT_ALIGNMENT.TOP_CENTER) {
    ctx.beginPath();

    const size = style.size;
    ctx.font = size + "px Arial";
    ctx.fillStyle = style.color;
    ctx.strokeStyle = style.strokeColor;
    ctx.textBaseline = "top";
    ctx.setLineDash([]);

    const {locatedX, locatedY} = this._locateText(ctx, text, x, y, style, alignment);

    ctx.fillText(text, locatedX, locatedY);
    if (style.strokeColor) {
      // ctx.lineWidth = 2;
      ctx.strokeText(text, locatedX, locatedY);
    }
  }

  _locateText(ctx, text, x, y, style, alignment) {
    let locatedX = x;
    let locatedY = y;

    // Width and height are already doubled
    const width = floor(ctx.measureText(text).width);
    const height = style.size;

    switch (alignment) {
      case TEXT_ALIGNMENT.TOP_CENTER:
        locatedX = x - floor(width / 2);
        break;
      case TEXT_ALIGNMENT.TOP_LEFT:
        // already aligned
        break;
      case TEXT_ALIGNMENT.BOTTOM_CENTER:
        locatedX = x - floor(width / 2);
        locatedY = y - style.size;
        break;
      case TEXT_ALIGNMENT.BOTTOM_RIGHT:
        locatedX = x - width;
        locatedY = y - style.size;
        break;
      case TEXT_ALIGNMENT.CENTER_CENTER:
        locatedX = x - floor(width / 2);
        locatedY = y - floor(style.size / 2);
        break;
      case TEXT_ALIGNMENT.LEFT_CENTER:
        locatedY = y - floor(height / 2);
        break;
    }

    return {locatedX, locatedY};
  }

  _getNestingLevel(component) {
    let level = 0;
    let parent = component.$parent;

    while (parent) {
      parent = parent.$parent;
      level++;
    }

    return level;
  }

}
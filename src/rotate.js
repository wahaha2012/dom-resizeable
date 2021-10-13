import { getLineAngle } from "./utils/math";
/**
 * depend on @svgdotjs/svg.js
 * global event config
 */
let _target = {
  element: null,
  options: {},
};

// 监听事件
const addEventListener = () => {
  document.addEventListener("mousemove", mousemoveHandler);
  document.addEventListener("mouseup", mouseupHandler);
};

// 消除监听
const removeEventListener = () => {
  document.removeEventListener("mousemove", mousemoveHandler);
  document.removeEventListener("mouseup", mouseupHandler);
};

const mousemoveHandler = function (e) {
  const { element, options, origin } = _target;
  if (!element) {
    return;
  }

  if (element.rotate) {
    if (options && typeof options.onRotating === "function") {
      options.onRotating(
        e,
        origin,
        getLineAngle(_target.origin.x, _target.origin.y, e.pageX, e.pageY)
      );
    }
  }
};

const mouseupHandler = function (e) {
  const { element, options, origin } = _target;
  if (!element) {
    return;
  }

  if (options && typeof options.onEnd === "function") {
    options.onEnd(
      e,
      origin,
      getLineAngle(_target.origin.x, _target.origin.y, e.pageX, e.pageY)
    );
  }

  const { x, y } = element.pos || {};
  const diffX = e.pageX - x;
  const diffY = e.pageY - y;
  const diff = Math.sqrt(diffX * diffX + diffY * diffY);

  if (diff < 7) {
    // click event
    element.rotate = false;
    _target = {};
    return false;
  }

  setTimeout(() => {
    element.rotate = false;
    element.pos = null;
    _target = {};
  }, 0);

  removeEventListener();
};

/**
 * set rotate handle
 * @param {Element} element SVG Element
 * @param {Object} options rotate config
 * @returns {Element} svg element
 */
export const setRotate = (targetElement, handleElement, options = {}) => {
  const element = handleElement;
  const isHTML = targetElement instanceof HTMLElement;
  if (!element) {
    return;
  }

  if (!isHTML && typeof element.move !== "function") {
    console.error(
      `Rotate target ${element} is not an element of @svgdotjs/svg.js, maybe you should install @svgdotjs/svg.js firstly.`
    );
    return element;
  }

  const rotateStart = (e) => {
    e.stopPropagation();
    let targetBounding = {};
    if (isHTML) {
      targetBounding = targetElement.getBoundingClientRect();
    }

    // set event target to current target
    _target = {
      element,
      options,
      origin: {
        x: !isHTML
          ? targetElement.cx()
          : targetBounding.left + targetBounding.width / 2,
        y: !isHTML
          ? targetElement.cy()
          : targetBounding.top + targetBounding.height / 2,
      },
    };

    if (typeof options.onStart === "function") {
      options.onStart(
        e,
        _target.origin,
        getLineAngle(_target.origin.x, _target.origin.y, e.pageX, e.pageY)
      );
    }

    element.pos = {
      x: e.pageX,
      y: e.pageY,
    };
    element.rotate = true;

    addEventListener();
  };

  if (isHTML) {
    element.addEventListener("mousedown", rotateStart);
  } else {
    element.on("mousedown", rotateStart);
  }

  return element;
};

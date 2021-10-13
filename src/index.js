import { setDraggable } from "dom-draggable";
import { setRotate } from "./rotate";
import { getStyle } from "./utils/css";
import { createElement } from "utils-es/dom";

export default class Resize {
  constructor(stage, options) {
    this.group = createElement("div", {
      class: "resize-group",
      style: "display: none",
    });

    this.handles = [];
    this.width = options.width;
    this.height = options.height;
    this.handleSize = options.handleSize || 8;
    this.editTarget = null;
    this.lockAspectRatio = false;

    this.container = this.createContainer(options.width, options.height);
    this.group.appendChild(this.container);

    this.createHandles();
    options.rotateable && this.createRotateHandle();
    this.setCheckIcon(options);

    if (options.moveable) {
      setDraggable(this.group, {
        onDragMove: () => {
          if (this.editTarget) {
            this.editTarget.style.left = this.group.style.left;
            this.editTarget.style.top = this.group.style.top;
          }
        },
      });
    }

    stage.appendChild(this.group);
  }

  /**
   * set confirm icon
   * @param {Object} options confirm icon config
   * @returns
   */
  setCheckIcon(options) {
    if (options.hideCheckIcon) {
      return;
    }
    this.checkIcon = createElement("span", {
      class: "confirm",
      style: `right:5px; top:2px; width: 16px;height:8px; position: absolute; border-left: #000 2px solid; border-bottom:#000 2px solid;transform: rotate(-45deg);cursor: pointer;`,
    });
    this.group.appendChild(this.checkIcon);
    this.checkIcon.addEventListener("click", () => {
      this.group.style.display = "none";
      options &&
        typeof options.onConfirm === "function" &&
        options.onConfirm(e);
    });
  }

  /**
   * create rotate handle
   */
  createRotateHandle() {
    const x = this.width / 2;
    this.rotateBarLength = 30;
    const r = this.handleSize;
    const line = createElement("div", {
      class: "rotate-line",
      style: `width:0;height:${
        this.rotateBarLength
      }px;position:absolute;left: ${x}px; top:${
        -1 * this.rotateBarLength - r / 2
      }px;border-left: #000 1px dashed;font-size:0;`,
    });
    this.group.appendChild(line);

    const circle = createElement("div", {
      class: "rotate-handle",
      style: `border-radius: ${
        r / 2 + 2
      }px; width:${r}px; height: ${r}px; cursor: alias; border: #000 1px solid; background: #333; left: ${
        x - r / 2 - 1
      }px; top:${-1 * this.rotateBarLength - r / 2}px; position: absolute;`,
    });

    this.group.appendChild(circle);

    this.bindRotateEvent(circle);

    this.rotateLine = line;
    this.rotateHandle = circle;
  }

  /**
   * bind rotate event
   * @param {HTMLElement} handle rotate handle
   */
  bindRotateEvent(handle) {
    let startAngle = 90;
    setRotate(this.group, handle, {
      onStart: (e, origin, angle) => {},

      onRotating: (e, origin, angle) => {
        // html transform rotate use absolute rotate degree
        const angleDelt = startAngle - angle;

        this.group.style.transform = `rotate(${angleDelt}deg)`;
        this.editTarget.style.transform = `rotate(${angleDelt}deg)`;
      },

      onEnd: (e, origin, angle) => {},
    });
  }

  /**
   * update rotate bar, all handle is relative to parent element
   * @param {Number} width container width
   * @param {Number} height container height
   */
  updateRotateBar(width) {
    const r = this.handleSize;
    this.rotateLine.style.left = width / 2 + "px";
    this.rotateHandle.style.left = width / 2 - r / 2 + "px";
  }

  /**
   * create resize control handles
   */
  createHandles() {
    const positionList = this.getHandlePosition();

    this.handles = positionList.map((v) => this.createHandle(v));
  }

  createContainer(width, height) {
    const rect = createElement("div", {
      class: "resize-container",
      style: `width:${width}px; height: ${height}px; border: #000 1px dashed; box-sizing: border-box;`,
    });

    return rect;
  }

  /**
   * create handle element
   * @param {Object} config
   * @returns HTMLElement
   */
  createHandle(config) {
    const { x, y, r, cursor } = config;
    const left = x - r / 2;
    const top = y - r / 2;
    const circle = createElement("div", {
      class: "resize-handle",
      style: `border-radius: ${
        r / 2 + 2
      }px; width:${r}px; height: ${r}px; cursor: ${cursor}-resize; border: #000 1px solid; background: #fff; left: ${left}px; top:${top}px; position: absolute;`,
    });

    this.group.appendChild(circle);

    setTimeout(() => {
      this.bindHanleEvent(circle, config);
    }, 0);

    return circle;
  }

  /**
   * bind event to control handle
   * @param {HTMLElement} handle
   * @param {Object} config
   */
  bindHanleEvent(handle, config) {
    const lock = { x: false, y: false };
    if (["s", "n"].includes(config.cursor)) {
      lock.x = true;
    } else if (["w", "e"].includes(config.cursor)) {
      lock.y = true;
    }

    setDraggable(handle, {
      // disableGlobalEvent: true,
      lock,
      disableFollow: true,
      relative: true,
      keepCursor: true,

      onDragStart(e) {
        e.stopPropagation();
      },

      onDragMove: (e) => {
        const { w, h, x, y } = this.updateSize(e, handle, lock, config);
        if (this.editTarget) {
          this.editTarget.style.width = w + "px";
          this.editTarget.style.height = h + "px";
          // this.editTarget.style.left = x + "px";
          // this.editTarget.style.top = y + "px";

          // sync position with resize group
          this.editTarget.style.left = x;
          this.editTarget.style.top = y;
        }
      },

      onDragEnd: (e) => {
        // console.log("drag finished");
        this.updateSize(e, handle, lock, config, true);
      },
    });
  }

  /**
   * update size resize control ui
   * @param {Event} e mouse event
   * @param {HTMLElement} handle handle element
   * @param {Boolean} lock lock direction
   * @param {Object} config handle config
   * @param {Boolean} end drag end flag
   * @returns new bounding data
   */
  updateSize(e, handle, lock, config, end) {
    const { x, y } = handle.pos;
    const { cursor } = config;
    let xMove = e.pageX - x;
    let yMove = e.pageY - y;
    const leftDirection = cursor.indexOf("w") > -1;
    const upDirection = cursor.indexOf("n") > -1;

    if (this.lockAspectRatio) {
      let direction = ["w", "n", "sw", "ne"].includes(cursor) ? -1 : 1;
      if (lock.y) {
        yMove = xMove * direction;
      } else {
        xMove = yMove * direction;
      }
    }

    let w = this.width;
    let h = this.height;
    // adjust x axis
    if (!lock.x || this.lockAspectRatio) {
      // left direction
      if (leftDirection) {
        w = this.width - xMove;
        this.group.style.left = x + xMove + "px";
      } else {
        w = this.width + xMove;
      }
    }

    // adjust y axis
    if (!lock.y || this.lockAspectRatio) {
      // up direction
      if (upDirection) {
        h = this.height - yMove;
        this.group.style.top = y + yMove + "px";
      } else {
        h = this.height + yMove;
      }
    }

    this.changeGroupSize(w, h, !end);
    // const { left, top } = this.group.getBoundingClientRect();

    return {
      w,
      h,
      // x: left,
      // y: top,
      x: this.group.style.left,
      y: this.group.style.top,
      // xMove: lock.x ? 0 : xMove,
      // yMove: lock.y ? 0 : yMove,
    };
  }

  /**
   * change size of resize control container
   * @param {Number} w container width
   * @param {Number} h container height
   * @param {Boolean} moving mouse moving flag
   */
  changeGroupSize(w, h, moving) {
    this.container.style.width = w + "px";
    this.container.style.height = h + "px";
    if (!moving) {
      this.width = w;
      this.height = h;
    }

    const positionList = this.getHandlePosition(w, h);
    // const { left, top } = this.container.getBoundingClientRect();

    this.handles.forEach((el, i) => {
      const { x, y, r } = positionList[i];
      el.style.left = x - r / 2 + "px";
      el.style.top = y - r / 2 + "px";
    });

    if (this.checkIcon) {
      this.checkIcon.style.right = "5px";
      this.checkIcon.style.top = "2px";
    }

    this.rotateLine && this.updateRotateBar(w, h);
  }

  /**
   * get resize control handles position config
   * @param {Number} w container width
   * @param {Number} h container height
   * @returns position config list
   */
  getHandlePosition(w, h) {
    const r = this.handleSize;
    const width = w || this.width;
    const height = h || this.height;
    const positionList = [
      {
        x: 0,
        y: 0,
        r,
        cursor: "nw",
      },
      {
        x: width / 2,
        y: 0,
        r,
        cursor: "n",
      },
      {
        x: width,
        y: 0,
        r,
        cursor: "ne",
      },
      {
        x: width,
        y: height / 2,
        r,
        cursor: "e",
      },
      {
        x: width,
        y: height,
        r,
        cursor: "se",
      },
      {
        x: width / 2,
        y: height,
        r,
        cursor: "s",
      },
      {
        x: 0,
        y: height,
        r,
        cursor: "sw",
      },
      {
        x: 0,
        y: height / 2,
        r,
        cursor: "w",
      },
    ];

    return positionList;
  }

  /**
   * bind resize control ui to target element
   * @param {HTMLElement} element target element
   * @param {Object} config resize config for target element
   */
  bindEditTarget(element, config = { lockAspectRatio: false }) {
    this.editTarget = element;
    this.lockAspectRatio = config.lockAspectRatio;
    this.group.style.display = "block";
    // cache transform
    const targetTransform = element.style.transform;

    // sync transfrom from edit target element to resize ui group
    this.group.style.transform = targetTransform;

    // reset transform setting
    this.editTarget.style.transform = "";
    const { left, top, width, height } = element.getBoundingClientRect();
    this.group.style.left = left + "px";
    this.group.style.top = top + "px";
    // restore transform style
    this.editTarget.style.transform = targetTransform;

    this.changeGroupSize(width, height);
  }
}

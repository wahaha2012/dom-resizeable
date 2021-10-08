import { setDraggable } from "dom-draggable";
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
    this.setCheckIcon(options);

    if (options.dragable) {
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
          this.editTarget.style.left = x + "px";
          this.editTarget.style.top = y + "px";
        }
      },

      onDragEnd: (e) => {
        // console.log("drag finished");
        this.updateSize(e, handle, lock, config, true);
      },
    });
  }

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
    const { left, top } = this.group.getBoundingClientRect();

    return {
      w,
      h,
      x: left,
      y: top,
      // xMove: lock.x ? 0 : xMove,
      // yMove: lock.y ? 0 : yMove,
    };
  }

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
  }

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

  bindEditTarget(element, config = { lockAspectRatio: false }) {
    this.editTarget = element;
    this.lockAspectRatio = config.lockAspectRatio;
    this.group.style.display = "block";

    const { left, top, width, height } = element.getBoundingClientRect();
    this.group.style.left = left + "px";
    this.group.style.top = top + "px";
    this.changeGroupSize(width, height);
  }
}

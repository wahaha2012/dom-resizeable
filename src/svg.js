import { setDraggable } from "dom-draggable/svg";
import { checkIcon } from "./icons";

export default class Resize {
  constructor(stage, options) {
    this.group = stage.group();
    this.group.hide();

    this.handles = [];
    this.width = options.width;
    this.height = options.height;
    this.handleSize = options.handleSize || 8;
    this.editTarget = null;
    this.lockAspectRatio = false;

    this.container = this.createContainer(options.width, options.height);

    this.createHandles();
    this.setCheckIcon(options);

    if (options.dragable) {
      setDraggable(this.group, {
        onDragMove: () => {
          this.editTarget &&
            this.editTarget.x(this.container.x()).y(this.container.y());
        },
      });
    }
  }

  setCheckIcon(options) {
    if (options.hideCheckIcon) {
      return;
    }
    this.checkIcon = checkIcon;
    this.group.add(this.checkIcon);
    checkIcon.move(this.container.width() - checkIcon.width(), 0);
    checkIcon.on("click", () => {
      this.group.hide();
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
    const rect = this.group.rect(width, height);
    rect
      .stroke({
        width: 1,
        color: "#000",
        dasharray: [5, 5],
      })
      .fill("transparent")
      .attr({
        // 关闭抗锯齿
        "shape-rendering": "crispEdges",
      })
      .css({
        cursor: "move",
      });

    return rect;
  }

  createHandle(config) {
    const { x, y, r, cursor } = config;
    const circle = this.group.circle(r);

    circle
      .stroke({
        width: 1,
        color: "#000",
      })
      .fill("#fff")
      .attr({
        // 关闭抗锯齿
        // "shape-rendering": "crispEdges",
      })
      .css({
        cursor: cursor + "-resize",
      })
      .move(x - r / 2, y - r / 2);

    this.bindHanleEvent(circle, config);

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
      onDragStart(e) {
        e.stopPropagation();
      },

      onDragMove: (e) => {
        const { w, h, x, y } = this.updateSize(e, handle, lock, config);
        this.editTarget && this.editTarget.size(w, h).x(x).y(y);
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
        this.container.x(x + xMove);
      } else {
        w = this.width + xMove;
      }
    }

    // adjust y axis
    if (!lock.y || this.lockAspectRatio) {
      // up direction
      if (upDirection) {
        h = this.height - yMove;
        this.container.y(y + yMove);
      } else {
        h = this.height + yMove;
      }
    }

    this.changeGroupSize(w, h, !end);

    return {
      w,
      h,
      x: this.container.x(),
      y: this.container.y(),
      // xMove: lock.x ? 0 : xMove,
      // yMove: lock.y ? 0 : yMove,
    };
  }

  changeGroupSize(w, h, moving) {
    this.container.size(w, h);
    if (!moving) {
      this.width = w;
      this.height = h;
    }

    const positionList = this.getHandlePosition(w, h);
    const top = this.container.y();
    const left = this.container.x();
    this.handles.forEach((el, i) => {
      const { x, y, r } = positionList[i];
      el.move(left + x - r / 2, top + y - r / 2);
    });

    this.checkIcon &&
      this.checkIcon.move(left + w - this.checkIcon.width(), top);
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
    const offset = this.handleSize / 2;
    this.group.show().move(element.x() - offset, element.y() - offset);
    this.changeGroupSize(element.width(), element.height());
  }
}

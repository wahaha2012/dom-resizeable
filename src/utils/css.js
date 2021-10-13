/**
 * get style from element
 * @param {HTMLElement} element
 * @param {String} attribute
 * @param {RegExp} pattern
 * @returns
 */

export const getStyle = (element, attribute, pattern) => {
  const style = element.style[attribute];
  if (pattern instanceof RegExp) {
    const match = style.match(pattern);
    if (match) {
      return match;
    }
  }

  return style;
};

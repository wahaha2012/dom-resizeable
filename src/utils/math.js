/**
 * get line angle in degree
 * @param {Number} startX line start position x
 * @param {Number} startY line start poisiton y
 * @param {Number} endX line end position x
 * @param {Number} endY line end position y
 * @returns line anticlock angle begin from x axis
 */
export const getLineAngle = (startX, startY, endX, endY) => {
  const deltX = endX - startX;
  // html 坐标系y轴方向相反
  const deltY = startY - endY;

  return (Math.atan2(deltY, deltX) * 180) / Math.PI;
};

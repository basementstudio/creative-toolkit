export const lerp = (x: number, y: number, t: number) => {
  return (1 - t) * x + t * y;
};

export const damp = (x: number, y: number, lambda: number, dt: number) => {
  return lerp(x, y, 1 - Math.exp(-lambda * dt));
};

export const clamp = (min: number, input: number, max: number) => {
  return input < min ? min : input > max ? max : input;
};

export const pascal = (s: string) =>
  s
    .replace(/[^\w\s]/gi, " ")
    .replace(/\w+/g, (w) => {
      return w[0]?.toUpperCase() + w.slice(1).toLowerCase();
    })
    .replace(/\s/g, "");

export const flattenObject = (arr: Record<string, any>[]) => {
  const res: Record<string, any> = {};

  arr.forEach((obj) => {
    Object.keys(obj).forEach((key) => {
      res[key] = obj[key];
    });
  });

  return res;
};

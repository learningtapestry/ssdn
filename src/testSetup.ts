// Mock Image.onload and Image.onerror in the jsdom environment.
const freeGlobal = global as any;

export function temporaryGlobalVariable(
  name: string,
  value: any,
  fn: () => void,
) {
  const previousGlobal = freeGlobal[name];
  freeGlobal[name] = value;
  fn();
  freeGlobal[name] = previousGlobal;
}

freeGlobal.temporaryGlobalVariable = temporaryGlobalVariable;

Object.defineProperty(freeGlobal.Image.prototype, "_src", {
  writable: true,
});

Object.defineProperty(freeGlobal.Image.prototype, "src", {
  set(src) {
    this._src = src;
    const shouldLoad = freeGlobal.imagesShouldLoad;
    if (!shouldLoad) {
      setTimeout(() =>
        this.onerror(new Error("The image was configured not to load.")),
      );
    } else {
      setTimeout(() => this.onload());
    }
  },
  get() {
    return this._src;
  },
});

Object.defineProperty(document, "hidden", {
  writable: true,
});

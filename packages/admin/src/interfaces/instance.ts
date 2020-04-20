/**
 * instance.ts: Interface that carries information about a SSDN instance
 */

import Setting from "./setting";

export default interface Instance {
  name: string;
  settings: Setting[];
}

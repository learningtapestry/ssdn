/**
 * instance.ts: Interface that carries information about a Nucleus instance
 */

import Setting from "./setting";

export default interface Instance {
  name: string;
  settings: Setting[];
}

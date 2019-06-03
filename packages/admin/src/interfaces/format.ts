export type CaliperFormat = "Caliper";

export type XAPIFormat = "xAPI";

export type Format = CaliperFormat | XAPIFormat;

export interface DbFormat {
  name: string;
  description?: string;
  creationDate: string;
  updateDate: string;
}

export interface NewDbFormat {
  name: string;
  description?: string;
}

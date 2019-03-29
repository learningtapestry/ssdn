import express, { Application } from "express";
import { createWriteStream, WriteStream } from "fs";
import { Server } from "http";
import { parse as parseQs } from "querystring";
import { parse as parseUrl } from "url";

/**
 * A backend server for tests. It stores messages in memory and allows them to
 * be retrieved later on.
 */
export class Backend {
  public messages: { [type: string]: any[] } = {};

  public app: Application;

  public server: Server | undefined;

  public port: number;

  private messageLog: WriteStream = createWriteStream("tmp/integration-test/messages.log", {
    flags: "a",
  });

  constructor(port: number, staticFolder: string) {
    this.port = port;
    this.app = express();

    this.app.use(express.static(staticFolder));
    this.app.get("/test/:testName/beacon", this.imageBeaconEndpoint.bind(this));
    this.app.get("/test/:testName/messages", this.messagesEndpoint.bind(this));
  }

  public close() {
    if (this.server) {
      this.server.close();
      console.info(`BackendService shutting down.`);
    }
  }

  public listen() {
    this.server = this.app.listen(this.port);
    console.info(`BackendService listening on ${this.port}.`);
  }

  private imageBeaconEndpoint(req: express.Request, res: express.Response) {
    const rawQuery = parseUrl(req.url).query;
    const qs = parseQs(rawQuery as string);
    const message = {
      apiKey: qs.apiKey,
      event: JSON.parse(qs.event as string),
    };
    const testName = req.params.testName;
    if (!this.messages[testName]) {
      this.messages[testName] = [];
    }
    this.messages[testName].push(message);
    this.messageLog.write("\n");
    this.messageLog.write(JSON.stringify(message, null, 4));
    res.end();
  }

  private messagesEndpoint(req: express.Request, res: express.Response) {
    res.json(this.messages[req.params.testName]);
  }
}

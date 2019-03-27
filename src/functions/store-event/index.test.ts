import { Context } from "aws-lambda";

import kinesisEvent from "../../../test-support/lambda-events/store-event-kinesis.json";
import KinesisRepository from "../../repositories/kinesis-repository";
import { handler } from "./index";

jest.mock("../../repositories/kinesis-repository");

describe("StoreEventFunction", () => {
  beforeEach(() => {
    (KinesisRepository as any).mockClear();
  });

  it("fans out records", () => {
    handler(kinesisEvent, {} as Context, () => {
      /* Do nothing */
    });
    expect(KinesisRepository).toHaveBeenCalledTimes(1);
    expect(kinesisEvent).toHaveProperty("Records"); // Sanity check
    expect((KinesisRepository as any).mock.instances[0].storeBatch).toHaveBeenCalledWith(
      kinesisEvent.Records.map((r) => r.kinesis.data),
    );
  });
});

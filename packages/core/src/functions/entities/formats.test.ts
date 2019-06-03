import { APIGatewayProxyEvent } from "aws-lambda";

import { buildFormat } from "../../../test-support/factories";
import { FakeImpl, mocked } from "../../../test-support/jest-helper";
import FormatRepository from "../../repositories/format-repository";
import { getFormatRepository } from "../../services";
import { handler } from "./index";

jest.mock("../../services", () => {
  const formatRepo = {
    delete: jest.fn(),
    findAll: jest.fn(),
    get: jest.fn(),
    put: jest.fn(),
    update: jest.fn(),
  };

  const exports = {
    getFormatRepository: jest.fn(() => formatRepo),
  };

  (exports.getFormatRepository as any).impl = formatRepo;

  return exports;
});

const fakeRepo = (getFormatRepository as any).impl as FakeImpl<FormatRepository>;

describe("EntitiesApiFunction", () => {
  describe("Formats", () => {
    beforeEach(() => jest.clearAllMocks());

    describe("get", () => {
      it("returns a list of formats", async () => {
        fakeRepo.findAll!.mockResolvedValueOnce([buildFormat({ name: "test" })]);
        const response = await handler(
          {
            httpMethod: "GET",
            path: "/formats",
          },
          {},
        );
        expect(response.body).toEqual(
          '[{"creationDate":"","description":"","name":"test","updateDate":""}]',
        );
        expect(fakeRepo.findAll).toHaveBeenCalledWith();
      });
    });

    describe("get /:name", () => {
      it("returns a format", async () => {
        fakeRepo.get!.mockResolvedValueOnce(buildFormat({ name: "test" }));
        const response = await handler(
          {
            httpMethod: "GET",
            path: "/formats/test",
          },
          {},
        );
        expect(response.body).toEqual(
          '{"creationDate":"","description":"","name":"test","updateDate":""}',
        );
        expect(fakeRepo.get).toHaveBeenCalledWith("test");
      });
    });

    describe("post", () => {
      it("creates a format", async () => {
        fakeRepo.put!.mockResolvedValueOnce(buildFormat({ name: "test" }));
        const response = await handler(
          {
            body: JSON.stringify({
              name: "test",
            }),
            headers: {
              "content-type": "application/json",
            },
            httpMethod: "POST",
            path: "/formats",
          },
          {},
        );
        expect(response.body).toEqual(
          '{"creationDate":"","description":"","name":"test","updateDate":""}',
        );
        expect(fakeRepo.put).toHaveBeenCalledWith({
          name: "test",
        });
      });
    });

    describe("patch", () => {
      it("updates a format", async () => {
        fakeRepo.update!.mockResolvedValueOnce(buildFormat({ name: "test" }));
        const response = await handler(
          {
            body: JSON.stringify({
              name: "test",
            }),
            headers: {
              "content-type": "application/json",
            },
            httpMethod: "PATCH",
            path: "/formats/test",
          },
          {},
        );
        expect(response.body).toEqual(
          '{"creationDate":"","description":"","name":"test","updateDate":""}',
        );
        expect(fakeRepo.update).toHaveBeenCalledWith("test", {
          name: "test",
        });
      });
    });

    describe("delete /:name", () => {
      it("deletes a format", async () => {
        const response = await handler(
          {
            httpMethod: "DELETE",
            path: "/formats/test",
          },
          {},
        );
        expect(response.statusCode).toEqual(200);
        expect(fakeRepo.delete).toHaveBeenCalledWith("test");
      });
    });
  });
});

import IAM from "aws-sdk/clients/iam";

import { fakeAws, fakeImpl } from "../../test-support/jest-helper";
import { AWS_NUCLEUS } from "../interfaces/aws-metadata-keys";
import IamService from "./iam-service";
import NucleusMetadataService from "./nucleus-metadata-service";

const fakeMetadata = fakeImpl<NucleusMetadataService>({
  getMetadataValue: jest.fn((key: string) => ({
    value: ({ [AWS_NUCLEUS.nucleusId]: "RedNucleusId" } as any)[key],
  })),
});

const fakeIam = fakeAws<IAM>({
  attachRolePolicy: jest.fn(() => Promise.resolve()),
  createRole: jest.fn(({ RoleName }) =>
    Promise.resolve({
      Role: {
        Arn: `${RoleName}Arn`,
      },
    }),
  ),
  listRoles: jest.fn(({ PathPrefix }) =>
    PathPrefix === "/nucleus/RedNucleusId/externaltest.learningtapestry.com/"
      ? Promise.resolve({
          Roles: [
            {
              Arn: `TestRoleArn`,
              AssumeRolePolicyDocument: encodeURIComponent(
                JSON.stringify({
                  Statement: [
                    {
                      Action: "sts:AssumeRole",
                      Condition: { StringEquals: { "sts:ExternalId": "123456" } },
                      Effect: "Allow",
                      Principal: { AWS: "Example Corp's AWS Account ID" },
                    },
                  ],
                  Version: "2012-10-17",
                }),
              ),
              RoleName: "TestRoleName",
            },
          ],
        })
      : Promise.resolve({ Roles: [] }),
  ),
  putRolePolicy: jest.fn(),
});

describe("IamService", () => {
  describe("attachEndpointRolePolicy", () => {
    it("attaches a role to a policy", async () => {
      const iamService = new IamService(fakeIam, fakeMetadata);
      await iamService.attachEndpointRolePolicy(
        { value: "TestPolicyArn" },
        "https://externaltest.learningtapestry.com",
      );
      expect(fakeIam.impl.attachRolePolicy!.mock.calls[0][0]).toEqual({
        PolicyArn: "TestPolicyArn",
        RoleName: "TestRoleName",
      });
    });
  });

  describe("findOrCreateEndpointRole", () => {
    it("finds a role when one already exists", async () => {
      const iamService = new IamService(fakeIam, fakeMetadata);
      const result = await iamService.findOrCreateEndpointRole(
        "https://externaltest.learningtapestry.com",
        "654321",
      );
      expect(result).toEqual({
        arn: "TestRoleArn",
        externalId: "123456",
        name: "TestRoleName",
      });
    });

    it("creates a role when none exists", async () => {
      const iamService = new IamService(fakeIam, fakeMetadata);
      const result = await iamService.findOrCreateEndpointRole(
        "https://newrole.learningtapestry.com",
        "654321",
      );
      expect(result.arn).toContain("nucleus_ex_RedNucleusId_newrole.learni_");
      expect(result.externalId).toBeTruthy();
      expect(result.externalId.split("-")).toHaveLength(5); // It's an UUID v4
    });
  });

  describe("updateEndpointRoleInlinePolicy", () => {
    it("skips empty policies", async () => {
      const iamService = new IamService(fakeIam, fakeMetadata);
      await iamService.updateEndpointRoleInlinePolicy(
        { Statement: [] },
        "https://externaltest.learningtapestry.com",
      );
      expect(fakeIam.putRolePolicy).not.toHaveBeenCalled();
    });

    it("finds the role and updates its policy", async () => {
      const iamService = new IamService(fakeIam, fakeMetadata);
      await iamService.updateEndpointRoleInlinePolicy(
        { Statement: [{ test: "works" }] },
        "https://externaltest.learningtapestry.com",
      );
      expect(fakeIam.putRolePolicy).toHaveBeenCalledWith({
        PolicyDocument: '{"Statement":[{"test":"works"}]}',
        PolicyName: "TestRoleName-Policy",
        RoleName: "TestRoleName",
      });
    });
  });
});

import IAM from "aws-sdk/clients/iam";
import property from "lodash/fp/property";
import { parse } from "url";
import uuid from "uuid/v4";

import { getIamClient } from "../aws-clients";
import NucleusMetadataService from "./nucleus-metadata-service";

export default class IamService {
  private client: IAM;
  private metadata: NucleusMetadataService;

  constructor(metadata: NucleusMetadataService) {
    this.client = getIamClient();
    this.metadata = metadata;
  }

  public async attachEndpointRolePolicy(
    awsAccountId: string,
    endpoint: string,
    policyName: string,
  ) {
    const ownEndpoint = await this.metadata.getEndpoint();
    const roleName = this.buildRoleName(awsAccountId, ownEndpoint, endpoint);
    const iam = getIamClient();
    const policyArn = await this.metadata.getConfigurationValue(policyName);
    await iam
      .attachRolePolicy({
        PolicyArn: policyArn,
        RoleName: roleName,
      })
      .promise();
  }

  public async findOrCreateEndpointRole(endpoint: string, externalAwsAccountId: string) {
    const sourceEndpoint = await this.metadata.getEndpoint();
    const roleName = this.buildRoleName(externalAwsAccountId, sourceEndpoint, endpoint);
    let role: {
      arn: string;
      externalId: string;
    };

    try {
      const response = await this.client
        .getRole({
          RoleName: roleName,
        })
        .promise();
      role = {
        arn: response.Role.Arn,
        externalId: this.findRoleExternalId(response.Role.AssumeRolePolicyDocument!),
      };
    } catch {
      const externalId = uuid();
      const response = await this.client
        .createRole({
          AssumeRolePolicyDocument: JSON.stringify({
            Statement: [
              {
                Action: ["sts:AssumeRole"],
                Condition: { StringEquals: { "sts:ExternalId": externalId } },
                Effect: "Allow",
                Principal: {
                  AWS: `arn:aws:iam::${externalAwsAccountId}:root`,
                },
              },
            ],
            Version: "2012-10-17",
          }),
          RoleName: roleName,
        })
        .promise();
      role = {
        arn: response.Role.Arn,
        externalId,
      };
    }

    return role;
  }

  private buildRoleName(
    externalAwsAccountId: string,
    ownEndpoint: string,
    externalEndpoint: string,
  ) {
    return [
      "nucleus",
      "ex",
      externalAwsAccountId,
      this.getEndpointId(ownEndpoint),
      this.getEndpointId(externalEndpoint),
    ].join("_");
  }

  private getEndpointId(endpoint: string) {
    const parsed = parse(endpoint);
    return parsed.hostname!.split(".")[0];
  }

  private findRoleExternalId(policyDocumentBody: string) {
    const policyDocument = JSON.parse(decodeURIComponent(policyDocumentBody));
    const findProp = property("Condition.StringEquals.sts:ExternalId");
    const statement = (policyDocument.Statement as any[]).find(
      (st) => st.Effect === "Allow" && st.Action === "sts:AssumeRole" && findProp(st),
    );
    return findProp(statement);
  }
}

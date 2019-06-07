import IAM from "aws-sdk/clients/iam";
import property from "lodash/fp/property";
import nanoid from "nanoid";
import { parse } from "url";
import uuid from "uuid/v4";

import { AWS_NUCLEUS, POLICIES } from "../interfaces/aws-metadata-keys";
import { MetadataValue } from "../interfaces/base-types";
import logger from "../logger";
import NucleusMetadataService from "./nucleus-metadata-service";

export interface RoleInfo {
  arn: string;
  externalId: string;
  name: string;
}

export default class IamService {
  private client: IAM;
  private metadata: NucleusMetadataService;

  constructor(client: IAM, metadata: NucleusMetadataService) {
    this.client = client;
    this.metadata = metadata;
  }

  public async attachEndpointRolePolicy(
    policyArn: MetadataValue<POLICIES>,
    externalEndpoint: string,
  ) {
    const rolePath = this.buildRolePath(
      (await this.metadata.getMetadataValue(AWS_NUCLEUS.nucleusId)).value,
      externalEndpoint,
    );
    await this.client
      .attachRolePolicy({
        PolicyArn: policyArn.value,
        RoleName: (await this.findRoleByPath(rolePath)).RoleName,
      })
      .promise();
  }

  public async updateEndpointRoleInlinePolicy(policyDocument: any, externalEndpoint: string) {
    if (!policyDocument.Statement.length) {
      return;
    }

    const rolePath = this.buildRolePath(
      (await this.metadata.getMetadataValue(AWS_NUCLEUS.nucleusId)).value,
      externalEndpoint,
    );

    const role = await this.findRoleByPath(rolePath);

    await this.client
      .putRolePolicy({
        PolicyDocument: JSON.stringify(policyDocument),
        PolicyName: `${role.RoleName}-Policy`,
        RoleName: role.RoleName,
      })
      .promise();
  }

  public async findOrCreateEndpointRole(externalEndpoint: string, externalAwsAccountId: string) {
    const nucleusId = (await this.metadata.getMetadataValue(AWS_NUCLEUS.nucleusId)).value;
    const rolePath = this.buildRolePath(nucleusId, externalEndpoint);

    let role: RoleInfo;

    try {
      const existingRole = await this.findRoleByPath(rolePath);
      role = {
        arn: existingRole.Arn,
        externalId: this.findRoleExternalId(existingRole.AssumeRolePolicyDocument!),
        name: existingRole.RoleName,
      };
    } catch {
      const externalId = uuid();
      const newRole = await this.client
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
          Path: rolePath,
          RoleName: this.buildRoleName(nucleusId, externalEndpoint),
        })
        .promise();

      role = {
        arn: newRole.Role.Arn,
        externalId,
        name: newRole.Role.RoleName,
      };
    }

    return role;
  }

  private buildRolePath(nucleusId: string, externalEndpoint: string) {
    return `/nucleus/${nucleusId}/${externalEndpoint.replace(/^https?\:\/\//i, "")}/`;
  }

  private buildRoleName(nucleusId: string, externalEndpoint: string) {
    return `nucleus_ex_${nucleusId.slice(0, 14)}_${parse(externalEndpoint).hostname!.slice(
      0,
      14,
    )}_${nanoid()}`;
  }

  private async findRoleByPath(path: string) {
    const roles = await this.client
      .listRoles({
        PathPrefix: path,
      })
      .promise();

    if (!roles.Roles.length) {
      throw new Error(`Could not find role for path: ${path}`);
    }

    return roles.Roles[0]!;
  }

  private findRoleExternalId(policyDocumentBody: string) {
    const policyDocument = JSON.parse(decodeURIComponent(policyDocumentBody));
    const findProp = property("Condition.StringEquals.sts:ExternalId");
    const statements = Array.isArray(policyDocument.Statement)
      ? policyDocument.Statement
      : [policyDocument.Statement];
    const statement = (statements as any[]).find(
      (st) => st.Effect === "Allow" && st.Action === "sts:AssumeRole" && findProp(st),
    );
    const externalId = findProp(statement);
    if (externalId) {
      return externalId;
    }
    logger.error("Could not find the external ID for an existing policy document.");
    throw new Error("Could not find the external ID for an existing policy document.");
  }
}

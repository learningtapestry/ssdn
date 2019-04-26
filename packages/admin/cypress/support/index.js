import AWSService from "../../src/services/aws-service";

(async () => {
  await AWSService.configure();
})();

import "./commands";

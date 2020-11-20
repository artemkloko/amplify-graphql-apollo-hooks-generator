import inquirer from "inquirer";

import { Context } from "@aws-amplify/cli/lib/domain/context";
import { AmplifyEventArgs } from "@aws-amplify/cli/lib/domain/amplify-event";

import { run as cmdGenerate } from "../commands/generate";

export const run = async (context: Context, args: AmplifyEventArgs) => {
  /**
   * This is loosely copied from
   * amplify-cli/packages/amplify-codegen/src/callbacks/prePushUpdateCallback.js
   */
  const shouldGenerateHooks = await askUpdateHooks();
  if (shouldGenerateHooks) {
    cmdGenerate(context);
  }
};

const askUpdateHooks = async () => {
  /**
   * This is loosely copied from
   * amplify-cli/packages/amplify-codegen/src/walkthrough/questions/updateCode.js
   */
  const answer = await inquirer.prompt<{ confirmUpdateCode: boolean }>([
    {
      name: "confirmUpdateHooks",
      message:
        "Do you want to update the Apollo hooks for your updated GraphQL API",
      type: "confirm",
      default: true,
    },
  ]);

  return answer.confirmUpdateCode;
};

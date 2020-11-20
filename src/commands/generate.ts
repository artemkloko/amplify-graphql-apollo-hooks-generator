import * as path from "path";
import { Context } from "@aws-amplify/cli/lib/domain/context";
import loadConfig from "amplify-codegen/src/codegen-config";

import { generate } from "../generator";
import { FILE_EXTENSION_MAP } from "../constants";

export const run = async (context: Context) => {
  /**
   * Most of the following is loosely copied from
   * amplify-cli/packages/amplify-codegen/src/commands/statements.js
   */
  const config = loadConfig(context, false);
  const { projectPath } = context.amplify.getEnvInfo();
  for (const cfg of config.getProjects()) {
    const includeFiles = path.join(projectPath, cfg.includes[0]);
    const opsGenDirectory = cfg.amplifyExtension.docsFilePath
      ? path.join(projectPath, cfg.amplifyExtension.docsFilePath)
      : path.dirname(path.dirname(includeFiles));
    const schemaPath = path.join(projectPath, cfg.schema);

    /**
     * The following is loosely copied from
     * amplify-cli/packages/amplify-codegen/src/commands/types.js
     */
    const fileExtension =
      FILE_EXTENSION_MAP[cfg.amplifyExtension.codeGenTarget];
    const typesOutputPath = path
      .join(projectPath, cfg.amplifyExtension.generatedFileName)
      .replace(new RegExp("\\." + fileExtension + "$"), "");

    let apolloHooksPath = cfg.amplifyExtension.apolloHooksPath;
    if (!apolloHooksPath) {
      /**
       * If cfg.amplifyExtension.docsFilePath is defined
       *  - opsGenDirectory will point to statements directory, so we need to
       *    use parent directory
       * Else
       *  - opsGenDirectory will point to graphql directory, so we need to use
       *    the same directory
       */
      apolloHooksPath = cfg.amplifyExtension.docsFilePath
        ? path.join(opsGenDirectory, "..", "hooks.ts")
        : path.join(opsGenDirectory, "hooks.ts");
    }

    generate(schemaPath, apolloHooksPath, {
      language: cfg.amplifyExtension.codeGenTarget,
      statementsImportPath: opsGenDirectory,
      typesImportPath: typesOutputPath,
    });

    context.print.info(
      `Generated Apollo hooks successfully and saved at ${apolloHooksPath}`
    );
  }
};

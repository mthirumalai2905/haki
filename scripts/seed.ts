import { getWorkspace } from "../src/lib/workspace";
import { seedSampleData } from "../src/lib/sample";

async function main() {
  const workspace = await getWorkspace();
  const result = await seedSampleData(workspace.id, true);
  console.log(result);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

import { ZonesInputs } from "./zones.inputs";
import { ZonesSchema } from "./zones.schema";

	export function testZonesForm() {
    if (import.meta.env.MODE === "development") {
  const inputs = ZonesInputs();
  const schema = ZonesSchema((key: string) => key);
   const inputCount = inputs.reduce((count, input) => {
      if (input.multiLang) {
        return count + 2; // Assuming each multiLang input has two fields (e.g
        // nameAr and nameEn)
      }
      return count + 1; // Single input
    }, 0);
  // `coordinates` stays in the schema (optional) since the map input was removed.
  const schemaFields = Object.keys(schema.shape).filter((k) => k !== "coordinates");
  if (inputCount !== schemaFields.length) {
    throw new Error("Inputs and schema do not match");
  }
  }
}

  
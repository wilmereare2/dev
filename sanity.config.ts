import { visionTool } from "@sanity/vision";
import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { schemaTypes } from "./sanity/schemas";
import { structure } from "./lib/sanity/structure";
import { documentActions } from "./sanity/plugins/manual-archive";
import {
  sanityApiVersion,
  sanityDataset,
  sanityProjectId,
  sanityConfigured,
} from "./lib/sanity/env";

const projectId = sanityConfigured ? sanityProjectId! : "placeholder";

export default defineConfig({
  name: "manuelax",
  title: "manuelaX Studio",
  projectId,
  dataset: sanityDataset,
  basePath: "/studio",
  plugins: [structureTool({ structure }), visionTool({ defaultApiVersion: sanityApiVersion })],
  schema: {
    types: schemaTypes,
  },
  document: {
    actions: documentActions,
  },
});

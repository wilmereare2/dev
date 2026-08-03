import { defineField, type ImageOptions } from "sanity";
import { PixelImageInput } from "@/sanity/components/pixel-image-input";

const pixelMetaFields = [
  defineField({
    name: "outputWidth",
    title: "Output width (px)",
    type: "number",
    hidden: true,
  }),
  defineField({
    name: "outputHeight",
    title: "Output height (px)",
    type: "number",
    hidden: true,
  }),
  defineField({
    name: "displayScreen",
    title: "Display screen preset",
    type: "string",
    hidden: true,
  }),
];

/** Image field with hotspot, pixel regulator, and display-screen preview in Studio. */
export function pixelImageField(config: {
  name: string;
  title: string;
  description?: string;
  required?: boolean;
  options?: ImageOptions & { accept?: string };
}) {
  return defineField({
    name: config.name,
    title: config.title,
    type: "image",
    description: config.description,
    options: { hotspot: true, accept: "image/*", ...config.options },
    components: { input: PixelImageInput },
    fields: pixelMetaFields,
    validation: config.required ? (rule) => rule.required() : undefined,
  });
}

"use client";

import StyleGeneratorPage from "@/components/StyleGeneratorPage";
import { styleConfigs } from "@/lib/styles";

export default function ProductPage() {
  return <StyleGeneratorPage style={styleConfigs.product} />;
}
"use client";

import StyleGeneratorPage from "@/components/StyleGeneratorPage";
import { styleConfigs } from "@/lib/styles";

export default function AnimePage() {
  return <StyleGeneratorPage style={styleConfigs.anime} />;
}
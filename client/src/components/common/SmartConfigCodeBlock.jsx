import React from "react";
import CodeBlock from "./CodeBlock";

// Utility to extract code from various possible formats
function extractCodeAndLang(input, fallbackLang = "text") {
  if (!input) return { code: "", language: fallbackLang };

  // If input is an object with a *_content field, use that
  if (typeof input === "object" && input !== null) {
    // Try common keys
    for (const key of [
      "dockerfile_content",
      "docker_compose_content",
      "workflow_content",
      "code",
      "content",
    ]) {
      if (input[key]) return extractCodeAndLang(input[key], fallbackLang);
    }
    // If only one string field, use it
    const stringFields = Object.entries(input).filter(
      ([, v]) => typeof v === "string"
    );
    if (stringFields.length === 1) {
      return extractCodeAndLang(stringFields[0][1], fallbackLang);
    }
    // Fallback: JSON.stringify
    return { code: JSON.stringify(input, null, 2), language: "json" };
  }

  // If input is a string
  let str = String(input).trim();

  // If wrapped in triple backticks, extract language and content
  const mdMatch = str.match(/^```([a-zA-Z0-9]*)\n([\s\S]*?)\n?```$/);
  if (mdMatch) {
    const lang = mdMatch[1] || fallbackLang;
    return { code: mdMatch[2], language: lang };
  }

  // If looks like JSON string, try to parse and extract *_content
  if (str.startsWith("{") && str.endsWith("}")) {
    try {
      const obj = JSON.parse(str);
      return extractCodeAndLang(obj, fallbackLang);
    } catch {
      // Not valid JSON, fall through
    }
  }

  // Heuristic: detect Dockerfile, YAML, etc.
  if (
    /^FROM |^#|^WORKDIR |^COPY |^RUN |^CMD |^EXPOSE |^USER |^HEALTHCHECK /m.test(
      str
    )
  ) {
    return { code: str, language: "dockerfile" };
  }
  if (/^version: ['"]?\d/m.test(str) || /services:/m.test(str)) {
    return { code: str, language: "yaml" };
  }
  if (/^name: .+\non:/m.test(str) && /jobs:/m.test(str)) {
    return { code: str, language: "yaml" };
  }
  if (str.startsWith("{") && str.includes(":")) {
    return { code: str, language: "json" };
  }
  if (/^\s*#!/m.test(str) || /export\s+\w+=/m.test(str)) {
    return { code: str, language: "shell" };
  }
  if (/^\s*<\?xml|^\s*<html|^\s*<!DOCTYPE/m.test(str)) {
    return { code: str, language: "xml" };
  }
  if (/^\s*\w+\s*{|^\s*\.\w+\s*{/m.test(str)) {
    return { code: str, language: "css" };
  }

  // Fallback: plain text
  return { code: str, language: fallbackLang };
}

const SmartConfigCodeBlock = ({ value, title, fallbackLang }) => {
  const { code, language } = extractCodeAndLang(value, fallbackLang);
  return <CodeBlock code={code} language={language} title={title} />;
};

export default SmartConfigCodeBlock;

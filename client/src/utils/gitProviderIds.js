/** Map UI wizard / integrations ids to API route provider ids. */
export function toApiProviderId(uiId) {
  if (!uiId) return "github";
  const id = String(uiId).toLowerCase();
  if (id === "azure-devops" || id === "azure" || id === "azuredevops") {
    return "azuredevops";
  }
  return id;
}

/** Map API / backend provider ids to Redux connection keys. */
export function toConnectionProviderId(apiId) {
  if (!apiId) return "github";
  const id = String(apiId);
  if (id === "azureDevOps" || id.toLowerCase() === "azuredevops") {
    return "azuredevops";
  }
  return id.toLowerCase();
}

/** Map API ids to project-creation wizard provider step ids. */
export function toWizardProviderId(apiId) {
  const connectionId = toConnectionProviderId(apiId);
  if (connectionId === "azuredevops") {
    return "azure-devops";
  }
  return connectionId;
}

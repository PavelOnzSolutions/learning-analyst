import dagre from 'dagre';
import type { IPipeline } from '../models/pipeline.model';
import type { McpSourceDto } from '../services/McpConfigurationService';
import type { IAutoSrePipeline, ISreSignalSource } from '../models/sre.model';

const nodeWidth = 200;
const nodeHeight = 64;

export type ModelTier = 'LIGHT' | 'MEDIUM' | 'HEAVY';

export const MODEL_TIER_LABEL: Record<ModelTier, string> = {
  LIGHT: 'Haiku (light)',
  MEDIUM: 'Sonnet (medium)',
  HEAVY: 'Opus (heavy)',
};

export interface AgentDef {
  id: string;
  label: string;
  tier: ModelTier;
  lane: 'support' | 'tasks' | 'autosre';
  description: string;
  localToolIds: string[];
  mcpStage?: 'RETRIEVAL' | 'EXECUTION';
  /** Narrows MCP tool wiring to specific source keys instead of every source at mcpStage. */
  mcpSourceKeys?: string[];
}

export interface ToolFunctionParam {
  name: string;
  type: string;
  description: string;
  required: boolean;
}

export interface ToolFunctionDef {
  name: string;
  description: string;
  params: ToolFunctionParam[];
  returns: string;
}

export interface LocalToolDef {
  id: string;
  label: string;
  functions: ToolFunctionDef[];
}

export const TASKS_ENTRY_NODE_ID = 'tasks:entry';

export const LOCAL_TOOLS: LocalToolDef[] = [
  {
    id: 'knowledgeBase',
    label: 'KnowledgeBaseTool',
    functions: [
      {
        name: 'semanticSearch',
        description: 'Search the knowledge base by meaning, not exact words.',
        params: [
          { name: 'query', type: 'string', description: 'The search text.', required: true },
          { name: 'topK', type: 'integer', description: 'The number of results to return.', required: true },
        ],
        returns: 'A list of matching text chunks, with a title and a relevance score.',
      },
      {
        name: 'structuredQuery',
        description: 'Find text chunks tagged with an exact domain and key.',
        params: [
          { name: 'domain', type: 'string', description: 'The metadata domain to match.', required: true },
          { name: 'key', type: 'string', description: 'The metadata key to match.', required: true },
        ],
        returns: 'Up to 20 matching text chunks, or a message that says none were found.',
      },
      {
        name: 'searchInCollection',
        description: 'Search the knowledge base inside one named collection.',
        params: [
          { name: 'query', type: 'string', description: 'The search query.', required: true },
          { name: 'collectionName', type: 'string', description: 'The collection name to search within.', required: true },
          { name: 'topK', type: 'integer', description: 'Maximum number of results to return.', required: true },
        ],
        returns: 'A numbered list of matches, each with a score, a title, and text.',
      },
      {
        name: 'listDocuments',
        description: 'List documents in the knowledge base. Filter by collection name, or leave it out to list all documents.',
        params: [
          { name: 'collectionName', type: 'string', description: 'Optional collection name to filter by, or empty for all.', required: false },
        ],
        returns: 'A bulleted list of documents, each with an ID, a type, a chunk count, and a status.',
      },
      {
        name: 'addLessonLearned',
        description: 'Save a lesson learned from this task, for future tasks to reuse.',
        params: [
          { name: 'title', type: 'string', description: 'Short descriptive title for the lesson.', required: true },
          { name: 'content', type: 'string', description: 'What was learned, why it matters, and when to apply it.', required: true },
          { name: 'confidence', type: 'string', description: 'Confidence level, from 0.0 to 1.0.', required: true },
          { name: 'tags', type: 'string', description: 'Optional comma-separated tags.', required: false },
        ],
        returns: "A confirmation message with the saved record's ID.",
      },
      {
        name: 'searchLessonsLearned',
        description: 'Search past lessons learned for relevant experience and insights from previous tasks.',
        params: [
          { name: 'query', type: 'string', description: "The search query describing what you're looking for.", required: true },
          { name: 'topK', type: 'integer', description: 'Maximum number of results to return.', required: true },
        ],
        returns: 'A numbered list of past lessons, each with a score, a title, and content.',
      },
    ],
  },
  {
    id: 'policyLookup',
    label: 'PolicyLookupTool',
    functions: [
      {
        name: 'policyCheck',
        description: 'Check whether a pipeline allows a proposed operation.',
        params: [
          { name: 'pipelineId', type: 'string', description: 'The pipeline ID, as a UUID string.', required: true },
          { name: 'operationClass', type: 'string', description: 'The type of operation. One of: INFRA_SCALE, INFRA_DELETE, DEPLOY, SECRET_ROTATION, IAM_CHANGE, DATA_MUTATION, READ_ONLY, OTHER.', required: true },
          { name: 'resourceSelector', type: 'string', description: 'The resource the operation targets, for example subscription:abcd/rg:prod-rg.', required: true },
        ],
        returns: 'A JSON object with fields allowed, reason, and raciSnapshot.',
      },
    ],
  },
  {
    id: 'keyringAccess',
    label: 'KeyringAccessTool',
    functions: [
      {
        name: 'listAvailableCredentialTags',
        description: 'List credential tags available for one credential type.',
        params: [
          { name: 'credentialType', type: 'string', description: 'The credential type. One of: AZURE_ARM, AZURE_GRAPH_API, GITHUB, BITBUCKET, SMTP, REST_WEBHOOK.', required: true },
        ],
        returns: 'A list of tag names, or an empty list.',
      },
      {
        name: 'resolveCredential',
        description: "Read a credential's fields by type and tag. Secret fields are masked.",
        params: [
          { name: 'credentialType', type: 'string', description: 'The credential type. One of: AZURE_ARM, AZURE_GRAPH_API, GITHUB, BITBUCKET, SMTP, REST_WEBHOOK.', required: true },
          { name: 'tag', type: 'string', description: 'The credential tag to resolve.', required: true },
        ],
        returns: 'A comma-separated key=value string, or an error message that starts with ERROR:.',
      },
    ],
  },
  {
    id: 'raciLookup',
    label: 'RaciLookupTool',
    functions: [
      {
        name: 'resolveRaciRecipients',
        description: 'Find the people responsible, accountable, consulted, or informed for an operation.',
        params: [
          { name: 'pipelineId', type: 'string', description: 'The pipeline ID, as a UUID string.', required: true },
          { name: 'operationClass', type: 'string', description: 'The type of operation. One of: INFRA_SCALE, INFRA_DELETE, DEPLOY, SECRET_ROTATION, IAM_CHANGE, DATA_MUTATION, READ_ONLY, OTHER.', required: true },
          { name: 'resourceSelector', type: 'string', description: 'The resource the operation targets. Leave empty to match any resource.', required: false },
          { name: 'raciRoles', type: 'string', description: 'A comma-separated list of RACI roles, for example RESPONSIBLE,ACCOUNTABLE.', required: true },
        ],
        returns: 'A JSON list of recipients, each with an email, a name, a RACI role, and whether they are external.',
      },
    ],
  },
  {
    id: 'approvalLink',
    label: 'ApprovalLinkTool',
    functions: [
      {
        name: 'generateApprovalLink',
        description: 'Create a one-time approval link for one recipient.',
        params: [
          { name: 'taskId', type: 'string', description: 'The Support task ID, as a UUID string.', required: true },
          { name: 'recipientEmail', type: 'string', description: 'The email address allowed to use the link.', required: true },
          { name: 'action', type: 'string', description: 'The approval action. One of: APPROVE, REJECT, ACKNOWLEDGE.', required: true },
          { name: 'trigger', type: 'string', description: 'The reason the link is sent. One of: APPROVAL_REQUEST, APPROVAL_TIMEOUT, VALIDATION_BLOCK, EXECUTION_FAILURE, SECURITY_INCIDENT, EXTERNAL_SIGNAL.', required: true },
          { name: 'validForMinutes', type: 'integer', description: 'How many minutes the link stays valid.', required: true },
        ],
        returns: 'The approval link URL, or an error message that starts with ERROR:.',
      },
    ],
  },
  {
    id: 'email',
    label: 'EmailTool',
    functions: [
      {
        name: 'sendTemplatedEmail',
        description: 'Send a templated email to one recipient.',
        params: [
          { name: 'taskId', type: 'string', description: 'The Support task ID, as a UUID string.', required: true },
          { name: 'credentialTag', type: 'string', description: 'The SMTP credential tag to send from.', required: true },
          { name: 'templateName', type: 'string', description: 'The email template. One of: approval-request, escalation.', required: true },
          { name: 'recipient', type: 'string', description: 'The recipient email address.', required: true },
          { name: 'subject', type: 'string', description: 'The email subject line.', required: true },
          { name: 'slotsJson', type: 'string', description: 'A JSON object with template slot values.', required: true },
          { name: 'stub', type: 'boolean', description: 'If true, skip the real send and only record the attempt.', required: true },
        ],
        returns: 'A status word, SENT or FAILED, or an error message that starts with ERROR:.',
      },
    ],
  },
  {
    id: 'restCall',
    label: 'RestCallTool',
    functions: [
      {
        name: 'restCall',
        description: "Send an HTTP request to a webhook credential's base URL.",
        params: [
          { name: 'taskId', type: 'string', description: 'The Support task ID, as a UUID string.', required: true },
          { name: 'credentialTag', type: 'string', description: 'The REST_WEBHOOK credential tag to send through.', required: true },
          { name: 'method', type: 'string', description: 'The HTTP method. One of: GET, POST, PUT, PATCH, DELETE.', required: true },
          { name: 'relativePath', type: 'string', description: "The path appended to the credential's base URL.", required: true },
          { name: 'jsonBody', type: 'string', description: 'A JSON object sent as the request body.', required: false },
          { name: 'stub', type: 'boolean', description: 'If true, skip the real call and only record the attempt.', required: true },
        ],
        returns: 'A status word, SENT or FAILED, or an error message that starts with ERROR:.',
      },
    ],
  },
  {
    id: 'httpClient',
    label: 'HttpClientTool',
    functions: [
      {
        name: 'get',
        description: 'Send an HTTP GET request to a public HTTPS URL.',
        params: [
          { name: 'url', type: 'string', description: 'The HTTPS URL to request. Private and internal addresses are blocked.', required: true },
        ],
        returns: 'The response body, or an error message that starts with ERROR:.',
      },
      {
        name: 'post',
        description: 'Send an HTTP POST request with a JSON body to a public HTTPS URL.',
        params: [
          { name: 'url', type: 'string', description: 'The HTTPS URL to request. Private and internal addresses are blocked.', required: true },
          { name: 'jsonBody', type: 'string', description: 'The JSON body to send.', required: true },
        ],
        returns: 'The response body, or an error message that starts with ERROR:.',
      },
    ],
  },
  {
    id: 'msGraph',
    label: 'MsGraphTool',
    functions: [
      {
        name: 'listUsers',
        description: 'List up to 50 Entra ID users.',
        params: [{ name: 'credentialTag', type: 'string', description: 'The AZURE_GRAPH_API credential tag to use.', required: true }],
        returns: 'The raw Microsoft Graph JSON response, or an error message that starts with ERROR:.',
      },
      {
        name: 'getUser',
        description: 'Get one Entra ID user by ID or sign-in name.',
        params: [
          { name: 'credentialTag', type: 'string', description: 'The AZURE_GRAPH_API credential tag to use.', required: true },
          { name: 'idOrUpn', type: 'string', description: "The user's object ID or user principal name.", required: true },
        ],
        returns: 'The raw Microsoft Graph JSON response, or an error message that starts with ERROR:.',
      },
      {
        name: 'listGroups',
        description: 'List up to 50 Entra ID groups.',
        params: [{ name: 'credentialTag', type: 'string', description: 'The AZURE_GRAPH_API credential tag to use.', required: true }],
        returns: 'The raw Microsoft Graph JSON response, or an error message that starts with ERROR:.',
      },
      {
        name: 'listAppRegistrations',
        description: 'List up to 50 Azure AD app registrations.',
        params: [{ name: 'credentialTag', type: 'string', description: 'The AZURE_GRAPH_API credential tag to use.', required: true }],
        returns: 'The raw Microsoft Graph JSON response, or an error message that starts with ERROR:.',
      },
      {
        name: 'getAppRegistration',
        description: 'Get one Azure AD app registration by ID.',
        params: [
          { name: 'credentialTag', type: 'string', description: 'The AZURE_GRAPH_API credential tag to use.', required: true },
          { name: 'idOrAppId', type: 'string', description: "The app registration's object ID or application (client) ID.", required: true },
        ],
        returns: 'The raw Microsoft Graph JSON response, or an error message that starts with ERROR:.',
      },
      {
        name: 'executeGraphRequest',
        description: 'Send a custom Microsoft Graph request, for anything the other functions do not cover.',
        params: [
          { name: 'credentialTag', type: 'string', description: 'The AZURE_GRAPH_API credential tag to use.', required: true },
          { name: 'path', type: 'string', description: 'The Graph API path, starting with /.', required: true },
          { name: 'method', type: 'string', description: 'The HTTP method. One of: GET, POST, PUT, PATCH, DELETE.', required: true },
          { name: 'jsonBody', type: 'string', description: 'The JSON body to send, for methods that need one.', required: false },
        ],
        returns: 'The raw Microsoft Graph JSON response, or an error message that starts with ERROR:.',
      },
    ],
  },
  {
    id: 'azureArm',
    label: 'AzureArmTool',
    functions: [
      {
        name: 'listSubscriptions',
        description: 'List Azure subscriptions visible to a credential.',
        params: [{ name: 'credentialTag', type: 'string', description: 'The AZURE_ARM credential tag to use.', required: true }],
        returns: 'The raw Azure Resource Manager JSON response, or an error message that starts with ERROR:.',
      },
      {
        name: 'listResourceGroups',
        description: 'List resource groups in one Azure subscription.',
        params: [
          { name: 'credentialTag', type: 'string', description: 'The AZURE_ARM credential tag to use.', required: true },
          { name: 'subscriptionId', type: 'string', description: 'The Azure subscription ID.', required: true },
        ],
        returns: 'The raw Azure Resource Manager JSON response, or an error message that starts with ERROR:.',
      },
      {
        name: 'listResources',
        description: 'List resources in a subscription, or in one resource group.',
        params: [
          { name: 'credentialTag', type: 'string', description: 'The AZURE_ARM credential tag to use.', required: true },
          { name: 'subscriptionId', type: 'string', description: 'The Azure subscription ID.', required: true },
          { name: 'resourceGroupName', type: 'string', description: 'Optional resource group name. Leave empty to list every resource in the subscription.', required: false },
        ],
        returns: 'The raw Azure Resource Manager JSON response, or an error message that starts with ERROR:.',
      },
      {
        name: 'getResource',
        description: 'Get one Azure resource by its resource ID.',
        params: [
          { name: 'credentialTag', type: 'string', description: 'The AZURE_ARM credential tag to use.', required: true },
          { name: 'resourceId', type: 'string', description: 'The full Azure resource ID.', required: true },
          { name: 'apiVersion', type: 'string', description: 'The Azure Resource Manager API version, for example 2021-04-01.', required: true },
        ],
        returns: 'The raw Azure Resource Manager JSON response, or an error message that starts with ERROR:.',
      },
      {
        name: 'executeArmRequest',
        description: 'Send a custom Azure Resource Manager request, for anything the other functions do not cover.',
        params: [
          { name: 'credentialTag', type: 'string', description: 'The AZURE_ARM credential tag to use.', required: true },
          { name: 'path', type: 'string', description: 'The ARM path, starting with /.', required: true },
          { name: 'method', type: 'string', description: 'The HTTP method. One of: GET, POST, PUT, PATCH, DELETE.', required: true },
          { name: 'jsonBody', type: 'string', description: 'The JSON body to send, for methods that need one.', required: false },
          { name: 'apiVersion', type: 'string', description: 'The Azure Resource Manager API version.', required: true },
        ],
        returns: 'The raw Azure Resource Manager JSON response, or an error message that starts with ERROR:.',
      },
    ],
  },
  {
    id: 'webSearch',
    label: 'WebSearchTool',
    functions: [
      {
        name: 'search',
        description: 'Search the web for a query.',
        params: [
          { name: 'query', type: 'string', description: 'The search text.', required: true },
          { name: 'maxResults', type: 'integer', description: 'The maximum number of results to return.', required: true },
        ],
        returns: 'A placeholder result string. This tool is not yet connected to a live search provider.',
      },
    ],
  },
  {
    id: 'fileParser',
    label: 'FileParserTool',
    functions: [
      {
        name: 'parseDocument',
        description: 'Read the text content of an uploaded document.',
        params: [{ name: 'fileId', type: 'string', description: "The uploaded document's file ID.", required: true }],
        returns: 'A placeholder result string. Document parsing is not yet implemented.',
      },
      {
        name: 'extractTables',
        description: 'Read the tables in an uploaded document.',
        params: [{ name: 'fileId', type: 'string', description: "The uploaded document's file ID.", required: true }],
        returns: 'A placeholder result string. Table extraction is not yet implemented.',
      },
    ],
  },
  {
    id: 'sqlExecutor',
    label: 'SqlExecutorTool',
    functions: [
      {
        name: 'executeQuery',
        description: 'Run a read-only SQL query against the knowledge base.',
        params: [{ name: 'sql', type: 'string', description: 'The SQL query to execute against the knowledge base.', required: true }],
        returns: 'The query results as JSON, or a JSON error object.',
      },
    ],
  },
];

export const LOCAL_TOOLS_BY_ID: Record<string, LocalToolDef> =
  Object.fromEntries(LOCAL_TOOLS.map((t) => [t.id, t]));

/**
 * Fixed agent roster across both lanes: the Support agents (traced from
 * SupportAiConfig.java — model tier + tool bindings — and each agent's
 * @SystemMessage prompt for description) and the Tasks agents (traced
 * from AiConfig.java and OrchestratorTools.java).
 */
export const AGENTS: AgentDef[] = [
  {
    id: 'conversation',
    label: 'ConversationAgent',
    tier: 'MEDIUM',
    lane: 'support',
    description: 'Talks with the user in Microsoft Teams to collect missing details about the issue.',
    localToolIds: ['knowledgeBase'],
  },
  {
    id: 'retrieval',
    label: 'RetrievalAgent',
    tier: 'LIGHT',
    lane: 'support',
    description: 'Searches GitHub through MCP, checks Jira ticket status, and searches the knowledge base.',
    localToolIds: ['knowledgeBase'],
    mcpStage: 'RETRIEVAL',
    mcpSourceKeys: ['github'],
  },
  {
    id: 'scraping',
    label: 'ScrapingAgent',
    tier: 'LIGHT',
    lane: 'support',
    description: 'Fetches web pages over HTTP.',
    localToolIds: ['httpClient'],
  },
  {
    id: 'reasoning',
    label: 'ReasoningAgent',
    tier: 'HEAVY',
    lane: 'support',
    description: 'Finds the root cause and proposes a fix, or plans a requested action, using past lessons learned.',
    localToolIds: ['knowledgeBase'],
  },
  {
    id: 'validation',
    label: 'ValidationAgent',
    tier: 'MEDIUM',
    lane: 'support',
    description: 'Checks the proposed fix against risk rules and RACI policy.',
    localToolIds: ['policyLookup', 'keyringAccess'],
  },
  {
    id: 'planning',
    label: 'PlanningAgent',
    tier: 'HEAVY',
    lane: 'support',
    description: 'Turns the proposed fix into an ordered list of Azure ARM and Graph API steps.',
    localToolIds: [],
  },
  {
    id: 'approval',
    label: 'ApprovalAgent',
    tier: 'LIGHT',
    lane: 'support',
    description: 'Writes the approval request and sends it to the RACI approvers by email or webhook.',
    localToolIds: ['raciLookup', 'approvalLink', 'email', 'restCall', 'keyringAccess'],
  },
  {
    id: 'execution',
    label: 'ExecutionAgent',
    tier: 'MEDIUM',
    lane: 'support',
    description: 'Runs the approved plan with Azure ARM, Microsoft Graph, and MCP execution tools.',
    localToolIds: ['keyringAccess', 'msGraph', 'azureArm'],
    mcpStage: 'EXECUTION',
  },
  {
    id: 'audit',
    label: 'AuditAgent',
    tier: 'MEDIUM',
    lane: 'support',
    description: 'Writes the audit record for the run and saves a lesson learned.',
    localToolIds: ['knowledgeBase'],
  },
  {
    id: 'orchestrator',
    label: 'OrchestratorAgent',
    tier: 'HEAVY',
    lane: 'tasks',
    description: 'Coordinates a Task by delegating subtasks to worker agents, one at a time, based on what the prompt needs.',
    localToolIds: [],
  },
  {
    id: 'search',
    label: 'SearchAgent',
    tier: 'MEDIUM',
    lane: 'tasks',
    description: 'Runs a web search subtask and returns the results.',
    localToolIds: ['webSearch'],
  },
  {
    id: 'document',
    label: 'DocumentAgent',
    tier: 'MEDIUM',
    lane: 'tasks',
    description: 'Parses an uploaded document and answers questions from its content.',
    localToolIds: ['fileParser', 'knowledgeBase'],
  },
  {
    id: 'database',
    label: 'DatabaseAgent',
    tier: 'MEDIUM',
    lane: 'tasks',
    description: 'Runs a read-only SQL query subtask and returns the results.',
    localToolIds: ['sqlExecutor', 'knowledgeBase'],
  },
  {
    id: 'apiIntegration',
    label: 'ApiIntegrationAgent',
    tier: 'MEDIUM',
    lane: 'tasks',
    description: 'Calls an external HTTP API subtask and returns the response.',
    localToolIds: ['httpClient'],
  },
  {
    id: 'azureSpectator',
    label: 'AzureSpectatorAgent',
    tier: 'MEDIUM',
    lane: 'tasks',
    description: 'Reads Azure and Entra ID resources to answer a subtask.',
    localToolIds: ['azureArm', 'msGraph'],
  },
  {
    id: 'atlassianQuery',
    label: 'AtlassianQueryAgent',
    tier: 'MEDIUM',
    lane: 'tasks',
    description: 'Answers read-only questions about Jira issues and Confluence pages.',
    localToolIds: [],
    mcpStage: 'RETRIEVAL',
    mcpSourceKeys: ['jira', 'confluence'],
  },
  {
    id: 'projectManager',
    label: 'ProjectManagerAgent',
    tier: 'MEDIUM',
    lane: 'support',
    description: 'Looks up a Jira ticket\'s status during retrieval, and creates or updates the ticket after execution.',
    localToolIds: [],
    mcpStage: 'RETRIEVAL',
    mcpSourceKeys: ['jira'],
  },
  {
    id: 'wiki',
    label: 'WikiAgent',
    tier: 'LIGHT',
    lane: 'support',
    description: 'Searches Confluence for reasoning and planning agents when they need more documentation.',
    localToolIds: [],
    mcpStage: 'RETRIEVAL',
    mcpSourceKeys: ['confluence'],
  },
  {
    id: 'detection',
    label: 'DetectionAgent',
    tier: 'MEDIUM',
    lane: 'autosre',
    description: 'Writes a short incident brief from the rule that fired and the signal data that triggered it.',
    localToolIds: [],
  },
  {
    id: 'pattern',
    label: 'PatternAgent',
    tier: 'LIGHT',
    lane: 'autosre',
    description: 'Finds recurring patterns in a batch of raw log lines and extracts a normalized signature for each one.',
    localToolIds: [],
  },
];

export const AGENTS_BY_ID: Record<string, AgentDef> =
  Object.fromEntries(AGENTS.map((a) => [a.id, a]));

/**
 * Processing order traced from SupportAsyncPipeline: ConversationAgent is the
 * entry point; Retrieval and Scraping gather context in parallel before
 * Reasoning runs.
 */
export const AGENT_SEQUENCE_EDGES: Array<[string, string]> = [
  ['conversation', 'retrieval'],
  ['conversation', 'scraping'],
  ['retrieval', 'reasoning'],
  ['scraping', 'reasoning'],
  ['reasoning', 'validation'],
  ['validation', 'planning'],
  ['planning', 'approval'],
  ['approval', 'execution'],
  ['execution', 'audit'],
  ['retrieval', 'projectManager'],
  ['audit', 'projectManager'],
  ['reasoning', 'wiki'],
  ['planning', 'wiki'],
];

/**
 * OrchestratorAgent delegates dynamically (no fixed sequence): it calls
 * whichever worker agents a given prompt needs. Modeled as a star from
 * orchestrator to each worker.
 */
export const TASK_SEQUENCE_EDGES: Array<[string, string]> = [
  ['orchestrator', 'search'],
  ['orchestrator', 'document'],
  ['orchestrator', 'database'],
  ['orchestrator', 'apiIntegration'],
  ['orchestrator', 'azureSpectator'],
  ['orchestrator', 'atlassianQuery'],
];

/**
 * DetectionAgent is the autosre lane's entry point (written by
 * AutoSreAsyncPipeline.detectIncident); PatternAgent feeds it when a log
 * batch classifies as a new/matched pattern (SreLogPatternService). Once
 * written, the incident brief flows into the same RetrievalAgent /
 * ScrapingAgent -> ReasoningAgent -> ... chain Support uses, via the
 * existing AGENT_SEQUENCE_EDGES edges.
 */
export const AUTOSRE_SEQUENCE_EDGES: Array<[string, string]> = [
  ['pattern', 'detection'],
  ['detection', 'retrieval'],
  ['detection', 'scraping'],
];

export interface SystemTopologyNodeData {
  kind: 'pipeline-group' | 'agent' | 'tool' | 'signal-source';
  label: string;
  subtitle: string;
  environment?: string;
  pipelines?: Array<{ id: string; name: string; teamId: string }>;
  agent?: AgentDef;
  toolKind?: 'local' | 'mcp';
  toolId?: string;
  usedByAgentIds?: string[];
  mcp?: McpSourceDto;
  sreSource?: ISreSignalSource;
  dimmed?: boolean;
  active?: boolean;
  [key: string]: unknown;
}

export interface OverviewGraphNode {
  id: string;
  x: number;
  y: number;
  data: SystemTopologyNodeData;
}

export interface OverviewGraphEdge {
  id: string;
  source: string;
  target: string;
}

export function buildSystemOverviewGraph(
  pipelines: IPipeline[],
  mcpSources: McpSourceDto[],
  autoSrePipelines: IAutoSrePipeline[] = [],
  sreSources: ISreSignalSource[] = [],
): { nodes: OverviewGraphNode[]; edges: OverviewGraphEdge[] } {
  const g = new dagre.graphlib.Graph();
  g.setGraph({ rankdir: 'LR', nodesep: 50, ranksep: 140, marginx: 50, marginy: 50 });
  g.setDefaultEdgeLabel(() => ({}));

  const dataById = new Map<string, SystemTopologyNodeData>();
  const rawEdges: OverviewGraphEdge[] = [];

  const addNode = (id: string, data: SystemTopologyNodeData) => {
    dataById.set(id, data);
    g.setNode(id, { width: nodeWidth, height: nodeHeight });
  };

  const addEdge = (source: string, target: string) => {
    const id = `${source}->${target}`;
    rawEdges.push({ id, source, target });
    if (!g.hasEdge(source, target)) {
      g.setEdge(source, target);
    }
  };

  // Tier 1 — pipelines grouped by environment
  const byEnvironment = new Map<string, IPipeline[]>();
  pipelines.forEach((p) => {
    const list = byEnvironment.get(p.environment) ?? [];
    list.push(p);
    byEnvironment.set(p.environment, list);
  });
  byEnvironment.forEach((pipelinesInEnv, environment) => {
    const id = `pg:${environment}`;
    addNode(id, {
      kind: 'pipeline-group',
      label: environment,
      subtitle: `${pipelinesInEnv.length} pipeline${pipelinesInEnv.length === 1 ? '' : 's'}`,
      environment,
      pipelines: pipelinesInEnv,
    });
    addEdge(id, 'agent:conversation');
  });

  // Auto SRE lane — AutoSrePipeline rows grouped by environment, feeding DetectionAgent.
  const byAutoSreEnvironment = new Map<string, IAutoSrePipeline[]>();
  autoSrePipelines.forEach((p) => {
    const list = byAutoSreEnvironment.get(p.environment) ?? [];
    list.push(p);
    byAutoSreEnvironment.set(p.environment, list);
  });
  byAutoSreEnvironment.forEach((pipelinesInEnv, environment) => {
    const id = `apg:${environment}`;
    addNode(id, {
      kind: 'pipeline-group',
      label: `${environment} · Auto SRE`,
      subtitle: `${pipelinesInEnv.length} pipeline${pipelinesInEnv.length === 1 ? '' : 's'}`,
      environment,
      pipelines: pipelinesInEnv,
    });
    addEdge(id, 'agent:detection');
  });

  // Tasks lane — a single, ungrouped entry point (Task has no environment/team).
  addNode(TASKS_ENTRY_NODE_ID, {
    kind: 'pipeline-group',
    label: 'Tasks',
    subtitle: 'Ad-hoc prompts',
    pipelines: [],
  });
  addEdge(TASKS_ENTRY_NODE_ID, 'agent:orchestrator');

  // Tier 2 — fixed agent roster
  AGENTS.forEach((agentDef) => {
    addNode(`agent:${agentDef.id}`, {
      kind: 'agent',
      label: agentDef.label,
      subtitle: MODEL_TIER_LABEL[agentDef.tier],
      agent: agentDef,
    });
  });
  AGENT_SEQUENCE_EDGES.forEach(([from, to]) => addEdge(`agent:${from}`, `agent:${to}`));
  TASK_SEQUENCE_EDGES.forEach(([from, to]) => addEdge(`agent:${from}`, `agent:${to}`));
  AUTOSRE_SEQUENCE_EDGES.forEach(([from, to]) => addEdge(`agent:${from}`, `agent:${to}`));

  // Tier 3a — local tools (only ones bound to at least one agent)
  LOCAL_TOOLS.forEach((toolDef) => {
    const usedByAgentIds = AGENTS.filter((a) => a.localToolIds.includes(toolDef.id)).map((a) => a.id);
    if (usedByAgentIds.length === 0) return;
    const id = `tool:local:${toolDef.id}`;
    addNode(id, {
      kind: 'tool',
      label: toolDef.label,
      subtitle: 'Local tool',
      toolKind: 'local',
      toolId: toolDef.id,
      usedByAgentIds,
    });
    usedByAgentIds.forEach((agentId) => addEdge(`agent:${agentId}`, id));
  });

  // Tier 3b — live MCP tool sources
  mcpSources.forEach((source) => {
    const usedByAgentIds = AGENTS.filter((a) =>
      a.mcpSourceKeys ? a.mcpSourceKeys.includes(source.key) : a.mcpStage === source.stage,
    ).map((a) => a.id);
    const id = `tool:mcp:${source.key}`;
    addNode(id, {
      kind: 'tool',
      label: source.displayName,
      subtitle: source.enabled ? `MCP · ${source.stage}` : `MCP · ${source.stage} · disabled`,
      toolKind: 'mcp',
      toolId: source.key,
      usedByAgentIds,
      mcp: source,
    });
    usedByAgentIds.forEach((agentId) => addEdge(`agent:${agentId}`, id));
  });

  // Auto SRE lane — live signal sources. Every source can trigger PatternAgent
  // (log batches) and DetectionAgent (every fired rule reaches Detection
  // directly too — threshold/forecast rules never go through PatternAgent).
  sreSources.forEach((source) => {
    const id = `source:sre:${source.key}`;
    addNode(id, {
      kind: 'signal-source',
      label: source.displayName,
      subtitle: source.enabled ? `Signal source · ${source.type}` : `Signal source · ${source.type} · disabled`,
      usedByAgentIds: ['pattern', 'detection'],
      sreSource: source,
    });
    addEdge(id, 'agent:pattern');
    addEdge(id, 'agent:detection');
  });

  dagre.layout(g);

  const nodes: OverviewGraphNode[] = [];
  dataById.forEach((data, id) => {
    const n = g.node(id);
    nodes.push({ id, x: n.x - nodeWidth / 2, y: n.y - nodeHeight / 2, data });
  });

  return { nodes, edges: rawEdges };
}

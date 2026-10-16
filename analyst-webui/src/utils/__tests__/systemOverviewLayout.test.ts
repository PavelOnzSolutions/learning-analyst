import { describe, it, expect } from 'vitest';
import { buildSystemOverviewGraph, AGENTS, LOCAL_TOOLS, LOCAL_TOOLS_BY_ID, TASKS_ENTRY_NODE_ID } from '../systemOverviewLayout';
import type { IPipeline } from '../../models/pipeline.model';
import type { McpSourceDto } from '../../services/McpConfigurationService';
import type { IAutoSrePipeline, ISreSignalSource } from '../../models/sre.model';

const pipeline = (overrides: Partial<IPipeline> = {}): IPipeline => ({
  id: 'p1',
  teamId: 'team-1',
  name: 'Deploy API',
  description: null,
  environment: 'DEV',
  defaultApprovalTimeoutMinutes: 60,
  escalationCredentialTag: null,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  ...overrides,
});

const mcpSource = (overrides: Partial<McpSourceDto> = {}): McpSourceDto => ({
  key: 'jira',
  displayName: 'Jira',
  builtIn: true,
  stage: 'RETRIEVAL',
  enabled: true,
  ...overrides,
});

const autoSrePipeline = (overrides: Partial<IAutoSrePipeline> = {}): IAutoSrePipeline => ({
  id: 'ap1',
  teamId: 'team-1',
  name: 'Prod Auto SRE',
  description: null,
  environment: 'PROD',
  defaultApprovalTimeoutMinutes: 30,
  escalationCredentialTag: null,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  ...overrides,
});

const sreSource = (overrides: Partial<ISreSignalSource> = {}): ISreSignalSource => ({
  id: 's1',
  key: 'app-insights',
  displayName: 'App Insights',
  type: 'AZURE_MONITOR',
  enabled: true,
  credentialId: null,
  config: {},
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  ...overrides,
});

describe('buildSystemOverviewGraph', () => {
  it('groups pipelines into one node per environment', () => {
    const { nodes } = buildSystemOverviewGraph(
      [
        pipeline({ id: 'p1', environment: 'DEV' }),
        pipeline({ id: 'p2', environment: 'DEV' }),
        pipeline({ id: 'p3', environment: 'PROD' }),
      ],
      [],
    );
    const groups = nodes.filter((n) => n.data.kind === 'pipeline-group' && n.id !== TASKS_ENTRY_NODE_ID);
    expect(groups).toHaveLength(2);
    const dev = groups.find((n) => n.id === 'pg:DEV');
    expect(dev?.data.pipelines).toHaveLength(2);
  });

  it('creates one node per fixed agent', () => {
    const { nodes } = buildSystemOverviewGraph([], []);
    const agents = nodes.filter((n) => n.data.kind === 'agent');
    expect(agents).toHaveLength(AGENTS.length);
    expect(agents.map((n) => n.id)).toContain('agent:conversation');
    expect(agents.map((n) => n.id)).toContain('agent:execution');
  });

  it('connects every pipeline-group node to the conversation agent', () => {
    const { nodes, edges } = buildSystemOverviewGraph([pipeline({ environment: 'DEV' })], []);
    const pg = nodes.find((n) => n.data.kind === 'pipeline-group')!;
    expect(edges.some((e) => e.source === pg.id && e.target === 'agent:conversation')).toBe(true);
  });

  it('connects a RETRIEVAL-stage MCP source to the agents that declare it in mcpSourceKeys', () => {
    const { nodes, edges } = buildSystemOverviewGraph(
      [],
      [
        mcpSource({ key: 'jira', stage: 'RETRIEVAL' }),
        mcpSource({ key: 'confluence', displayName: 'Confluence', stage: 'RETRIEVAL' }),
        mcpSource({ key: 'github', displayName: 'GitHub', stage: 'RETRIEVAL' }),
      ],
    );
    expect(nodes.some((n) => n.id === 'tool:mcp:jira')).toBe(true);
    // RetrievalAgent no longer has direct Jira/Confluence MCP access; it only wires to github.
    expect(edges.some((e) => e.source === 'agent:retrieval' && e.target === 'tool:mcp:github')).toBe(true);
    expect(edges.some((e) => e.source === 'agent:retrieval' && e.target === 'tool:mcp:jira')).toBe(false);
    expect(edges.some((e) => e.source === 'agent:retrieval' && e.target === 'tool:mcp:confluence')).toBe(false);
    // ProjectManagerAgent and WikiAgent take over the dedicated Jira/Confluence wiring.
    expect(edges.some((e) => e.source === 'agent:projectManager' && e.target === 'tool:mcp:jira')).toBe(true);
    expect(edges.some((e) => e.source === 'agent:wiki' && e.target === 'tool:mcp:confluence')).toBe(true);
  });

  it('connects an EXECUTION-stage MCP source to the execution agent', () => {
    const { edges } = buildSystemOverviewGraph([], [mcpSource({ key: 'azure', stage: 'EXECUTION' })]);
    expect(edges.some((e) => e.source === 'agent:execution' && e.target === 'tool:mcp:azure')).toBe(true);
  });

  it('connects ValidationAgent to its local tools', () => {
    const { edges } = buildSystemOverviewGraph([], []);
    expect(edges.some((e) => e.source === 'agent:validation' && e.target === 'tool:local:policyLookup')).toBe(true);
    expect(edges.some((e) => e.source === 'agent:validation' && e.target === 'tool:local:keyringAccess')).toBe(true);
  });

  it('binds every agent to its exact local tools and MCP stage per the spec', () => {
    const expected: Record<
      string,
      { localToolIds: string[]; mcpStage?: 'RETRIEVAL' | 'EXECUTION'; mcpSourceKeys?: string[] }
    > = {
      conversation: { localToolIds: ['knowledgeBase'] },
      retrieval: { localToolIds: ['knowledgeBase'], mcpStage: 'RETRIEVAL', mcpSourceKeys: ['github'] },
      scraping: { localToolIds: ['httpClient'] },
      reasoning: { localToolIds: ['knowledgeBase'] },
      validation: { localToolIds: ['policyLookup', 'keyringAccess'] },
      planning: { localToolIds: [] },
      approval: { localToolIds: ['raciLookup', 'approvalLink', 'email', 'restCall', 'keyringAccess'] },
      execution: { localToolIds: ['keyringAccess', 'msGraph', 'azureArm'], mcpStage: 'EXECUTION' },
      audit: { localToolIds: ['knowledgeBase'] },
      orchestrator: { localToolIds: [] },
      search: { localToolIds: ['webSearch'] },
      document: { localToolIds: ['fileParser', 'knowledgeBase'] },
      database: { localToolIds: ['sqlExecutor', 'knowledgeBase'] },
      apiIntegration: { localToolIds: ['httpClient'] },
      azureSpectator: { localToolIds: ['azureArm', 'msGraph'] },
      atlassianQuery: { localToolIds: [], mcpStage: 'RETRIEVAL', mcpSourceKeys: ['jira', 'confluence'] },
      projectManager: { localToolIds: [], mcpStage: 'RETRIEVAL', mcpSourceKeys: ['jira'] },
      wiki: { localToolIds: [], mcpStage: 'RETRIEVAL', mcpSourceKeys: ['confluence'] },
      detection: { localToolIds: [] },
      pattern: { localToolIds: [] },
    };
    expect(AGENTS).toHaveLength(Object.keys(expected).length);
    Object.entries(expected).forEach(([id, exp]) => {
      const agent = AGENTS.find((a) => a.id === id);
      expect(agent).toBeDefined();
      expect(agent!.localToolIds).toEqual(exp.localToolIds);
      expect(agent!.mcpStage).toBe(exp.mcpStage);
      expect(agent!.mcpSourceKeys).toEqual(exp.mcpSourceKeys);
    });
  });

  it('assigns numeric x/y positions to every node after layout', () => {
    const { nodes } = buildSystemOverviewGraph([pipeline()], [mcpSource()]);
    nodes.forEach((n) => {
      expect(typeof n.x).toBe('number');
      expect(typeof n.y).toBe('number');
      expect(Number.isNaN(n.x)).toBe(false);
      expect(Number.isNaN(n.y)).toBe(false);
    });
  });

  it('adds a static Tasks entry node connected to the orchestrator agent', () => {
    const { nodes, edges } = buildSystemOverviewGraph([], []);
    const tasksNode = nodes.find((n) => n.id === TASKS_ENTRY_NODE_ID);
    expect(tasksNode).toBeDefined();
    expect(tasksNode?.data.kind).toBe('pipeline-group');
    expect(edges.some((e) => e.source === TASKS_ENTRY_NODE_ID && e.target === 'agent:orchestrator')).toBe(true);
  });

  it('wires the Orchestrator agent to each of its 5 worker agents', () => {
    const { edges } = buildSystemOverviewGraph([], []);
    ['search', 'document', 'database', 'apiIntegration', 'azureSpectator'].forEach((id) => {
      expect(edges.some((e) => e.source === 'agent:orchestrator' && e.target === `agent:${id}`)).toBe(true);
    });
  });

  it('shares the knowledgeBase tool node between the Support and Tasks lanes', () => {
    const { edges } = buildSystemOverviewGraph([], []);
    expect(edges.some((e) => e.source === 'agent:conversation' && e.target === 'tool:local:knowledgeBase')).toBe(true);
    expect(edges.some((e) => e.source === 'agent:document' && e.target === 'tool:local:knowledgeBase')).toBe(true);
  });

  it('gives every local tool at least one function with a name, description, and returns line', () => {
    LOCAL_TOOLS.forEach((tool) => {
      expect(tool.functions.length).toBeGreaterThan(0);
      tool.functions.forEach((fn) => {
        expect(fn.name).toBeTruthy();
        expect(fn.description).toBeTruthy();
        expect(fn.returns).toBeTruthy();
      });
    });
  });

  it('marks KnowledgeBaseTool.semanticSearch params correctly', () => {
    const kb = LOCAL_TOOLS_BY_ID['knowledgeBase'];
    const fn = kb.functions.find((f) => f.name === 'semanticSearch')!;
    expect(fn.params.map((p) => p.name)).toEqual(['query', 'topK']);
    expect(fn.params.find((p) => p.name === 'topK')?.type).toBe('integer');
  });

  it('marks optional params as not required (e.g. KnowledgeBaseTool.listDocuments.collectionName)', () => {
    const kb = LOCAL_TOOLS_BY_ID['knowledgeBase'];
    const fn = kb.functions.find((f) => f.name === 'listDocuments')!;
    expect(fn.params.find((p) => p.name === 'collectionName')?.required).toBe(false);
  });

  it('groups AutoSrePipeline rows into one node per environment, wired to DetectionAgent', () => {
    const { nodes, edges } = buildSystemOverviewGraph(
      [],
      [],
      [autoSrePipeline({ id: 'ap1', environment: 'PROD' }), autoSrePipeline({ id: 'ap2', environment: 'PROD' })],
      [],
    );
    const apg = nodes.find((n) => n.id === 'apg:PROD');
    expect(apg).toBeDefined();
    expect(apg?.data.kind).toBe('pipeline-group');
    expect(apg?.data.pipelines).toHaveLength(2);
    expect(edges.some((e) => e.source === 'apg:PROD' && e.target === 'agent:detection')).toBe(true);
  });

  it('adds DetectionAgent and PatternAgent to the autosre lane, wired into the shared chain', () => {
    const { edges } = buildSystemOverviewGraph([], [], [], []);
    const detection = AGENTS.find((a) => a.id === 'detection');
    const pattern = AGENTS.find((a) => a.id === 'pattern');
    expect(detection?.lane).toBe('autosre');
    expect(pattern?.lane).toBe('autosre');
    expect(edges.some((e) => e.source === 'agent:pattern' && e.target === 'agent:detection')).toBe(true);
    expect(edges.some((e) => e.source === 'agent:detection' && e.target === 'agent:retrieval')).toBe(true);
    expect(edges.some((e) => e.source === 'agent:detection' && e.target === 'agent:scraping')).toBe(true);
  });

  it('creates one signal-source node per SreSignalSource, wired into PatternAgent and DetectionAgent', () => {
    const { nodes, edges } = buildSystemOverviewGraph([], [], [], [sreSource({ key: 'app-insights' })]);
    const node = nodes.find((n) => n.id === 'source:sre:app-insights');
    expect(node).toBeDefined();
    expect(node?.data.kind).toBe('signal-source');
    expect(node?.data.usedByAgentIds).toEqual(['pattern', 'detection']);
    expect(edges.some((e) => e.source === 'source:sre:app-insights' && e.target === 'agent:pattern')).toBe(true);
    expect(edges.some((e) => e.source === 'source:sre:app-insights' && e.target === 'agent:detection')).toBe(true);
  });

  it('passes the enabled flag through onto the signal-source node data', () => {
    const { nodes } = buildSystemOverviewGraph([], [], [], [sreSource({ key: 'webhook-1', enabled: false })]);
    const node = nodes.find((n) => n.id === 'source:sre:webhook-1');
    expect(node?.data.sreSource?.enabled).toBe(false);
  });
});

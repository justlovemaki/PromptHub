import { NextRequest } from 'next/server';
import { authenticateRequest } from '@/lib/mcp-auth';
import { db } from '@/lib/database';
import { prompt } from '@/drizzle-schema';
import { eq, and } from 'drizzle-orm';

interface MCPMessage {
  jsonrpc: '2.0';
  id?: string | number;
  method?: string;
  params?: any;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

function createMCPResult(id: MCPMessage['id'], result: any) {
  return {
    jsonrpc: '2.0' as const,
    id,
    result,
  };
}

function createMCPError(id: MCPMessage['id'], code: number, message: string, data?: any) {
  return {
    jsonrpc: '2.0' as const,
    id,
    error: {
      code,
      message,
      data,
    },
  };
}

async function* handleMCPStream(message: MCPMessage, authResult: any) {
  // Log request body
  console.log('[MCP] Authenticated request body:', message);

  // Handle MCP initialization request
  if (message.method === 'initialize') {
    console.log('[MCP] Processing initialize request');
    yield createMCPResult(message.id, {
      protocolVersion: '2025-03-26',
      capabilities: {},
      serverInfo: {
        name: 'Prompt Manager MCP Server',
        version: '1.0.0'
      }
    });
    return;
  }

  // Handle notifications/initialized (treat as a method that needs acknowledgment)
  if (message.method === 'notifications/initialized') {
    console.log('[MCP] Processing notifications/initialized');
    yield createMCPResult(message.id, {
      success: true
    });
    return;
  }

  // Handle listPrompts method
  if (message.method === 'listPrompts') {
    console.log('[MCP] Processing listPrompts');
    const personalSpaceId = authResult.user.personalSpaceId;
    const userPrompts = await db.select().from(prompt).where(eq(prompt.spaceId, personalSpaceId));
    
    yield createMCPResult(message.id, {
      prompts: userPrompts.map(p => ({
        id: p.id,
        name: p.title,
        content: p.content,
        tags: p.tags
      }))
    });
    return;
  }

  // Handle tools/list method
  if (message.method === 'tools/list') {
    console.log('[MCP] Processing tools/list');
    yield createMCPResult(message.id, {
      tools: [
        {
          name: "getPromptById",
          description: "根据提示词ID获取提示词内容",
          inputSchema: {
            type: "object",
            properties: {
              id: {
                type: "string",
                description: "提示词ID"
              }
            },
            required: ["id"]
          }
        },
        {
          name: "listPrompt",
          description: "查询当前用户的所有提示词的标题和描述",
          inputSchema: {
            type: "object",
            properties: {},
            required: []
          }
        }
      ]
    });
    return;
  }

  // Handle getPromptById tool execution
  if (message.method === 'tools/call' && message.params?.name === 'getPromptById') {
    const { id } = message.params.arguments || message.params;
    const personalSpaceId = authResult.user.personalSpaceId;
    console.log('[MCP] Processing getPromptById for personal space:', personalSpaceId);
    console.log('[MCP] Prompt ID:', id);

    // 根据ID精确查找提示词，并限制在用户个人空间内
    const matchedPrompt = await db.select({
      content: prompt.content
    }).from(prompt).where(
      and(
        eq(prompt.spaceId, personalSpaceId),
        eq(prompt.id, id)
      )
    ).limit(1);

    // console.log('[MCP] Matched prompt:', matchedPrompt);

    yield createMCPResult(message.id, {
      content: [
        {
          type: "text",
          text: JSON.stringify(matchedPrompt[0] || null),
        },
      ],
      isPartial: false
    });
    return;
  }

  // Handle listPrompt tool execution
  if (message.method === 'tools/call' && message.params?.name === 'listPrompt') {
    const personalSpaceId = authResult.user.personalSpaceId;
    console.log('[MCP] Processing listPrompt for personal space:', personalSpaceId);

    const userPrompts = await db.select({
      id: prompt.id,
      title: prompt.title,
      description: prompt.description,
      tags: prompt.tags
    }).from(prompt).where(eq(prompt.spaceId, personalSpaceId));

    // console.log('[MCP] User prompts:', userPrompts);

    yield createMCPResult(message.id, {
      content: [
        {
          type: "text",
          text: JSON.stringify(userPrompts),
        },
      ],
      isPartial: false
    });
    return;
  }

  // Default: return error for unhandled methods
  yield createMCPError(message.id, -32601, 'Method not found');
}

export async function POST(request: NextRequest) {
  const encoder = new TextEncoder();

  try {
    // Log request body first
    const requestBody = await request.clone().json().catch(() => null);
    console.log('[MCP] Request body:', requestBody);
    
    // For All requests, require authentication
    const authResult = await authenticateRequest(request);
    if (!authResult) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    const message: MCPMessage = await request.json();
    
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // 发送 SSE 格式的消息
          for await (const response of handleMCPStream(message, authResult)) {
            // SSE 格式: "data: {json}\n\n"
            const data = `data: ${JSON.stringify(response)}\n\n`;
            controller.enqueue(encoder.encode(data));
          }
          
          // 发送结束标记
          controller.enqueue(encoder.encode('event: done\ndata: {}\n\n'));
          controller.close();
        } catch (error) {
          const errorData = `event: error\ndata: ${JSON.stringify({ error: String(error) })}\n\n`;
          controller.enqueue(encoder.encode(errorData));
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no', // 禁用 nginx 缓冲
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Invalid request' }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      }
    );
  }
}

// CORS preflight handler
export async function OPTIONS() {
  const response = new Response(null, { status: 200 });
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return response;
}
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { decrypt } from "@/lib/encrypt";
import { streamText, dynamicTool, jsonSchema, stepCountIs, type ModelMessage } from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAI } from "@ai-sdk/openai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const SYSTEM_PROMPT = `You are SkyFi Agent — an expert AI assistant for satellite imagery.
You help users search for imagery, check feasibility, get pricing, place orders, and monitor areas of interest (AOIs).

Key behaviors:
- When a user mentions a place by name (e.g. "Nairobi", "the port of Rotterdam"), always call resolve_location_to_wkt first to convert it to coordinates before searching.
- Always include thumbnailUrls in search results so users can preview imagery.
- Before placing any order, generate a preview with request_image_order and present the cost to the user. Never confirm an order without explicit user approval.
- For cloud-prone areas or poor weather, proactively suggest SAR imagery.
- When the user sets up AOI monitoring, confirm the subscription ID so they can track it.

Be concise, helpful, and geospatial-savvy.`;

async function buildMcpTools(
  mcpServerUrl: string,
  skyfiKey: string,
  notificationUrl: string
) {
  const transport = new StreamableHTTPClientTransport(
    new URL(`${mcpServerUrl}/mcp`),
    {
      requestInit: {
        headers: {
          "X-Skyfi-Api-Key": skyfiKey,
          "X-Skyfi-Notification-Url": notificationUrl,
        },
      },
    }
  );

  const client = new Client(
    { name: "skyfi-agent-web", version: "1.0.0" },
    { capabilities: {} }
  );
  await client.connect(transport);

  const { tools: mcpTools } = await client.listTools();

  const tools: Record<string, ReturnType<typeof dynamicTool>> = {};
  for (const mcpTool of mcpTools) {
    const name = mcpTool.name;
    tools[name] = dynamicTool({
      description: mcpTool.description ?? name,
      inputSchema: jsonSchema(
        (mcpTool.inputSchema as Record<string, unknown>) ?? {
          type: "object",
          properties: {},
        }
      ),
      execute: async (params: unknown) => {
        const result = await client.callTool({
          name,
          arguments: params as Record<string, unknown>,
        });
        if (Array.isArray(result.content)) {
          return result.content
            .map((c) =>
              c.type === "text"
                ? (c as { type: "text"; text: string }).text
                : JSON.stringify(c)
            )
            .join("\n");
        }
        return JSON.stringify(result.content);
      },
    });
  }

  return { tools, client };
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session.user as { id: string }).id;

  const { messages } = (await req.json()) as {
    messages: Array<{ role: "user" | "assistant"; content: string }>;
  };

  const secrets = await prisma.userSecret.findUnique({ where: { userId } });
  if (!secrets?.skyfiKey || !secrets?.aiKey) {
    return Response.json(
      {
        error:
          "Please configure your SkyFi and AI API keys in Settings before chatting.",
      },
      { status: 400 }
    );
  }

  const skyfiKey = decrypt(secrets.skyfiKey);
  const aiKey = decrypt(secrets.aiKey);
  const provider = secrets.aiProvider;

  const appUrl =
    process.env.NEXTAUTH_URL ?? `https://${req.headers.get("host")}`;
  const notificationUrl = `${appUrl}/api/webhooks/aoi?userId=${userId}`;
  const mcpServerUrl = process.env.MCP_SERVER_URL!;

  let mcpClient: Client | null = null;

  try {
    const { tools, client } = await buildMcpTools(
      mcpServerUrl,
      skyfiKey,
      notificationUrl
    );
    mcpClient = client;

    let model;
    if (provider === "openai") {
      model = createOpenAI({ apiKey: aiKey })("gpt-4o");
    } else if (provider === "gemini") {
      model = createGoogleGenerativeAI({ apiKey: aiKey })(
        "gemini-2.0-flash-exp"
      );
    } else {
      model = createAnthropic({ apiKey: aiKey })(
        "claude-3-5-sonnet-20241022"
      );
    }

    const result = streamText({
      model,
      messages: messages as ModelMessage[],
      tools,
      stopWhen: stepCountIs(15),
      system: SYSTEM_PROMPT,
      onFinish: async () => {
        await mcpClient?.close();
      },
    });

    return result.toTextStreamResponse();
  } catch (err) {
    await mcpClient?.close();
    console.error("Chat error:", err);
    return Response.json(
      { error: "Failed to connect to SkyFi services. Check your API keys." },
      { status: 500 }
    );
  }
}

import { GoogleGenAI, Type, Schema } from "@google/genai";
import { TrendItem, SupplyItem, StrategyType, TrendAnalysisResult, DataSource } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const DATA_SOURCE_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    type: { type: Type.STRING, enum: ["WEB", "DB", "AI"], description: "数据来源类型: WEB(网络/公开数据), DB(数据库/历史统计), AI(AI推理/预测)" },
    name: { type: Type.STRING, description: "来源名称 (例如: '36氪', '内部销售数据', 'Gemini趋势模型')" },
    factors: { 
      type: Type.ARRAY, 
      items: { type: Type.STRING },
      description: "如果是AI推理，列出3个关键影响因子 (例如: '社交媒体热度', '季节性因素', '成本波动')" 
    }
  },
  required: ["type", "name"]
};

const TRENDS_ANALYSIS_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    marketAnalysis: { type: Type.STRING, description: "基于选定策略的市场现状深度分析 (中文，约50-80字)" },
    strategicConclusion: { type: Type.STRING, description: "基于分析得出的关键结论或行动建议 (中文，约30-50字)" },
    source: DATA_SOURCE_SCHEMA,
    items: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          title: { type: Type.STRING, description: "趋势名称 (中文, 例如: '桂花拿铁')" },
          description: { type: Type.STRING, description: "趋势的简短说明 (中文)" },
          growthRate: { type: Type.STRING, description: "增长率 (例如: '+15%')" },
          category: { type: Type.STRING, description: "分类 (中文, 例如: '茶饮', '咖啡', '小料')" },
          imageUrl: { type: Type.STRING, description: "A placeholder image keyword related to the drink" },
          source: DATA_SOURCE_SCHEMA
        },
        required: ["id", "title", "description", "growthRate", "category", "source"]
      }
    }
  },
  required: ["marketAnalysis", "strategicConclusion", "items", "source"]
};

const SUPPLY_SCHEMA: Schema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      id: { type: Type.STRING },
      companyName: { type: Type.STRING, description: "公司名称 (中文)" },
      product: { type: Type.STRING, description: "产品名称 (中文)" },
      price: { type: Type.STRING, description: "价格 (中文格式, 例如: '¥25/kg')" },
      location: { type: Type.STRING, description: "地点 (中文)" },
      type: { type: Type.STRING, enum: ["SUPPLY", "DEMAND"] },
      verified: { type: Type.BOOLEAN }
    },
    required: ["id", "companyName", "product", "price", "location", "type", "verified"]
  }
};

const getStrategyPrompt = (strategy: StrategyType, customContext?: string) => {
  switch (strategy) {
    case 'COST':
      return "重点关注：低成本替代品、高性价比原料、下沉市场、高利润率产品。忽略昂贵的小众原料。";
    case 'UNIQUE':
      return "重点关注：猎奇口味、创新搭配、高颜值、社交媒体打卡属性、稀有原料。";
    case 'QUALITY':
      return "重点关注：有机认证、单一产地、健康无添加、顶级口感、高端市场。";
    case 'CUSTOM':
      return `严格按照用户自定义的三个优先级指标（按重要性排序）进行筛选和推荐：${customContext || '通用'}。`;
    default:
      return "关注全品类综合表现。";
  }
};

export const fetchTrends = async (strategy: StrategyType = 'DEFAULT', customContext?: string): Promise<TrendAnalysisResult> => {
  try {
    const strategyText = getStrategyPrompt(strategy, customContext);
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `请分析2024/2025年中国饮品市场趋势。${strategyText}
      
      任务要求：
      1. 生成【市场现状分析】和【策略结论】，并标注该分析的数据来源（如果是综合分析，通常为AI推理）。
      2. 生成5个具体的流行饮品或原料趋势预测，并为每一个预测标注数据来源（例如：某某行业报告WEB，某某销售数据DB，或AI推理）。
      3. 如果数据来源是【AI推理(AI)】，必须列出推导该结论的2-3个关键影响因子（例如：社交声量增长、原材料成本下降、健康趋势等）。
      
      请确保所有文本内容都是中文。`,
      config: {
        responseMimeType: "application/json",
        responseSchema: TRENDS_ANALYSIS_SCHEMA,
        systemInstruction: "你是一位资深的饮品行业数据分析师。根据用户的策略偏好提供深度市场分析和趋势预测。对于每一个数据点，你都会严谨地标记来源。",
      },
    });

    const data = JSON.parse(response.text || "{}");
    const items = (data.items || []).map((item: any, index: number) => ({
      ...item,
      imageUrl: `https://picsum.photos/400/300?random=${index + 10}`
    }));

    return {
      marketAnalysis: data.marketAnalysis || "市场分析生成中...",
      strategicConclusion: data.strategicConclusion || "策略生成中...",
      source: data.source || { type: 'AI', name: 'Gemini Analysis', factors: ['实时市场扫描', '历史趋势拟合'] },
      items: items
    };
  } catch (error) {
    console.error("Error fetching trends:", error);
    return {
      marketAnalysis: "暂时无法获取市场分析。",
      strategicConclusion: "请稍后重试。",
      source: { type: 'DB', name: 'System Recovery' },
      items: []
    };
  }
};

export const fetchSupplyData = async (category: string = "general", strategy: StrategyType = 'DEFAULT', customContext?: string): Promise<SupplyItem[]> => {
  try {
    const strategyText = getStrategyPrompt(strategy, customContext);

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `请生成6条饮品行业的B2B供需信息（混合供应商和采购需求），相关类别：${category}。${strategyText} 例如，如果是成本优先，提供价格低廉的原料；如果是独特性优先，提供稀有原料。请使用中文生成公司名、产品名和地点。`,
      config: {
        responseMimeType: "application/json",
        responseSchema: SUPPLY_SCHEMA,
        systemInstruction: "你是一个饮品供应链数据库。根据用户的策略偏好生成原材料、包装或设备B2B列表。",
      },
    });

    const list = JSON.parse(response.text || "[]");
    
    // Inject timestamps
    const now = Date.now();
    const dayMs = 86400000;
    
    return list.map((item: any) => ({
      ...item,
      createdAt: now,
      expiresAt: now + (Math.floor(Math.random() * 11) + 3) * dayMs
    }));

  } catch (error) {
    console.error("Error fetching supply data:", error);
    return [];
  }
};

export const chatWithAnalyst = async (history: { role: string; parts: { text: string }[] }[], newMessage: string) => {
  try {
    const chat = ai.chats.create({
      model: "gemini-2.5-flash",
      history: history,
      config: {
        systemInstruction: "你是一位专业的饮品供应链顾问。回答有关中国市场的价格、采购策略和配料趋势的问题。回答要简洁实用，适合移动端聊天界面阅读。",
      }
    });

    const result = await chat.sendMessage({ message: newMessage });
    return result.text;
  } catch (error) {
    console.error("Chat error:", error);
    return "抱歉，暂时无法连接到分析服务器。请稍后再试。";
  }
};
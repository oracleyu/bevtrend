import React, { useState, useEffect, useRef } from 'react';
import { TabView, TrendItem, SupplyItem, ChatMessage, StrategyType, TrendAnalysisResult, CustomStrategy, DataSource } from './types';
import { fetchTrends, fetchSupplyData, chatWithAnalyst } from './services/geminiService';
import { 
  ChartIcon, 
  BoxIcon, 
  SparklesIcon, 
  UserIcon, 
  SearchIcon, 
  SendIcon, 
  CheckCircleIcon,
  MoreIcon,
  PlusIcon,
  XIcon,
  ClockIcon,
  GlobeIcon,
  DatabaseIcon,
  BrainIcon
} from './components/Icons';

// --- WeChat Style Components ---

const WeChatHeader = ({ title }: { title: string }) => (
  <div className="bg-white flex-none pt-12 pb-3 px-4 flex items-center justify-between border-b border-gray-100 shadow-sm z-20">
    <div className="w-20"></div> {/* Spacer for symmetry */}
    <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
    <div className="w-20 flex justify-end">
       <div className="border border-gray-200 rounded-full px-3 py-1 flex items-center space-x-3 bg-white bg-opacity-80 backdrop-blur-sm">
         <MoreIcon className="w-4 h-4 text-gray-700" />
         <div className="w-[1px] h-3 bg-gray-300"></div>
         <div className="w-4 h-4 rounded-full border-2 border-gray-700 relative">
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-gray-700 rounded-full"></div>
         </div>
       </div>
    </div>
  </div>
);

const TabBar = ({ currentTab, onTabChange }: { currentTab: TabView, onTabChange: (tab: TabView) => void }) => {
  const tabs = [
    { id: TabView.TRENDS, label: '趋势', icon: ChartIcon },
    { id: TabView.SUPPLY, label: '供需', icon: BoxIcon },
    { id: TabView.ASSISTANT, label: 'AI参谋', icon: SparklesIcon },
    { id: TabView.PROFILE, label: '我的', icon: UserIcon },
  ];

  return (
    <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 pb-safe pt-2 px-6 flex justify-between items-center z-50 h-20 shadow-[0_-1px_10px_rgba(0,0,0,0.03)]">
      {tabs.map((tab) => {
        const isActive = currentTab === tab.id;
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex flex-col items-center justify-center w-16 space-y-1 transition-colors duration-200 ${
              isActive ? 'text-[#07C160]' : 'text-gray-400'
            }`}
          >
            <Icon className={`w-6 h-6 ${isActive ? 'fill-current' : ''}`} />
            <span className="text-[10px] font-medium">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
};

// --- Publish Modal ---
const PublishModal = ({ onClose, onPublish }: { onClose: () => void, onPublish: (item: SupplyItem) => void }) => {
  const [type, setType] = useState<'SUPPLY' | 'DEMAND'>('SUPPLY');
  const [product, setProduct] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [price, setPrice] = useState('');
  const [location, setLocation] = useState('');
  const [validityDays, setValidityDays] = useState(7);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!product || !companyName || !price || !location) return;

    const now = Date.now();
    const newItem: SupplyItem = {
      id: now.toString(),
      type,
      product,
      companyName,
      price,
      location,
      verified: false,
      createdAt: now,
      expiresAt: now + (validityDays * 24 * 60 * 60 * 1000)
    };

    onPublish(newItem);
  };

  return (
    <div className="absolute inset-0 z-[60] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm" onClick={onClose}></div>
      <div className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl p-6 relative z-10 animate-slide-up sm:animate-fade-in sm:m-4 shadow-2xl">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <XIcon className="w-6 h-6" />
        </button>
        
        <h2 className="text-xl font-bold mb-6 text-gray-900">发布供需信息</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type Selection */}
          <div className="flex bg-gray-100 p-1 rounded-lg">
            <button
              type="button"
              onClick={() => setType('SUPPLY')}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${
                type === 'SUPPLY' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500'
              }`}
            >
              我是供应商
            </button>
            <button
              type="button"
              onClick={() => setType('DEMAND')}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${
                type === 'DEMAND' ? 'bg-white shadow-sm text-orange-600' : 'text-gray-500'
              }`}
            >
              我有采购需求
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">产品名称</label>
            <input 
              required
              value={product}
              onChange={e => setProduct(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#07C160] focus:border-transparent"
              placeholder="例如: 云南小粒咖啡豆" 
            />
          </div>

          <div className="flex space-x-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">价格说明</label>
              <input 
                required
                value={price}
                onChange={e => setPrice(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#07C160] focus:border-transparent"
                placeholder="例如: ¥50/kg" 
              />
            </div>
             <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">公司/店铺</label>
              <input 
                required
                value={companyName}
                onChange={e => setCompanyName(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#07C160] focus:border-transparent"
                placeholder="公司名称" 
              />
            </div>
          </div>

          <div className="flex space-x-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">地点</label>
              <input 
                required
                value={location}
                onChange={e => setLocation(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#07C160] focus:border-transparent"
                placeholder="例如: 上海" 
              />
            </div>
            <div className="w-1/3">
              <label className="block text-sm font-medium text-gray-700 mb-1">有效期</label>
              <select 
                value={validityDays}
                onChange={e => setValidityDays(Number(e.target.value))}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#07C160]"
              >
                <option value={7}>7天</option>
                <option value={15}>15天</option>
                <option value={30}>30天</option>
              </select>
            </div>
          </div>

          <div className="pt-2">
            <button 
              type="submit" 
              className="w-full bg-[#07C160] text-white font-bold py-3 rounded-xl shadow-lg hover:bg-[#06ad56] transition-colors active:scale-95 transform"
            >
              立即发布
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- Helper Components ---

const SourceBadge = ({ source, lightMode = false }: { source: DataSource, lightMode?: boolean }) => {
  const Icon = source.type === 'AI' ? BrainIcon : source.type === 'WEB' ? GlobeIcon : DatabaseIcon;
  const label = source.type === 'AI' ? 'AI 推理' : source.type === 'WEB' ? '全网数据' : '数据库';
  
  // Colors
  const baseClass = "text-[10px] flex items-start gap-2";
  const iconClass = lightMode ? "text-green-100" : (source.type === 'AI' ? "text-purple-500" : "text-gray-500");
  const textClass = lightMode ? "text-green-50" : "text-gray-500";
  const factorClass = lightMode ? "bg-white/10 text-white border-white/20" : "bg-purple-50 text-purple-700 border-purple-100";
  const sourceNameClass = lightMode ? "text-green-200/80" : "text-gray-400";

  return (
    <div className={baseClass}>
      <div className={`mt-0.5 ${iconClass}`}>
         <Icon className="w-3 h-3" />
      </div>
      <div className="flex-1 min-w-0">
        <div className={`flex items-center gap-2 ${textClass} flex-wrap`}>
           <span className="font-bold opacity-90 whitespace-nowrap">{label}</span>
           <span className={`text-[9px] truncate max-w-full ${sourceNameClass}`}>来源: {source.name}</span>
        </div>
        {source.type === 'AI' && source.factors && source.factors.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {source.factors.map((f, i) => (
               <span key={i} className={`px-1.5 py-0.5 rounded border text-[9px] ${factorClass}`}>
                 {f}
               </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};


// --- View Components ---

interface TrendsViewProps {
  strategy: StrategyType;
  customContext: string;
  onStrategyChange: (s: StrategyType, context?: string, id?: string) => void;
  savedStrategies: CustomStrategy[];
  onSaveStrategy: (name: string, factors: string[]) => void;
  onDeleteStrategy: (id: string) => void;
  activeStrategyId: string;
}

const TrendsView = ({ 
  strategy, 
  customContext, 
  onStrategyChange,
  savedStrategies,
  onSaveStrategy,
  onDeleteStrategy,
  activeStrategyId
}: TrendsViewProps) => {
  const [data, setData] = useState<TrendAnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCustomInput, setShowCustomInput] = useState(false);
  
  // Custom Strategy Factors State
  const [factors, setFactors] = useState(['', '', '']);
  const [stratName, setStratName] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const result = await fetchTrends(strategy, strategy === 'CUSTOM' ? customContext : undefined);
      setData(result);
      setLoading(false);
    };
    load();
  }, [strategy, customContext]);

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if(factors.some(f => f.trim())) {
      const contextString = factors
        .filter(f => f.trim())
        .map((f, i) => `${i+1}. ${f}`)
        .join(', ');
      
      if (stratName.trim()) {
        onSaveStrategy(stratName, factors);
      } else {
        // Run as temporary custom strategy
        onStrategyChange('CUSTOM', contextString, 'TEMP_CUSTOM');
      }
      setShowCustomInput(false);
    }
  };

  const openNewCustom = () => {
    setFactors(['', '', '']);
    setStratName('');
    setShowCustomInput(true);
  };

  const handleFactorChange = (index: number, value: string) => {
    const newFactors = [...factors];
    newFactors[index] = value;
    setFactors(newFactors);
  };

  const systemStrategies: { id: StrategyType; label: string }[] = [
    { id: 'DEFAULT', label: '综合推荐' },
    { id: 'COST', label: '成本优先' },
    { id: 'UNIQUE', label: '独特性' },
    { id: 'QUALITY', label: '品质优先' },
  ];

  return (
    <div className="h-full flex flex-col relative bg-gray-50">
       {/* Strategy Selector Header */}
       <div className="bg-white border-b border-gray-100 pt-3 pb-3 px-4 z-10 sticky top-0 shadow-sm">
         <div className="flex justify-between items-center mb-2">
            <p className="text-xs text-gray-500 font-medium">选择或创建您的趋势分析策略:</p>
         </div>
         <div className="flex space-x-2 overflow-x-auto no-scrollbar pb-1 items-center">
           {systemStrategies.map(s => (
             <button
               key={s.id}
               onClick={() => onStrategyChange(s.id, undefined, s.id)}
               className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-medium transition-all flex-shrink-0 ${
                 activeStrategyId === s.id 
                   ? 'bg-[#07C160] text-white shadow-md' 
                   : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
               }`}
             >
               {s.label}
             </button>
           ))}

           {savedStrategies.map(s => (
             <div key={s.id} className="relative group flex-shrink-0">
               <button
                 onClick={() => {
                   const context = s.factors.map((f, i) => `${i+1}. ${f}`).join(', ');
                   onStrategyChange('CUSTOM', context, s.id);
                 }}
                 className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-medium transition-all pr-8 ${
                   activeStrategyId === s.id
                     ? 'bg-[#07C160] text-white shadow-md' 
                     : 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200'
                 }`}
               >
                 {s.name}
               </button>
               <button 
                 onClick={(e) => { e.stopPropagation(); onDeleteStrategy(s.id); }}
                 className={`absolute right-1 top-1/2 transform -translate-y-1/2 p-1 rounded-full hover:bg-black/10 ${
                   activeStrategyId === s.id ? 'text-white' : 'text-green-700'
                 }`}
               >
                 <XIcon className="w-3 h-3" />
               </button>
             </div>
           ))}
            
            <button
               onClick={openNewCustom}
               className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center flex-shrink-0 ${
                 activeStrategyId === 'TEMP_CUSTOM'
                   ? 'bg-[#07C160] text-white shadow-md' 
                   : 'bg-gray-800 text-white hover:bg-gray-700'
               }`}
             >
               <PlusIcon className="w-3 h-3 mr-1" />
               <span>自定义</span>
             </button>
         </div>
       </div>

      {/* Custom Input Modal */}
      {showCustomInput && (
        <div className="absolute inset-0 z-50 bg-black bg-opacity-30 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full rounded-2xl p-5 shadow-2xl animate-scale-in max-h-[90%] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
               <h3 className="text-lg font-bold text-gray-800">自定义分析策略</h3>
               <button onClick={() => setShowCustomInput(false)} className="text-gray-400 hover:text-gray-600"><XIcon className="w-5 h-5"/></button>
            </div>
            
            <p className="text-xs text-gray-500 mb-4">请输入三个最重要的判断因子，我们会根据这些因子为您生成定制化的市场报告。</p>

            <form onSubmit={handleCustomSubmit} className="space-y-4">
               <div>
                 <label className="block text-xs font-bold text-gray-700 mb-1">策略名称 (选填)</label>
                 <input 
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="例如：夏季低卡策略 (输入名称以保存)"
                    value={stratName}
                    onChange={(e) => setStratName(e.target.value)}
                  />
               </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-700">优先级因子</label>
                {[0, 1, 2].map((idx) => (
                  <div key={idx} className="relative">
                     <div className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500 border border-gray-200">
                       {idx + 1}
                     </div>
                     <input 
                      required={idx === 0}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:bg-white transition-all"
                      placeholder={`输入第 ${idx + 1} 优先级因子...`}
                      value={factors[idx]}
                      onChange={(e) => handleFactorChange(idx, e.target.value)}
                    />
                  </div>
                ))}
              </div>
              
              <div className="pt-2 flex justify-end space-x-3">
                <button 
                  type="button" 
                  onClick={() => setShowCustomInput(false)}
                  className="px-4 py-2 text-sm text-gray-500 font-medium hover:bg-gray-50 rounded-lg"
                >
                  取消
                </button>
                <button 
                  type="submit"
                  className="px-6 py-2 bg-[#07C160] text-white text-sm font-bold rounded-lg shadow-lg shadow-green-200 flex items-center"
                >
                  {stratName.trim() ? '保存并分析' : '仅分析一次'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto pb-24 no-scrollbar pt-4 px-4">
        {loading ? (
          <div className="space-y-4">
            <div className="h-40 bg-white rounded-xl animate-pulse p-4 flex flex-col justify-center items-center space-y-3">
               <div className="w-3/4 h-4 bg-gray-200 rounded"></div>
               <div className="w-1/2 h-4 bg-gray-200 rounded"></div>
               <div className="w-2/3 h-4 bg-gray-200 rounded"></div>
            </div>
            {[1, 2].map((i) => (
              <div key={i} className="bg-white rounded-xl h-28 animate-pulse" />
            ))}
          </div>
        ) : data ? (
          <div className="space-y-6">
            
            {/* Analysis Card */}
            <div className="bg-gradient-to-br from-[#07C160] to-[#059669] rounded-xl p-5 text-white shadow-lg relative overflow-hidden">
               <div className="absolute -right-4 -top-4 opacity-10">
                 <ChartIcon className="w-32 h-32" />
               </div>
               <div className="relative z-10">
                 <div className="mb-4">
                    <h3 className="text-green-100 text-xs font-bold uppercase tracking-wider mb-1">市场现状分析</h3>
                    <p className="text-sm leading-relaxed font-medium opacity-95">{data.marketAnalysis}</p>
                 </div>
                 <div className="pt-4 border-t border-white/20 mb-4">
                    <h3 className="text-green-100 text-xs font-bold uppercase tracking-wider mb-1">策略结论</h3>
                    <p className="text-lg font-bold">{data.strategicConclusion}</p>
                 </div>
                 
                 {/* Analysis Source Attribution */}
                 {data.source && (
                   <div className="pt-3 border-t border-white/10">
                     <SourceBadge source={data.source} lightMode={true} />
                   </div>
                 )}
               </div>
            </div>

            {/* Trends List */}
            <div>
              <h3 className="text-gray-900 font-bold text-lg mb-3 flex items-center">
                 <SparklesIcon className="w-5 h-5 mr-1 text-[#07C160]" />
                 具体产品预测
              </h3>
              <div className="space-y-4">
                {data.items.map((trend) => (
                  <div key={trend.id} className="bg-white rounded-xl p-4 shadow-sm flex flex-col space-y-3">
                    <div className="flex items-start space-x-4">
                      <div className="w-20 h-20 rounded-lg bg-gray-200 overflow-hidden flex-shrink-0 relative">
                        <img src={trend.imageUrl} alt={trend.title} className="w-full h-full object-cover" />
                        <div className="absolute top-0 left-0 bg-black/50 backdrop-blur-sm px-2 py-0.5 rounded-br-lg">
                          <span className="text-white text-[10px] font-bold">{trend.category}</span>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-1">
                          <h3 className="text-gray-900 font-bold text-lg truncate flex-1">{trend.title}</h3>
                          <span className="text-red-500 font-bold text-sm flex items-center bg-red-50 px-1.5 py-0.5 rounded ml-2">
                             {trend.growthRate}
                          </span>
                        </div>
                        <p className="text-gray-500 text-xs line-clamp-3 leading-relaxed">{trend.description}</p>
                      </div>
                    </div>
                    
                    {/* Item Source Attribution */}
                    {trend.source && (
                      <div className="pt-3 border-t border-gray-50">
                        <SourceBadge source={trend.source} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

interface SupplyViewProps {
  strategy: StrategyType;
  customContext: string;
}

const SupplyView = ({ strategy, customContext }: SupplyViewProps) => {
  const [items, setItems] = useState<SupplyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'SUPPLY' | 'DEMAND'>('ALL');
  const [showPublish, setShowPublish] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      // Fetch based on the global strategy setting
      const data = await fetchSupplyData("general", strategy, customContext);
      setItems(data);
      setLoading(false);
    };
    load();
  }, [strategy, customContext]); // Reload when strategy changes

  const handlePublish = (newItem: SupplyItem) => {
    setItems(prev => [newItem, ...prev]);
    setShowPublish(false);
  };

  const getRemainingDays = (expiresAt: number) => {
    const diff = expiresAt - Date.now();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
  };

  // Filter items: matching type AND not expired
  const filteredItems = items.filter(item => {
    const isExpired = Date.now() > item.expiresAt;
    const matchesType = filter === 'ALL' || item.type === filter;
    return matchesType && !isExpired;
  });

  const getRecommendationText = () => {
    switch (strategy) {
      case 'COST': return '基于您的“成本优先”偏好，为您精选高性价比货源';
      case 'UNIQUE': return '基于您的“独特性”偏好，为您寻找稀缺小众原料';
      case 'QUALITY': return '基于您的“品质优先”偏好，为您筛选高端优质供应商';
      case 'CUSTOM': return `基于自定义因子 (${customContext.substring(0, 20)}...) 智能匹配`;
      default: return '热门供需推荐';
    }
  };

  return (
    <div className="h-full flex flex-col relative bg-gray-50">
      {/* Filter Bar */}
      <div className="sticky top-0 z-40 bg-gray-50 px-4 py-3 border-b border-gray-100">
        <div className="flex space-x-2 bg-gray-200 p-1 rounded-lg">
          {['ALL', 'SUPPLY', 'DEMAND'].map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type as any)}
              className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${
                filter === type ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {type === 'ALL' ? '全部' : type === 'SUPPLY' ? '找货源' : '求购'}
            </button>
          ))}
        </div>
        {strategy !== 'DEFAULT' && (
           <div className="mt-2 bg-green-50 text-green-700 px-3 py-2 rounded-lg text-xs flex items-start animate-fade-in border border-green-100">
             <SparklesIcon className="w-3 h-3 mr-2 mt-0.5 flex-shrink-0" />
             <span className="line-clamp-2">{getRecommendationText()}</span>
           </div>
        )}
      </div>

      {/* List Content */}
      <div className="px-4 space-y-3 flex-1 overflow-y-auto no-scrollbar pb-24 pt-2">
        {loading ? (
          <div className="flex justify-center pt-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center pt-20 text-gray-400 text-sm">
            <div className="mb-2">📭</div>
            暂无有效信息
          </div>
        ) : (
          filteredItems.map((item) => {
            const daysLeft = getRemainingDays(item.expiresAt);
            return (
              <div key={item.id} className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 relative overflow-hidden group">
                 <div className={`absolute left-0 top-0 bottom-0 w-1 ${item.type === 'SUPPLY' ? 'bg-blue-500' : 'bg-orange-500'}`}></div>
                 
                 <div className="flex justify-between items-start mb-2 pl-3">
                   <div className="flex items-center space-x-2">
                     <h3 className="font-bold text-gray-900 text-md line-clamp-1">{item.product}</h3>
                     <span className={`text-[10px] px-1.5 py-0.5 rounded border ${
                       item.type === 'SUPPLY' 
                         ? 'border-blue-200 text-blue-600 bg-blue-50' 
                         : 'border-orange-200 text-orange-600 bg-orange-50'
                     }`}>
                       {item.type === 'SUPPLY' ? '供应' : '求购'}
                     </span>
                   </div>
                   
                   {/* Expiration Badge */}
                   <div className={`flex items-center text-[10px] ${daysLeft <= 3 ? 'text-red-500' : 'text-gray-400'}`}>
                      <ClockIcon className="w-3 h-3 mr-1" />
                      {daysLeft}天后过期
                   </div>
                 </div>

                 <div className="pl-3 space-y-1">
                   <p className="text-xl font-bold text-red-600">{item.price}</p>
                   <div className="flex items-center text-gray-500 text-xs">
                     <span className="font-medium mr-2">{item.companyName}</span>
                     {item.verified && <CheckCircleIcon className="w-3 h-3 text-blue-500" />}
                   </div>
                   <div className="flex justify-between items-end">
                      <p className="text-gray-400 text-xs">{item.location}</p>
                      <button className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-medium rounded transition-colors">
                        查看详情
                      </button>
                   </div>
                 </div>
              </div>
            );
          })
        )}
      </div>

      {/* FAB - Publish Button */}
      <button 
        onClick={() => setShowPublish(true)}
        className="absolute right-6 bottom-24 bg-[#07C160] hover:bg-[#06ad56] text-white rounded-full p-4 shadow-lg shadow-green-500/30 transition-transform active:scale-95 z-50 flex items-center justify-center"
      >
        <PlusIcon className="w-6 h-6" />
      </button>

      {/* Modal */}
      {showPublish && (
        <PublishModal 
          onClose={() => setShowPublish(false)} 
          onPublish={handlePublish} 
        />
      )}
    </div>
  );
};

const AssistantView = () => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '1', role: 'model', text: '你好！我是您的供应链AI参谋。想了解最近什么原料最火，或者哪里能买到优质茶叶吗？', timestamp: Date.now() }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // Prepare history for API
    const history = messages.map(m => ({
      role: m.role,
      parts: [{ text: m.text }]
    }));

    const responseText = await chatWithAnalyst(history, userMsg.text);

    const modelMsg: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'model',
      text: responseText,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, modelMsg]);
    setIsTyping(false);
  };

  return (
    <div className="flex flex-col h-full bg-gray-100 pb-20">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
              msg.role === 'user' 
                ? 'bg-[#07C160] text-white rounded-tr-none' 
                : 'bg-white text-gray-800 rounded-tl-none'
            }`}>
              {msg.text}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white rounded-2xl rounded-tl-none px-4 py-3 shadow-sm">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce delay-100"></div>
                <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce delay-200"></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-white p-3 border-t border-gray-200 flex items-center space-x-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          placeholder="问问AI关于市场趋势的问题..."
          className="flex-1 bg-gray-100 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
        />
        <button 
          onClick={handleSend}
          disabled={!input.trim() || isTyping}
          className={`p-2.5 rounded-full ${
            input.trim() ? 'bg-[#07C160] text-white' : 'bg-gray-200 text-gray-400'
          }`}
        >
          <SendIcon className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

const ProfileView = () => (
  <div className="h-full overflow-y-auto pb-24 no-scrollbar p-4">
    <div className="bg-white rounded-xl p-6 shadow-sm mb-4 flex items-center space-x-4">
      <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
         <UserIcon className="w-8 h-8 text-gray-400" />
      </div>
      <div>
        <h2 className="text-xl font-bold text-gray-900">微信用户</h2>
        <p className="text-gray-500 text-xs">ID: 8829301</p>
      </div>
    </div>

    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      {[
        { label: '我的发布', count: 12 },
        { label: '收藏夹', count: 5 },
        { label: '浏览历史', count: 128 },
      ].map((item, idx) => (
        <div key={idx} className="flex justify-between items-center p-4 border-b border-gray-100 last:border-0 active:bg-gray-50">
          <span className="text-gray-700 text-sm font-medium">{item.label}</span>
          <div className="flex items-center">
            <span className="text-gray-400 text-xs mr-2">{item.count}</span>
            <div className="w-2 h-2 border-t-2 border-r-2 border-gray-300 transform rotate-45"></div>
          </div>
        </div>
      ))}
    </div>
    
    <div className="mt-6 text-center text-xs text-gray-400">
      <p>饮品链小程序 v1.0.0</p>
      <p>由 Gemini 数据服务驱动</p>
    </div>
  </div>
);

// --- Main App Component ---

export default function App() {
  const [currentTab, setCurrentTab] = useState<TabView>(TabView.TRENDS);
  // Shared state for Strategy preference
  const [strategy, setStrategy] = useState<StrategyType>('DEFAULT');
  const [customStrategyContext, setCustomStrategyContext] = useState<string>('');
  const [activeStrategyId, setActiveStrategyId] = useState<string>('DEFAULT');

  const [savedStrategies, setSavedStrategies] = useState<CustomStrategy[]>(() => {
    try {
      const saved = localStorage.getItem('drinkchain_strategies');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const handleStrategyChange = (newStrategy: StrategyType, context?: string, id?: string) => {
    setStrategy(newStrategy);
    if (context) setCustomStrategyContext(context);
    setActiveStrategyId(id || newStrategy);
  };

  const handleSaveStrategy = (name: string, factors: string[]) => {
    const newStrat: CustomStrategy = {
      id: Date.now().toString(),
      name,
      factors
    };
    const updated = [...savedStrategies, newStrat];
    setSavedStrategies(updated);
    localStorage.setItem('drinkchain_strategies', JSON.stringify(updated));
    
    // Automatically select the new strategy
    const context = factors.map((f, i) => `${i+1}. ${f}`).join(', ');
    handleStrategyChange('CUSTOM', context, newStrat.id);
  };

  const handleDeleteStrategy = (id: string) => {
    const updated = savedStrategies.filter(s => s.id !== id);
    setSavedStrategies(updated);
    localStorage.setItem('drinkchain_strategies', JSON.stringify(updated));
    
    if (activeStrategyId === id) {
      handleStrategyChange('DEFAULT', undefined, 'DEFAULT');
    }
  };

  const renderContent = () => {
    switch (currentTab) {
      case TabView.TRENDS:
        return (
          <TrendsView 
            strategy={strategy} 
            customContext={customStrategyContext}
            onStrategyChange={handleStrategyChange}
            savedStrategies={savedStrategies}
            onSaveStrategy={handleSaveStrategy}
            onDeleteStrategy={handleDeleteStrategy}
            activeStrategyId={activeStrategyId}
          />
        );
      case TabView.SUPPLY:
        return (
          <SupplyView 
            strategy={strategy} 
            customContext={customStrategyContext}
          />
        );
      case TabView.ASSISTANT:
        return <AssistantView />;
      case TabView.PROFILE:
        return <ProfileView />;
      default:
        return (
          <TrendsView 
            strategy={strategy} 
            customContext={customStrategyContext}
            onStrategyChange={handleStrategyChange}
            savedStrategies={savedStrategies}
            onSaveStrategy={handleSaveStrategy}
            onDeleteStrategy={handleDeleteStrategy}
            activeStrategyId={activeStrategyId}
          />
        );
    }
  };

  const getTitle = () => {
    switch (currentTab) {
      case TabView.TRENDS: return '市场趋势';
      case TabView.SUPPLY: return '供需大厅';
      case TabView.ASSISTANT: return '智能参谋';
      case TabView.PROFILE: return '个人中心';
      default: return '饮品链';
    }
  };

  return (
    <div className="h-[100dvh] w-full bg-gray-100 text-gray-800 font-sans max-w-md mx-auto shadow-2xl relative overflow-hidden flex flex-col border-x border-gray-200">
      <WeChatHeader title={getTitle()} />
      <main className="flex-1 overflow-hidden relative">
        {renderContent()}
      </main>
      <TabBar currentTab={currentTab} onTabChange={setCurrentTab} />
    </div>
  );
}
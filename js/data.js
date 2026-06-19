/**
 * 路亚助手 - 数据模块
 * 包含鱼种百科、拟饵数据库、技巧指南等静态数据
 */

// ========== 鱼种百科 ==========
const FISH_SPECIES = [
  {
    id: 'guiyu',
    name: '鳜鱼',
    alias: ['桂鱼', '桂花鱼', '季花鱼', '鳌花'],
    scientific: 'Siniperca chuatsi',
    category: '底层伏击型',
    difficulty: 3,
    season: '春末至秋季为黄金期，夏季夜钓效果好',
    temps: { min: 15, optimal: [22, 30], max: 35 },
    pressure: { optimal: [995, 1008], note: '对气压变化敏感，骤降前活性高' },
    waters: ['流水江河', '湖泊水库', '乱石底', '陡岸深坎', '桥墩附近', '水坝下方'],
    depth: '中底层，通常2-8米',
    desc: '鳜鱼是典型的伏击型掠食者，喜躲在石缝、乱石堆、陡坎等障碍区，等待猎物经过时发动突袭。',
    behavior: {
      feeding: '晨昏活跃，夏季夜间摄食旺盛。视觉敏锐，喜清水环境。',
      structure: '100%与障碍物相关：乱石底、陡坎、桥墩、树桩、水坝出水口。',
      attack: '伏击型攻击，从隐蔽处冲出，咬饵果断但容易因阻力吐饵。'
    },
    lureRecommend: {
      hard: ['小胖(Crank)', 'VIB', '摇摆米诺(Crankbait)', '深潜米诺'],
      soft: ['T尾鱼', '卷尾蛆', '小龙虾软饵', '面条虫'],
      color: ['自然色系：绿背白腹', '暖水用：火蜥蜴红', '浑水用：荧光黄/粉红'],
      size: ['2-4寸（5-10cm）', '5-10g铅头钩或德州']
    },
    tips: [
      '关键是将饵送到结构区，宁愿挂底损失几个饵，也不能在空水层搜索',
      '手法以跳底为主：收线2-3圈→停顿让饵下落→再收线，模拟受伤小鱼',
      '中鱼后立即扬竿刺鱼，鳜鱼嘴里硬，刺不穿容易脱钩',
      '选用高灵敏度竿子，感受底部结构传递',
      '前导线推荐12-20lb碳线，耐磨性重要'
    ],
    image: null
  },
  {
    id: 'luyu',
    name: '大口黑鲈',
    alias: ['大嘴鲈', '加州鲈', 'Bass'],
    scientific: 'Micropterus salmoides',
    category: '中上层巡游型',
    difficulty: 2,
    season: '全年可钓，春季产卵前(3-5月)和秋季(9-11月)为黄金期',
    temps: { min: 5, optimal: [18, 28], max: 35 },
    pressure: { optimal: [995, 1010], note: '适应性较强，气压正常范围内均可作钓' },
    waters: ['静水湖泊', '水库', '缓流河段', '草区', '倒树', '浮台下面', '荷叶区'],
    depth: '中上层，0.5-5米，随季节和温度变化',
    desc: '大口黑鲈是国内路亚最热门的对象鱼之一，适应性极强。它对拟饵反应积极，攻击方式多样。',
    behavior: {
      feeding: '晨昏为摄食高峰，阴天全天可钓。水温18-25℃时活性最高。',
      structure: '草区边缘、倒树、码头、浮台、岩石堆、深浅交界处。',
      attack: '攻击方式多变：可以从底部冲上来爆口，也可以缓缓跟随然后吸饵。'
    },
    lureRecommend: {
      hard: ['水面系(Popper/Pencil)', '复合亮片(Spinnerbait)', '摇摆米诺', '小胖', 'VIB'],
      soft: ['卷尾蛆', 'T尾鱼', '面条虫(Wacky rig)', '小龙虾软饵'],
      color: ['清水：自然色/半透明', '浑水：亮色/对比色', '夜间：黑色'],
      size: ['3-5寸软饵', '7-14g硬饵']
    },
    tips: [
      '春季产卵期优先搜索浅水平台/草区，用软虫慢拖或水面系',
      '夏季高温期用深潜米诺或德州钓组搜索深水结构',
      '秋季是爆钓季，用反应饵快速搜索大范围水面',
      '如果跟饵不咬，换更慢的手法或更小的饵',
      'Wacky rig是鲈鱼入门最有效的钓组之一'
    ],
    image: null
  },
  {
    id: 'qiaozui',
    name: '翘嘴鲌',
    alias: ['翘嘴', '大白鱼', '翘壳', '白鱼'],
    scientific: 'Culter alburnus',
    category: '中上层巡游型',
    difficulty: 3,
    season: '春夏秋季均可，夏季夜钓效果极好。冬季在深水可钓',
    temps: { min: 3, optimal: [20, 30], max: 35 },
    pressure: { optimal: [990, 1008], note: '对低压敏感，气压下降时摄食活跃' },
    waters: ['大型水库', '湖泊', '江河缓流段', '大坝出水口', '铧尖', '深浅交界处'],
    depth: '中上层，夏季夜晚上浮至0.5-2米表层',
    desc: '翘嘴鲌是国内路亚最具代表性的目标鱼之一。体型修长，游速极快。窗口期明显——天刚黑到晚上10点之间疯狂炸水捕食。',
    behavior: {
      feeding: '黄昏到深夜为主要窗口期，清晨也有短暂窗口。白天活性较低。',
      structure: '开阔水面、大坝出水口、铧尖、岛屿周围。标志性行为是炸水。',
      attack: '远程追击型攻击，可以在十几米外冲过来咬饵。'
    },
    lureRecommend: {
      hard: ['铅笔(Pencil)', '米诺(Minnow)', '铁板', '波爬(Popper)', '沉水铅笔'],
      soft: ['长条T尾鱼', '卷尾蛆'],
      color: ['夜晚：黑色/深色', '白天：银色/白身红头', '浑水：荧光色'],
      size: ['5-10cm硬饵', '7-15g铁板/铅笔']
    },
    tips: [
      '窗口期是王道——傍晚到深夜是最佳时间',
      '听到炸水声后，将饵抛到炸水点前方2-3米',
      '铅笔手法：抽-停-抽-停，模拟受伤逃窜的小鱼',
      '白天用铁板跳底或VIB慢搜深水(3-8米)',
      '线组建议用0.8-1.5号PE线配2-3号前导',
      '翘嘴嘴皮薄，中鱼后不能暴力扬竿，要顺势带住'
    ],
    image: null
  },
  {
    id: 'heiyu',
    name: '黑鱼',
    alias: ['乌鱼', '财鱼', '雷鱼', '蛇鱼'],
    scientific: 'Channa argus',
    category: '表层伏击型',
    difficulty: 2,
    season: '5-10月为黄金期，水温25-30℃时活性最高',
    temps: { min: 15, optimal: [25, 32], max: 38 },
    pressure: { optimal: [990, 1005], note: '低压闷热天气反而活性高' },
    waters: ['水草密集区', '荷花塘', '芦苇荡', '浮萍水面', '进水口草区'],
    depth: '表层，0-1米草区',
    desc: '黑鱼是路亚中最刺激的目标鱼之一——看雷蛙在草面上被爆口是视觉震撼。护巢期（6-7月）攻击性极强。',
    behavior: {
      feeding: '夏季全天可钓，护巢期攻击性最强。换气频率反映活性。',
      structure: '草区、浮萍、荷花丛、芦苇根——越重障越好。',
      attack: '从草底冲上来的垂直爆口，雷蛙走过去时嘭一声炸裂。'
    },
    lureRecommend: {
      hard: ['雷蛙(Frog)', '水面系铅笔', '波爬'],
      soft: ['软蛙(无铅/插铅)', '大T尾鱼(草区边缘)'],
      color: ['自然蛙色：绿/褐', '亮色：黄肚/白肚'],
      size: ['雷蛙：标准6-8cm', '软饵：4-5寸']
    },
    tips: [
      '雷强竿+PE线是标配，至少6号PE（60lb+），暴力扬竿打穿草',
      '雷蛙要在草面上走之字路线，吸引黑鱼注意',
      '看到黑鱼换气后，将雷蛙抛到那个位置附近',
      '爆口后数1-2秒再扬竿！黑鱼含住蛙要翻身后才咬实',
      '路亚黑鱼最大的禁忌：暴力扬竿不够果断，被草挡住'
    ],
    image: null
  },
  {
    id: 'makou',
    name: '马口鱼',
    alias: ['马口', '桃花鱼', '山鳟'],
    scientific: 'Opsariichthys bidens',
    category: '中上层小型鱼',
    difficulty: 1,
    season: '春至秋季，夏季早晨和傍晚为最佳',
    temps: { min: 10, optimal: [18, 28], max: 32 },
    pressure: { optimal: [995, 1010], note: '对气压不特别敏感' },
    waters: ['溪流', '清澈小河', '山涧', '水库上游入水口'],
    depth: '中上层，0.3-2米',
    desc: '马口是路亚入门最好的练习鱼种，分布广泛、攻击积极。公鱼繁殖期体色艳丽桃花色。',
    behavior: {
      feeding: '白天活跃，早晚窗口更明显。喜成群在水面追逐小鱼。',
      structure: '溪流产卵场、沙石底浅滩、缓流区、入水口。',
      attack: '小型鱼式的快速追击，经常跃出水面攻击。'
    },
    lureRecommend: {
      hard: ['微型米诺(3-5cm)', '小亮片(2-3g)', '小铅笔'],
      soft: ['1.5-2寸小T尾', '微型卷尾蛆'],
      color: ['自然小鱼色', '亮银色', '鲜艳色(红头/金身)'],
      size: ['1-4g微型拟饵', '2-3cm小亮片']
    },
    tips: [
      'UL/L调性的竿子+小亮片是马口标准配置',
      '亮片在水里旋转的反光是吸引马口的关键',
      '抛投到急流缓流交界处，慢收+小抽',
      '马口嘴大但唇薄，中鱼后不能暴力飞鱼',
      '可以尝试飞蝇钩加小助投器，效果出奇好'
    ],
    image: null
  },
  {
    id: 'ganyu',
    name: '鳡鱼',
    alias: ['黄颊', '水老虎', '竿鱼'],
    scientific: 'Elopichthys bambusa',
    category: '上层巡游型',
    difficulty: 5,
    season: '夏秋季为主要季节，高温期活性高',
    temps: { min: 10, optimal: [22, 32], max: 36 },
    pressure: { optimal: [990, 1008], note: '气压稳定或缓慢下降时最佳' },
    waters: ['大型水库', '江河干流', '开阔湖面'],
    depth: '中上层，常在0.5-3米表层巡游',
    desc: '鳡鱼被称为水老虎，是淡水路亚的终极目标之一。体型巨大（可超50kg），游速极快。',
    behavior: {
      feeding: '白天活跃，晴天高温时更积极。追击速度快。',
      structure: '开阔水面、大坝附近、岛屿周围。在搜索饵鱼群。',
      attack: '爆裂式攻击——从远处高速冲来，水面炸开。'
    },
    lureRecommend: {
      hard: ['大型米诺(10-15cm)', '大型铅笔', '大铁板', '大VIB(15-25g)'],
      soft: ['大型软鱼(5-7寸)', '搭配铅头钩大克重'],
      color: ['自然小鱼仿生色', '银色反光', '白身红头'],
      size: ['10-20cm', '15-30g']
    },
    tips: [
      'MH/H调竿子+3000-4000型纺车轮或水滴轮',
      '远投能力是核心',
      '看到水面有炸水或小鱼逃窜，立刻抛投到那个区域',
      '鳡鱼牙齿锋利，前导线建议用40-60lb碳线或钢前导',
      '中鱼后控鱼要稳——第一波冲刺极快，泄力不能锁死'
    ],
    image: null
  },
  {
    id: 'huanwei',
    name: '红尾',
    alias: ['红尾鲌', '蒙古红鲌', '红梢'],
    scientific: 'Culter mongolicus',
    category: '中上层巡游型',
    difficulty: 3,
    season: '夏季至初秋，夜钓效果较好',
    temps: { min: 8, optimal: [20, 30], max: 34 },
    pressure: { optimal: [992, 1008], note: '和翘嘴类似，低压前活跃' },
    waters: ['水库', '湖泊', '江河中下游'],
    depth: '中上层，夏季夜晚会上浮至表层',
    desc: '红尾鲌和翘嘴相似但体型略小，尾鳍下叶呈红色。群体活动明显。',
    behavior: {
      feeding: '晨昏和夜间为主，白天深水层活动。群体捕食。',
      structure: '开阔水面、铧尖、深浅交界处、大坝出水口。',
      attack: '群体追击，速度快，经常跃出水面。'
    },
    lureRecommend: {
      hard: ['铅笔', '米诺', 'VIB', '铁板', '波爬'],
      soft: ['T尾鱼', '卷尾蛆'],
      color: ['银色', '金色', '红头银身'],
      size: ['5-9cm硬饵', '7-15g']
    },
    tips: [
      '和翘嘴类似，但红尾更喜欢动态快收的饵',
      '找到炸水点是关键',
      '使用金属VIB快速搜索大范围水面'
    ],
    image: null
  },
  {
    id: 'baitiao',
    name: '白条',
    alias: ['箴条', '餐条', '蓝刀'],
    scientific: 'Hemiculter leucisculus',
    category: '上层小型鱼',
    difficulty: 1,
    season: '春夏秋季均可，夏季最活跃',
    temps: { min: 10, optimal: [22, 32], max: 36 },
    pressure: { optimal: [990, 1010], note: '适应性强' },
    waters: ['河溪', '湖泊', '水库', '几乎任何静水或缓流水域'],
    depth: '表层，0-0.8米',
    desc: '白条是最常见的小型路亚鱼种，几乎任何淡水水域都有。对微型亮片反应极快。',
    behavior: {
      feeding: '全天可钓，晴天水面温度升高时更活跃。',
      structure: '水面开阔区、入水口、浅滩。经常成群在水面追逐。',
      attack: '快速啄击，经常咬不中钩子。'
    },
    lureRecommend: {
      hard: ['微型亮片(1-2g)', '小飞蝇钩', '微型米诺(2-3cm)'],
      soft: ['微小卷尾蛆(1寸)'],
      color: ['银色亮片最佳', '金色', '鲜艳色'],
      size: ['0.5-3g', '1-3cm亮片']
    },
    tips: [
      'UL竿+小亮片/飞蝇钩，0.4-0.8号PE线',
      '亮片抛出去就开始收，白条会在饵落水瞬间攻击',
      '白条嘴极小，用小钩(10-14号)是关键',
      '可以用助投器+飞蝇钩的组合，效率极高'
    ],
    image: null
  }
];

// ========== 拟饵类型数据库 ==========
const LURE_TYPES = [
  {
    id: 'popper',
    name: '波爬 (Popper)',
    category: '硬饵-水面系',
    desc: '头部有凹面的水面系硬饵，通过抽竿产生水花和声音，模拟落水挣扎的小鱼或青蛙。',
    technique: '抽-停顿-抽-停顿。抽竿幅度决定水花大小，节奏变化是关键。',
    depth: '水面',
    speed: '中慢速 + 节奏变化',
    seasons: ['春末', '夏', '初秋'],
    targetSpecies: ['luyu', 'heiyu', 'qiaozui', 'ganyu'],
    conditions: '夏季早晚窗口期最适合，安静水面效果更好',
    tips: '不要收太快，鱼需要时间定位声源。如果鱼跟而不咬，放慢节奏或换更小的波爬。'
  },
  {
    id: 'pencil',
    name: '铅笔 (Pencil Bait)',
    category: '硬饵-水面系',
    desc: '长条形水面系硬饵，通过连续小抽让饵在水面走之字路线，模拟逃窜的小鱼。',
    technique: '连续小幅抽竿(走之字)，或抽-停交替。竿尖指向水面。',
    depth: '水面',
    speed: '快速抽动',
    seasons: ['夏', '秋'],
    targetSpecies: ['qiaozui', 'huanwei', 'ganyu', 'luyu'],
    conditions: '傍晚至夜间窗口期首选，翘嘴和红尾的最爱',
    tips: '夜钓铅笔效果出奇好。黑色铅笔夜间效果更佳。'
  },
  {
    id: 'minnow',
    name: '米诺 (Minnow)',
    category: '硬饵-悬浮/潜行',
    desc: '最常见的硬饵类型，模仿小鱼的形态和泳姿。',
    technique: '匀速回收为主，可配合小抽和停顿。悬浮型最适合抽-停手法。',
    depth: '潜深1-3米（标准），4-6米（深潜型）',
    speed: '中速匀速',
    seasons: ['春', '夏', '秋', '冬'],
    targetSpecies: ['luyu', 'qiaozui', 'huanwei', 'guiyu', 'ganyu'],
    conditions: '适用性最广的万能饵，几乎任何条件都能用',
    tips: '悬浮型米诺是路亚鲈鱼的经典——抽-停时模拟受伤小鱼。'
  },
  {
    id: 'crank',
    name: '摇摆小胖 (Crankbait)',
    category: '硬饵-摇摆/振动',
    desc: '短胖体型、大舌板的硬饵，摇摆幅度大、震动强烈。',
    technique: '匀速回收。舌板角度决定潜深。',
    depth: '1-3米(浅潜)，3-6米(深潜)',
    speed: '中速',
    seasons: ['春', '夏', '秋'],
    targetSpecies: ['guiyu', 'luyu', 'qiaozui'],
    conditions: '搜索利器，适合开阔水面或浅水结构区',
    tips: '撞底手法是Crank的核心技术——触底瞬间停一下再继续收。'
  },
  {
    id: 'vib',
    name: 'VIB (Vibration)',
    category: '硬饵-全水层金属',
    desc: '金属或硬塑材质的振颤型拟饵，下沉速度快，全身震动频率高。',
    technique: '匀速回收或跳底。',
    depth: '全水层',
    speed: '中速到快速',
    seasons: ['春', '夏', '秋', '冬'],
    targetSpecies: ['guiyu', 'luyu', 'qiaozui', 'huanwei', 'ganyu'],
    conditions: '搜索效率最高的拟饵之一',
    tips: 'VIB最容易挂底——到底后立即上抬竿尖。铁板VIB落底后小跳对鳜鱼有奇效。'
  },
  {
    id: 'spinnerbait',
    name: '复合亮片 (Spinnerbait)',
    category: '硬饵-复合',
    desc: '金属丝框架上带旋转亮片和橡胶裙的拟饵。',
    technique: '匀速回收，保持在草区上方掠过。',
    depth: '0.5-2米',
    speed: '中速或慢速',
    seasons: ['春', '夏', '秋'],
    targetSpecies: ['luyu', 'heiyu'],
    conditions: '浑水或草区边缘首选',
    tips: '防挂性极佳——在草区、树枝区轻松通过。'
  },
  {
    id: 'frog',
    name: '雷蛙 (Frog)',
    category: '硬饵-水面系草区',
    desc: '空心软胶蛙体，配双钩隐藏在身体两侧。专门用于重草区的表层拟饵。',
    technique: '在草面上走之字路线，经过草洞时停顿。',
    depth: '水面/草面',
    speed: '中速，不规则走线',
    seasons: ['夏', '初秋'],
    targetSpecies: ['heiyu'],
    conditions: '重草区、荷塘、浮萍水面',
    tips: '雷强专用饵。爆口后一定要延迟扬竿——数1-2秒。'
  },
  {
    id: 'jig',
    name: '铅头钩 (Jig Head)',
    category: '软饵钓组',
    desc: '铅头钩+软饵的组合，最基础也最有效的软饵钓组。',
    technique: '跳底或慢拖+小跳。',
    depth: '全水层',
    speed: '慢速，重视触底感受',
    seasons: ['全季节'],
    targetSpecies: ['guiyu', 'luyu', 'heiyu', 'qiaozui'],
    conditions: '全地形适用，尤其适合结构区、乱石底',
    tips: '自由下落阶段是鱼咬饵的高峰。敏感竿子是必须的。'
  },
  {
    id: 'texas',
    name: '德州钓组 (Texas Rig)',
    category: '软饵钓组',
    desc: '子弹铅+挡珠+偏钩钩+软饵的组合。钩尖藏在软饵体内，防挂性极佳。',
    technique: '重心在下，适合跳底和穿越障碍。',
    depth: '底层',
    speed: '慢速',
    seasons: ['春', '夏', '秋'],
    targetSpecies: ['luyu', 'guiyu', 'heiyu'],
    conditions: '重障区、乱石堆、树桩区',
    tips: '配面条虫或小龙虾软饵，在障碍区外围抛投慢慢拖进去。'
  },
  {
    id: 'wacky',
    name: 'Wacky钓组',
    category: '软饵钓组',
    desc: '面条虫中间用轻钩挂住，两端自然下垂。对鲈鱼有致命吸引力。',
    technique: '抛投→自由下沉→轻微抖动→等待→收线重复。',
    depth: '2-5米',
    speed: '极慢',
    seasons: ['春', '夏', '秋'],
    targetSpecies: ['luyu'],
    conditions: '清水静水区效果最佳',
    tips: '鲈鱼最爱的钓组之一。精髓是慢——让面条虫自然飘落。'
  },
  {
    id: 'spinner',
    name: '亮片 (Spinner)',
    category: '金属饵',
    desc: '金属片在水中旋转产生闪光和扰流，最常见的入门路亚饵。',
    technique: '匀速回收为主。',
    depth: '0.5-2米',
    speed: '中速到快速',
    seasons: ['春', '夏', '秋'],
    targetSpecies: ['makou', 'baitiao', 'luyu', 'qiaozui'],
    conditions: '溪流小鱼首选',
    tips: '马口和白条的标准配置。使用旋转环避免线被拧成麻花。'
  },
  {
    id: 'metaljig',
    name: '铁板 (Metal Jig)',
    category: '金属饵',
    desc: '金属一体成型的流线型拟饵，远投性能极佳。',
    technique: '跳底为主或快速回收。',
    depth: '全水层',
    speed: '跳底或快速',
    seasons: ['夏', '秋', '冬'],
    targetSpecies: ['qiaozui', 'huanwei', 'guiyu', 'ganyu'],
    conditions: '大水面远投搜索，深水作钓',
    tips: '下沉途中的截口往往是最大的鱼。远投能力在所有拟饵中最强。'
  }
];

// ========== 手法技巧 ==========
const TECHNIQUES = [
  {
    id: 'jump',
    name: '跳底手法',
    desc: '让饵在底层呈跳跃式前进，模拟在底部活动的小鱼、小虾或昆虫。',
    steps: ['抛投到目标位置', '待饵沉底', '抬竿尖至45度同时收余线', '竿尖下压让饵自由下落', '触底后重复'],
    keyPoints: ['自由下落阶段是鱼攻击的高峰', '用高感度竿子感受底部材质', '跳起高度控制在20-50cm'],
    targetSpecies: ['guiyu', 'luyu', 'heiyu'],
    suitableLures: ['铅头钩+T尾', '德州钓组', 'VIB', '铁板']
  },
  {
    id: 'walkdog',
    name: '走狗手法 (Walk the Dog)',
    desc: '竿尖连续小幅抽动，让铅笔在水面走之字形路线。',
    steps: ['抛投后竿尖指向水面', '连续小幅抽竿（手腕发力，10-20cm幅度）', '每抽2-3次停顿半秒', '变速'],
    keyPoints: ['关键是节奏而不是力度', '鱼跟饵不咬时放慢速度', 'ML-M调竿最合适'],
    targetSpecies: ['qiaozui', 'huanwei', 'ganyu', 'luyu'],
    suitableLures: ['铅笔(Pencil)']
  },
  {
    id: 'pop',
    name: '波爬手法 (Popping)',
    desc: '通过抽竿让波爬头部撞击水面，产生水花和声音。',
    steps: ['抛投后等待水面波纹散去', '短促有力地抽一下', '停顿2-5秒', '重复'],
    keyPoints: ['核心是声音+停顿', '清晨和黄昏是黄金时间'],
    targetSpecies: ['luyu', 'heiyu', 'qiaozui'],
    suitableLures: ['波爬(Popper)']
  },
  {
    id: 'frogwalk',
    name: '雷蛙走草',
    desc: '在重草区操控雷蛙在草面上行走。',
    steps: ['抛到草洞或草区边缘', '竿尖指向高处匀速收线', '制造曲折路线', '经过草洞时停顿', '爆口后延迟扬竿'],
    keyPoints: ['MH/H调竿+50lb以上PE线', '爆口后延迟扬竿是最重要的规则', '蛙要有活物的感觉'],
    targetSpecies: ['heiyu'],
    suitableLures: ['雷蛙(Frog)', '软蛙']
  },
  {
    id: 'bottomhop',
    name: '精细跳底 (Bottom Hopping)',
    desc: '针对鳜鱼、鲈鱼的精细跳底技术。',
    steps: ['使用轻克重铅头钩+T尾', '抛投到结构区', '让饵自由沉底', '轻抬竿尖20-30cm', '放松线让饵自由落下'],
    keyPoints: ['触底信号是核心', '自由下落阶段竿尖跟着饵走', '鳜鱼咬口常常是线突然一松'],
    targetSpecies: ['guiyu', 'luyu'],
    suitableLures: ['铅头钩+T尾', '德州+面条虫', '小型VIB']
  }
];

// ========== 季节作钓策略 ==========
const SEASON_STRATEGY = {
  spring: {
    name: '春季 (3-5月)',
    desc: '产卵期，鱼靠岸。鲈鱼最活跃。',
    tips: ['鲈鱼产卵前疯狂摄食', '黑鱼护巢性增强', '翘嘴白天在深水', '鳜鱼在乱石区用铅头钩']
  },
  summer: {
    name: '夏季 (6-8月)',
    desc: '高温期，窗口期作钓是关键。',
    tips: ['早晨6-9点、傍晚5-8点是黄金窗口', '夜钓翘嘴和红尾', '白天用深潜米诺/铁板搜索深水', '黑鱼用雷蛙走重草区']
  },
  autumn: {
    name: '秋季 (9-11月)',
    desc: '贴秋膘期，全年最佳窗口。',
    tips: ['鲈鱼疯狂摄食', '翘嘴白天也开始活跃', '鳜鱼在深水结构区大量进食', '全年路亚黄金季']
  },
  winter: {
    name: '冬季 (12-2月)',
    desc: '低温期，需要精细手法。',
    tips: ['目标鱼缩小到鳜鱼、翘嘴、鲈鱼', '极慢速+极小饵', '选择晴好天气出钓', '收线速度是夏季的1/3']
  }
};

// ========== 天气影响分析规则 ==========
const WEATHER_RULES = {
  pressure: {
    description: '气压对鱼活性的影响',
    levels: [
      { range: [1005, 1025], score: 5, label: '稳定', desc: '气压稳定，鱼活性正常' },
      { range: [995, 1005], score: 8, label: '较佳', desc: '适度的低气压区，鱼摄食活跃' },
      { range: [990, 995], score: 9, label: '最佳', desc: '低压区，鱼活性极佳' },
      { range: [985, 990], score: 6, label: '低压', desc: '过低气压，鱼口可能变差' },
      { range: [0, 985], score: 3, label: '极低压', desc: '暴风雨前后，鱼群活性不稳定' },
      { range: [1025, 1050], score: 3, label: '高压', desc: '鱼趋于深水，窗口期变短' }
    ],
    trendRules: [
      { trend: 'rising', label: '气压上升中', desc: '鱼活性可能短暂变好，然后趋于保守' },
      { trend: 'falling', label: '气压下降中', desc: '最佳窗口！鱼会疯狂摄食' },
      { trend: 'stable', label: '气压稳定', desc: '鱼活性维持正常水平' }
    ]
  },
  temperature: {
    description: '温度对鱼活性的影响',
    general: [
      { range: [25, 32], score: 9, label: '最佳温度', desc: '最高活性温度区间' },
      { range: [18, 25], score: 8, label: '舒适', desc: '全天窗口期较长' },
      { range: [10, 18], score: 5, label: '低温', desc: '鱼活性下降，需放慢手法' },
      { range: [32, 38], score: 5, label: '高温', desc: '窗口期集中在早晚' },
      { range: [0, 10], score: 2, label: '极低温', desc: '大部分鱼进入冬眠状态' }
    ]
  },
  wind: {
    description: '风对作钓的影响',
    levels: [
      { level: '0-1级', desc: '无风或微风——鱼谨慎', score: 5 },
      { level: '2-3级', desc: '微风细浪——最佳风力条件', score: 9 },
      { level: '4-5级', desc: '中浪——可作钓但抛投受限', score: 6 },
      { level: '6级以上', desc: '大风大浪——不适合作钓', score: 2 }
    ]
  },
  weather: {
    description: '天气状况的影响',
    conditions: [
      { type: '晴', score: 6, desc: '窗口期集中在早晚' },
      { type: '多云', score: 8, desc: '全天窗口期延长' },
      { type: '小雨', score: 9, desc: '增加溶氧——鱼活性高' },
      { type: '中雨', score: 7, desc: '雨停后通常是爆口期' },
      { type: '大雨', score: 3, desc: '水质变浑，暂时不适合' },
      { type: '阴', score: 8, desc: '光线弱，鱼全天保持较高活性' },
      { type: '雷阵雨', score: 7, desc: '雷雨前气压骤降——爆口模式' }
    ]
  }
};

// ========== 工具函数 ==========
function getMoonPhase(date) {
  if (!date) date = new Date();
  let year = date.getFullYear();
  let month = date.getMonth() + 1;
  const day = date.getDate();
  if (month < 3) { year--; month += 12; }
  month++;
  const c = 365.25 * year;
  const e = 30.66 * month;
  const jd = c + e + day - 694359;
  let b = jd / 29.53059;
  b = b - Math.floor(b);
  b = Math.round(b * 8);
  if (b >= 8) b = 0;
  const phases = ['新月', '蛾眉月', '上弦月', '盈凸月', '满月', '亏凸月', '下弦月', '残月'];
  return phases[b];
}

function getCurrentSeason() {
  const m = new Date().getMonth() + 1;
  if (m >= 3 && m <= 5) return 'spring';
  if (m >= 6 && m <= 8) return 'summer';
  if (m >= 9 && m <= 11) return 'autumn';
  return 'winter';
}

function getSeasonName(season) {
  return SEASON_STRATEGY[season] ? SEASON_STRATEGY[season].name : '';
}

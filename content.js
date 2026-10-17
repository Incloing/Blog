// 在这里修改主页介绍、栏目与内容。示例内容可直接删除，新增文章使用唯一 id。
window.BLOG = {
  name: 'Incloing',
  heroText: '把日子写成诗，\n把好奇留给远方。',
  // 首次成功开通 GitHub Pages 的时间，更新网站时请不要重置。
  startedAt: '2026-10-17T02:34:10Z',
  profile: { school: '东北林业大学', major: '人工智能', qq: '', bio: '' },
  // 填入本人在各平台的个人主页完整链接。留空时显示待补充状态。
  social: [
    { id: 'github', label: 'GitHub', href: 'https://github.com/Incloing' },
    { id: 'xiaohongshu', label: '小红书', href: 'https://www.xiaohongshu.com/user/profile/6847afbf000000001d01702f' },
    { id: 'x', label: 'X', href: 'https://x.com/InclosingAAA' },
    { id: 'instagram', label: 'Instagram', href: 'https://www.instagram.com/yangyangyang93869/' },
    { id: 'facebook', label: 'Facebook', href: 'https://www.facebook.com/share/1Jz43UqUc8/' }
  ],
  tagline: '记录，探索，慢慢生长。',
  intro: '你好，我是 Incloing。\n这里记录学习、创造，和日常的小小发现。',
  about: ['你好，我是 Incloing，欢迎来到我的个人空间。', '我想在这里整理学习的过程，保存做过的项目，也记下一些日常的片刻。它会随着新的经历和想法，慢慢变得丰富。', '这里刚刚开始搭建，文章和项目目前是供预览结构的示例。之后会替换成我的真实记录。'],
  categories: [
    { id: 'notes', title: '学习笔记', english: 'LEARN & CONNECT', subtitle: 'IDEAS, ONE NOTE AT A TIME', description: '把零散的知识，连成自己的地图。', artAlt: 'Google Cloud 原始报告中的浅蓝色粒子云' },
    { id: 'projects', title: '项目', english: 'MAKE & EXPLORE', subtitle: 'FROM A THOUGHT TO SOMETHING REAL', description: '从一个念头，到可以触摸的作品。', artAlt: 'Google Cloud 原始报告中的流动金色雕塑' },
    { id: 'life', title: '生活随笔', english: 'LIVE & NOTICE', subtitle: 'LITTLE MOMENTS, KEPT HERE', description: '收集日常里，那些值得停留的片刻。', artAlt: 'Google Cloud 原始报告中的绿色自然形态' }
  ],
  posts: [
    {id:'hello-world', category:'life', title:'给自己留一小块互联网', date:'2026-10-17', tags:['建站手记','新的开始'], demo:true, pinned:true, excerpt:'把想法慢慢写下来，把散落的记录放在一起。这个小小的站点，就从这里开始。', body:[{heading:'一个可以慢慢生长的地方',text:'这是网站第一篇示例文章。你可以把这里改成建站的初衷，也可以写下一段最近想说的话。个人主页不需要一开始就有完整答案，重要的是有一个愿意回来的地方。'},{heading:'这里会放什么',text:'学习笔记用来整理知识，项目栏目记录从想法到实现的过程，生活随笔留给那些不必急着归类的念头。'},{heading:'写给未来的自己',text:'这一段可以换成你对未来的期待。文章支持段落、小标题和标签，后续可以继续增加内容。'}]},
    {id:'learning-map', category:'notes', title:'把学过的东西，整理成自己的知识地图', date:'2026-10-16', tags:['学习方法','知识整理'], demo:true, excerpt:'从一个问题出发，记录理解的过程，再让知识之间建立联系。', body:[{heading:'先记下问题',text:'这是一篇学习笔记示例。可以先写清楚：我正在学什么？我遇到了哪个问题？我想用这些知识解决什么？'},{heading:'记录推导，而不只是结论',text:'用自己的话复述概念，补上一个简单的例子，留下尚未理解的部分。下次回来时，就能接着这个思路继续。'},{heading:'给笔记建立联系',text:'在文章末尾记录相关主题和下一步想学的内容。比起一次整理完所有知识，持续补充往往更容易坚持。'}]},
    {id:'personal-home', category:'projects', title:'Incloing：我的个人主页', date:'2026-10-15', tags:['Web','个人网站'], demo:true, status:'示例项目', excerpt:'一个用来整理学习、展示项目、保存日常记录的个人空间。', body:[{heading:'项目概览',text:'这是项目详情页示例，展示你的作品可以如何呈现。请将目标、截图、技术选型和实际成果替换为真实内容。'},{heading:'从需求到结构',text:'首页介绍自己，学习笔记按主题分类，项目页讲清目标与实现，随笔记录日常。内容可以通过 content.js 统一管理。'},{heading:'下一步',text:'填入真实介绍与文章，为项目补充截图、仓库地址和演示链接，逐步把这里变成自己的数字花园。'}]},
    {id:'small-observations', category:'life', title:'普通的一天，也有值得记住的事情', date:'2026-10-14', tags:['日常','片刻'], demo:true, excerpt:'不一定要等到远行，才开始留意身边的风景。', body:[{heading:'留意',text:'这是一篇生活随笔示例。这里可以记下一次散步、一段对话、一本刚读完的书，或一个突然冒出来的想法。'},{heading:'把片刻留下来',text:'照片、文字、几句简单的描述，都可以成为记录。它们不必宏大，只要对自己有意义。'}]},
    {id:'project-notes', category:'notes', title:'动手之前，先把问题写清楚', date:'2026-10-12', tags:['实践','问题拆解'], demo:true, excerpt:'从需求、边界到验证方式，一份小小的清单，让动手的过程更有方向。', body:[{heading:'要解决的问题',text:'这是一篇实践笔记示例。先用一句话描述问题，再写下谁会使用、什么时候会用，以及什么结果才算完成。'},{heading:'拆成能够验证的小步',text:'每一步都尽量有清晰的输入和输出。做完后记录发现与取舍，这些过程往往比最终结果更值得保留。'}]},
    {id:'little-tool', category:'projects', title:'下一个小项目，正在酝酿', date:'2026-10-10', tags:['灵感','小工具'], demo:true, status:'示例占位', excerpt:'为生活中一个小小的不便，尝试做一个小小的工具。', body:[{heading:'项目占位',text:'这里是第二个项目的位置。准备好真实项目后，可以替换标题、描述、标签，以及项目的实现过程。'},{heading:'建议记录的内容',text:'这个项目为什么开始？做了什么？遇到了哪些问题？下一步想改进什么？这些问题能帮助别人更好地理解你的作品。'}]}
  ]
};

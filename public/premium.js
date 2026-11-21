const css=document.createElement('link'); css.rel='stylesheet'; css.href='/app/premium.css?v=gold3'; document.head.append(css);
const art={ '🏠':'diamond','🎮':'diamond','💳':'card','🕒':'wait','👤':'wallet','⚙️':'diamond','💰':'wallet','🎟️':'promo','🎧':'support','🏆':'trophy','💎':'diamond','📦':'empty','🛍️':'empty','💸':'wallet','🤝':'gift','🎁':'gift','📢':'channel','📣':'channel','⚡':'bolt','✅':'success','⌛':'wait','⏳':'wait','⚠️':'alert','⛔':'alert','❌':'alert','🧾':'card','📊':'trophy','👥':'gift','🎨':'diamond' };
const symbols={'🔍':'⌕','🔎':'⌕','📋':'⧉','📎':'＋','⬇️':'↓','⬆️':'↑','🔄':'↻','🗑️':'×','🚫':'−','👁️':'◉','💾':'Saqlash','🔗':'↗'};
const emoji=/\p{Extended_Pictographic}[\uFE0F\u200D\p{Extended_Pictographic}]*/gu;
function polish(root){
  const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT); const nodes=[];
  while(walker.nextNode()) nodes.push(walker.currentNode);
  for(const node of nodes){
    if(node.parentElement?.closest('script,style,textarea,code')) continue;
    const text=node.textContent; emoji.lastIndex=0; if(!emoji.test(text)) continue; emoji.lastIndex=0;
    const fragment=document.createDocumentFragment(); let at=0;
    for(const m of text.matchAll(emoji)){
      fragment.append(text.slice(at,m.index));
      if(art[m[0]]){ const im=document.createElement('img'); im.src='/media/'+art[m[0]]+'.webp'; im.alt=''; im.className='art'; im.width=28; im.height=28; fragment.append(im); }
      else fragment.append(symbols[m[0]] || '');
      at=m.index+m[0].length;
    }
    fragment.append(text.slice(at)); node.replaceWith(fragment);
  }
}
let queued=false;
new MutationObserver(()=>{if(queued)return;queued=true;queueMicrotask(()=>{queued=false;polish(document.body);});}).observe(document.body,{childList:true,subtree:true,characterData:true});
polish(document.body);
try{window.Telegram?.WebApp?.setHeaderColor('#ffffff');window.Telegram?.WebApp?.setBackgroundColor('#ffffff');window.Telegram?.WebApp?.setBottomBarColor?.('#ffffff');window.Telegram?.WebApp?.disableVerticalSwipes?.();}catch{}

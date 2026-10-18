(() => {
'use strict';
const $=s=>document.querySelector(s),data=window.ATLAS_PALETTES;
const roles=['base','sub','accent'],labels=['Base','Sub','Accent'];
const groupNames={main:'メイン',season:'季節',event:'イベント'};
const detail=$('#detail'),manual=$('#manual'),narrow=matchMedia('(max-width:1100px)');
let promptMode='new';
let usageMode='slides';
const ratio=Object.freeze([70,25,5]);
let category='',color='',season='',purposes=new Set(),view='all',selected=null,opener=null,timer,favorites=new Set(),recent=[];
function node(tag,cls,text){const el=document.createElement(tag);if(cls)el.className=cls;if(text!==undefined)el.textContent=text;return el;}
const paths={heart:'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z',search:'m21 21-5-5 M19 10.5a8.5 8.5 0 1 1-17 0 8.5 8.5 0 0 1 17 0',clock:'M12 8v5l4 2 M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0',grid:'M3 3h6v6H3z M15 3h6v6h-6z M3 15h6v6H3z M15 15h6v6h-6z',list:'M9 5h12 M9 12h12 M9 19h12 M3 5h1 M3 12h1 M3 19h1',copy:'M9 5V3h11v14h-3 M4 7h11v14H4z',close:'m5 5 14 14 M19 5 5 19',sliders:'M3 6h4 M11 6h10 M3 12h10 M17 12h4 M3 18h4 M11 18h10 M7 3v6 M17 9v6 M7 15v6',palette:'M12 3a9 9 0 1 0 0 18h1a2 2 0 0 0 1.5-3.5 1.5 1.5 0 0 1 1-2.5H18a4 4 0 0 0 3-4 9 9 0 0 0-9-8Z M7 10h.01 M10 6h.01 M15 7h.01 M17 11h.01'};
function icon(name){const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('fill','none');svg.setAttribute('stroke','currentColor');svg.setAttribute('stroke-linecap','round');svg.setAttribute('stroke-linejoin','round');svg.setAttribute('aria-hidden','true');svg.classList.add('icon');const path=document.createElementNS(svg.namespaceURI,'path');path.setAttribute('d',paths[name]);svg.append(path);return svg;}
document.querySelectorAll('[data-icon]').forEach(el=>el.replaceWith(icon(el.dataset.icon)));
function luminance(hex) {
 const rgb = hex.slice(1).match(/../g).map(c=>parseInt(c,16)/255).map(c=>c<=.04045?c/12.92:((c+.055)/1.055)**2.4);
 return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722;
}
function textColor(hex) {return luminance(hex)>.179128784747792 ? '#000000' : '#FFFFFF';}
function validate(items) {
 if (!Array.isArray(items)||items.length!==208) throw Error('208件の配色データが必要です');
 const ids=new Set(),names=new Set(),sets=new Set(),categories=new Map();
 const expected={main:['ポップ','ビビッド','ネオン','パステル','くすみカラー','モノトーン','クール','爽やか','ナチュラル','アースカラー','韓国風','高級・エレガント','レトロ'],season:['春','夏','秋','冬'],event:['ハロウィン','クリスマス']};
 items.forEach((p,i)=>{
  if(p.id!==String(i+1).padStart(3,'0')||ids.has(p.id)) throw Error('番号または名前が不正です');
  for(const key of ['name','category','categoryType','description']) if(typeof p[key]!=='string'||!p[key]) throw Error('必須項目がありません');
  if(!Array.isArray(p.tags)||!p.tags.length||!p.tags.every(t=>typeof t==='string'&&t)) throw Error('タグが不正です');
  if(!expected[p.categoryType]?.includes(p.category)) throw Error('ジャンルが不正です');
  if(!Array.isArray(p.purposes)||!p.purposes.length||!p.purposes.every(t=>typeof t==='string'&&t)) throw Error('用途が不正です');
  if(Number(p.id)>=101&&Number(p.id)<=200&&!p.purposes.includes(p.purpose)) throw Error('主用途が不正です');
  roles.forEach(k=>{if(!/^#[0-9A-F]{6}$/.test(p[k])) throw Error('HEXが不正です');});
  const set=roles.map(k=>p[k]).join(',');if(sets.has(set)) throw Error('色セットが重複しています');
  ids.add(p.id);names.add(p.name);sets.add(set);categories.set(p.category,(categories.get(p.category)||0)+1);
 });
 if(categories.size!==19) throw Error('ジャンル件数が不正です');
}
function allText(p){return roles.map((r,i)=>`${labels[i]}: ${p[r]}`).join('\n');}
function promptText(p){
 const colors=`Base（${ratio[0]}%）：${p.base}
役割：背景や広い面積に使用する基本色

Sub（${ratio[1]}%）：${p.sub}
役割：メインの印象を作る補助色。カード・図形・装飾などに使用

Accent（${ratio[2]}%）：${p.accent}
役割：見出し・装飾・ボタン・強調部分などに使用する差し色

配色比率はBase ${ratio[0]}%、Sub ${ratio[1]}%、Accent ${ratio[2]}%を目安にしてください。この比率はデザイン全体に使用する色面積の基本の目安です。デザインの目的や文字の視認性に応じて調整してかまいません。`;
 return promptMode==='recolor'
 ? `現在のデザインについて、レイアウト・構成・テキスト・画像・サイズ・配置などは維持したまま、配色のみを次の3色に変更してください。

${colors}

元のデザインの構成や雰囲気をできる限り維持し、各色を役割に応じて割り当ててください。

色以外の変更や、デザイン全体の作り直しは行わないでください。文字や重要な情報の視認性も確保してください。`
 : `次の3色を使用して、統一感のあるデザインを新規制作してください。

${colors}

3色の役割とバランスを意識し、視認性とデザイン性を両立させてください。`;
}
function setPromptMode(mode){
 promptMode=mode;
 document.querySelectorAll('[data-prompt-mode]').forEach(tab=>{const active=tab.dataset.promptMode===mode;tab.setAttribute('aria-selected',String(active));tab.tabIndex=active?0:-1;});
 $('#prompt-panel').setAttribute('aria-labelledby',mode==='new'?'prompt-tab-new':'prompt-tab-recolor');
 if(selected){$('#prompt').value=promptText(selected);$('#prompt').scrollTop=0;}
}
$('#prompt-tabs').addEventListener('click',e=>{const tab=e.target.closest('[data-prompt-mode]');if(tab)setPromptMode(tab.dataset.promptMode);});
$('#prompt-tabs').addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();const tabs=[...document.querySelectorAll('[data-prompt-mode]')];const current=tabs.indexOf(e.target.closest('[data-prompt-mode]'));const index=e.key==='Home'?0:e.key==='End'?1:(current+1)%tabs.length;setPromptMode(tabs[index].dataset.promptMode);tabs[index].focus();});
function setUsageMode(mode){usageMode=mode;document.querySelectorAll('[data-usage-mode]').forEach(tab=>{const active=tab.dataset.usageMode===mode;tab.setAttribute('aria-selected',String(active));tab.tabIndex=active?0:-1;});$('#usage-slides').toggleAttribute('hidden',mode!=='slides');$('#usage-design').toggleAttribute('hidden',mode!=='design');$('#usage-panel').setAttribute('aria-labelledby','usage-tab-'+mode);}
$('#usage-tabs').addEventListener('click',e=>{const tab=e.target.closest('[data-usage-mode]');if(tab)setUsageMode(tab.dataset.usageMode);});
$('#usage-tabs').addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();const tabs=[...document.querySelectorAll('[data-usage-mode]')],current=tabs.indexOf(e.target.closest('[data-usage-mode]')),index=e.key==='Home'?0:e.key==='End'?1:(current+1)%tabs.length;setUsageMode(tabs[index].dataset.usageMode);tabs[index].focus();});
// Store the new numbering in a separate, atomic record. Legacy keys stay untouched.
const storageKey='atlas-library-sequential-208-v1';
const legacyIDMap={'209':'022','210':'041','211':'053','212':'055','213':'064'};
const reusedIDs=new Set(Object.values(legacyIDMap));
function cleanStoredIDs(value,legacy=false){
 if(!Array.isArray(value))return [];
 const valid=new Set(data.map(p=>p.id));
 return [...new Set(value.filter(id=>typeof id==='string'&&(!legacy||!reusedIDs.has(id))).map(id=>legacy?(legacyIDMap[id]||id):id).filter(id=>valid.has(id)))];
}
function loadStorage(){try{
 const current=localStorage.getItem(storageKey);
 if(current!==null){const saved=JSON.parse(current);if(saved.version!==1||!Array.isArray(saved.favorites)||!Array.isArray(saved.recent))throw Error('Invalid library');favorites=new Set(cleanStoredIDs(saved.favorites));recent=cleanStoredIDs(saved.recent).slice(0,30);}
 else{const readLegacy=key=>{try{return JSON.parse(localStorage.getItem(key)||'[]');}catch{return [];}};favorites=new Set(cleanStoredIDs(readLegacy('atlas-favorites'),true));recent=cleanStoredIDs(readLegacy('atlas-recent'),true).slice(0,30);saveStorage();}
 }catch{$('#storage-note').hidden=false;}}
function saveStorage(){try{localStorage.setItem(storageKey,JSON.stringify({version:1,favorites:[...favorites],recent}));}catch{$('#storage-note').hidden=false;}}
function toast(text){$('#toast').textContent=text;$('#toast').classList.add('visible');clearTimeout(timer);timer=setTimeout(()=>$('#toast').classList.remove('visible'),2200);}
function syncScroll(){document.body.style.overflow=manual.open||(narrow.matches&&detail.classList.contains('overlay-open'))?'hidden':'';}
async function copy(text){try{if(!navigator.clipboard?.writeText)throw Error('Unavailable');await navigator.clipboard.writeText(text);toast('コピーしました');}catch{$('#manual-text').value=text;if(!manual.open)manual.showModal();$('#manual-text').focus();$('#manual-text').select();syncScroll();}}
function preview(p){const el=node('div','palette');roles.forEach(role=>{const s=node('div','swatch');s.style.backgroundColor=p[role];s.setAttribute('aria-label',`${role} ${p[role]}`);el.append(s);});return el;}
function tags(p){const el=node('div','tags');p.tags.slice(0,3).forEach(t=>el.append(node('span','tag',t)));return el;}
function syncFavorites(){const yes=!!selected&&favorites.has(selected.id);for(const el of [$('#detail-heart'),$('#favorite-add')]){el.setAttribute('aria-pressed',String(yes));el.setAttribute('aria-label',yes?'お気に入りから削除':'お気に入りに追加');}$('#favorite-label').textContent=yes?'お気に入り登録済み':'お気に入りに追加';document.querySelectorAll('.card>.heart').forEach(b=>{const on=favorites.has(b.dataset.id);b.setAttribute('aria-pressed',String(on));b.setAttribute('aria-label',`${b.dataset.name}をお気に入り${on?'から削除':'に追加'}`);});}
function toggleFavorite(p){if(favorites.has(p.id))favorites.delete(p.id);else favorites.add(p.id);saveStorage();syncFavorites();if(view==='favorites')render();}
function populateDetail(p){selected=p;$('#detail-no').textContent=`No.${p.id}`;$('#detail-title').textContent=p.name;$('#detail-description').textContent=p.description;$('#detail-preview').replaceChildren(...preview(p).childNodes);$('#detail-tags').replaceChildren(...tags(p).childNodes);$('#detail-colors').replaceChildren();roles.forEach((r,i)=>{const row=node('div','color-row'),button=node('button');button.append(icon('copy'));button.setAttribute('aria-label',`${labels[i]} ${p[r]}をコピー`);button.addEventListener('click',()=>copy(p[r]));row.append(node('strong','',labels[i]),node('code','',p[r]),button);$('#detail-colors').append(row);});$('#prompt').value=promptText(p);const sample=$('#usage-preview');for(const r of roles)sample.style.setProperty('--'+r,p[r]);for(const r of roles)sample.style.setProperty('--'+r+'-text',textColor(p[r]));syncFavorites();document.querySelectorAll('.card').forEach(el=>el.classList.toggle('selected',el.dataset.id===p.id));}
function openDetail(p,trigger){opener=trigger;populateDetail(p);recent=[p.id,...recent.filter(id=>id!==p.id)].slice(0,30);saveStorage();document.body.classList.remove('panel-closed');detail.scrollTop=0;if(narrow.matches){detail.classList.add('overlay-open');detail.setAttribute('role','dialog');detail.setAttribute('aria-modal','true');$('#detail-backdrop').hidden=false;$('#detail-title').focus();}syncScroll();if(view==='recent')render();}
function closeDetail(){detail.classList.remove('overlay-open');detail.removeAttribute('role');detail.removeAttribute('aria-modal');document.body.classList.add('panel-closed');$('#detail-backdrop').hidden=true;syncScroll();if(opener?.isConnected)opener.focus();else $('#search').focus();}
function card(p){const el=node('article','card');el.dataset.id=p.id;el.classList.toggle('selected',selected?.id===p.id);const open=node('button','card-open');open.setAttribute('aria-label',`No.${p.id} ${p.name}の詳細を開く`);const codes=node('div','codes');roles.forEach((r,i)=>{const cell=node('span');cell.append(node('small','',labels[i]),document.createTextNode(p[r]));codes.append(cell);});open.append(node('span','card-no',`No.${p.id}`),node('h3','',p.name),preview(p),codes);open.addEventListener('click',()=>openDetail(p,open));const heart=node('button','heart');heart.dataset.id=p.id;heart.dataset.name=p.name;heart.append(icon('heart'));heart.addEventListener('click',()=>toggleFavorite(p));const bottom=node('div','card-bottom');bottom.append(tags(p));el.append(open,heart,bottom);return el;}
function updateCategories(){
 const container=$('#categories');container.replaceChildren();
 for(const c of ['',...new Set(data.filter(p=>p.categoryType==='main').map(p=>p.category))]){const button=node('button','category-button',c||'すべて');button.dataset.category=c;container.append(button);}
 syncCategories();
}
function initSeasonEvents(){
 const events=window.ATLAS_EVENTS;
 const names=['お正月','バレンタイン','イースター','夏祭り・花火','ハロウィン','クリスマス'];
 if(!Array.isArray(events)||events.length!==6||events.some((event,i)=>event.name!==names[i]||!Array.isArray(event.palettes)||!event.palettes.length||new Set(event.palettes.map(p=>p.id)).size!==event.palettes.length||event.palettes.some(p=>!data.some(item=>item.id===p.id)||!p.reason)))throw Error('イベント対応表が不正です');
 const container=$('#season-events');
 for(const [label,items] of [['季節',['春','夏','秋','冬']],['イベント',names]]){
  container.append(node('div','category-group',label));
  for(const name of items){const button=node('button','category-button',name);button.dataset.season=name;button.setAttribute('aria-pressed','false');container.append(button);}
 }
 container.addEventListener('click',e=>{const button=e.target.closest('[data-season]');if(!button)return;season=season===button.dataset.season?'':button.dataset.season;syncSeasonEvents();render();});
}
function syncSeasonEvents(){document.querySelectorAll('[data-season]').forEach(button=>{const active=button.dataset.season===season;button.classList.toggle('active',active);button.setAttribute('aria-pressed',String(active));});}
function matchesSeason(p){if(!season)return true;const event=window.ATLAS_EVENTS.find(item=>item.name===season);return event?event.palettes.some(item=>item.id===p.id):p.tags.includes(season)||p.category===season;}
function initPurposeFilters(){
 const all=[...new Set(data.flatMap(p=>p.purposes))];
 for(const purpose of all){const b=node('button','purpose-button',purpose);b.dataset.purpose=purpose;b.setAttribute('aria-pressed','false');b.addEventListener('click',()=>{if(purposes.has(purpose))purposes.delete(purpose);else purposes.add(purpose);b.classList.toggle('active',purposes.has(purpose));b.setAttribute('aria-pressed',String(purposes.has(purpose)));render();});$('#purpose-filters').append(b);}

}
function syncCategories(){document.querySelectorAll('[data-category]').forEach(b=>{const yes=b.dataset.category===category;b.classList.toggle('active',yes);b.setAttribute('aria-pressed',String(yes));});}
const colorTools=window.ATLAS_COLOR_TOOLS;
function initColors(){colorTools.options.forEach(([key,label,hex])=>{const b=node('button','color-chip');b.dataset.color=key;b.style.setProperty('--chip',hex);b.append(node('span','chip-dot'),node('span','chip-label',label));b.setAttribute('aria-label',label+'系統で絞り込み');b.setAttribute('aria-pressed','false');b.addEventListener('click',()=>{color=color===key?'':key;document.querySelectorAll('[data-color]').forEach(x=>{x.classList.toggle('active',x.dataset.color===color);x.setAttribute('aria-pressed',String(x.dataset.color===color));});$('#color-hint').textContent=color?`${label}系統を含む配色`:'3色のいずれかの色系統で絞り込み';render();});$('#color-filters').append(b);});}
const nameCollator=new Intl.Collator('ja',{usage:'sort',sensitivity:'base'});
const tasteOrder=['ポップ','ビビッド','ネオン','パステル','くすみカラー','モノトーン','クール','爽やか','ナチュラル','アースカラー','韓国風','高級・エレガント','レトロ','春','夏','秋','冬','ハロウィン','クリスマス'];
function sortPalettes(items,sort){return items.sort((a,b)=>{
 let difference=0;
 if(sort==='name')difference=nameCollator.compare(window.ATLAS_READINGS[a.id],window.ATLAS_READINGS[b.id]);
 else if(sort==='taste')difference=tasteOrder.indexOf(a.category)-tasteOrder.indexOf(b.category);
 else if(sort==='hue')difference=colorTools.hueKey(a.base)-colorTools.hueKey(b.base);
 else if(sort==='brightness')difference=colorTools.luminance(b.base)-colorTools.luminance(a.base);
 return difference||Number(a.id)-Number(b.id);
});}
function normalized(s){return s.normalize('NFKC').toLocaleLowerCase('ja').trim();}
function render(){const words=normalized($('#search').value).split(/\s+/).filter(Boolean);let results=data.filter(p=>(!category||p.category===category)&&matchesSeason(p)&&[...purposes].every(purpose=>p.purposes.includes(purpose))&&(!color||roles.some(r=>colorTools.families(p[r]).includes(color)))&&(view!=='favorites'||favorites.has(p.id))&&(view!=='recent'||recent.includes(p.id))&&words.every(w=>normalized([p.id,`No.${p.id}`,p.name,p.description,p.category,...p.purposes,...p.tags,...roles.map(r=>p[r])].join(' ')).includes(w)));sortPalettes(results,$('#sort').value);$('#grid').replaceChildren(...results.map(card));$('#footer-count').textContent=data.length;$('#count').textContent=results.length===data.length?`全 ${data.length} 件`:`${results.length} / ${data.length} 件`;$('#empty').hidden=results.length!==0;$('#empty-message').textContent=view==='favorites'?'カードのハートを押すと、ここに保存できます。':view==='recent'?'パレットの詳細を開くと、ここに表示されます。':'検索キーワードや絞り込み条件を変更してください。';syncFavorites();}
function setView(next){view=next;$('#view-title').textContent={all:'3色のカラーパレット',favorites:'お気に入りのパレット',recent:'最近使ったパレット'}[view];document.querySelectorAll('[data-view]').forEach(b=>{b.classList.toggle('active',b.dataset.view===view);b.setAttribute('aria-pressed',String(b.dataset.view===view));});render();}
function reset(){category='';color='';season='';purposes.clear();syncSeasonEvents();document.querySelectorAll('[data-purpose]').forEach(b=>{b.classList.remove('active');b.setAttribute('aria-pressed','false');});$('#search').value='';$('#sort').value='number';syncCategories();document.querySelectorAll('[data-color]').forEach(b=>{b.classList.remove('active');b.setAttribute('aria-pressed','false');});$('#color-hint').textContent='3色のいずれかの色系統で絞り込み';setView('all');}
$('#categories').addEventListener('click',e=>{const b=e.target.closest('[data-category]');if(!b)return;category=b.dataset.category;syncCategories();render();});
$('#search').addEventListener('input',render);$('#sort').addEventListener('change',render);$('#reset').addEventListener('click',reset);$('#empty-reset').addEventListener('click',reset);document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>setView(b.dataset.view)));
$('#detail-heart').addEventListener('click',()=>toggleFavorite(selected));$('#favorite-add').addEventListener('click',()=>toggleFavorite(selected));$('#copy-all').addEventListener('click',()=>copy(allText(selected)));for(const id of ['#copy-prompt','#copy-prompt-bottom'])$(id).addEventListener('click',()=>copy($('#prompt').value));$('#close-detail').addEventListener('click',closeDetail);$('#detail-backdrop').addEventListener('click',closeDetail);$('#close-manual').addEventListener('click',()=>manual.close());manual.addEventListener('close',syncScroll);
function trap(e,container){if(e.key!=='Tab')return;const items=[...container.querySelectorAll('button,textarea,input,select,[tabindex="0"]')].filter(el=>!el.disabled&&el.getClientRects().length);const first=items[0],last=items[items.length-1],active=document.activeElement;if(e.shiftKey&&(active===first||!items.includes(active))){e.preventDefault();last?.focus();}else if(!e.shiftKey&&(active===last||!items.includes(active))){e.preventDefault();first?.focus();}}
manual.addEventListener('keydown',e=>trap(e,manual));document.addEventListener('keydown',e=>{if(manual.open)return;if(e.key==='Escape'){if($('.sidebar').classList.contains('open')){$('.sidebar').classList.remove('open');$('#mobile-filter').setAttribute('aria-expanded','false');$('#mobile-filter').focus();}else if(!document.body.classList.contains('panel-closed'))closeDetail();}if(narrow.matches&&detail.classList.contains('overlay-open'))trap(e,detail);});
$('#mobile-filter').addEventListener('click',()=>{const open=$('.sidebar').classList.toggle('open');$('#mobile-filter').setAttribute('aria-expanded',String(open));});
$('#grid-view').addEventListener('click',()=>setDisplay(false));$('#list-view').addEventListener('click',()=>setDisplay(true));function setDisplay(list){$('#grid').classList.toggle('list-mode',list);$('#list-view').setAttribute('aria-pressed',String(list));$('#grid-view').setAttribute('aria-pressed',String(!list));}
narrow.addEventListener('change',()=>{detail.classList.remove('overlay-open');detail.removeAttribute('role');detail.removeAttribute('aria-modal');$('#detail-backdrop').hidden=true;syncScroll();});
try{validate(data);if(data.some(p=>!window.ATLAS_READINGS?.[p.id]))throw Error("並び替え用の読み仮名が不足しています");loadStorage();updateCategories();initSeasonEvents();initPurposeFilters();initColors();populateDetail(data[0]);setView('all');}catch(error){$('#grid').textContent=`配色データを読み込めませんでした：${error.message}`;console.error(error);}
})();

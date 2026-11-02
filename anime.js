/* ReelVault Anime extension — separate local data; never modifies movie rating storage. */
(()=>{
'use strict';
const AKEY='reelvault-anime-v1', MODEKEY='reelvault-section-v1';
const starters=[
{id:'anime-cyberpunk',title:'Cyberpunk: Edgerunners',year:2022,type:'series',seasons:1,description:'A street kid tries to survive Night City as an edgerunner.'},
{id:'anime-snowball',title:'Snowball Earth',year:2026,type:'series',seasons:1,description:'A young pilot returns to an Earth covered in ice.'},
{id:'anime-sakamoto',title:'Sakamoto Days',year:2025,type:'series',seasons:1,description:'A retired legendary hitman gets pulled back into danger.'},
{id:'anime-chainsaw',title:'Chainsaw Man',year:2022,type:'series',seasons:1,description:'Denji becomes a devil hunter after merging with Pochita.'},
{id:'anime-reze',title:'Chainsaw Man – The Movie: Reze Arc',year:2025,type:'movie',seasons:0,description:'Denji meets Reze in a new chapter of his story.'}
];
let anime=[],section=localStorage.getItem(MODEKEY)==='anime'?'anime':'horror',animeResults=[],animeQuery='',animeFocus=null,seasonFocus=null,overallAnswers=[],seasonAnswers=[];
try{const v=JSON.parse(localStorage.getItem(AKEY));anime=Array.isArray(v)?v:starters.map(x=>({...x,status:'watchlist',watched:[],seasonsRated:{}}));}catch{anime=starters.map(x=>({...x,status:'watchlist',watched:[],seasonsRated:{}}));}
for(const x of starters){if(!anime.some(y=>y.id===x.id||y.title.toLowerCase()===x.title.toLowerCase()))anime.push({...x,status:'watchlist',watched:[],seasonsRated:{}})}
for(const a of anime){const known=starters.find(s=>s.id===a.id);if(known){a.seasons=known.seasons;a.type=known.type}a.watched=Array.isArray(a.watched)?a.watched:[];a.seasonsRated=a.seasonsRated&&typeof a.seasonsRated==='object'?a.seasonsRated:{}}
const store=()=>localStorage.setItem(AKEY,JSON.stringify(anime));store();
async function updateReleasedSeasons(){
 const checked=Number(localStorage.getItem('reelvault-anime-season-check')||0);
 if(Date.now()-checked<86400000)return;
 localStorage.setItem('reelvault-anime-season-check',String(Date.now()));
 const ids=['anime-cyberpunk','anime-snowball','anime-sakamoto','anime-chainsaw'];
 for(const id of ids){
  const a=anime.find(x=>x.id===id);if(!a)continue;
  try{
   const res=await fetch('https://api.tvmaze.com/singlesearch/shows?q='+encodeURIComponent(a.title)+'&embed=episodes');
   if(!res.ok)continue;const result=await res.json();
   const norm=s=>s.toLowerCase().replace(/[^a-z0-9]/g,'');
   if(norm(result.name)!==norm(a.title))continue;
   const now=new Date().toISOString().slice(0,10);
   const episodes=result._embedded?.episodes||[];
   const n=Math.max(0,...episodes.filter(ep=>ep.type!=='special'&&ep.airdate&&ep.airdate<=now).map(ep=>+ep.season||0));
   if(n>a.seasons){a.seasons=n;store();if(section==='anime')render();}
  }catch(e){}
 }
}

const esc=s=>escapeHtml(s);
const fiveQs=[
['How much did you enjoy this season?',['Not at all','Not much','It was okay','Really enjoyed it','Loved it']],
['How engaging was the story?',['Very dull','Weak','Okay','Very engaging','Outstanding']],
['How memorable were its characters?',['Not at all','Barely','Somewhat','Very','Unforgettable']],
['How was the pacing?',['Poor','Uneven','Fine','Very good','Excellent']],
['How much do you want more?',['Not at all','A little','Maybe','A lot','Absolutely']]
];
const mean=arr=>arr.reduce((a,b)=>a+b,0)*2/arr.length;
const rating=a=>{const base=Array.isArray(a.overallAnswers)&&a.overallAnswers.length===10?mean(a.overallAnswers):null;const ss=Object.values(a.seasonsRated||{}).filter(x=>Array.isArray(x)&&x.length===5);if(base===null)return null;const seasonal=ss.length?ss.reduce((n,x)=>n+mean(x),0)/ss.length:null;return (seasonal===null?base:base*.7+seasonal*.3).toFixed(1)};
const poster=a=>a.artwork?'<img class="poster" src="'+esc(a.artwork)+'" alt="'+esc(a.title)+' cover" loading="lazy" onerror="this.style.display=\'none\';this.insertAdjacentHTML(\'afterend\',\'<div class=&quot;poster fallback&quot;>🎞</div>\')">':'<div class="poster fallback">🎞</div>';
const legacyRender=render;
function animeCard(a){const s=rating(a);return '<article class="card anime-entry" data-anime-open="'+esc(a.id)+'">'+poster(a)+'<div class="cardbody"><div class="title">'+esc(a.title)+' <span class="meta">('+esc(a.year||'')+')</span></div><div class="meta">'+(a.type==='movie'?'Movie':a.seasons+' released season'+(a.seasons===1?'':'s'))+'</div>'+(s!==null?'<div class="score">★ '+s+' / 10</div>':'')+'<div class="actions"><button class="pill primary" data-anime-open="'+esc(a.id)+'">View & rate</button></div></div></article>'}
function renderAnime(){document.body.classList.add('anime-mode');document.getElementById('stats').innerHTML='<div class="stat"><strong>'+anime.filter(a=>rating(a)!==null).length+'</strong><span>Rated anime</span></div><div class="stat"><strong>'+anime.filter(a=>a.status==='watchlist').length+'</strong><span>Anime watchlist</span></div><div class="stat"><strong>'+anime.filter(a=>a.type==='series').length+'</strong><span>Series</span></div>';document.querySelectorAll('#nav button').forEach(b=>b.classList.toggle('active',b.dataset.tab===tab));const el=document.getElementById('content');
if(tab==='rated'){el.innerHTML='<div class="sectionhead"><h2>★ Rated anime</h2></div>'+(anime.filter(x=>rating(x)!==null).sort((a,b)=>+rating(b)-+rating(a)).map(animeCard).join('')||'<div class="empty">No anime rated yet.</div>')}
else if(tab==='watchlist'){el.innerHTML='<div class="sectionhead"><h2>◉ Anime watchlist</h2><button class="pill" id="anime-refresh-posters">Refresh covers</button></div>'+(anime.filter(a=>a.status==='watchlist').map(animeCard).join('')||'<div class="empty">Your anime watchlist is empty.</div>')}
else if(tab==='search'){el.innerHTML='<div class="sectionhead"><h2>Find anime</h2></div><form id="anime-search-form" class="searchrow"><input id="anime-query" class="field" placeholder="Search anime titles" value="'+esc(animeQuery)+'" required><button class="btn">Search</button></form><div id="anime-search-results">'+animeResults.map(searchCard).join('')+'</div>';document.getElementById('anime-search-form').onsubmit=searchAnime}
else if(tab==='recommend'){el.innerHTML='<div class="anime-reel" id="anime-reel"><div class="empty">Finding anime trailers…</div></div>';loadAnimeClips();}
else renderAnimeSettings()}
function searchCard(a){const inList=anime.some(x=>x.malId===a.malId||x.title.toLowerCase()===a.title.toLowerCase());return '<article class="card">'+poster(a)+'<div class="cardbody"><div class="title">'+esc(a.title)+'</div><div class="meta">'+(a.type==='movie'?'Movie':(a.seasons===null?'Seasons not verified':a.seasons+' released season(s)'))+'</div><div class="actions"><button class="pill primary" data-anime-add="'+(a.malId||'anilist-'+a.aniListId)+'" '+(inList?'disabled':'')+'>'+(inList?'In collection':'+ Watchlist')+'</button></div></div></article>'}
function renderAnimeSettings(){elSettings();function elSettings(){document.getElementById('content').innerHTML='<div class="sectionhead"><h2>⚙ Settings</h2></div>'+sectionPanel()+'<div class="panel"><h3>Anime collection backup</h3><p class="info">Your anime data is separate from your movie ratings.</p><button class="btn secondary" id="anime-export">Export anime backup</button></div><div class="panel"><h3>Remove mode</h3><p class="info">Locked by default. Enable it to show Remove buttons.</p><label><input id="anime-remove" type="checkbox" '+(removeMode?'checked':'')+'> Enable remove mode</label></div>';document.getElementById('anime-remove').onchange=e=>{removeMode=e.target.checked;render()};document.getElementById('anime-export').onclick=()=>downloadBlob(new Blob([JSON.stringify({app:'ReelVault Anime',anime},null,2)],{type:'application/json'}),'reelvault-anime-backup.json')}}
function sectionPanel(){return '<div class="panel"><h3>Collection</h3><div class="topactions"><button class="btn '+(section==='horror'?'':'secondary')+'" data-section="horror">Psychological Horror</button><button class="btn '+(section==='anime'?'':'secondary')+'" data-section="anime">Anime</button></div></div>'}
render=function(){if(section==='anime')renderAnime();else{document.body.classList.remove('anime-mode');legacyRender();if(tab==='settings')document.getElementById('content').insertAdjacentHTML('afterbegin',sectionPanel())}};
async function searchAnime(e){
 e.preventDefault();animeQuery=document.getElementById('anime-query').value.trim();const out=document.getElementById('anime-search-results');if(!animeQuery)return;
 out.innerHTML='<div class="empty">Searching anime…</div>';
 try{
  let items=[];
  try{items=await aniListLookup(animeQuery);}catch(err){}
  if(!items.length){
   const res=await fetch('https://api.jikan.moe/v4/anime?q='+encodeURIComponent(animeQuery)+'&limit=20');
   if(!res.ok)throw Error('Search unavailable');
   const data=await res.json();items=(data.data||[]).map(x=>({malId:x.mal_id,title:x.title_english||x.title,year:x.year||Number((x.aired?.from||'').slice(0,4))||'',type:x.type==='Movie'?'movie':'series',seasons:x.type==='Movie'?0:null,artwork:x.images?.webp?.large_image_url||x.images?.jpg?.large_image_url||'',description:x.synopsis||''}));
  }
  animeResults=items.filter(x=>x.title&&(x.malId||x.aniListId));
  out.innerHTML=animeResults.length?animeResults.map(searchCard).join(''):'<div class="empty">No matching anime found.</div>';
 }catch(err){out.innerHTML='<div class="empty">Anime search is temporarily unavailable. Try again later.</div>';}
}
function details(id){const a=anime.find(x=>x.id===id);if(!a)return;animeFocus=id;const root=document.getElementById('modalroot');const score=rating(a);let seasons='';if(a.type==='series'&&Number.isInteger(a.seasons)&&a.seasons>0){seasons='<h3>Released seasons</h3><p class="info">Check each season you have watched. The season count is fixed by the catalog—not editable here.</p>'+Array.from({length:a.seasons},(_,i)=>'<div class="split question"><label style="margin:0"><input type="checkbox" data-season-check="'+i+'" '+(a.watched.includes(i+1)?'checked':'')+'> Season '+(i+1)+'</label><button class="pill" data-season-rate="'+i+'" '+(!a.watched.includes(i+1)?'disabled':'')+'>'+(a.seasonsRated[i+1]?'Edit season rating':'Rate season')+'</button></div>').join('')}
if(a.type==='series'&&!a.seasons)seasons='<p class="info">Season count has not been verified for this title yet. Season tracking will become available after verification.</p>';root.innerHTML='<div class="modal"><div class="sheet"><div class="split"><h2>'+esc(a.title)+'</h2><button class="close" data-anime-close>×</button></div><p class="info">'+esc(a.description||'')+'</p>'+seasons+'<div class="panel"><h3>Overall series rating</h3><p class="info">'+(score===null?'Not rated yet':'Your score: '+score+'/10')+'</p><button class="btn" data-overall-rate>Rate with 10 questions</button></div>'+(a.type==='series'?'<p class="info">Completed season ratings contribute 30% to the final series score; the 10-question overall rating contributes 70%.</p>':'')+(removeMode?'<button class="pill danger" data-anime-delete>Remove from anime collection</button>':'')+'</div></div>';
root.querySelectorAll('[data-season-check]').forEach(x=>x.onchange=()=>{const n=+x.dataset.seasonCheck+1;if(x.checked&&!a.watched.includes(n))a.watched.push(n);if(!x.checked)a.watched=a.watched.filter(y=>y!==n);store();details(id)});
root.querySelectorAll('[data-season-rate]').forEach(x=>x.onclick=()=>ratingModal(a,+x.dataset.seasonRate+1));
root.querySelector('[data-overall-rate]').onclick=()=>ratingModal(a,null);root.querySelector('[data-anime-close]').onclick=()=>root.innerHTML='';
if(removeMode)root.querySelector('[data-anime-delete]').onclick=()=>{if(!removeMode)return;if(confirm('Remove '+a.title+'?')){anime=anime.filter(x=>x.id!==id);store();root.innerHTML='';render()}}}
function ratingModal(a,n){seasonFocus=n;let q=n===null?questions.map((item,i)=>[0,5,9].includes(i)?[item[0].replace(/movie/gi,'anime'),item[1]]:item):fiveQs;let values=n===null?a.overallAnswers:a.seasonsRated[n];let curr=Array.from({length:q.length},(_,i)=>values?.[i]??null);function draw(scroll){const root=document.getElementById('modalroot');root.innerHTML='<div class="modal"><div class="sheet" id="anime-rating-sheet"><div class="split"><h2>'+esc(a.title)+(n===null?' — overall':' — Season '+n)+'</h2><button class="close" id="anime-rating-back">×</button></div>'+q.map((item,i)=>'<div class="question"><h3>'+(i+1)+'. '+esc(item[0])+'</h3><div class="choices">'+item[1].map((choice,j)=>'<button class="choice '+(curr[i]===j+1?'selected':'')+'" data-anime-q="'+i+'" data-anime-val="'+(j+1)+'">'+esc(choice)+'</button>').join('')+'</div></div>').join('')+'<div class="ratingtotal">'+curr.filter(x=>x!==null).length+'/'+q.length+' answered</div><div class="topactions"><button class="btn" id="anime-rating-save" '+(curr.some(x=>x===null)?'disabled':'')+'>Save rating</button></div></div></div>';const sheet=root.querySelector('.sheet');sheet.scrollTop=scroll||0;root.querySelectorAll('[data-anime-q]').forEach(button=>button.onclick=()=>{const y=sheet.scrollTop;curr[+button.dataset.animeQ]=+button.dataset.animeVal;draw(y)});root.querySelector('#anime-rating-back').onclick=()=>details(a.id);root.querySelector('#anime-rating-save').onclick=()=>{if(curr.some(x=>x===null))return;if(n===null)a.overallAnswers=curr.slice();else a.seasonsRated[n]=curr.slice();if(n===null)a.status='rated';store();render();details(a.id)}}draw(0)}
document.getElementById('content').addEventListener('error',e=>{const image=e.target;if(image.tagName!=='IMG'||!image.closest('.anime-entry'))return;const id=image.closest('.anime-entry')?.dataset.animeOpen;const item=anime.find(a=>a.id===id);if(!item||item.posterRetry)return;item.posterRetry=true;item.artwork='';store();hydrateAnimePosters();},{capture:true});
document.getElementById('content').addEventListener('click',e=>{const mode=e.target.closest('[data-section]');if(mode){section=mode.dataset.section;localStorage.setItem(MODEKEY,section);tab='watchlist';document.getElementById('modalroot').innerHTML='';render();return}if(section!=='anime')return;if(e.target.closest('#anime-refresh-posters')){for(const a of anime){a.artwork='';delete a.posterRetry;}store();hydrateAnimePosters(true);showToast('Refreshing anime covers');return;}const clipAdd=e.target.closest('[data-anime-clip-add]');if(clipAdd){const x=animeClips.find(y=>y.id===clipAdd.dataset.animeClipAdd);if(x&&!anime.some(y=>y.malId===x.malId)){anime.push({...x,id:'anime-'+(x.malId||'anilist-'+x.aniListId),status:'watchlist',watched:[],seasonsRated:{}});store();showToast('Added to anime watchlist');}return;}const clipDetail=e.target.closest('[data-anime-clip-detail]');if(clipDetail){const x=animeClips.find(y=>y.id===clipDetail.dataset.animeClipDetail);if(x){const known=anime.find(y=>y.malId===x.malId);if(known)details(known.id);else{animeResults=[x];tab='search';render();}}return;}const open=e.target.closest('[data-anime-open]');if(open){details(open.dataset.animeOpen);return}const add=e.target.closest('[data-anime-add]');if(add){const x=animeResults.find(z=>String(z.malId||'anilist-'+z.aniListId)===add.dataset.animeAdd);if(!x)return;anime.push({...x,id:'anime-'+x.malId,status:'watchlist',watched:[],seasonsRated:{}});store();render();return}});

const POSTER_LOOKUP={
 'anime-cyberpunk':'Cyberpunk: Edgerunners',
 'anime-snowball':'Snowball Earth',
 'anime-sakamoto':'Sakamoto Days',
 'anime-chainsaw':'Chainsaw Man',
 'anime-reze':'Chainsaw Man Movie: Reze Arc'
};
async function aniListLookup(title){
 const query='query($search:String!){Page(perPage:10){media(search:$search,type:ANIME){id idMal title{english romaji native} coverImage{extraLarge large medium} startDate{year} format description}}}';
 const res=await fetch('https://graphql.anilist.co',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({query,variables:{search:title}})});
 if(!res.ok)throw Error('AniList unavailable');
 const json=await res.json();
 return (json.data?.Page?.media||[]).map(x=>({malId:x.idMal||null,aniListId:x.id,title:x.title.english||x.title.romaji||'',romaji:x.title.romaji||'',year:x.startDate?.year||'',type:x.format==='MOVIE'?'movie':'series',seasons:x.format==='MOVIE'?0:null,artwork:x.coverImage.extraLarge||x.coverImage.large||x.coverImage.medium||'',description:(x.description||'').replace(/<[^>]*>/g,'').slice(0,700)}));
}
const normalizePosterTitle=s=>String(s||'').toLowerCase().replace(/[^a-z0-9]/g,'');
function chooseAnimeResult(title,items,year){
 const exact=items.find(x=>[x.title,x.romaji].some(n=>normalizePosterTitle(n)===normalizePosterTitle(title))&&(!year||!x.year||Math.abs(x.year-year)<3));
 return exact||items.find(x=>normalizePosterTitle(x.title)===normalizePosterTitle(title))||null;
}
async function hydrateAnimePosters(force=false){
 const targets=anime.filter(x=>force||!x.artwork);
 for(const item of targets){
  const title=POSTER_LOOKUP[item.id]||item.title;
  try{
   let found=null;
   try{found=chooseAnimeResult(title,await aniListLookup(title),item.year)}
   catch(e){}
   if(!found){
    const response=await fetch('https://api.jikan.moe/v4/anime?q='+encodeURIComponent(title)+'&limit=10');
    if(response.ok){
     const data=await response.json();
     const items=(data.data||[]).map(x=>({malId:x.mal_id,title:x.title_english||x.title,romaji:x.title,year:x.year||'',artwork:x.images?.webp?.large_image_url||x.images?.jpg?.large_image_url||''}));
     found=chooseAnimeResult(title,items,item.year);
    }
   }
   if(found?.artwork){item.artwork=found.artwork;item.malId=item.malId||found.malId;store();if(section==='anime'&&(tab==='watchlist'||tab==='rated'))render();}
  }catch(e){}
 }
}

render();updateReleasedSeasons();hydrateAnimePosters();
})();
(()=>{
const S=window.SC||{},LIVE=!!S.url;
const get=k=>{try{return JSON.parse(localStorage.getItem(k))}catch(e){return null}},put=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}};
// the web app (shell-check.com/app) keeps its login in this browser; the website reads the same one, so one login covers both
let ses=get('sc.session');
async function api(p,o={}){const r=await fetch(S.url+p,{...o,headers:{apikey:S.key,Authorization:'Bearer '+(ses&&ses.access_token||S.key),...(o.body?{'Content-Type':'application/json'}:{}),...(o.headers||{})}});
 const t=await r.text();let j=null;try{j=t?JSON.parse(t):null}catch(e){}if(!r.ok)throw new Error((j&&(j.message||j.msg))||'Something went wrong');return j}
async function fresh(){if(!LIVE||!ses||!ses.refresh_token)return;if(ses.expires_at*1000>Date.now()+60000)return;
 try{const s=await api('/auth/v1/token?grant_type=refresh_token',{method:'POST',body:JSON.stringify({refresh_token:ses.refresh_token})});ses={...ses,...s};put('sc.session',ses)}catch(e){ses=null;put('sc.session',null)}}
const user=()=>ses&&ses.user;const name=()=>ses&&(ses.profile&&ses.profile.username||ses.user&&ses.user.email);
const who=document.getElementById('who');
(async()=>{await fresh();if(who&&user())who.textContent='Hi, '+name();
 const id=(document.querySelector('meta[name=sc-model]')||{}).content;if(!id)return;
 const price=+(document.querySelector('meta[name=sc-price]')||{}).content||null;
 const btn=document.querySelector('.like'),msg=document.getElementById('lm');let on=false;
 const show=()=>{btn.setAttribute('aria-pressed',on);btn.setAttribute('aria-label',on?'Liked':'Like')};
 // demo mode (no Supabase yet): likes live in this browser, same place the web app keeps them
 const demo=()=>get('sc.demo')||{users:{},likes:{},posts:[],postLikes:{},blocked:{}};
 if(user()){if(LIVE){try{const r=await api('/rest/v1/likes?select=model_id&model_id=eq.'+id);on=r.length>0}catch(e){}}else{const d=demo();on=!!(d.likes[user().id]||{})[id]}show()}
 btn.onclick=async()=>{if(!user()){msg.innerHTML='<a href="../app/#account">Log in</a> to save skates to your Liked list.';return}
  const want=!on;try{
   if(LIVE){if(want)await api('/rest/v1/likes',{method:'POST',headers:{Prefer:'resolution=merge-duplicates'},body:JSON.stringify({model_id:id,user_id:user().id,price_seen:price})});
    else await api('/rest/v1/likes?model_id=eq.'+id,{method:'DELETE'})}
   else{const d=demo(),l=d.likes[user().id]=d.likes[user().id]||{};if(want)l[id]={alert:false,...(l[id]||{}),model_id:id,price_seen:price,created_at:new Date().toISOString()};else delete l[id];put('sc.demo',d)}
   on=want;show();msg.innerHTML=on?'Saved to <a href="../app/#liked">Liked</a>. Switch on a price alert there.':''}catch(e){msg.textContent=e.message}};
 if(!LIVE)return;
 try{const [f]=await api('/rest/v1/fit_summary?model_id=eq.'+id);if(f&&f.n>=3){const pc=x=>Math.round(100*x/f.n)+'%';
  document.getElementById('cft').innerHTML='<b>'+f.n+' skaters</b> reported how their size fit. '+pc(f.right)+' say it fit well. '+(f.small?pc(f.small)+' found it short. ':'')+(f.big?pc(f.big)+' found it long. ':'')+(f.narrow?pc(f.narrow)+' found it narrow. ':'')+(f.wide?pc(f.wide)+' found it wide.':'');
  document.getElementById('cf').classList.add('on')}}catch(e){}
 try{const r=await api('/rest/v1/prices?model_id=eq.'+id+'&select=price,currency,shop,checked_at&order=price.asc&limit=1');if(r[0]){const e=document.getElementById('lp');e.textContent='· today from '+Math.round(r[0].price)+' '+r[0].currency;e.classList.add('on')}}catch(e){}
})();})();
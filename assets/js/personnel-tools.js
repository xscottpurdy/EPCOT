/* Shared Personnel UI. Player favorites sync to campaign state; DM personal stars remain local. */
(function(){
  function key(scope){return `epcot-personnel-favorites:${sessionStorage.getItem('epcot-account-id') || 'guest'}:${scope}`;}
  function favorites(scope){try{return new Set(JSON.parse(localStorage.getItem(key(scope))||'[]'));}catch{return new Set();}}
  function toggle(scope,id){const set=favorites(scope);set.has(String(id))?set.delete(String(id)):set.add(String(id));try{localStorage.setItem(key(scope),JSON.stringify([...set]));}catch{alert('Favorites could not be saved on this device.');}return set.has(String(id));}
  function neighborhood(value){return value==='Burns Gardens'?'Burns Preserve':value||'';}
  function zoom(img){const dialog=document.createElement('dialog');dialog.className='epcot-portrait-dialog';const close=document.createElement('button');close.type='button';close.textContent='Close ×';close.setAttribute('aria-label','Close portrait');const large=document.createElement('img');large.src=img.currentSrc||img.src;large.alt=img.alt;dialog.append(close,large);document.body.append(dialog);close.onclick=()=>dialog.close();dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close();});dialog.addEventListener('close',()=>dialog.remove(),{once:true});dialog.showModal();}
  document.addEventListener('click',e=>{const img=e.target.closest('.npc-card-image img,.dm-personnel-portrait img');if(img)zoom(img);});
  document.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.matches('.npc-card-image img,.dm-personnel-portrait img')){e.preventDefault();zoom(e.target);}});
  const accountId=()=>sessionStorage.getItem('epcot-account-id')||'';
  function forgetLocal(scope,id){const set=favorites(scope);set.delete(String(id));localStorage.setItem(key(scope),JSON.stringify([...set]));}
  async function setPlayerFavorite(state,desired){
    const client=window.epcotAuth?.client, account=accountId();
    if(!client||!account||!state?.id||!['hero','villain'].includes(state.campaign))throw Error('Personnel account unavailable.');
    for(let attempt=0;attempt<3;attempt++){
      const query=()=>client.from('npc_campaign_state');
      const scope=q=>q.eq('id',state.id).eq('npc_id',state.npc_id).eq('campaign',state.campaign).eq('is_visible',true);
      const {data:row,error}=await scope(query().select('favorite_account_ids')).maybeSingle();
      if(error)throw error;if(!row)throw Error('Personnel record is no longer visible.');
      const before=row.favorite_account_ids||[],set=new Set(before);desired?set.add(account):set.delete(account);
      if(set.size===before.length&&before.every(x=>set.has(x)))return before;
      const after=[...set].sort();
      const {data:updated,error:writeError}=await scope(query().update({favorite_account_ids:after})).eq('favorite_account_ids','{'+before.join(',')+'}').select('favorite_account_ids');
      if(writeError)throw writeError;if(updated?.length)return updated[0].favorite_account_ids;
    }
    throw Error('Favorites changed elsewhere. Please try again.');
  }
  window.epcotPersonnelTools={favorites,toggle,neighborhood,accountId,forgetLocal,setPlayerFavorite};
})();

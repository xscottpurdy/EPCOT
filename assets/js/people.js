/* =====================================================
   EPCOT DND
   SHARED PERSONNEL ENGINE

   Shared by:
   - Hero Cast
   - Hero Unbound
   - Villain Cast
   - Villain Unbound

   CORE RULE:
   Campaign controls knowledge.
   Reality controls presentation.

   CAMPAIGN:
   - determines which NPCs are visible
   - determines notes
   - determines relationship state

   REALITY:
   - determines displayed NPC name
   - determines displayed NPC portrait
   ===================================================== */


/* =====================================================
   FIXED OPTIONS
   ===================================================== */

const NPC_COMPANIES = [
  'Progress Dynamics',
  'VistaCorp',
  'Monsanto',
  'Fordham Mobility',
  'WestHouse Systems',
  'Disney Enterprises',
  'Unaffiliated'
];


const NPC_MAGIC_DOMAINS = [
  'Bravura',
  'Starpath',
  'Craftspark',
  'Mindwave',
  'Heartline',
  'Dreamlight'
];


const NPC_NEIGHBORHOODS = [
  'Anderson Ward',
  'Blair Quarter',
  'Davis Vista',
  'Ryman Fields',
  'Atencio Reach',
  'Toombs Gardens',
  'Gurr District',
  'Joerger Commons',
  'Chao Terrace',
  'Coats Line',
  'Gracey Foundry',
  'Broggie Yard',
  'Irvine Passage',
  'McKim Portal',
  'Chapman Gate',
  'Baxter Forge',
  'Crump Works',
  'Burns Preserve',
  'Underground',
  'Unaffiliated'
];


/* =====================================================
   STATE
   ===================================================== */

let npcRecords = [];
const playerPersonnelFilter={search:'',neighborhood:'',favorites:false};
function playerFavorites(){const id=window.epcotPersonnelTools.accountId();return new Set(npcCampaignStates.filter(s=>id&&(s.favorite_account_ids||[]).includes(id)).map(s=>String(s.npc_id)));}
let playerFavoriteImportBusy=false;
async function importPlayerFavorites(){
 if(playerFavoriteImportBusy)return;playerFavoriteImportBusy=true;
 const tools=window.epcotPersonnelTools,campaign=getCurrentCampaign();
 try{for(const id of tools.favorites(campaign)){
  const state=getNpcCampaignState(id);if(!state?.is_visible)continue;
  try{state.favorite_account_ids=await tools.setPlayerFavorite(state,true);tools.forgetLocal(campaign,id);}catch(e){console.warn('Local favorite not yet imported:',e.message);}
 }}finally{playerFavoriteImportBusy=false;}
}

function renderPlayerPersonnelFilters(){
 const grid=peopleById('npcGrid'); if(!grid||peopleById('playerPersonnelFilters'))return;
 const panel=document.createElement('div');panel.id='playerPersonnelFilters';panel.className='epcot-personnel-filters';
 panel.innerHTML=`<label>Search Personnel<input type="search" placeholder="Name, title, skill, notes…" data-personnel-search></label><label>Neighborhood<select data-personnel-neighborhood><option value="">All Neighborhoods</option>${NPC_NEIGHBORHOODS.map(x=>`<option>${peopleEscapeHtml(x)}</option>`).join('')}</select></label><label>Favorites<select data-personnel-favorites><option value="">All Personnel</option><option value="yes">Favorites only</option></select></label>`;
 grid.before(panel);panel.addEventListener('input',()=>{playerPersonnelFilter.search=panel.querySelector('[data-personnel-search]').value.trim().toLowerCase();playerPersonnelFilter.neighborhood=panel.querySelector('[data-personnel-neighborhood]').value;playerPersonnelFilter.favorites=panel.querySelector('[data-personnel-favorites]').value==='yes';renderPeople();});
}


let npcCampaignStates = [];

let npcBeingEdited = null;

let peopleNpcChannel = null;

let peopleCampaignChannel = null;

let peopleRealtimeRefreshTimer = null;
let peopleLoadBusy=false;
let playerNoteEditor=null;


/* =====================================================
   BASIC HELPERS
   ===================================================== */

function peopleById(id){

  return document.getElementById(id);

}


function getCurrentCampaign(){

  const campaign =
    (
      document.body.dataset.campaign ||
      'hero'
    ).toLowerCase();


  return campaign === 'villain'
    ? 'villain'
    : 'hero';

}


function getCurrentReality(){

  const reality =
    (
      document.body.dataset.reality ||
      'cast'
    ).toLowerCase();


  return reality === 'unbound'
    ? 'unbound'
    : 'cast';

}


function peopleEscapeHtml(value){

  return String(
    value ?? ''
  )
  .replaceAll('&','&amp;')
  .replaceAll('<','&lt;')
  .replaceAll('>','&gt;')
  .replaceAll('"','&quot;')
  .replaceAll("'","&#039;");

}


function showPeopleError(
  title,
  error
){

  console.error(
    title,
    error
  );


  const message =
    error?.message ||
    String(error);


  alert(
    `${title}\n\n${message}`
  );

}


/* =====================================================
   SAFE RICH TEXT
   ===================================================== */

function sanitizeNpcNotes(html){

  const wrapper =
    document.createElement(
      'div'
    );


  wrapper.innerHTML =
    html || '';


  const allowedTags =
    new Set([
      'B',
      'STRONG',
      'I',
      'EM',
      'U',
      'UL',
      'OL',
      'LI',
      'P',
      'DIV',
      'BR'
    ]);


  wrapper
    .querySelectorAll('*')
    .forEach(
      element => {

        if(
          !allowedTags.has(
            element.tagName
          )
        ){

          element.replaceWith(
            document.createTextNode(
              element.textContent
            )
          );

          return;

        }


        Array.from(
          element.attributes
        )
        .forEach(
          attribute => {

            element.removeAttribute(
              attribute.name
            );

          }
        );

      }
    );


  return wrapper.innerHTML;

}


/* =====================================================
   CAMPAIGN STATE

   This is now the source of truth for whether the
   CURRENT CAMPAIGN knows this NPC.

   No campaign-state row = this campaign has not
   discovered the NPC.
   ===================================================== */

function getNpcCampaignState(
  npcId
){

  const campaign =
    getCurrentCampaign();


  return npcCampaignStates.find(
    state =>
      state.npc_id === npcId &&
      state.campaign === campaign
  ) || null;

}


/* =====================================================
   CAMPAIGN VISIBILITY
   ===================================================== */

function npcIsVisible(npc){

  return Boolean(
    getNpcCampaignState(
      npc.id
    )
  );

}


/* =====================================================
   REALITY-SPECIFIC IDENTITY
   ===================================================== */

function getNpcDisplayName(npc){

  const reality =
    getCurrentReality();


  if(
    reality === 'unbound'
  ){

    return (
      npc.name_unbound ||
      npc.name_cast ||
      'Unnamed Personnel'
    );

  }


  return (
    npc.name_cast ||
    npc.name_unbound ||
    'Unnamed Personnel'
  );

}


function getNpcImageUrl(npc){

  const reality =
    getCurrentReality();


  if(
    reality === 'unbound'
  ){

    return (
      npc.unbound_image_url ||
      npc.cast_image_url ||
      ''
    );

  }


  return (
    npc.cast_image_url ||
    npc.unbound_image_url ||
    ''
  );

}


function getNpcImageMarkup(npc){

  const imageUrl =
    getNpcImageUrl(npc);


  if(imageUrl){

    return `
      <img
        src="${peopleEscapeHtml(imageUrl)}"
        alt="${peopleEscapeHtml(getNpcDisplayName(npc))}"
        loading="lazy" tabindex="0" role="button" aria-label="Enlarge portrait"
      >
    `;

  }


  return `
    <div class="npc-image-placeholder">
      ?
    </div>
  `;

}


/* =====================================================
   RELATIONSHIP TAG
   ===================================================== */

function getRelationshipTag(
  npcId
){

  const state =
    getNpcCampaignState(
      npcId
    );


  return (
    state?.relationship_tag ||
    'NEUTRAL'
  );

}


/* =====================================================
   SKILL TRAINING
   ===================================================== */

function getSkillTraining(npc){

  if(
    !Array.isArray(
      npc.skill_training
    )
  ){

    return [];

  }


  return npc.skill_training
    .filter(Boolean);

}


/* =====================================================
   RENDER PERSONNEL
   ===================================================== */

function renderPeople(){

  const grid =
    peopleById(
      'npcGrid'
    );


  if(!grid){
    return;
  }


  const visibleNpcs =
    npcRecords.filter(npc=>{
      if(!npcIsVisible(npc))return false;
      const state=getNpcCampaignState(npc.id);
      const text=[getNpcDisplayName(npc),npc.title,npc.company_association,npc.magic_domain,window.epcotPersonnelTools.neighborhood(npc.neighborhood),...getSkillTraining(npc),state?.details?.replace(/<[^>]*>/g,' ')].filter(Boolean).join(' ').toLowerCase();
      return (!playerPersonnelFilter.search||text.includes(playerPersonnelFilter.search))&&(!playerPersonnelFilter.neighborhood||window.epcotPersonnelTools.neighborhood(npc.neighborhood)===playerPersonnelFilter.neighborhood)&&(!playerPersonnelFilter.favorites||playerFavorites().has(String(npc.id)));
    });


  if(!visibleNpcs.length){

    grid.innerHTML = `
      <div class="people-empty-state">

        <strong>
          No matching personnel.
        </strong>

        <p>
          Try different filters, or ask the DM to reveal personnel your campaign has met.
        </p>

      </div>
    `;

    return;

  }


  grid.innerHTML =

    visibleNpcs.map(
      npc => {

        const state =
          getNpcCampaignState(
            npc.id
          );


        const skills =
          getSkillTraining(
            npc
          );


        const relationship =
          getRelationshipTag(
            npc.id
          );


return `

  <article
    class="npc-card"
    data-npc-id="${npc.id}"
    style="
      position:relative;
      overflow:hidden;
      ${npc.is_reassigned
        ? 'filter:saturate(.3);'
        : ''
      }
    "
  >

    ${
      npc.is_reassigned
        ? `
            <div
              style="
                position:absolute;
                inset:0;
                z-index:20;
                pointer-events:none;
                background:
                  linear-gradient(
                    135deg,
                    transparent 0 35%,
                    rgba(102,10,19,.78) 35% 47%,
                    rgba(20,3,6,.94) 47% 53%,
                    rgba(102,10,19,.78) 53% 65%,
                    transparent 65% 100%
                  );
                display:flex;
                justify-content:center;
                align-items:center;
              "
            >

              <div
                style="
                  transform:rotate(-11deg);
                  border:4px solid rgba(255,226,215,.92);
                  padding:9px 22px;
                  background:rgba(66,5,12,.82);
                  color:#ffe0d4;
                  font-size:1.4rem;
                  font-weight:900;
                  letter-spacing:.18em;
                  text-shadow:
                    0 2px 3px rgba(0,0,0,.9);
                  box-shadow:
                    0 0 0 3px rgba(66,5,12,.55),
                    0 8px 24px rgba(0,0,0,.5);
                "
              >
                REASSIGNED
              </div>

            </div>
          `
        : ''
    }


    <div class="npc-card-image">

              ${getNpcImageMarkup(npc)}

              <div
                class="npc-relationship npc-relationship-${peopleEscapeHtml(
                  relationship.toLowerCase()
                )}"
              >
                ${peopleEscapeHtml(relationship)}
              </div>

            </div>



            <div class="npc-card-body">


              <div class="npc-card-heading">


                <div>

                  <div class="npc-name">
                    ${peopleEscapeHtml(
                      getNpcDisplayName(npc)
                    )}
                  </div>


                  ${
                    npc.title
                      ? `
                          <div class="npc-title">
                            ${peopleEscapeHtml(
                              npc.title
                            )}
                          </div>
                        `
                      : ''
                  }

                </div>



                <button class="epcot-favorite-button" type="button" data-npc-action="favorite" data-npc-id="${npc.id}" aria-pressed="${playerFavorites().has(String(npc.id))}">${playerFavorites().has(String(npc.id))?'★':'☆'} Favorite</button>


              </div>



              <div class="npc-tags">


                ${
                  npc.company_association
                    ? `
                        <span>
                          ${peopleEscapeHtml(
                            npc.company_association
                          )}
                        </span>
                      `
                    : ''
                }


                ${
                  npc.magic_domain
                    ? `
                        <span>
                          ${peopleEscapeHtml(
                            npc.magic_domain
                          )}
                        </span>
                      `
                    : ''
                }


                ${
                  npc.neighborhood
                    ? `
                        <span>
                          ${peopleEscapeHtml(
                            window.epcotPersonnelTools.neighborhood(npc.neighborhood)
                          )}
                        </span>
                      `
                    : ''
                }


              </div>



              <div class="npc-training">


                <div class="npc-small-heading">
                  Skill Training
                </div>


                <div class="npc-training-list">

                  ${
                    skills.length

                      ? skills.map(
                          skill => `
                            <span>
                              ${peopleEscapeHtml(skill)}
                            </span>
                          `
                        ).join('')

                      : `
                          <span class="npc-none">
                            No training assigned.
                          </span>
                        `
                  }

                </div>


              </div>



              <div class="npc-details">


                <div class="npc-small-heading">
                  What We Know
                </div>


                <div class="npc-details-copy">

                  ${
                    state?.details

                      ? sanitizeNpcNotes(
                          state.details
                        )

                      : 'No notes yet.'
                  }

                </div>
                <button class="npc-details-button" type="button" data-npc-action="note" data-npc-id="${peopleEscapeHtml(npc.id)}">Edit Notes</button>


                


              </div>


            </div>


          </article>

        `;

      }

    ).join('');

}


/* =====================================================
   SELECT OPTIONS
   ===================================================== */

async function loadPeople(
  showLoading = true
){

  const grid =
    peopleById(
      'npcGrid'
    );


  if(!grid){
    return;
  }


  if(peopleLoadBusy)return;
  peopleLoadBusy=true;

  if(showLoading){

    grid.innerHTML = `
      <div class="people-loading">
        Loading Personnel...
      </div>
    `;

  }


  try{

    const campaign =
      getCurrentCampaign();


npcCampaignStates =
  await supabaseGet(
    `npc_campaign_state?select=id,npc_id,campaign,details,relationship_tag,relationship_score,is_visible,favorite_account_ids&campaign=eq.${campaign}&is_visible=eq.true`
  );


    await importPlayerFavorites();
    playerNoteEditor?.refresh();

    const npcIds =
      npcCampaignStates
        .map(
          state =>
            state.npc_id
        )
        .filter(Boolean);


    if(!npcIds.length){

      npcRecords = [];

      renderPeople();

      return;

    }


    /*
      PostgREST "in" filter.
      UUIDs do not require quotes here.
    */

    const idFilter =
      npcIds.join(',');


    npcRecords =
      await supabaseGet(
        `npcs?select=*&id=in.(${idFilter})&order=name_cast.asc`
      );


    renderPeople();

  }
  catch(error){

    if(!showLoading){console.warn("Personnel refresh failed",error);return;}
    showPeopleError(
      'Personnel could not be loaded.',
      error
    );


    grid.innerHTML = `
      <div class="people-empty-state">

        <strong>
          Personnel could not be loaded.
        </strong>

        <p>
          ${peopleEscapeHtml(
            error.message
          )}
        </p>

      </div>
    `;

  }finally{peopleLoadBusy=false;}

}


/* =====================================================
   RICH TEXT TOOLBAR
   ===================================================== */

function openPlayerNpcNote(npcId){
 const npc=npcRecords.find(n=>String(n.id)===String(npcId)),state=getNpcCampaignState(npcId),campaign=getCurrentCampaign();if(!npc||!state?.is_visible||playerNoteEditor)return;
 const dialog=document.createElement('dialog');dialog.className='epcot-note-dialog';
 dialog.innerHTML=`<h3>Shared Personnel Notes</h3><p>${peopleEscapeHtml(getNpcDisplayName(npc))} · ${peopleEscapeHtml(campaign.toUpperCase())}</p><p>Everyone in this campaign shares these notes. Edit, add, or remove any text, then save to sync.</p><div class="epcot-note-toolbar" aria-label="Formatting"><button type="button" data-format="bold"><b>B</b></button> <button type="button" data-format="italic"><i>I</i></button> <button type="button" data-format="insertUnorderedList">• List</button></div><div data-note-editor class="epcot-note-editor" contenteditable="true" role="textbox" aria-multiline="true" aria-label="Campaign notes"></div><p data-note-status role="status"></p><div><button type="button" data-note-save>Save Changes</button> <button type="button" data-note-clear>Clear Notes</button> <button type="button" data-note-reload>Reload Latest</button> <button type="button" data-note-close>Close</button></div>`;
 document.body.append(dialog);const q=x=>dialog.querySelector(x),editor=q('[data-note-editor]'),save=q('[data-note-save]'),close=q('[data-note-close]'),status=q('[data-note-status]'),reload=q('[data-note-reload]'),clear=q('[data-note-clear]');let base=state.details??'',initial='',busy=false,conflict=false;
 function dirty(){return sanitizeNpcNotes(editor.innerHTML)!==initial;}
 function setBase(value){base=value??'';editor.innerHTML=sanitizeNpcNotes(base);initial=sanitizeNpcNotes(editor.innerHTML);conflict=false;status.textContent='Up to date.';save.disabled=true;}
 function refresh(){if(busy)return;const current=getNpcCampaignState(npcId);if(!current?.is_visible){conflict=true;save.disabled=true;status.textContent='This Personnel File is no longer visible.';return;}if((current.details??'')!==base){if(dirty()){conflict=true;save.disabled=true;status.textContent='Someone changed these notes. Copy your draft if needed, then Reload Latest to merge your changes.';}else setBase(current.details);}}
 playerNoteEditor={refresh};setBase(base);dialog.addEventListener('close',()=>{playerNoteEditor=null;dialog.remove();},{once:true});
 editor.addEventListener('input',()=>{save.disabled=busy||conflict||!dirty();if(!conflict)status.textContent=dirty()?'Unsaved changes.':'Up to date.';});
 editor.addEventListener('paste',e=>{e.preventDefault();document.execCommand('insertText',false,e.clipboardData.getData('text/plain'));});
 dialog.querySelectorAll('[data-format]').forEach(b=>{b.onmousedown=e=>e.preventDefault();b.onclick=()=>{editor.focus();document.execCommand(b.dataset.format,false,null);editor.dispatchEvent(new Event('input'));};});
 clear.onclick=()=>{if(!busy&&confirm('Clear the shared notes for this campaign? Save Changes to publish.')){editor.innerHTML='';editor.dispatchEvent(new Event('input'));}};
 function canClose(){return !busy&&(!dirty()||confirm('Discard unsaved changes?'));}close.onclick=()=>{if(canClose())dialog.close();};dialog.addEventListener('cancel',e=>{if(!canClose())e.preventDefault();});
 const fetchLatest=async()=>{const {data,error}=await window.epcotAuth.client.from('npc_campaign_state').select('details,is_visible').eq('id',state.id).eq('npc_id',npcId).eq('campaign',campaign).eq('is_visible',true).maybeSingle();if(error)throw error;if(!data?.is_visible)throw Error('Personnel File is no longer visible.');return data;};
 reload.onclick=async()=>{if(busy||(dirty()&&!confirm('Discard your unsaved draft and load the latest shared notes?')))return;busy=true;editor.contentEditable='false';try{setBase((await fetchLatest()).details);}catch(e){status.textContent=e.message;}finally{busy=false;editor.contentEditable='true';save.disabled=conflict||!dirty();}};
 save.onclick=async()=>{if(busy||conflict||!dirty())return;busy=true;save.disabled=true;editor.contentEditable='false';try{
  const client=window.epcotAuth.client,latest=await fetchLatest();if((latest.details??'')!==base){conflict=true;throw Error('Someone changed the notes. Copy your draft if needed, then Reload Latest.');}
  const clean=sanitizeNpcNotes(editor.innerHTML),details=editor.textContent.trim()?clean:'';
  let query=client.from('npc_campaign_state').update({details}).eq('id',state.id).eq('npc_id',npcId).eq('campaign',campaign).eq('is_visible',true);query=latest.details===null?query.is('details',null):query.eq('details',latest.details);
  const {data,error}=await query.select('id');if(error)throw error;if(!data?.length){conflict=true;throw Error('Someone changed the notes. Your draft is preserved; reload before saving.');}
  const current=getNpcCampaignState(npcId);if(current)current.details=details;setBase(details);renderPeople();status.textContent='Saved and shared with your campaign.';schedulePeopleRealtimeRefresh();
 }catch(e){status.textContent=e.message;}finally{busy=false;editor.contentEditable='true';save.disabled=conflict||!dirty();}};
 dialog.showModal();editor.focus();
}

function connectPeopleGrid(){

  const grid =
    peopleById(
      'npcGrid'
    );


  if(!grid){
    return;
  }


  grid.addEventListener(
    'click',
    async event => {

      const button =
        event.target.closest(
          '[data-npc-action]'
        );


      if(!button){
        return;
      }


      const action =
        button.dataset.npcAction;


      const npcId =
        button.dataset.npcId;


      if(action==='note'){openPlayerNpcNote(npcId);return;}
      if(action==='favorite' && npcRecords.some(n=>String(n.id)===npcId&&npcIsVisible(n))){
        const state=getNpcCampaignState(npcId);if(button.disabled||!state)return;button.disabled=true;
        try{const tools=window.epcotPersonnelTools;const desired=!playerFavorites().has(npcId);const ids=await tools.setPlayerFavorite(state,desired);const current=getNpcCampaignState(npcId);if(current)current.favorite_account_ids=ids;try{tools.forgetLocal(getCurrentCampaign(),npcId);}catch{}renderPeople();schedulePeopleRealtimeRefresh();}catch(e){alert('Favorite could not be saved: '+e.message);}finally{button.disabled=false;}
      }

    }
  );

}


/* =====================================================
   EDITOR EVENTS
   ===================================================== */

function schedulePeopleRealtimeRefresh(){

  clearTimeout(
    peopleRealtimeRefreshTimer
  );


  peopleRealtimeRefreshTimer =
    setTimeout(
      () => {

        loadPeople(
          false
        );

      },
      150
    );

}


/* =====================================================
   REALTIME

   IMPORTANT:
   Use the authenticated client already created by
   auth.js instead of creating another GoTrue client.

   This avoids the duplicate-client warning we saw
   earlier.
   ===================================================== */

function connectPeopleRealtime(){

  const client =
    window.epcotAuth?.client;


  if(!client){

    console.warn(
      'Personnel Realtime could not start because the authenticated Supabase client is unavailable.'
    );

    return;

  }


  const campaign =
    getCurrentCampaign();


  if(peopleNpcChannel){

    client.removeChannel(
      peopleNpcChannel
    );

  }


  if(peopleCampaignChannel){

    client.removeChannel(
      peopleCampaignChannel
    );

  }


  peopleNpcChannel =
    client
      .channel(
        `personnel-records-${campaign}`
      )
      .on(
        'postgres_changes',
        {
          event:'*',
          schema:'public',
          table:'npcs'
        },
        schedulePeopleRealtimeRefresh
      )
      .subscribe(
        (
          status,
          error
        ) => {

          if(error){

            console.error(
              'Personnel record Realtime error:',
              error
            );

          }


          console.log(
            'Personnel Records Realtime:',
            status
          );

        }
      );


  peopleCampaignChannel =
    client
      .channel(
        `personnel-campaign-${campaign}`
      )
      .on(
        'postgres_changes',
        {
          event:'*',
          schema:'public',
          table:'npc_campaign_state',
          filter:
            `campaign=eq.${campaign}`
        },
        schedulePeopleRealtimeRefresh
      )
      .subscribe(
        (
          status,
          error
        ) => {

          if(error){

            console.error(
              'Personnel Campaign Realtime error:',
              error
            );

          }


          console.log(
            'Personnel Campaign Realtime:',
            status
          );

        }
      );

}


/* =====================================================
   INITIALIZE
   ===================================================== */

async function initializePeople(){

  if(
    !peopleById(
      'npcGrid'
    )
  ){

    return;
  }


  connectPeopleGrid();

  renderPlayerPersonnelFilters();


  await loadPeople(
    true
  );


  connectPeopleRealtime();
  setInterval(()=>{if(!document.hidden)loadPeople(false);},15000);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)loadPeople(false);});

}


/* =====================================================
   START
   ===================================================== */

if(
  document.readyState ===
  'loading'
){

  document.addEventListener(
    'DOMContentLoaded',
    initializePeople
  );

}
else{

  initializePeople();

}
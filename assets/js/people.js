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
  'Burns Gardens'
];


/* =====================================================
   STATE
   ===================================================== */

let npcRecords = [];

let npcCampaignStates = [];

let npcBeingEdited = null;

let peopleNpcChannel = null;

let peopleCampaignChannel = null;

let peopleRealtimeRefreshTimer = null;


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
        loading="lazy"
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
    .filter(Boolean)
    .slice(0,3);

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
    npcRecords.filter(
      npcIsVisible
    );


  if(!visibleNpcs.length){

    grid.innerHTML = `
      <div class="people-empty-state">

        <strong>
          No personnel discovered yet.
        </strong>

        <p>
          Add someone this campaign has met
          to begin the Personnel archive.
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



                <button
                  class="npc-edit-button"
                  type="button"
                  data-npc-action="edit"
                  data-npc-id="${npc.id}"
                >
                  Edit
                </button>


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
                            npc.neighborhood
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


                <button
                  class="npc-details-button"
                  type="button"
                  data-npc-action="details"
                  data-npc-id="${npc.id}"
                >
                  Edit Notes
                </button>


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

function makeOptions(
  values,
  selectedValue,
  placeholder
){

  return `
    <option value="">
      ${placeholder}
    </option>

    ${
      values.map(
        value => `
          <option
            value="${peopleEscapeHtml(value)}"
            ${
              value === selectedValue
                ? 'selected'
                : ''
            }
          >
            ${peopleEscapeHtml(value)}
          </option>
        `
      ).join('')
    }
  `;

}


/* =====================================================
   OPEN NEW NPC
   ===================================================== */

function openNewNpc(){

  npcBeingEdited =
    null;


  const title =
    peopleById(
      'npcEditorTitle'
    );


  if(title){

    title.textContent =
      'Add Personnel File';

  }


  fillNpcEditor(
    null
  );


  openPeopleModal(
    'npcEditorModal'
  );

}


/* =====================================================
   OPEN NPC EDITOR
   ===================================================== */

function openNpcEditor(
  npcId
){

  const npc =
    npcRecords.find(
      item =>
        item.id === npcId
    );


  if(!npc){
    return;
  }


  npcBeingEdited =
    npc;


  const title =
    peopleById(
      'npcEditorTitle'
    );


  if(title){

    title.textContent =
      'Edit Personnel File';

  }


  fillNpcEditor(
    npc
  );


  openPeopleModal(
    'npcEditorModal'
  );

}


/* =====================================================
   FILL NPC EDITOR
   ===================================================== */

function fillNpcEditor(npc){

  const castName =
    peopleById(
      'npcNameCast'
    );


  if(castName){

    castName.value =
      npc?.name_cast ||
      '';

  }


  const unboundName =
    peopleById(
      'npcNameUnbound'
    );


  if(unboundName){

    unboundName.value =
      npc?.name_unbound ||
      '';

  }


  const castImage =
    peopleById(
      'npcCastImageUrl'
    );


  if(castImage){

    castImage.value =
      npc?.cast_image_url ||
      '';

  }


  const unboundImage =
    peopleById(
      'npcUnboundImageUrl'
    );


  if(unboundImage){

    unboundImage.value =
      npc?.unbound_image_url ||
      '';

  }


  const title =
    peopleById(
      'npcTitle'
    );


  if(title){

    title.value =
      npc?.title ||
      '';

  }


  const company =
    peopleById(
      'npcCompany'
    );


  if(company){

    company.innerHTML =
      makeOptions(
        NPC_COMPANIES,
        npc?.company_association || '',
        'Choose company...'
      );

  }


  const domain =
    peopleById(
      'npcMagicDomain'
    );


  if(domain){

    domain.innerHTML =
      makeOptions(
        NPC_MAGIC_DOMAINS,
        npc?.magic_domain || '',
        'Choose Magic Domain...'
      );

  }


  const neighborhood =
    peopleById(
      'npcNeighborhood'
    );


  if(neighborhood){

    neighborhood.innerHTML =
      makeOptions(
        NPC_NEIGHBORHOODS,
        npc?.neighborhood || '',
        'Choose neighborhood...'
      );

  }

}


/* =====================================================
   SAVE NPC
   ===================================================== */

async function saveNpc(){

  const castName =
    peopleById(
      'npcNameCast'
    )?.value.trim();


  const unboundName =
    peopleById(
      'npcNameUnbound'
    )?.value.trim() ||
    '';


  if(!castName){

    alert(
      'Please enter the NPC’s Cast name.'
    );

    return;

  }


  const body = {

    name_cast:
      castName,

    name_unbound:
      unboundName || null,

    cast_image_url:
      peopleById(
        'npcCastImageUrl'
      )?.value.trim() ||
      null,

    unbound_image_url:
      peopleById(
        'npcUnboundImageUrl'
      )?.value.trim() ||
      null,

    company_association:
      peopleById(
        'npcCompany'
      )?.value ||
      null,

    title:
      peopleById(
        'npcTitle'
      )?.value.trim() ||
      null,

    magic_domain:
      peopleById(
        'npcMagicDomain'
      )?.value ||
      null,

    neighborhood:
      peopleById(
        'npcNeighborhood'
      )?.value ||
      null

  };


  try{

    if(npcBeingEdited){

      await supabasePatch(
        `npcs?id=eq.${npcBeingEdited.id}`,
        body
      );

    }
    else{

      const inserted =
        await supabasePost(
          'npcs',
          body
        );


      if(!inserted[0]){

        throw new Error(
          'Supabase did not return the new NPC.'
        );

      }


      const newNpc =
        inserted[0];


      /*
        The campaign-state row is what causes the
        NPC to become visible to THIS campaign.
      */

      await supabasePost(
        'npc_campaign_state',
        {

          npc_id:
            newNpc.id,

          campaign:
            getCurrentCampaign(),

          details:
            '',

          relationship_tag:
            'NEUTRAL'

        }
      );

    }


    closePeopleModal(
      'npcEditorModal'
    );


    npcBeingEdited =
      null;


    await loadPeople(
      false
    );

  }
  catch(error){

    showPeopleError(
      npcBeingEdited
        ? 'NPC could not be updated.'
        : 'NPC could not be added.',
      error
    );

  }

}


/* =====================================================
   DELETE NPC

   IMPORTANT:
   This still deletes the GLOBAL NPC.

   We will eventually reserve true global deletion
   for the DM interface.
   ===================================================== */

async function deleteNpc(){

  if(!npcBeingEdited){
    return;
  }


  const confirmed =
    confirm(
      `Delete ${getNpcDisplayName(npcBeingEdited)} completely?`
    );


  if(!confirmed){
    return;
  }


  try{

    await supabaseDelete(
      `npcs?id=eq.${npcBeingEdited.id}`
    );


    closePeopleModal(
      'npcEditorModal'
    );


    npcBeingEdited =
      null;


    await loadPeople(
      false
    );

  }
  catch(error){

    showPeopleError(
      'NPC could not be deleted.',
      error
    );

  }

}


/* =====================================================
   OPEN NPC DETAILS
   ===================================================== */

function openNpcDetails(
  npcId
){

  const npc =
    npcRecords.find(
      item =>
        item.id === npcId
    );


  if(!npc){
    return;
  }


  const state =
    getNpcCampaignState(
      npcId
    );


  const title =
    peopleById(
      'npcDetailsTitle'
    );


  if(title){

    title.textContent =
      getNpcDisplayName(
        npc
      );

  }


  const editor =
    peopleById(
      'npcDetailsText'
    );


  if(editor){

    editor.innerHTML =
      sanitizeNpcNotes(
        state?.details ||
        ''
      );

  }


  const modal =
    peopleById(
      'npcDetailsModal'
    );


  if(modal){

    modal.dataset.npcId =
      npcId;

  }


  openPeopleModal(
    'npcDetailsModal'
  );

}


/* =====================================================
   SAVE NPC DETAILS
   ===================================================== */

async function saveNpcDetails(){

  const modal =
    peopleById(
      'npcDetailsModal'
    );


  const npcId =
    modal?.dataset.npcId;


  if(!npcId){
    return;
  }


  const details =
    sanitizeNpcNotes(
      peopleById(
        'npcDetailsText'
      )?.innerHTML ||
      ''
    );


  const campaign =
    getCurrentCampaign();


  const state =
    getNpcCampaignState(
      npcId
    );


  try{

    if(state){

      await supabasePatch(
        `npc_campaign_state?id=eq.${state.id}`,
        {
          details
        }
      );

    }
    else{

      await supabasePost(
        'npc_campaign_state',
        {

          npc_id:
            npcId,

          campaign,

          details,

          relationship_tag:
            'NEUTRAL'

        }
      );

    }


    closePeopleModal(
      'npcDetailsModal'
    );


    await loadPeople(
      false
    );

  }
  catch(error){

    showPeopleError(
      'NPC notes could not be saved.',
      error
    );

  }

}


/* =====================================================
   LOAD PERSONNEL

   1. Load campaign-state rows FIRST.
   2. Those rows determine which NPCs this campaign knows.
   3. Load only the required NPC records.

   This means Hero does not render Villain-only NPCs,
   and Villain does not render Hero-only NPCs.
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
    `npc_campaign_state?select=id,npc_id,campaign,details,relationship_tag,relationship_score,is_visible&campaign=eq.${campaign}&is_visible=eq.true`
  );


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

  }

}


/* =====================================================
   RICH TEXT TOOLBAR
   ===================================================== */

function connectNpcNotesToolbar(){

  document
    .querySelectorAll(
      '[data-note-command]'
    )
    .forEach(
      button => {

        button.addEventListener(
          'click',
          () => {

            const editor =
              peopleById(
                'npcDetailsText'
              );


            if(!editor){
              return;
            }


            editor.focus();


            document.execCommand(
              button.dataset.noteCommand,
              false,
              null
            );

          }
        );

      }
    );

}


/* =====================================================
   MODAL HELPERS
   ===================================================== */

function openPeopleModal(id){

  const modal =
    peopleById(id);


  if(!modal){
    return;
  }


  modal.classList.add(
    'open'
  );


  modal.setAttribute(
    'aria-hidden',
    'false'
  );

}


function closePeopleModal(id){

  const modal =
    peopleById(id);


  if(!modal){
    return;
  }


  modal.classList.remove(
    'open'
  );


  modal.setAttribute(
    'aria-hidden',
    'true'
  );

}


/* =====================================================
   CARD EVENTS
   ===================================================== */

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
    event => {

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


      if(action === 'edit'){

        openNpcEditor(
          npcId
        );

      }


      if(action === 'details'){

        openNpcDetails(
          npcId
        );

      }

    }
  );

}


/* =====================================================
   EDITOR EVENTS
   ===================================================== */

function connectNpcEditor(){

  const add =
    peopleById(
      'addNpcButton'
    );


  if(add){

    add.addEventListener(
      'click',
      openNewNpc
    );

  }


  const save =
    peopleById(
      'saveNpcButton'
    );


  if(save){

    save.addEventListener(
      'click',
      saveNpc
    );

  }


  const cancel =
    peopleById(
      'cancelNpcButton'
    );


  if(cancel){

    cancel.addEventListener(
      'click',
      () => {

        npcBeingEdited =
          null;


        closePeopleModal(
          'npcEditorModal'
        );

      }
    );

  }


  const remove =
    peopleById(
      'deleteNpcButton'
    );


  if(remove){

    remove.addEventListener(
      'click',
      deleteNpc
    );

  }

}


/* =====================================================
   DETAILS EVENTS
   ===================================================== */

function connectNpcDetails(){

  const save =
    peopleById(
      'saveNpcDetailsButton'
    );


  if(save){

    save.addEventListener(
      'click',
      saveNpcDetails
    );

  }


  const cancel =
    peopleById(
      'cancelNpcDetailsButton'
    );


  if(cancel){

    cancel.addEventListener(
      'click',
      () => {

        closePeopleModal(
          'npcDetailsModal'
        );

      }
    );

  }

}


/* =====================================================
   MODAL BACKDROPS
   ===================================================== */

function connectPeopleModalBackdrops(){

  [
    'npcEditorModal',
    'npcDetailsModal'
  ]
  .forEach(
    id => {

      const modal =
        peopleById(id);


      if(!modal){
        return;
      }


      modal.addEventListener(
        'click',
        event => {

          if(
            event.target === modal
          ){

            closePeopleModal(
              id
            );

          }

        }
      );

    }
  );

}


/* =====================================================
   REALTIME REFRESH
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

  connectNpcEditor();

  connectNpcDetails();

  connectNpcNotesToolbar();

  connectPeopleModalBackdrops();


  await loadPeople(
    true
  );


  connectPeopleRealtime();

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
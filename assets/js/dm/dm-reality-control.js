/* =====================================================
   EPCOT DND
   DM REALITY CONTROL
   ===================================================== */

let dmRealityPlayers = [];
let dmRealityStates = [];
let dmRealityCharacters = [];
let dmRealityCompanyFiles = [];


/* =====================================================
   HELPERS
   ===================================================== */

function dmRealityById(id){
  return document.getElementById(id);
}


function dmRealityEscape(value){

  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

}


function dmRealityClient(){

  return window.epcotAuth?.client || null;

}


function getDmRealityState(accountId){

  return dmRealityStates.find(
    row =>
      row.account_id === accountId
  ) || null;

}


function getDmRealityCharactersForAccount(
  accountId
){

  return dmRealityCharacters.filter(
    character =>
      character.account_id === accountId
  );

}


function getDmRealityCharacter(
  accountId,
  campaign
){

  return getDmRealityCharactersForAccount(
    accountId
  ).find(
    character =>
      character.campaign === campaign
  ) || null;

}


function getDmRealityCompanyFile(
  characterId
){

  return dmRealityCompanyFiles.find(
    file =>
      file.character_id === characterId
  ) || null;

}


/* =====================================================
   VISIBLE IDENTITY
   ===================================================== */

function getDmRealityVisibleName(
  characterId,
  reality = 'cast'
){

  if(!characterId){
    return 'Unassigned';
  }


  const file =
    getDmRealityCompanyFile(
      characterId
    );


  if(!file){
    return 'Unnamed Character';
  }


  if(
    reality === 'unbound'
  ){

    return (
      file.unbound_display_name ||
      file.display_name ||
      'Unnamed Character'
    );

  }


  return (
    file.display_name ||
    file.unbound_display_name ||
    'Unnamed Character'
  );

}


/* =====================================================
   LOAD PLAYERS
   ===================================================== */

async function loadDmRealityPlayers(){

  const client =
    dmRealityClient();


  const {
    data,
    error
  } =
    await client

      .from('accounts')

      .select(
        `
          id,
          username,
          display_name,
          role,
          active
        `
      )

      .eq('role', 'player')

      .eq('active', true)

      .order(
        'display_name',
        {
          ascending:true
        }
      );


  if(error){
    throw error;
  }


  dmRealityPlayers =
    data || [];

}


/* =====================================================
   LOAD CHARACTERS
   ===================================================== */

async function loadDmRealityCharacters(){

  const accountIds =
    dmRealityPlayers
      .map(player => player.id);


  if(!accountIds.length){

    dmRealityCharacters = [];

    return;

  }


  const {
    data,
    error
  } =
    await dmRealityClient()

      .from('characters')

      .select(
        `
          id,
          account_id,
          campaign
        `
      )

      .in(
        'account_id',
        accountIds
      );


  if(error){
    throw error;
  }


  dmRealityCharacters =
    data || [];

}


/* =====================================================
   LOAD REALITY STATES
   ===================================================== */

async function loadDmRealityStates(){

  const {
    data,
    error
  } =
    await dmRealityClient()

      .from('player_reality_state')

      .select(
        `
          account_id,
          campaign,
          reality,
          free_access,
          updated_at
        `
      );


  if(error){
    throw error;
  }


  dmRealityStates =
    data || [];

}


/* =====================================================
   LOAD COMPANY FILE IDENTITIES
   ===================================================== */

async function loadDmRealityCompanyFiles(){

  const characterIds =
    dmRealityCharacters
      .map(character => character.id);


  if(!characterIds.length){

    dmRealityCompanyFiles = [];

    return;

  }


  const {
    data,
    error
  } =
    await dmRealityClient()

      .from('company_files')

      .select(
        `
          character_id,
          display_name,
          unbound_display_name,
          image_url,
          unbound_image_url
        `
      )

      .in(
        'character_id',
        characterIds
      );


  if(error){
    throw error;
  }


  dmRealityCompanyFiles =
    data || [];

}


/* =====================================================
   CREATE MISSING REALITY STATES
   ===================================================== */

async function ensureDmRealityStates(){

  const existingIds =
    new Set(
      dmRealityStates.map(
        state =>
          state.account_id
      )
    );


  const missing =
    dmRealityPlayers.filter(
      player =>
        !existingIds.has(
          player.id
        )
    );


  if(!missing.length){
    return;
  }


  const rows =
    missing.map(
      player => ({

        account_id:
          player.id,

        campaign:
          'hero',

        reality:
          'cast',

        free_access:
          false

      })
    );


  const {
    error
  } =
    await dmRealityClient()

      .from('player_reality_state')

      .insert(rows);


  if(error){
    throw error;
  }


  await loadDmRealityStates();

}


/* =====================================================
   CURRENT CHARACTER LABEL
   ===================================================== */

function getDmRealityCharacterLabel(
  player
){

  const state =
    getDmRealityState(
      player.id
    );


  if(!state){
    return 'Unassigned';
  }


  if(state.free_access){

    return 'All Four Sheets Available';

  }


  const character =
    getDmRealityCharacter(
      player.id,
      state.campaign
    );


  return getDmRealityVisibleName(
    character?.id,
    state.reality
  );

}


/* =====================================================
   DISPLAY STATE
   ===================================================== */

function getDmRealityDisplayState(
  state
){

  if(!state){
    return 'UNASSIGNED';
  }


  if(state.free_access){
    return 'FREE ACCESS';
  }


  const campaign =
    state.campaign === 'villain'
      ? 'VILLAIN'
      : 'HERO';


  const reality =
    state.reality === 'unbound'
      ? 'UNBOUND'
      : 'CAST';


  return `${campaign} // ${reality}`;

}


/* =====================================================
   UPDATE REALITY STATE
   ===================================================== */

async function updateDmRealityState(
  accountId,
  changes
){

  const {
    data,
    error
  } =
    await dmRealityClient()

      .from('player_reality_state')

      .update(changes)

      .eq(
        'account_id',
        accountId
      )

      .select(
        `
          account_id,
          campaign,
          reality,
          free_access,
          updated_at
        `
      )

      .single();


  if(error){
    throw error;
  }


  const index =
    dmRealityStates.findIndex(
      state =>
        state.account_id ===
        accountId
    );


  if(index >= 0){

    dmRealityStates[index] =
      data;

  }
  else{

    dmRealityStates.push(
      data
    );

  }


  renderDmRealityControl();


  document.dispatchEvent(
    new CustomEvent(
      'epcot:dm-reality-changed',
      {
        detail:{
          accountId,
          state:data
        }
      }
    )
  );

}


/* =====================================================
   BUSY STATE
   ===================================================== */

function setDmRealityBusy(
  accountId,
  busy
){

  document
    .querySelectorAll(
      `[data-reality-account="${accountId}"]`
    )
    .forEach(
      element => {

        element.disabled =
          busy;

      }
    );

}


/* =====================================================
   CAMPAIGN LEVER
   ===================================================== */

async function handleDmCampaignToggle(
  accountId
){

  const state =
    getDmRealityState(
      accountId
    );


  if(
    !state ||
    state.free_access
  ){
    return;
  }


  const campaign =
    state.campaign === 'villain'
      ? 'hero'
      : 'villain';


  setDmRealityBusy(
    accountId,
    true
  );


  try{

    await updateDmRealityState(
      accountId,
      { campaign }
    );

  }
  catch(error){

    console.error(
      'Campaign update failed:',
      error
    );


    alert(
      'VistaCorp could not update this Explorer campaign.'
    );


    renderDmRealityControl();

  }

}


/* =====================================================
   REALITY LEVER
   ===================================================== */

async function handleDmRealityToggle(
  accountId
){

  const state =
    getDmRealityState(
      accountId
    );


  if(
    !state ||
    state.free_access
  ){
    return;
  }


  const reality =
    state.reality === 'unbound'
      ? 'cast'
      : 'unbound';


  setDmRealityBusy(
    accountId,
    true
  );


  try{

    await updateDmRealityState(
      accountId,
      { reality }
    );

  }
  catch(error){

    console.error(
      'Reality update failed:',
      error
    );


    alert(
      'VistaCorp could not update this Explorer reality.'
    );


    renderDmRealityControl();

  }

}


/* =====================================================
   ACCESS LEVER
   ===================================================== */

async function handleDmAccessToggle(
  accountId
){

  const state =
    getDmRealityState(
      accountId
    );


  if(!state){
    return;
  }


  setDmRealityBusy(
    accountId,
    true
  );


  try{

    await updateDmRealityState(
      accountId,
      {
        free_access:
          !state.free_access
      }
    );

  }
  catch(error){

    console.error(
      'Access update failed:',
      error
    );


    alert(
      'VistaCorp could not update Explorer access.'
    );


    renderDmRealityControl();

  }

}


/* =====================================================
   LEVER MARKUP
   ===================================================== */

function renderDmRealityLever({
  accountId,
  type,
  topLabel,
  bottomLabel,
  down,
  disabled = false,
  title = ''
}){

  return `

    <button
      class="
        dm-control-lever
        ${down ? 'is-down' : 'is-up'}
        ${disabled ? 'is-disabled' : ''}
      "
      type="button"
      data-reality-account="${accountId}"
      data-reality-action="${type}"
      ${disabled ? 'disabled' : ''}
      title="${dmRealityEscape(title)}"
    >

      <span
        class="
          dm-control-lever-option
          dm-control-lever-option-top
          ${!down ? 'is-selected' : ''}
        "
      >
        ${dmRealityEscape(topLabel)}
      </span>


      <span class="dm-control-lever-machine">

        <span class="dm-control-lever-slot"></span>

        <span class="dm-control-lever-arm">

          <span class="dm-control-lever-knob"></span>

        </span>

        <span class="dm-control-lever-screw top"></span>

        <span class="dm-control-lever-screw bottom"></span>

      </span>


      <span
        class="
          dm-control-lever-option
          dm-control-lever-option-bottom
          ${down ? 'is-selected' : ''}
        "
      >
        ${dmRealityEscape(bottomLabel)}
      </span>

    </button>

  `;

}


/* =====================================================
   EMPTY STATE
   ===================================================== */

function renderDmRealityEmpty(
  mount
){

  mount.innerHTML = `

    <header class="dm-panel-header">

      <div>

        <h2 class="dm-panel-title">
          Reality Control
        </h2>

        <div class="dm-panel-subtitle">
          Perception Is Policy
        </div>

      </div>


      <div class="dm-panel-status">
        No Explorers Registered
      </div>

    </header>


    <div class="dm-module-loading">
      No active Explorer accounts have been registered.
    </div>

  `;

}


/* =====================================================
   RENDER
   ===================================================== */

function renderDmRealityControl(){

  const mount =
    dmRealityById(
      'dmRealityControlMount'
    );


  if(!mount){
    return;
  }


  if(!dmRealityPlayers.length){

    renderDmRealityEmpty(
      mount
    );

    return;

  }


  const rows =
    dmRealityPlayers

      .map(
        player => {

          const state =
            getDmRealityState(
              player.id
            );


          const hero =
            getDmRealityCharacter(
              player.id,
              'hero'
            );


          const villain =
            getDmRealityCharacter(
              player.id,
              'villain'
            );


          const heroCast =
            getDmRealityVisibleName(
              hero?.id,
              'cast'
            );


          const heroUnbound =
            getDmRealityVisibleName(
              hero?.id,
              'unbound'
            );


          const villainCast =
            getDmRealityVisibleName(
              villain?.id,
              'cast'
            );


          const villainUnbound =
            getDmRealityVisibleName(
              villain?.id,
              'unbound'
            );


          const initials =
            String(
              player.display_name ||
              player.username ||
              '?'
            )
              .split(/\s+/)
              .map(
                part =>
                  part.charAt(0)
              )
              .join('')
              .slice(0, 2)
              .toUpperCase();


          const accessFree =
            Boolean(
              state?.free_access
            );


          return `

            <tr class="dm-reality-main-row">

              <td>

                <div class="dm-explorer-cell">

                  <div class="dm-explorer-avatar">
                    ${dmRealityEscape(initials)}
                  </div>


                  <div>

                    <strong>
                      ${dmRealityEscape(
                        player.display_name
                      )}
                    </strong>


                    <div class="dm-reality-character-name">

                      ${dmRealityEscape(
                        getDmRealityCharacterLabel(
                          player
                        )
                      )}

                    </div>

                  </div>

                </div>

              </td>


              <td>

                <div
                  class="
                    dm-reality-state-display
                    ${
                      state?.campaign === 'villain'
                        ? 'villain'
                        : 'hero'
                    }
                    ${
                      accessFree
                        ? 'free'
                        : ''
                    }
                  "
                >

                  <span class="dm-reality-state-label">
                    Broadcasting
                  </span>


                  <strong>

                    ${dmRealityEscape(
                      getDmRealityDisplayState(
                        state
                      )
                    )}

                  </strong>

                </div>

              </td>


              <td>

                ${renderDmRealityLever({

                  accountId:
                    player.id,

                  type:
                    'campaign',

                  topLabel:
                    'Hero',

                  bottomLabel:
                    'Villain',

                  down:
                    state?.campaign ===
                    'villain',

                  disabled:
                    accessFree,

                  title:
                    accessFree
                      ? 'Campaign is player-controlled during Free Access'
                      : 'Pull lever to change Hero / Villain'

                })}

              </td>


              <td>

                ${renderDmRealityLever({

                  accountId:
                    player.id,

                  type:
                    'reality',

                  topLabel:
                    'Cast',

                  bottomLabel:
                    'Unbound',

                  down:
                    state?.reality ===
                    'unbound',

                  disabled:
                    accessFree,

                  title:
                    accessFree
                      ? 'Reality is player-controlled during Free Access'
                      : 'Pull lever to change Cast / Unbound'

                })}

              </td>


              <td>

                ${renderDmRealityLever({

                  accountId:
                    player.id,

                  type:
                    'access',

                  topLabel:
                    'Controlled',

                  bottomLabel:
                    'Free',

                  down:
                    accessFree,

                  title:
                    accessFree
                      ? 'Pull lever to restore DM control'
                      : 'Pull lever to give access to all four sheets'

                })}

              </td>


              <td>

                <div class="dm-reality-network-status">

                  <span
                    class="dm-reality-network-light"
                  ></span>

                  <strong>
                    SYNCED
                  </strong>

                </div>

              </td>

            </tr>


            <tr class="dm-reality-assignment-row">

              <td colspan="6">

                <span>
                  HERO //
                  ${dmRealityEscape(heroCast)}
                  ↔
                  ${dmRealityEscape(heroUnbound)}
                </span>


                <span>
                  VILLAIN //
                  ${dmRealityEscape(villainCast)}
                  ↔
                  ${dmRealityEscape(villainUnbound)}
                </span>

              </td>

            </tr>

          `;

        }
      )

      .join('');


  mount.innerHTML = `

    <header class="dm-panel-header">

      <div>

        <h2 class="dm-panel-title">
          Reality Control
        </h2>

        <div class="dm-panel-subtitle">
          Perception Is Policy
        </div>

      </div>


      <div class="dm-panel-status">

        ${dmRealityPlayers.length}

        Explorer${
          dmRealityPlayers.length === 1
            ? ''
            : 's'
        }

        Monitored

      </div>

    </header>


    <div class="dm-reality-table-wrap">

      <table class="dm-reality-table">

        <colgroup>

          <col class="dm-reality-col-explorer">

          <col class="dm-reality-col-state">

          <col class="dm-reality-col-control">

          <col class="dm-reality-col-control">

          <col class="dm-reality-col-access">

          <col class="dm-reality-col-status">

        </colgroup>


        <thead>

          <tr>

            <th>Explorer</th>

            <th>State</th>

            <th>Campaign</th>

            <th>Reality</th>

            <th>Access</th>

            <th>Status</th>

          </tr>

        </thead>


        <tbody>
          ${rows}
        </tbody>

      </table>

    </div>


    <div class="dm-panel-footer">

      <button
        type="button"
        id="dmRefreshRealityButton"
      >
        Refresh Reality Network →
      </button>

    </div>

  `;


  connectDmRealityControls();

}


/* =====================================================
   CONNECT CONTROLS
   ===================================================== */

function connectDmRealityControls(){

  document
    .querySelectorAll(
      '[data-reality-action="campaign"]'
    )
    .forEach(
      button => {

        button.addEventListener(
          'click',
          () => {

            handleDmCampaignToggle(
              button.dataset
                .realityAccount
            );

          }
        );

      }
    );


  document
    .querySelectorAll(
      '[data-reality-action="reality"]'
    )
    .forEach(
      button => {

        button.addEventListener(
          'click',
          () => {

            handleDmRealityToggle(
              button.dataset
                .realityAccount
            );

          }
        );

      }
    );


  document
    .querySelectorAll(
      '[data-reality-action="access"]'
    )
    .forEach(
      button => {

        button.addEventListener(
          'click',
          () => {

            handleDmAccessToggle(
              button.dataset
                .realityAccount
            );

          }
        );

      }
    );


  const refresh =
    dmRealityById(
      'dmRefreshRealityButton'
    );


  if(refresh){

    refresh.addEventListener(
      'click',
      loadAndRenderDmRealityControl
    );

  }

}


/* =====================================================
   LOAD EVERYTHING
   ===================================================== */

async function loadAndRenderDmRealityControl(){

  const mount =
    dmRealityById(
      'dmRealityControlMount'
    );


  if(!mount){
    return;
  }


  mount.innerHTML = `

    <div class="dm-module-loading">
      Scanning Explorer Reality States...
    </div>

  `;


  try{

    await Promise.all([

      loadDmRealityPlayers(),

      loadDmRealityStates()

    ]);


    await ensureDmRealityStates();


    await loadDmRealityCharacters();


    await loadDmRealityCompanyFiles();


    renderDmRealityControl();

  }
  catch(error){

    console.error(
      'Reality Control failed:',
      error
    );


    mount.innerHTML = `

      <header class="dm-panel-header">

        <div>

          <h2 class="dm-panel-title">
            Reality Control
          </h2>

          <div class="dm-panel-subtitle">
            Perception Network Error
          </div>

        </div>

      </header>


      <div class="dm-module-loading">

        VistaCorp could not load Reality Control.

        Check the browser console for details.

      </div>

    `;

  }

}


/* =====================================================
   INITIALIZE
   ===================================================== */

document.addEventListener(
  'epcot:dm-ready',
  loadAndRenderDmRealityControl
);
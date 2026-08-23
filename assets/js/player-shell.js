/* =====================================================
   EPCOT DND
   PLAYER SHELL
   ===================================================== */

const EPCOT_PLAYER_WORLD_ROUTES = {
  hero_cast: 'Hero Cast World.html',
  hero_unbound: 'Hero Unbound World.html',
  villain_cast: 'Villain Cast World.html',
  villain_unbound: 'Villain Unbound World.html'
};


let epcotPlayerProfile = null;
let epcotPlayerAssignments = null;
let epcotPlayerReality = null;
let epcotPlayerRealityChannel = null;
let epcotPlayerCharacter = null;


/* =====================================================
   PAGE HELPERS
   ===================================================== */

function getPlayerPageCampaign(){

  return String(
    document.body.dataset.campaign || ''
  ).toLowerCase();

}


function getPlayerPageReality(){

  return String(
    document.body.dataset.reality || ''
  ).toLowerCase();

}


function getPlayerRoute(
  campaign,
  reality
){

  return EPCOT_PLAYER_WORLD_ROUTES[
    `${campaign}_${reality}`
  ] || null;

}


/* =====================================================
   REDIRECTS
   ===================================================== */

function redirectPlayerToLogin(){

  window.location.href =
    'index.html';

}


function redirectDmToDashboard(){

  window.location.href =
    'DM Dashboard.html';

}


/* =====================================================
   PLAYER HEADER CONTROLS
   ===================================================== */

function installPlayerHeaderControls(){

  if(
    document.getElementById(
      'epcotPlayerHeaderControls'
    )
  ){
    return;
  }


  const header =
    document.querySelector(
      'header'
    );


  if(!header){
    return;
  }


  const style =
    document.createElement(
      'style'
    );


  style.id =
    'epcotPlayerHeaderControlStyles';


  style.textContent = `

#epcotPlayerHeaderControls{

  position:absolute;

  top:16px;
  right:18px;

  z-index:10000;

      display:flex;

      align-items:center;

      gap:8px;

      font-family:
        "Trebuchet MS",
        sans-serif;

    }


    #epcotPlayerHeaderControls button{

      appearance:none;

      min-height:34px;

      padding:
        0 13px;

      border:
        1px solid
        rgba(247,236,213,.38);

      border-radius:
        999px;

      background:
        rgba(5,20,30,.84);

      color:
        #f7ecd5;

      box-shadow:
        0 3px 10px
        rgba(0,0,0,.16);

      backdrop-filter:
        blur(7px);

      font:
        inherit;

      font-size:
        10px;

      font-weight:
        800;

      letter-spacing:
        .08em;

      text-transform:
        uppercase;

      cursor:pointer;

      transition:
        transform .16s ease,
        background .16s ease,
        border-color .16s ease;

    }


    #epcotPlayerHeaderControls button:hover{

      transform:
        translateY(-1px);

      background:
        rgba(7,58,85,.94);

      border-color:
        rgba(247,236,213,.7);

    }


    #epcotPlayerHeaderControls button:active{

      transform:
        translateY(0);

    }


    #epcotPlayerHeaderControls button:disabled{

      opacity:.55;

      cursor:default;

      transform:none;

    }


    #epcotRealitySwitcher{

      position:relative;

    }


    #epcotRealityMenu{

      position:absolute;

      top:calc(100% + 8px);
      right:0;

  z-index:10001;

      width:210px;

      padding:7px;

      border:
        1px solid
        rgba(247,236,213,.28);

      border-radius:
        12px;

      background:
        rgba(5,20,30,.97);

      box-shadow:
        0 12px 28px
        rgba(0,0,0,.3);

      backdrop-filter:
        blur(10px);

    }


    #epcotRealityMenu[hidden]{

      display:none !important;

    }


    #epcotRealityMenu button{

      display:block;

      width:100%;

      margin:0 0 5px;

      padding:
        10px 12px;

      border-radius:
        8px;

      text-align:left;

      box-shadow:none;

    }


    #epcotRealityMenu button:last-child{

      margin-bottom:0;

    }


    #epcotRealityMenu button.is-current{

      color:
        #efb84b;

      border-color:
        rgba(239,184,75,.7);

      background:
        rgba(239,184,75,.1);

    }

    header:has(#epcotPlayerHeaderControls){

  overflow:visible !important;

  z-index:9999 !important;

}

    #epcotRealityMenu button:disabled{

      opacity:.34;

    }


    @media(max-width:700px){

      #epcotPlayerHeaderControls{

        top:8px;
        right:8px;

      }


      #epcotPlayerHeaderControls button{

        min-height:30px;

        padding:
          0 10px;

        font-size:
          9px;

      }

    }

  `;


  document.head.appendChild(
    style
  );


  /*
    Make sure absolute positioning is anchored
    to the page's actual header.
  */

  const headerPosition =
    window.getComputedStyle(
      header
    ).position;


  if(
    headerPosition ===
    'static'
  ){

    header.style.position =
      'relative';

  }


  const controls =
    document.createElement(
      'div'
    );


  controls.id =
    'epcotPlayerHeaderControls';


  /*
    FREE ACCESS SWITCHER
  */

  const switcher =
    document.createElement(
      'div'
    );


  switcher.id =
    'epcotRealitySwitcher';


  switcher.hidden =
    true;


  const switchButton =
    document.createElement(
      'button'
    );


  switchButton.id =
    'epcotRealitySwitchButton';


  switchButton.type =
    'button';


  switchButton.textContent =
    'Change Reality';


  switchButton.setAttribute(
    'aria-expanded',
    'false'
  );


  const menu =
    document.createElement(
      'div'
    );


  menu.id =
    'epcotRealityMenu';


  menu.hidden =
    true;


  const realities = [

    {
      campaign:'hero',
      reality:'cast',
      label:'Hero // Cast'
    },

    {
      campaign:'hero',
      reality:'unbound',
      label:'Hero // Unbound'
    },

    {
      campaign:'villain',
      reality:'cast',
      label:'Villain // Cast'
    },

    {
      campaign:'villain',
      reality:'unbound',
      label:'Villain // Unbound'
    }

  ];


  realities.forEach(
    option => {

      const optionButton =
        document.createElement(
          'button'
        );


      optionButton.type =
        'button';


      optionButton.textContent =
        option.label;


      optionButton.dataset.campaign =
        option.campaign;


      optionButton.dataset.reality =
        option.reality;


      optionButton.addEventListener(
        'click',
        async () => {

          await switchPlayerReality(
            option.campaign,
            option.reality
          );

        }
      );


      menu.appendChild(
        optionButton
      );

    }
  );


  switchButton.addEventListener(
    'click',
    event => {

      event.stopPropagation();


      menu.hidden =
        !menu.hidden;


      switchButton.setAttribute(
        'aria-expanded',
        String(
          !menu.hidden
        )
      );

    }
  );


  switcher.append(
    switchButton,
    menu
  );


  /*
    LOGOUT
  */

  const logoutButton =
    document.createElement(
      'button'
    );


  logoutButton.id =
    'epcotPlayerLogoutButton';


  logoutButton.type =
    'button';


  logoutButton.textContent =
    'Log Out';


  logoutButton.addEventListener(
    'click',
    async () => {

      logoutButton.disabled =
        true;


      logoutButton.textContent =
        'Logging Out...';


      try{

        if(
          epcotPlayerRealityChannel &&
          window.epcotAuth?.client
        ){

          await window.epcotAuth.client
            .removeChannel(
              epcotPlayerRealityChannel
            );

        }


        sessionStorage.removeItem(
          'epcot-active-character-name'
        );


        sessionStorage.removeItem(
          'epcot-active-character-id'
        );


        await window.epcotAuth
          .logout();


        redirectPlayerToLogin();

      }
      catch(error){

        console.error(
          'Player logout failed:',
          error
        );


        logoutButton.disabled =
          false;


        logoutButton.textContent =
          'Log Out';

      }

    }
  );


  controls.append(
    switcher,
    logoutButton
  );


  header.appendChild(
    controls
  );


  document.addEventListener(
    'click',
    event => {

      if(
        !switcher.contains(
          event.target
        )
      ){

        menu.hidden =
          true;


        switchButton.setAttribute(
          'aria-expanded',
          'false'
        );

      }

    }
  );

}


/* =====================================================
   FREE ACCESS CONTROL
   ===================================================== */

function updatePlayerRealitySwitcher(){

  const switcher =
    document.getElementById(
      'epcotRealitySwitcher'
    );


  if(!switcher){
    return;
  }


  const enabled =
    epcotPlayerReality
      ?.free_access === true;


  switcher.hidden =
    !enabled;


  if(!enabled){
    return;
  }


  const buttons =
    switcher.querySelectorAll(
      '#epcotRealityMenu button'
    );


  buttons.forEach(
    button => {

      const campaign =
        button.dataset.campaign;


      const reality =
        button.dataset.reality;


      const isCurrent =
        campaign ===
          getPlayerPageCampaign()
        &&
        reality ===
          getPlayerPageReality();


      button.classList.toggle(
        'is-current',
        isCurrent
      );


      /*
  All four realities are now connected.
*/

button.disabled =
  false;

    }
  );

}


async function switchPlayerReality(
  campaign,
  reality
){

  if(
    !epcotPlayerReality
      ?.free_access
  ){
    return;
  }


  const route =
    getPlayerRoute(
      campaign,
      reality
    );


  if(!route){
    return;
  }


  const temporaryState = {

    ...epcotPlayerReality,

    campaign,
    reality

  };


  await applyPlayerIdentity(
    temporaryState
  );


  routePlayerToReality(
    temporaryState,
    true
  );

}

/* =====================================================
   REALITY TRANSITION
   ===================================================== */

function showRealityTransition(
  campaign,
  reality
){

  let overlay =
    document.getElementById(
      'epcotRealityTransition'
    );


  if(!overlay){

    overlay =
      document.createElement(
        'div'
      );


    overlay.id =
      'epcotRealityTransition';


    Object.assign(
      overlay.style,
      {
        position:'fixed',
        inset:'0',
        zIndex:'999999',
        display:'grid',
        placeItems:'center',
        background:'rgba(5,20,30,.96)',
        color:'#f7ecd5',
        fontFamily:'"Trebuchet MS", sans-serif',
        textAlign:'center',
        letterSpacing:'.12em',
        textTransform:'uppercase'
      }
    );


    document.body.appendChild(
      overlay
    );

  }


  const campaignLabel =
    campaign === 'villain'
      ? 'Villain'
      : 'Hero';


  const realityLabel =
    reality === 'unbound'
      ? 'Unbound'
      : 'Cast';


  overlay.innerHTML = `

    <div>

      <div
        style="
          font-size:11px;
          opacity:.65;
          margin-bottom:12px;
        "
      >
        World Discovery Network
      </div>

      <div
        style="
          font-size:22px;
          font-weight:800;
        "
      >
        Reality Assignment Updated
      </div>

      <div
        style="
          margin-top:12px;
          color:#efb84b;
          font-size:13px;
        "
      >
        ${campaignLabel} // ${realityLabel}
      </div>

    </div>

  `;

}


/* =====================================================
   ACTIVE CHARACTER
   ===================================================== */

function getActiveCharacterId(
  realityState
){

  if(
    !epcotPlayerAssignments ||
    !realityState
  ){
    return null;
  }


  if(
    realityState.campaign ===
    'villain'
  ){

    return (
      epcotPlayerAssignments
        .villain_character_id ||
      null
    );

  }


  return (
    epcotPlayerAssignments
      .hero_character_id ||
    null
  );

}


/* =====================================================
   LOAD CHARACTER + IDENTITY
   ===================================================== */

async function loadPlayerCharacter(
  characterId,
  reality
){

  if(!characterId){
    return null;
  }


  const {
    data,
    error
  } =
    await window.epcotAuth.client

      .from('characters')

      .select(
        `
          id,
          account_id,
          campaign,
          level,
          alignment,
          exhaustion,
          heroic_inspiration,
          dreamlight_die,
          heartline_die,
          mindwave_die,
          bravura_die,
          craftspark_die,
          starpath_die
        `
      )

      .eq(
        'id',
        characterId
      )

      .maybeSingle();


  if(error){
    throw error;
  }


  if(!data){
    return null;
  }


  const identity =
    await window.epcotAuth
      .getCharacterIdentity(
        characterId,
        reality
      );


  if(!identity){
    return null;
  }


  return {
    ...data,

    name:
      identity.name,

    image_url:
      identity.image_url,

    identity
  };

}


/* =====================================================
   APPLY PLAYER IDENTITY
   ===================================================== */

async function applyPlayerIdentity(
  realityState
){

  const characterId =
    getActiveCharacterId(
      realityState
    );


  if(!characterId){

    throw new Error(
      'No character is assigned for the active campaign.'
    );

  }


  const character =
    await loadPlayerCharacter(
      characterId,
      realityState.reality
    );


  if(!character){

    throw new Error(
      'The assigned character could not be loaded.'
    );

  }


  epcotPlayerCharacter =
    character;


  document.body.dataset.characterName =
    character.name;


  document.body.dataset.characterId =
    character.id;


  sessionStorage.setItem(
    'epcot-active-character-name',
    character.name
  );


  sessionStorage.setItem(
    'epcot-active-character-id',
    character.id
  );


  sessionStorage.setItem(
    'epcot-active-campaign',
    realityState.campaign
  );


  sessionStorage.setItem(
    'epcot-active-reality',
    realityState.reality
  );


  return character;

}


/* =====================================================
   PAGE MATCH
   ===================================================== */

function playerPageMatchesReality(
  state
){

  if(!state){
    return false;
  }


  return (
    getPlayerPageCampaign() ===
      state.campaign
    &&
    getPlayerPageReality() ===
      state.reality
  );

}


/* =====================================================
   ROUTING
   ===================================================== */

function routePlayerToReality(
  state,
  animate = false
){

  if(!state){
    return;
  }


  const route =
    getPlayerRoute(
      state.campaign,
      state.reality
    );


  if(!route){
    return;
  }


  if(animate){

    showRealityTransition(
      state.campaign,
      state.reality
    );


    window.setTimeout(
      () => {
        window.location.href =
          route;
      },
      650
    );


    return;

  }


  window.location.href =
    route;

}


/* =====================================================
   LIVE REALITY UPDATE
   ===================================================== */

async function handleLiveRealityUpdate(
  updatedState
){

  if(!updatedState){
    return;
  }


  const oldState =
    epcotPlayerReality;


  epcotPlayerReality =
    updatedState;


  if(
    updatedState.free_access
  ){
updatePlayerRealitySwitcher();
    document.dispatchEvent(
      new CustomEvent(
        'epcot:free-access-changed',
        {
          detail:{
            enabled:true,
            reality:updatedState
          }
        }
      )
    );


    return;

  }

updatePlayerRealitySwitcher();
  const changed =
    oldState?.campaign !==
      updatedState.campaign
    ||
    oldState?.reality !==
      updatedState.reality
    ||
    (
      oldState?.free_access === true &&
      updatedState.free_access === false
    );


  if(!changed){
    return;
  }


  await applyPlayerIdentity(
    updatedState
  );


  routePlayerToReality(
    updatedState,
    true
  );

}


/* =====================================================
   REALTIME
   ===================================================== */

function subscribeToPlayerReality(){

  const client =
    window.epcotAuth?.client;


  if(
    !client ||
    !epcotPlayerProfile
  ){
    return;
  }


  if(
    epcotPlayerRealityChannel
  ){

    client.removeChannel(
      epcotPlayerRealityChannel
    );

  }


  epcotPlayerRealityChannel =
    client

      .channel(
        `player-reality-${epcotPlayerProfile.id}`
      )

      .on(
        'postgres_changes',

        {
          event:'UPDATE',
          schema:'public',
          table:'player_reality_state',
          filter:
            `account_id=eq.${epcotPlayerProfile.id}`
        },

        payload => {

          handleLiveRealityUpdate(
            payload.new
          ).catch(
            error => {

              console.error(
                'Reality update failed:',
                error
              );

            }
          );

        }

      )

      .subscribe();

}


/* =====================================================
   PLAYER READY
   ===================================================== */

function dispatchPlayerReady(){

  document.dispatchEvent(
    new CustomEvent(
      'epcot:player-ready',
      {
        detail:{

          profile:
            epcotPlayerProfile,

          account:
            epcotPlayerProfile,

          assignments:
            epcotPlayerAssignments,

          reality:
            epcotPlayerReality,

          character:
            epcotPlayerCharacter,

          characterId:
            epcotPlayerCharacter?.id ||
            null,

          characterName:
            epcotPlayerCharacter?.name ||
            null

        }
      }
    )
  );

}


/* =====================================================
   INITIALIZE
   ===================================================== */

async function initializePlayerShell(){

  try{

    if(!window.epcotAuth){

      throw new Error(
        'EPCOT account system is unavailable.'
      );

    }


    epcotPlayerProfile =
      await window.epcotAuth
        .getCurrentAccount();


    if(!epcotPlayerProfile){

      redirectPlayerToLogin();
      return;

    }


    if(
      epcotPlayerProfile.role ===
      'dm'
    ){

      redirectDmToDashboard();
      return;

    }


    if(
      epcotPlayerProfile.role !==
        'player'
      ||
      epcotPlayerProfile.active !==
        true
    ){

      await window.epcotAuth.logout();

      redirectPlayerToLogin();
      return;

    }


    const [
      assignments,
      reality
    ] =
      await Promise.all([

        window.epcotAuth
          .getPlayerCharacters(
            epcotPlayerProfile.id
          ),

        window.epcotAuth
          .getRealityState(
            epcotPlayerProfile.id
          )

      ]);


    epcotPlayerAssignments =
      assignments;


    epcotPlayerReality =
      reality;


    if(!epcotPlayerAssignments){

      throw new Error(
        'Player characters could not be loaded.'
      );

    }


    if(!epcotPlayerReality){

      throw new Error(
        'Player Reality Control could not be loaded.'
      );

    }


/*
  When Free Access is OFF, use the DM-controlled
  campaign / reality.

  When Free Access is ON, the page the player actually
  opened determines which character identity should load.
*/

const activeRealityState =
  epcotPlayerReality.free_access

    ? {

        ...epcotPlayerReality,

        campaign:
          getPlayerPageCampaign(),

        reality:
          getPlayerPageReality()

      }

    : epcotPlayerReality;


await applyPlayerIdentity(
  activeRealityState
);


installPlayerHeaderControls();
updatePlayerRealitySwitcher();


if(
  !epcotPlayerReality.free_access
  &&
  !playerPageMatchesReality(
    epcotPlayerReality
  )
){

      routePlayerToReality(
        epcotPlayerReality
      );

      return;

    }


    subscribeToPlayerReality();

    dispatchPlayerReady();

  }
  catch(error){

    console.error(
      'Player shell failed:',
      error
    );


 installPlayerHeaderControls();
updatePlayerRealitySwitcher();


    alert(
      error?.message ||
      'Your World Discovery session could not be loaded.'
    );

  }

}


/* =====================================================
   PUBLIC API
   ===================================================== */

window.epcotPlayer = {

  getProfile(){
    return epcotPlayerProfile;
  },

  getAccount(){
    return epcotPlayerProfile;
  },

  getAssignments(){
    return epcotPlayerAssignments;
  },

  getReality(){
    return epcotPlayerReality;
  },

  getCharacter(){
    return epcotPlayerCharacter;
  },

  refreshIdentity:
    applyPlayerIdentity

};


/* =====================================================
   START
   ===================================================== */

if(
  document.readyState ===
  'loading'
){

  document.addEventListener(
    'DOMContentLoaded',
    initializePlayerShell
  );

}
else{

  initializePlayerShell();

}
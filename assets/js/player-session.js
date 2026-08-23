/* =====================================================
   EPCOT DND
   PLAYER SESSION + LIVE REALITY CONTROL

   Owns:
   - Verify player authentication
   - Verify assigned character
   - Protect player-world pages
   - Add permanent player logout control
   - Subscribe to DM Reality Control
   - Live-switch player when DM changes reality
   ===================================================== */


/* =====================================================
   ROUTES
   ===================================================== */

const EPCOT_PLAYER_WORLD_ROUTES = {

  hero_cast:
    'Hero Cast World.html',

  hero_unbound:
    'Hero Unbound World.html',

  villain_cast:
    'Villain Cast World.html',

  villain_unbound:
    'Villain Unbound World.html'

};


/* =====================================================
   STATE
   ===================================================== */

let epcotPlayerProfile = null;

let epcotPlayerAssignments = null;

let epcotPlayerReality = null;

let epcotPlayerRealityChannel = null;


/* =====================================================
   PAGE HELPERS
   ===================================================== */

function getPlayerPageCampaign(){

  return (
    document.body.dataset.campaign ||
    ''
  ).toLowerCase();

}


function getPlayerPageReality(){

  return (
    document.body.dataset.reality ||
    ''
  ).toLowerCase();

}


function playerRouteKey(
  campaign,
  reality
){

  return `${campaign}_${reality}`;

}


function getPlayerRoute(
  campaign,
  reality
){

  return (
    EPCOT_PLAYER_WORLD_ROUTES[
      playerRouteKey(
        campaign,
        reality
      )
    ] || null
  );

}


/* =====================================================
   LOGOUT CONTROL
   ===================================================== */

function installPlayerLogoutButton(){

  if(
    document.getElementById(
      'epcotPlayerLogoutButton'
    )
  ){

    return;

  }


  const button =
    document.createElement(
      'button'
    );


  button.id =
    'epcotPlayerLogoutButton';


  button.type =
    'button';


  button.textContent =
    'Log Out';


  button.setAttribute(
    'aria-label',
    'Log out of World Discovery'
  );


  /*
    Fixed positioning means we do not need to edit
    every Hero/Villain HTML file separately.
  */

  Object.assign(
    button.style,
    {

      position:
        'fixed',

      right:
        '18px',

      bottom:
        '58px',

      zIndex:
        '99990',

      minHeight:
        '34px',

      padding:
        '0 13px',

      border:
        '1px solid rgba(7,58,85,.28)',

      borderRadius:
        '999px',

      background:
        'rgba(247,236,213,.95)',

      color:
        '#073a55',

      boxShadow:
        '0 4px 12px rgba(7,58,85,.14)',

      fontFamily:
        '"Trebuchet MS", sans-serif',

      fontSize:
        '9px',

      fontWeight:
        '800',

      letterSpacing:
        '.10em',

      textTransform:
        'uppercase',

      cursor:
        'pointer'

    }
  );


  button.addEventListener(
    'click',
    async () => {

      button.disabled =
        true;


      button.textContent =
        'Logging Out...';


      try{

        /*
          Remove the Realtime subscription first.
        */

        if(
          epcotPlayerRealityChannel &&
          window.epcotAuth?.client
        ){

          await window.epcotAuth
            .client
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


        window.location.href =
          'index.html';

      }
      catch(error){

        console.error(
          'Player logout failed:',
          error
        );


        button.disabled =
          false;


        button.textContent =
          'Log Out';


        alert(
          'Could not log out. Please try again.'
        );

      }

    }
  );


  document.body.appendChild(
    button
  );

}


/* =====================================================
   REDIRECT HELPERS
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

        position:
          'fixed',

        inset:
          '0',

        zIndex:
          '999999',

        display:
          'grid',

        placeItems:
          'center',

        background:
          'rgba(5,20,30,.96)',

        color:
          '#f7ecd5',

        fontFamily:
          '"Trebuchet MS", sans-serif',

        textAlign:
          'center',

        letterSpacing:
          '.12em',

        textTransform:
          'uppercase'

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
          font-size:10px;
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
          font-size:12px;
        "
      >

        ${campaignLabel}
        //
        ${realityLabel}

      </div>

    </div>

  `;

}


/* =====================================================
   LOAD ASSIGNED CHARACTER
   ===================================================== */

async function getPlayerCharacter(
  characterId
){

  if(!characterId){
    return null;
  }


  const client =
    window.epcotAuth?.client;


  if(!client){
    return null;
  }


  const {
    data,
    error
  } =
    await client

      .from(
        'characters'
      )

      .select(
        'id, name, side'
      )

      .eq(
        'id',
        characterId
      )

      .maybeSingle();


  if(error){

    console.error(
      'Assigned character lookup failed:',
      error
    );

    return null;

  }


  return (
    data ||
    null
  );

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


  return (
    realityState.campaign ===
      'villain'

      ? epcotPlayerAssignments
          .villain_character_id

      : epcotPlayerAssignments
          .hero_character_id
  );

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
    await getPlayerCharacter(
      characterId
    );


  if(!character){

    throw new Error(
      'The assigned character could not be loaded.'
    );

  }


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


  return character;

}


/* =====================================================
   DOES THIS PAGE MATCH?
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
   ROUTE TO ASSIGNED WORLD
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

    console.error(
      'No player route exists for:',
      state
    );

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
      700
    );


    return;

  }


  window.location.href =
    route;

}


/* =====================================================
   HANDLE LIVE DM CHANGE
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


  /*
    FREE ACCESS means VistaCorp stops forcing
    automatic state changes.

    Player-side manual controls come later.
  */

  if(
    updatedState.free_access
  ){

    console.log(
      'VistaCorp Free Access enabled.'
    );

    return;

  }


  const campaignChanged =
    oldState?.campaign !==
      updatedState.campaign;


  const realityChanged =
    oldState?.reality !==
      updatedState.reality;


  const controlRestored =
    oldState?.free_access === true
    &&
    updatedState.free_access === false;


  if(
    campaignChanged ||
    realityChanged ||
    controlRestored
  ){

    try{

      await applyPlayerIdentity(
        updatedState
      );

    }
    catch(error){

      console.error(
        'Could not prepare new character identity:',
        error
      );

    }


    routePlayerToReality(
      updatedState,
      true
    );

  }

}


/* =====================================================
   REALTIME SUBSCRIPTION
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


  if(epcotPlayerRealityChannel){

    client.removeChannel(
      epcotPlayerRealityChannel
    );

  }


  epcotPlayerRealityChannel =
    client

      .channel(
        `player-reality-${epcotPlayerProfile.auth_user_id}`
      )

      .on(
        'postgres_changes',

        {

          event:
            'UPDATE',

          schema:
            'public',

          table:
            'player_reality_state',

          filter:
            `profile_id=eq.${epcotPlayerProfile.auth_user_id}`

        },

        payload => {

          console.log(
            'VistaCorp reality update received:',
            payload.new
          );


          handleLiveRealityUpdate(
            payload.new
          );

        }

      )

      .subscribe(
        (
          status,
          error
        ) => {

          if(
            status ===
            'SUBSCRIBED'
          ){

            console.log(
              'VistaCorp Reality Control LIVE.'
            );

          }


          if(error){

            console.error(
              'Reality subscription error:',
              error
            );

          }

        }
      );

}


/* =====================================================
   INITIALIZE PLAYER SESSION
   ===================================================== */

async function initializePlayerSession(){

  try{

    if(!window.epcotAuth){

      throw new Error(
        'EPCOT authentication is unavailable.'
      );

    }


    const user =
      await window.epcotAuth
        .getUser();


    if(!user){

      redirectPlayerToLogin();

      return;

    }


    epcotPlayerProfile =
      await window.epcotAuth
        .getProfile();


    if(!epcotPlayerProfile){

      redirectPlayerToLogin();

      return;

    }


    /*
      DM accounts never remain inside a player world.
    */

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
      !epcotPlayerProfile.active
    ){

      await window.epcotAuth
        .logout();


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
            epcotPlayerProfile.auth_user_id
          ),

        window.epcotAuth
          .getRealityState(
            epcotPlayerProfile.auth_user_id
          )

      ]);


    epcotPlayerAssignments =
      assignments;


    epcotPlayerReality =
      reality;


    if(
      !epcotPlayerAssignments ||
      !epcotPlayerReality
    ){

      throw new Error(
        'Player assignment information is incomplete.'
      );

    }


    await applyPlayerIdentity(
      epcotPlayerReality
    );


    /*
      Give the player a permanent escape hatch
      as soon as their session is valid.
    */

    installPlayerLogoutButton();


    /*
      If VistaCorp control is active, manually typing
      another world URL cannot bypass the DM assignment.
    */

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


    document.dispatchEvent(
      new CustomEvent(
        'epcot:player-ready',
        {

          detail:{

            profile:
              epcotPlayerProfile,

            assignments:
              epcotPlayerAssignments,

            reality:
              epcotPlayerReality,

            characterId:
              document.body.dataset
                .characterId,

            characterName:
              document.body.dataset
                .characterName

          }

        }
      )
    );

  }
  catch(error){

    console.error(
      'Player session failed:',
      error
    );


    /*
      If something goes wrong AFTER the user authenticated,
      still give them a way out instead of trapping them.
    */

    installPlayerLogoutButton();


    alert(
      error?.message ||
      'Your World Discovery session could not be verified.'
    );

  }

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
    initializePlayerSession
  );

}
else{

  initializePlayerSession();

}
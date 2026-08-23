/* =====================================================
   EPCOT DND
   HERO UNBOUND

   Owns:
   - Performance Record
   - D&D Beyond portal
   - Per-character portal storage
   - Hero Unbound navigation

   Shared engines:
   - player-shell.js
   - company-file.js
   - people.js
   - objectives.js
   - world.js
   - journal.js
   ===================================================== */


/* =====================================================
   ELEMENTS
   ===================================================== */

const unboundCharacterName =
  document.getElementById(
    'unboundCharacterName'
  );


const unboundPlayerName =
  document.getElementById(
    'unboundPlayerName'
  );


const sheetUrlInput =
  document.getElementById(
    'sheetUrl'
  );


const loadSheetButton =
  document.getElementById(
    'loadBtn'
  );


const clearSheetButton =
  document.getElementById(
    'clearBtn'
  );


const sheetFrame =
  document.getElementById(
    'sheetFrame'
  );


const heroSheetStatus =
  document.getElementById(
    'heroSheetStatus'
  );


const moduleNotice =
  document.getElementById(
    'unboundModuleNotice'
  );


const moduleNoticeTitle =
  document.getElementById(
    'unboundModuleNoticeTitle'
  );


const closeModuleNoticeButton =
  document.getElementById(
    'closeUnboundModuleNotice'
  );


/* =====================================================
   STATE
   ===================================================== */

let heroUnboundCharacter =
  null;


let heroUnboundProfile =
  null;


/* =====================================================
   VIEW HELPERS
   ===================================================== */

function getUnboundViews(){

  return Array.from(
    document.querySelectorAll(
      '[data-unbound-view]'
    )
  );

}


function getUnboundNavButtons(){

  return Array.from(
    document.querySelectorAll(
      '[data-unbound-nav]'
    )
  );

}


/* =====================================================
   OPEN VIEW
   ===================================================== */

function openHeroUnboundView(
  viewName
){

  getUnboundViews()
    .forEach(
      view => {

        view.hidden =
          view.dataset.unboundView !==
          viewName;

      }
    );


  getUnboundNavButtons()
    .forEach(
      button => {

        button.classList.toggle(
          'active',
          button.dataset.unboundNav ===
            viewName
        );

      }
    );


  if(moduleNotice){

    moduleNotice.hidden =
      true;

  }


  window.scrollTo({
    top:0,
    behavior:'smooth'
  });

}


/* =====================================================
   PERFORMANCE RECORD

   IMPORTANT:
   player-shell may provide only routing / assignment
   information.

   Before displaying or changing mechanical stats,
   Hero Unbound always loads the COMPLETE character row
   directly from Supabase.
   ===================================================== */


/* =====================================================
   PERFORMANCE LOADING STATE
   ===================================================== */

function setHeroUnboundPerformanceLoading(
  loading
){

  const level =
    document.getElementById(
      'unboundPerformanceLevel'
    );


  const alignment =
    document.getElementById(
      'unboundPerformanceAlignment'
    );


  const exhaustion =
    document.getElementById(
      'unboundPerformanceExhaustion'
    );


  const inspiration =
    document.getElementById(
      'unboundPerformanceInspiration'
    );


  if(loading){

    if(level){
      level.textContent = '...';
    }


    if(alignment){
      alignment.textContent = '...';
    }


    if(exhaustion){
      exhaustion.textContent = '...';
    }


    if(inspiration){
      inspiration.textContent = 'Loading...';
    }

  }


  document
    .querySelectorAll(
      '[data-unbound-stat]'
    )
    .forEach(
      button => {

        button.disabled =
          loading;

      }
    );


  const inspirationButton =
    document.getElementById(
      'unboundInspirationButton'
    );


  if(inspirationButton){

    inspirationButton.disabled =
      loading;

  }

}


/* =====================================================
   LOAD COMPLETE CHARACTER RECORD
   ===================================================== */

async function loadFullHeroUnboundCharacter(
  assignedCharacter
){

  const characterId =
    assignedCharacter?.id
    ||
    document.body.dataset.characterId;


  if(!characterId){

    throw new Error(
      'No assigned character ID was available.'
    );

  }


  const rows =
    await supabaseGet(
      `characters?select=*&id=eq.${encodeURIComponent(characterId)}&limit=1`
    );


  if(!rows.length){

    throw new Error(
      'The assigned Hero character could not be loaded.'
    );

  }


  heroUnboundCharacter =
    rows[0];


  document.body.dataset.characterId =
    heroUnboundCharacter.id;


  /*
    Keep the permanent technical character name
    available to older shared modules as a fallback.
  */

  document.body.dataset.characterName =
    heroUnboundCharacter.name ||
    '';

}


/* =====================================================
   RENDER PERFORMANCE
   ===================================================== */

function renderHeroUnboundPerformance(){

  if(!heroUnboundCharacter){
    return;
  }


  /*
    Do NOT use falsy fallbacks for database stats.

    A legitimate value of 0 must remain 0.
  */

  const level =
    Math.max(
      1,
      Number(
        heroUnboundCharacter.level ??
        1
      )
    );


  const alignment =
    Math.max(
      0,
      Number(
        heroUnboundCharacter.alignment ??
        0
      )
    );


  const exhaustion =
    Math.max(
      0,
      Math.min(
        6,
        Number(
          heroUnboundCharacter.exhaustion ??
          0
        )
      )
    );


  const inspiration =
    heroUnboundCharacter
      .heroic_inspiration === true;


  const levelElement =
    document.getElementById(
      'unboundPerformanceLevel'
    );


  if(levelElement){

    levelElement.textContent =
      String(level);

  }


  const alignmentElement =
    document.getElementById(
      'unboundPerformanceAlignment'
    );


  if(alignmentElement){

    alignmentElement.textContent =
      String(alignment);

  }


  const exhaustionElement =
    document.getElementById(
      'unboundPerformanceExhaustion'
    );


  if(exhaustionElement){

    exhaustionElement.textContent =
      Array.from(
        {length:6},
        (_,index) =>
          index < exhaustion
            ? '♥'
            : '♡'
      ).join(' ');

  }


  const inspirationElement =
    document.getElementById(
      'unboundPerformanceInspiration'
    );


  if(inspirationElement){

    inspirationElement.textContent =
      inspiration
        ? 'Inspired'
        : 'No Inspiration';

  }


  const inspirationButton =
    document.getElementById(
      'unboundInspirationButton'
    );


  if(inspirationButton){

    inspirationButton.textContent =
      inspiration
        ? 'Remove Inspiration'
        : 'Add Inspiration';

  }


  setHeroUnboundPerformanceLoading(
    false
  );

}


/* =====================================================
   SAVE PERFORMANCE STAT
   ===================================================== */

async function saveHeroUnboundStat(
  stat,
  value
){

  if(
    !heroUnboundCharacter?.id
  ){

    alert(
      'Your Performance Record is still loading.'
    );

    return;

  }


  try{

    /*
      Disable controls during the save so a rapid
      double-click cannot create conflicting updates.
    */

    document
      .querySelectorAll(
        '[data-unbound-stat]'
      )
      .forEach(
        button => {

          button.disabled =
            true;

        }
      );


    const inspirationButton =
      document.getElementById(
        'unboundInspirationButton'
      );


    if(inspirationButton){

      inspirationButton.disabled =
        true;

    }


    const updated =
      await supabasePatch(
        `characters?id=eq.${heroUnboundCharacter.id}`,
        {
          [stat]:
            value
        }
      );


    /*
      Prefer the actual row returned by Supabase.
    */

    if(updated[0]){

      heroUnboundCharacter =
        updated[0];

    }
    else{

      /*
        Fallback only if Supabase returns no representation.
      */

      heroUnboundCharacter = {

        ...heroUnboundCharacter,

        [stat]:
          value

      };

    }


    renderHeroUnboundPerformance();

  }
  catch(error){

    console.error(
      'Performance Record update failed:',
      error
    );


    alert(
      `Performance Record could not be updated.\n\n${error?.message || String(error)}`
    );


    /*
      Reload the database truth if a save fails.
    */

    try{

      await loadFullHeroUnboundCharacter(
        heroUnboundCharacter
      );


      renderHeroUnboundPerformance();

    }
    catch(reloadError){

      console.error(
        'Performance Record reload failed:',
        reloadError
      );

    }

  }

}


/* =====================================================
   STAT BUTTONS
   ===================================================== */

function connectHeroUnboundPerformance(){

  /*
    Buttons begin disabled until the complete
    character record has loaded.
  */

  setHeroUnboundPerformanceLoading(
    true
  );


  document
    .querySelectorAll(
      '[data-unbound-stat]'
    )
    .forEach(
      button => {

        button.addEventListener(
          'click',
          async () => {

            if(
              !heroUnboundCharacter?.id
            ){

              return;

            }


            const stat =
              button.dataset.unboundStat;


            const action =
              button.dataset.unboundStatAction;


            const direction =
              action === 'increase'
                ? 1
                : -1;


            /*
              At this point the value comes from the
              COMPLETE Supabase row, not an HTML default.
            */

            const current =
              Number(
                heroUnboundCharacter[
                  stat
                ] ??
                0
              );


            let next =
              current +
              direction;


            /* =============================
               STAT LIMITS
               ============================= */

            if(
              stat === 'level'
            ){

              next =
                Math.max(
                  1,
                  next
                );

            }


            if(
              stat === 'alignment'
            ){

              next =
                Math.max(
                  0,
                  next
                );

            }


            if(
              stat === 'exhaustion'
            ){

              next =
                Math.max(
                  0,
                  Math.min(
                    6,
                    next
                  )
                );

            }


            await saveHeroUnboundStat(
              stat,
              next
            );

          }
        );

      }
    );


  const inspirationButton =
    document.getElementById(
      'unboundInspirationButton'
    );


  inspirationButton
    ?.addEventListener(
      'click',
      async () => {

        if(
          !heroUnboundCharacter?.id
        ){

          return;

        }


        await saveHeroUnboundStat(
          'heroic_inspiration',
          !(
            heroUnboundCharacter
              .heroic_inspiration === true
          )
        );

      }
    );

}


/* =====================================================
   D&D BEYOND PORTAL

   The portal URL is stored in:
   characters.dndbeyond_url

   Supabase is now the source of truth.
   ===================================================== */


/* =====================================================
   EMPTY PORTAL
   ===================================================== */

function renderHeroUnboundEmpty(){

  if(!sheetFrame){
    return;
  }


  sheetFrame.innerHTML = `

    <div class="empty-state">

      <div class="empty-copy">

        <div class="empty-title">
          No Hero Sheet Loaded
        </div>


        <div class="empty-text">

          Add your D&D Beyond character link below
          to connect the Hero Sheet Portal.

        </div>

      </div>

    </div>

  `;


  if(heroSheetStatus){

    heroSheetStatus.textContent =
      'Portal Not Connected';

  }

}


/* =====================================================
   DISPLAY CHARACTER PORTAL
   ===================================================== */

function loadHeroUnboundSheet(
  url
){

  if(
    !url ||
    !sheetFrame
  ){

    return;

  }


  let parsedUrl;


  try{

    parsedUrl =
      new URL(
        url
      );

  }
  catch(error){

    alert(
      'Enter a valid character URL.'
    );

    return;

  }


  if(
    parsedUrl.protocol !== 'https:' &&
    parsedUrl.protocol !== 'http:'
  ){

    alert(
      'The character portal must use an HTTP or HTTPS link.'
    );

    return;

  }


  sheetFrame.innerHTML = `

    <iframe
      src="${parsedUrl.href}"
      title="D&D Beyond Hero Sheet"
      allow="fullscreen"
    ></iframe>

  `;


  if(heroSheetStatus){

    heroSheetStatus.textContent =
      'D&D Beyond // Connected';

  }

}


/* =====================================================
   RESTORE PORTAL FROM SUPABASE
   ===================================================== */

function restoreHeroUnboundSheet(){

  if(
    !heroUnboundCharacter
  ){

    return;

  }


  const savedUrl =
    heroUnboundCharacter
      .dndbeyond_url ||
    '';


  if(sheetUrlInput){

    sheetUrlInput.value =
      savedUrl;

  }


  if(!savedUrl){

    renderHeroUnboundEmpty();

    return;

  }


  loadHeroUnboundSheet(
    savedUrl
  );

}


/* =====================================================
   SAVE PORTAL TO SUPABASE
   ===================================================== */

async function saveHeroUnboundSheet(){

  if(
    !heroUnboundCharacter?.id
  ){

    alert(
      'Your character is still loading.'
    );

    return;

  }


  if(!sheetUrlInput){
    return;
  }


  const url =
    sheetUrlInput
      .value
      .trim();


  if(!url){

    alert(
      'Paste a D&D Beyond character URL first.'
    );

    return;

  }


  /*
    Validate before saving.
  */

  let parsedUrl;


  try{

    parsedUrl =
      new URL(
        url
      );

  }
  catch(error){

    alert(
      'Enter a valid character URL.'
    );

    return;

  }


  if(
    parsedUrl.protocol !== 'https:' &&
    parsedUrl.protocol !== 'http:'
  ){

    alert(
      'The character portal must use an HTTP or HTTPS link.'
    );

    return;

  }


  if(loadSheetButton){

    loadSheetButton.disabled =
      true;

    loadSheetButton.textContent =
      'Saving...';

  }


  try{

    const updated =
      await supabasePatch(
        `characters?id=eq.${heroUnboundCharacter.id}`,
        {
          dndbeyond_url:
            parsedUrl.href
        }
      );


    heroUnboundCharacter = {

      ...heroUnboundCharacter,

      ...(updated[0] || {
        dndbeyond_url:
          parsedUrl.href
      })

    };


    /*
      Normalize the visible URL to whatever
      Supabase now considers authoritative.
    */

    if(sheetUrlInput){

      sheetUrlInput.value =
        heroUnboundCharacter
          .dndbeyond_url ||
        parsedUrl.href;

    }


    loadHeroUnboundSheet(
      heroUnboundCharacter
        .dndbeyond_url ||
      parsedUrl.href
    );

  }
  catch(error){

    console.error(
      'D&D Beyond portal save failed:',
      error
    );


    alert(
      `The D&D Beyond link could not be saved.\n\n${error?.message || String(error)}`
    );

  }
  finally{

    if(loadSheetButton){

      loadSheetButton.disabled =
        false;

      loadSheetButton.textContent =
        'Open Portal';

    }

  }

}


/* =====================================================
   RELEASE PORTAL FROM SUPABASE
   ===================================================== */

async function clearHeroUnboundSheet(){

  if(
    !heroUnboundCharacter?.id
  ){

    return;

  }


  const confirmed =
    confirm(
      'Release the saved D&D Beyond portal for this character?'
    );


  if(!confirmed){
    return;
  }


  if(clearSheetButton){

    clearSheetButton.disabled =
      true;

    clearSheetButton.textContent =
      'Releasing...';

  }


  try{

    const updated =
      await supabasePatch(
        `characters?id=eq.${heroUnboundCharacter.id}`,
        {
          dndbeyond_url:
            null
        }
      );


    heroUnboundCharacter = {

      ...heroUnboundCharacter,

      ...(updated[0] || {
        dndbeyond_url:
          null
      })

    };


    if(sheetUrlInput){

      sheetUrlInput.value =
        '';

    }


    renderHeroUnboundEmpty();

  }
  catch(error){

    console.error(
      'D&D Beyond portal release failed:',
      error
    );


    alert(
      `The D&D Beyond link could not be released.\n\n${error?.message || String(error)}`
    );

  }
  finally{

    if(clearSheetButton){

      clearSheetButton.disabled =
        false;

      clearSheetButton.textContent =
        'Release';

    }

  }

}

/* =====================================================
   REALTIME UNBOUND PERFORMANCE RECORD

   Core Performance values and the D&D Beyond URL
   live in the same characters row as Cast.
   ===================================================== */

let heroUnboundRealtimeClient =
  null;

let heroUnboundRealtimeChannel =
  null;

let heroUnboundRealtimeTimer =
  null;


function connectHeroUnboundRealtime(){

  if(
    !heroUnboundCharacter ||
    !window.supabase ||
    !window.supabase.createClient
  ){

    return;

  }


  if(!heroUnboundRealtimeClient){

    heroUnboundRealtimeClient =
      window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
      );

  }


  if(heroUnboundRealtimeChannel){

    heroUnboundRealtimeClient
      .removeChannel(
        heroUnboundRealtimeChannel
      );

  }


  const characterId =
    heroUnboundCharacter.id;


  heroUnboundRealtimeChannel =
    heroUnboundRealtimeClient

      .channel(
        `hero-unbound-performance-${characterId}`
      )

      .on(
        'postgres_changes',
        {
          event:'UPDATE',
          schema:'public',
          table:'characters',
          filter:`id=eq.${characterId}`
        },
        () => {

          clearTimeout(
            heroUnboundRealtimeTimer
          );


          heroUnboundRealtimeTimer =
            setTimeout(
              async () => {

                try{

                  /*
                    Reload the authoritative row.
                  */

                  await loadFullHeroUnboundCharacter(
                    {
                      id:
                        characterId
                    }
                  );


                  /*
                    Update visible Performance stats.
                  */

                  renderHeroUnboundPerformance();


                  /*
                    Refresh the D&D Beyond URL/input/frame
                    from the new database value.
                  */

                  restoreHeroUnboundSheet();

                }
                catch(error){

                  console.error(
                    'Live Unbound Performance refresh failed:',
                    error
                  );

                }

              },
              150
            );

        }
      )

      .subscribe(
        (
          status,
          error
        ) => {

          console.log(
            'Hero Unbound Performance realtime status:',
            status
          );


          if(error){

            console.error(
              'Hero Unbound Performance realtime error:',
              error
            );

          }

        }
      );

}

/* =====================================================
   AUTHENTICATED PLAYER READY
   ===================================================== */

async function initializeHeroUnboundPlayer(
  event
){

  heroUnboundProfile =
    event.detail?.profile
    ||
    window.epcotPlayer?.getProfile()
    ||
    null;


  const assignedCharacter =
    event.detail?.character
    ||
    window.epcotPlayer?.getCharacter()
    ||
    null;


  setHeroUnboundPerformanceLoading(
    true
  );


  try{

    /*
      Critical step:

      Do not trust the lightweight player-shell
      character object for mechanical stats.

      Fetch the complete Supabase row.
    */

    await loadFullHeroUnboundCharacter(
      assignedCharacter
    );


    if(unboundCharacterName){

      unboundCharacterName.textContent =
        heroUnboundCharacter?.name
        ||
        'Unknown Hero';

    }


    if(unboundPlayerName){

      unboundPlayerName.textContent =
        heroUnboundProfile?.display_name

          ? `Explorer // ${heroUnboundProfile.display_name}`

          : 'Explorer Identity Verified';

    }


    /*
      Only now display actual mechanical values.
    */

renderHeroUnboundPerformance();


/*
  Portal key now also uses the confirmed
  character UUID.
*/

restoreHeroUnboundSheet();


/*
  Keep this active browser synchronized with
  DM Performance Record changes.
*/

connectHeroUnboundRealtime();

  }
  catch(error){

    console.error(
      'Hero Unbound character initialization failed:',
      error
    );


    alert(
      `Your Performance Record could not be loaded.\n\n${error?.message || String(error)}`
    );

  }

}

/* =====================================================
   NAVIGATION
   ===================================================== */

function connectHeroUnboundNavigation(){

  getUnboundNavButtons()
    .forEach(
      button => {

        button.addEventListener(
          'click',
          () => {

            const view =
              button.dataset.unboundNav;


            if(
  view === 'home' ||
  view === 'character' ||
  view === 'company-file' ||
  view === 'people' ||
  view === 'objectives' ||
  view === 'world' ||
  view === 'widgets' ||
  view === 'journal'
){

              openHeroUnboundView(
                view
              );

              return;

            }


            const labels = {};


            if(moduleNoticeTitle){

              moduleNoticeTitle.textContent =
                labels[view] ||
                'Module';

            }


            if(moduleNotice){

              moduleNotice.hidden =
                false;

            }

          }
        );

      }
    );

}


/* =====================================================
   CONNECT PORTAL
   ===================================================== */

function connectHeroUnboundPortal(){

  loadSheetButton
    ?.addEventListener(
      'click',
      saveHeroUnboundSheet
    );


  clearSheetButton
    ?.addEventListener(
      'click',
      clearHeroUnboundSheet
    );


  sheetUrlInput
    ?.addEventListener(
      'keydown',
      event => {

        if(
          event.key === 'Enter'
        ){

          event.preventDefault();

          saveHeroUnboundSheet();

        }

      }
    );

}


/* =====================================================
   CLOSE PLACEHOLDER
   ===================================================== */

closeModuleNoticeButton
  ?.addEventListener(
    'click',
    () => {

      if(moduleNotice){

        moduleNotice.hidden =
          true;

      }


      openHeroUnboundView(
        'character'
      );

    }
  );


/* =====================================================
   INITIALIZE
   ===================================================== */

connectHeroUnboundNavigation();

connectHeroUnboundPortal();

connectHeroUnboundPerformance();


document.addEventListener(
  'epcot:player-ready',
  initializeHeroUnboundPlayer
);


if(
  window.epcotPlayer?.getCharacter()
){

  initializeHeroUnboundPlayer({

    detail:{

      profile:
        window.epcotPlayer
          .getProfile(),

      character:
        window.epcotPlayer
          .getCharacter()

    }

  });

}

/* =====================================================
   DOWNTIME TICKET TRACKER
   UNBOUND PERFORMANCE RECORD

   Stored on:
   characters.downtime_tickets

   Because Cast and Unbound use the same campaign
   character ID, Tickets remain synchronized between
   the two realities.
   ===================================================== */

(function(){

  /* =====================================================
     INSERT TRACKER
     ===================================================== */

  function ensureUnboundTicketTracker(){

    if(
      document.getElementById(
        'unboundPerformanceTickets'
      )
    ){
      return;
    }


    const grid =
      document.querySelector(
        '#unboundCharacterView .performance-status-grid'
      );


    if(!grid){
      return;
    }


    const ticketCard =
      document.createElement(
        'article'
      );


    ticketCard.className =
      'performance-stat-card';


    ticketCard.innerHTML = `

      <div class="performance-stat-label">
        Tickets
      </div>


      <div class="performance-stat-controls">

        <button
          type="button"
          data-unbound-ticket-action="decrease"
          aria-label="Spend one Downtime Ticket"
        >
          −
        </button>


        <strong
          class="performance-stat-value"
          id="unboundPerformanceTickets"
        >
          0
        </strong>


        <button
          type="button"
          data-unbound-ticket-action="increase"
          aria-label="Add one Downtime Ticket"
        >
          +
        </button>

      </div>

    `;


    grid.appendChild(
      ticketCard
    );


    ticketCard
      .querySelectorAll(
        '[data-unbound-ticket-action]'
      )
      .forEach(
        button => {

          button.addEventListener(
            'click',
            async ()=>{

              if(
                !heroUnboundCharacter?.id
              ){
                return;
              }


              const direction =
                button.dataset
                  .unboundTicketAction ===
                'increase'
                  ? 1
                  : -1;


              const current =
                Math.max(
                  0,
                  Number(
                    heroUnboundCharacter
                      .downtime_tickets ??
                    0
                  )
                );


              const next =
                Math.max(
                  0,
                  current +
                  direction
                );


              if(
                next === current
              ){
                return;
              }


              await saveHeroUnboundStat(
                'downtime_tickets',
                next
              );


              renderUnboundTickets();

            }
          );

        }
      );


    renderUnboundTickets();

  }


  /* =====================================================
     RENDER
     ===================================================== */

  function renderUnboundTickets(){

    const value =
      document.getElementById(
        'unboundPerformanceTickets'
      );


    if(
      !value ||
      !heroUnboundCharacter
    ){
      return;
    }


    value.textContent =
      String(
        Math.max(
          0,
          Number(
            heroUnboundCharacter
              .downtime_tickets ??
            0
          )
        )
      );

  }


  /* =====================================================
     HOOK INTO EXISTING PERFORMANCE RENDER
     ===================================================== */

  const originalRenderHeroUnboundPerformance =
    renderHeroUnboundPerformance;


  renderHeroUnboundPerformance =
    function(){

      originalRenderHeroUnboundPerformance();


      ensureUnboundTicketTracker();


      renderUnboundTickets();

    };


  ensureUnboundTicketTracker();

})();
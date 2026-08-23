/* =====================================================
   EPCOT DND
   HOME MODULE

   Shared by player worlds.

   Owns Home dashboard rendering for:
   - Company File identity / badge
   - Explorer ID
   - Level / Cohort
   - Program Metrics
   - Favorite Objectives
   - Latest Journal posts
   - Stay Curious / Follow the Lights animation
   - Home realtime refreshes
   ===================================================== */


/* =====================================================
   STATE
   ===================================================== */

let homeCharacter = null;

let homeCompanyFile = null;

let homeObjectives = [];

let homeSubitems = [];

let homeFavorites = [];

let homeJournalPosts = [];

let homeRealtimeClient = null;

let homeRealtimeChannels = [];

let homeRefreshTimer = null;

let homeRefreshInFlight = false;

let homeRefreshQueued = false;

let homeControlsConnected = false;

let homeAnimationRunning = false;


/* =====================================================
   CONSTANTS
   ===================================================== */

const HOME_NEIGHBORHOOD_CODES = {

  'Anderson Ward':
    '1101',

  'Blair Quarter':
    '1102',

  'Davis Vista':
    '1103',

  'Ryman Fields':
    '1104',

  'Atencio Reach':
    '1105',

  'Toombs Gardens':
    '1106',

  'Gurr District':
    '1107',

  'Joerger Commons':
    '1108',

  'Chao Terrace':
    '1109',

  'Coats Line':
    '1110',

  'Gracey Foundry':
    '1111',

  'Broggie Yard':
    '1112',

  'Irvine Passage':
    '1113',

  'McKim Portal':
    '1114',

  'Chapman Gate':
    '1115',

  'Baxter Forge':
    '1116',

  'Crump Works':
    '1117',

  'Burns Gardens':
    '1118'

};


/* =====================================================
   BASIC HELPERS
   ===================================================== */

function homeById(id){

  return document.getElementById(
    id
  );

}


function getHomeCampaign(){

  const campaign =
    String(
      document.body.dataset.campaign ||
      'hero'
    )
      .toLowerCase();


  return campaign === 'villain'
    ? 'villain'
    : 'hero';

}


function getHomeReality(){

  const reality =
    String(
      document.body.dataset.reality ||
      'cast'
    )
      .toLowerCase();


  return reality === 'unbound'
    ? 'unbound'
    : 'cast';

}


function homeEscape(value){

  return String(
    value ?? ''
  )
    .replaceAll(
      '&',
      '&amp;'
    )
    .replaceAll(
      '<',
      '&lt;'
    )
    .replaceAll(
      '>',
      '&gt;'
    )
    .replaceAll(
      '"',
      '&quot;'
    )
    .replaceAll(
      "'",
      '&#039;'
    );

}


function homeNumber(
  value,
  fallback = 0
){

  const parsed =
    Number(value);


  return Number.isFinite(
    parsed
  )
    ? parsed
    : fallback;

}


function homeBoolean(value){

  return (
    value === true ||
    value === 1 ||
    value === 'true'
  );

}


function homeClamp(
  value,
  min,
  max
){

  return Math.min(
    max,
    Math.max(
      min,
      value
    )
  );

}


function homeInitial(value){

  const cleaned =
    String(
      value || ''
    )
      .trim();


  return cleaned
    ? cleaned
        .charAt(0)
        .toUpperCase()
    : '?';

}


function homeHasDashboard(){

  return Boolean(

    homeById(
      'homeStudentPhoto'
    )

    ||

    homeById(
      'homeLatestJournal'
    )

    ||

    homeById(
      'homeFavoriteObjectives'
    )

  );

}


/* =====================================================
   ACTIVE CHARACTER
   ===================================================== */

function getHomeCharacterId(){

  const shellCharacter =
    window.epcotPlayer
      ?.getCharacter
      ?.();


  return (

    shellCharacter?.id

    ||

    document.body
      .dataset
      .characterId

    ||

    sessionStorage.getItem(
      'epcot-active-character-id'
    )

    ||

    ''

  );

}


async function loadHomeCharacter(){

  const characterId =
    getHomeCharacterId();


  if(!characterId){

    throw new Error(
      'Home is waiting for the active player character.'
    );

  }


  const rows =
    await supabaseGet(
      `characters?select=*&id=eq.${encodeURIComponent(characterId)}&limit=1`
    );


  if(!rows.length){

    throw new Error(
      'The active character could not be loaded for Home.'
    );

  }


  homeCharacter =
    rows[0];


  document.body
    .dataset
    .characterId =
      homeCharacter.id;

}


/* =====================================================
   COMPANY FILE
   ===================================================== */

async function loadHomeCompanyFile(){

  if(!homeCharacter?.id){

    homeCompanyFile =
      null;

    return;

  }


  const rows =
    await supabaseGet(
      `company_files?select=*&character_id=eq.${encodeURIComponent(homeCharacter.id)}&limit=1`
    );


  homeCompanyFile =
    rows[0] ||
    null;

}


/* =====================================================
   DISPLAY IDENTITY
   ===================================================== */

function getHomeDisplayName(){

  const castName =
    homeCompanyFile
      ?.display_name ||
    '';


  const unboundName =
    homeCompanyFile
      ?.unbound_display_name ||
    '';


  if(
    getHomeReality() ===
    'unbound'
  ){

    return (

      unboundName

      ||

      castName

      ||

      'Unnamed Character'

    );

  }


  return (

    castName

    ||

    unboundName

    ||

    'Unnamed Character'

  );

}


function getHomeDisplayImage(){

  const castImage =
    homeCompanyFile
      ?.image_url ||
    '';


  const unboundImage =
    homeCompanyFile
      ?.unbound_image_url ||
    '';


  if(
    getHomeReality() ===
    'unbound'
  ){

    return (
      unboundImage ||
      castImage
    );

  }


  return (
    castImage ||
    unboundImage
  );

}


/* =====================================================
   EXPLORER ID

   Mirrors company-file.js.
   ===================================================== */

function homeExplorerNameCode(){

  const letters =
    String(

      homeCompanyFile
        ?.display_name

      ||

      homeCompanyFile
        ?.unbound_display_name

      ||

      ''

    )
      .replace(
        /[^a-zA-Z]/g,
        ''
      )
      .toUpperCase();


  return (
    letters.slice(
      0,
      3
    )
    ||
    'EXP'
  )
    .padEnd(
      3,
      'X'
    );

}


function getHomeExplorerId(){

  /*
    company-file.js already exposes the
    canonical Explorer ID builder.

    Use it whenever available.
  */

  if(

    window.getCompanyExplorerId

    &&

    homeCompanyFile

    &&

    homeCharacter

  ){

    const companyId =
      window.getCompanyExplorerId(
        homeCompanyFile,
        homeCharacter
      );


    if(companyId){

      return companyId;

    }

  }


  /*
    Fallback copies the same format used by
    Company File:

    NAME-NEIGHBORHOOD-MEMBER
  */

  const memberCode =
    homeCompanyFile
      ?.explorer_member_code ||
    '';


  if(!memberCode){

    return 'Not Assigned';

  }


  const neighborhoodCode =
    HOME_NEIGHBORHOOD_CODES[
      homeCompanyFile
        ?.neighborhood
    ]
    ||
    '0000';


  return [

    homeExplorerNameCode(),

    neighborhoodCode,

    memberCode

  ].join('-');

}


/* =====================================================
   OBJECTIVES
   ===================================================== */

async function loadHomeObjectives(){

  if(!homeCharacter?.id){

    homeObjectives = [];

    homeSubitems = [];

    homeFavorites = [];

    return;

  }


  const campaign =
    getHomeCampaign();


  /*
    Objectives are campaign-wide.

    Hero Cast and Hero Unbound therefore see
    the same Hero objective pool.
  */

  homeObjectives =
    await supabaseGet(
      `objectives?select=*&campaign=eq.${campaign}&archived=eq.false&order=created_at.desc`
    );


  /*
    Load the sub-objectives belonging to those
    campaign objectives.
  */

  if(homeObjectives.length){

    const ids =
      homeObjectives

        .map(
          objective =>
            objective.id
        )

        .filter(Boolean)

        .join(',');


    homeSubitems =
      ids

        ? await supabaseGet(
            `objective_subitems?select=*&objective_id=in.(${ids})&order=sort_order.asc`
          )

        : [];

  }
  else{

    homeSubitems = [];

  }


  /*
    Favorites belong to the active character.
  */

  homeFavorites =
    await supabaseGet(
      `objective_favorites?select=*&character_id=eq.${encodeURIComponent(homeCharacter.id)}&order=created_at.asc`
    );

}


/* =====================================================
   FAVORITE OBJECTIVE LIST
   ===================================================== */

function getHomeFavoriteItems(){

  const items = [];


  homeFavorites.forEach(
    favorite => {


      /*
        FAVORITED SUB-OBJECTIVE
      */

      if(
        favorite.subobjective_id
      ){

        const subitem =
          homeSubitems.find(
            item =>
              item.id ===
              favorite.subobjective_id
          );


        if(!subitem){

          return;

        }


        const objective =
          homeObjectives.find(
            item =>
              item.id ===
              subitem.objective_id
          );


        if(!objective){

          return;

        }


        items.push({

          id:
            subitem.id,

          type:
            'subitem',

          name:
            subitem.name ||
            'Untitled Sub-Objective',

          description:
            objective.name ||
            '',

          completed:
            homeBoolean(
              subitem.completed
            )

        });


        return;

      }


      /*
        FAVORITED MAIN OBJECTIVE
      */

      if(
        favorite.objective_id
      ){

        const objective =
          homeObjectives.find(
            item =>
              item.id ===
              favorite.objective_id
          );


        if(!objective){

          return;

        }


        items.push({

          id:
            objective.id,

          type:
            'objective',

          name:
            objective.name ||
            'Untitled Objective',

          description:
            objective.description ||
            '',

          completed:
            homeBoolean(
              objective.completed
            )

        });

      }

    }
  );


  /*
    Objectives already limits favorites to three,
    but Home protects itself anyway.
  */

  return items.slice(
    0,
    3
  );

}


/* =====================================================
   JOURNAL
   ===================================================== */

async function loadHomeJournal(){

  const campaign =
    getHomeCampaign();


  homeJournalPosts =
    await supabaseGet(
      `journal_posts?select=id,campaign,reality_posted,author_character_id,author_name,author_image_url,content,created_at&campaign=eq.${campaign}&order=created_at.desc&limit=5`
    );

}


/* =====================================================
   JOURNAL TIMESTAMP
   ===================================================== */

function homeJournalTimestamp(
  value
){

  if(!value){

    return '';

  }


  const date =
    new Date(
      value
    );


  if(
    Number.isNaN(
      date.getTime()
    )
  ){

    return '';

  }


  return new Intl.DateTimeFormat(
    undefined,
    {

      month:
        'short',

      day:
        'numeric',

      hour:
        'numeric',

      minute:
        '2-digit'

    }
  )
    .format(
      date
    );

}


/* =====================================================
   BADGE / IDENTITY RENDER
   ===================================================== */

function renderHomeIdentity(){

  const name =
    getHomeDisplayName();


  const image =
    getHomeDisplayImage();


  const explorerId =
    getHomeExplorerId();


  /* NAME */

  const nameTarget =
    homeById(
      'homeCharacterName'
    );


  if(nameTarget){

    nameTarget.textContent =
      name;

  }


  /* EXPLORER ID */

  const explorerTarget =
    homeById(
      'homeExplorerId'
    );


  if(explorerTarget){

    explorerTarget.textContent =
      explorerId;

  }


  /* LEVEL */

  const levelTarget =
    homeById(
      'homeLevel'
    );


  if(levelTarget){

    levelTarget.textContent =
      homeNumber(
        homeCharacter?.level,
        1
      );

  }


  /* COHORT */

  const cohortTarget =
    homeById(
      'homeCohort'
    );


  if(cohortTarget){

    cohortTarget.textContent =
      homeCompanyFile?.cohort ||
      'Not Assigned';

  }


  /*
    BADGE PHOTO

    This is the actual Home HTML mount:
    #homeStudentPhoto

    Cast prefers image_url.
    Unbound prefers unbound_image_url.
  */

  const photoTarget =
    homeById(
      'homeStudentPhoto'
    );


  if(photoTarget){

    if(image){

      photoTarget.innerHTML = `

        <img
          src="${homeEscape(image)}"
          alt="${homeEscape(name)}"
          class="home-student-photo-image"
          style="
            width:100%;
            height:100%;
            object-fit:cover;
            display:block;
          "
        >

      `;

    }
    else{

      photoTarget.innerHTML = `

        <div class="home-photo-placeholder">

          ${homeEscape(
            homeInitial(
              name
            )
          )}

        </div>

      `;

    }

  }


  /*
    Keep other identity targets synchronized.

    IMPORTANT:
    :not(body) preserves the bug fix that
    prevented Home from replacing the entire page.
  */

  document
    .querySelectorAll(
      '[data-character-name]:not(body)'
    )
    .forEach(
      element => {

        element.textContent =
          name;

      }
    );


  document
    .querySelectorAll(
      '[data-explorer-id]'
    )
    .forEach(
      element => {

        element.textContent =
          explorerId;

      }
    );

}


/* =====================================================
   PROGRAM METRICS
   ===================================================== */

function renderHomeProgramMetrics(){

  const alignment =
    homeClamp(

      homeNumber(
        homeCharacter?.alignment,
        0
      ),

      0,

      10

    );


  const exhaustion =
    homeClamp(

      homeNumber(
        homeCharacter?.exhaustion,
        0
      ),

      0,

      6

    );


  const inspiration =
    homeBoolean(
      homeCharacter
        ?.heroic_inspiration
    );


  /* ===================================================
     ALIGNMENT METER
     =================================================== */

  const meter =
    homeById(
      'homeAlignmentMeter'
    );


  if(meter){

    meter.style
      .setProperty(
        '--alignment-percent',
        `${alignment * 10}%`
      );


    meter.setAttribute(
      'aria-label',
      `Alignment ${alignment} out of 10`
    );

  }


  const alignmentValue =
    homeById(
      'homeAlignmentValue'
    );


  if(alignmentValue){

    alignmentValue.textContent =
      `${alignment} / 10`;

  }


  const alignmentStatus =
    homeById(
      'homeAlignmentStatus'
    );


  if(alignmentStatus){

    if(
      alignment >= 10
    ){

      alignmentStatus.textContent =
        'Mandatory Realignment Required';

    }
    else if(
      alignment >= 7
    ){

      alignmentStatus.textContent =
        'Program Variance Detected';

    }
    else if(
      alignment >= 4
    ){

      alignmentStatus.textContent =
        'Program Monitoring Active';

    }
    else{

      alignmentStatus.textContent =
        'Within Program Expectations';

    }

  }


  /* ===================================================
     EXHAUSTION
     =================================================== */

  const hearts =
    homeById(
      'homeExhaustionHearts'
    );


  if(hearts){

    hearts.innerHTML =
      Array.from(

        {
          length:
            6
        },

        (
          _,
          index
        ) => `

          <span
            class="home-exhaustion-heart${
              index < exhaustion
                ? ' is-filled'
                : ''
            }"
            aria-hidden="true"
          >
            ♥
          </span>

        `

      )
        .join('');


    hearts.setAttribute(
      'aria-label',
      `Exhaustion ${exhaustion} out of 6`
    );

  }


  /* ===================================================
     HEROIC INSPIRATION
     =================================================== */

  const inspirationIcon =
    homeById(
      'homeInspirationIcon'
    );


  if(inspirationIcon){

    inspirationIcon.classList.toggle(
      'is-active',
      inspiration
    );


    inspirationIcon.setAttribute(
      'aria-label',

      inspiration

        ? 'Heroic Inspiration available'

        : 'No Heroic Inspiration'

    );

  }


  const inspirationLabel =
    homeById(
      'homeInspirationLabel'
    );


  if(inspirationLabel){

    inspirationLabel.textContent =
      inspiration

        ? 'Inspiration Available'

        : 'No Inspiration';

  }

}


/* =====================================================
   OBJECTIVES RENDER
   ===================================================== */

function renderHomeObjectives(){

  const mount =
    homeById(
      'homeFavoriteObjectives'
    );


  if(!mount){

    return;

  }


  const favorites =
    getHomeFavoriteItems();


  if(!favorites.length){

    mount.innerHTML = `

      <div class="home-objectives-empty">

        <strong>
          No favorites yet.
        </strong>

        <div>
          Star up to three Objectives or
          Sub-Objectives to place them here.
        </div>

      </div>

    `;


    return;

  }


  mount.innerHTML =
    favorites

      .map(
        item => `

          <div
            class="home-objective-item${
              item.completed
                ? ' is-complete'
                : ''
            }"
          >


            <div
              class="home-objective-check"
              aria-label="${
                item.completed
                  ? 'Complete'
                  : 'Incomplete'
              }"
            >

              ${
                item.completed
                  ? '✓'
                  : '○'
              }

            </div>


            <div class="home-objective-copy">

              <strong>

                ${homeEscape(
                  item.name
                )}

              </strong>


              <span>

                ${homeEscape(

                  item.description

                  ||

                  (
                    item.type ===
                    'subitem'

                      ? 'Sub-Objective'

                      : 'Active Objective'
                  )

                )}

              </span>

            </div>


            <div
              class="home-objective-star"
              aria-label="Home favorite"
            >
              ★
            </div>


          </div>

        `
      )

      .join('');

}


/* =====================================================
   JOURNAL RENDER
   ===================================================== */

function renderHomeJournal(){

  const mount =
    homeById(
      'homeLatestJournal'
    );


  if(!mount){

    return;

  }


  if(
    !homeJournalPosts.length
  ){

    mount.innerHTML = `

      <div class="home-journal-empty">

        <strong>
          No journal entries yet.
        </strong>

      </div>

    `;


    return;

  }


  mount.innerHTML =
    homeJournalPosts

      .map(
        post => {


          const author =
            post.author_name ||
            'Unknown Explorer';


          const avatar =
            post.author_image_url ||
            '';


          const reality =
            post.reality_posted ===
              'unbound'

              ? 'Unbound'

              : 'Cast';


          return `

            <article class="home-journal-entry">


              <div class="home-journal-head">


                ${
                  avatar

                    ? `

                        <img
                          class="home-journal-avatar"
                          src="${homeEscape(avatar)}"
                          alt="${homeEscape(author)}"
                        >

                      `

                    : `

                        <div
                          class="
                            home-journal-avatar
                            home-journal-avatar-placeholder
                          "
                          aria-hidden="true"
                        >

                          ${homeEscape(
                            homeInitial(
                              author
                            )
                          )}

                        </div>

                      `
                }


                <div>


                  <strong>

                    ${homeEscape(
                      author
                    )}

                  </strong>


                  <span>

                    ${homeEscape(
                      homeJournalTimestamp(
                        post.created_at
                      )
                    )}

                    ${
                      post.created_at
                        ? ' · '
                        : ''
                    }

                    ${homeEscape(
                      reality
                    )}

                  </span>


                </div>


              </div>


              <div class="home-journal-content">

                ${homeEscape(
                  post.content ||
                  ''
                )}

              </div>


            </article>

          `;

        }
      )

      .join('');

}


/* =====================================================
   HOME NAVIGATION

   Hero Cast uses navigation.js.

   Hero Unbound uses hero-unbound.js.

   Clicking the existing navigation buttons means Home
   does not need to own either navigation architecture.
   ===================================================== */

function openHomeDestination(
  viewName
){

  /*
    CAST NAVIGATION
  */

  const castButton =
    document.querySelector(
      `.nav button[data-view="${viewName}"]`
    );


  if(castButton){

    castButton.click();

    return;

  }


  /*
    UNBOUND NAVIGATION
  */

  const unboundButton =
    document.querySelector(
      `[data-unbound-nav="${viewName}"]`
    );


  if(unboundButton){

    unboundButton.click();

    return;

  }


  /*
    FALLBACK
  */

  const genericButton =
    document.querySelector(
      `[data-view="${viewName}"], [data-unbound-nav="${viewName}"]`
    );


  genericButton?.click();

}


/* =====================================================
   CONNECT HOME NAVIGATION
   ===================================================== */

function connectHomeNavigationButtons(){

  const journalButton =
    homeById(
      'homeJournalButton'
    );


  if(
    journalButton
    &&
    !journalButton.dataset
      .homeConnected
  ){

    journalButton.dataset
      .homeConnected =
        'true';


    journalButton.addEventListener(
      'click',
      () => {

        openHomeDestination(
          'journal'
        );

      }
    );

  }


  const objectivesButton =
    homeById(
      'homeObjectivesButton'
    );


  if(
    objectivesButton
    &&
    !objectivesButton.dataset
      .homeConnected
  ){

    objectivesButton.dataset
      .homeConnected =
        'true';


    objectivesButton.addEventListener(
      'click',
      () => {

        openHomeDestination(
          'objectives'
        );

      }
    );

  }

}


/* =====================================================
   ANIMATION HELPERS
   ===================================================== */

function homeRandom(
  min,
  max
){

  return (
    min +
    Math.random() *
    (
      max -
      min
    )
  );

}


function removeHomeAnimationLayer(
  layer
){

  if(!layer){

    return;

  }


  layer.remove();


  homeAnimationRunning =
    false;

}


/* =====================================================
   CAST
   THE FUTURE IS YOURS
   ===================================================== */

function launchCastHomeAnimation(){

  if(homeAnimationRunning){

    return;

  }


  homeAnimationRunning =
    true;


  const layer =
    document.createElement(
      'div'
    );


  layer.className =
    'home-confetti-layer';


  layer.setAttribute(
    'aria-hidden',
    'true'
  );


  const pieceCount =
    80;


  for(
    let index = 0;
    index < pieceCount;
    index += 1
  ){

    const piece =
      document.createElement(
        'span'
      );


    const shape =
      Math.random() > 0.48

        ? 'home-confetti-circle'

        : 'home-confetti-strip';


    const color =
      1 +
      Math.floor(
        Math.random() *
        6
      );


    piece.className = [

      'home-confetti-piece',

      shape,

      `home-confetti-color-${color}`

    ].join(' ');


    piece.style.left =
      `${homeRandom(
        0,
        100
      )}vw`;


    piece.style
      .animationDuration =
        `${homeRandom(
          1.8,
          3.6
        )}s`;


    piece.style
      .animationDelay =
        `${homeRandom(
          0,
          0.65
        )}s`;


    piece.style
      .setProperty(

        '--confetti-drift',

        `${homeRandom(
          -24,
          24
        )}vw`

      );


    piece.style
      .setProperty(

        '--confetti-spin',

        `${homeRandom(
          -720,
          720
        )}deg`

      );


    layer.appendChild(
      piece
    );

  }


  document.body.appendChild(
    layer
  );


  window.setTimeout(
    () => {

      removeHomeAnimationLayer(
        layer
      );

    },
    4400
  );

}

/* =====================================================
   VILLAIN CAST
   THE FUTURE IS YOURS
   ===================================================== */

function launchVillainCastHomeAnimation(){

  if(homeAnimationRunning){

    return;

  }


  homeAnimationRunning =
    true;


  const layer =
    document.createElement(
      'div'
    );


  layer.className =
    'home-binary-layer';


  layer.setAttribute(
    'aria-hidden',
    'true'
  );


  /*
    Create vertical streams rather than individual
    confetti pieces. This should read much more like
    a CRT data cascade.
  */

  const streamCount =
    46;


  for(
    let index = 0;
    index < streamCount;
    index += 1
  ){

    const stream =
      document.createElement(
        'div'
      );


    stream.className =
      'home-binary-stream';


    const length =
      Math.floor(
        homeRandom(
          6,
          15
        )
      );


    let text =
      '';


    for(
      let character = 0;
      character < length;
      character += 1
    ){

      text +=
        Math.random() > .5
          ? '1\n'
          : '0\n';

    }


    stream.textContent =
      text;


    stream.style.left =
      `${homeRandom(
        0,
        100
      )}vw`;


    stream.style.fontSize =
      `${homeRandom(
        11,
        21
      )}px`;


    stream.style.animationDuration =
      `${homeRandom(
        2.1,
        4.3
      )}s`;


    stream.style.animationDelay =
      `${homeRandom(
        0,
        .7
      )}s`;


    stream.style.opacity =
      homeRandom(
        .35,
        .9
      );


    layer.appendChild(
      stream
    );

  }


  document.body.appendChild(
    layer
  );


  window.setTimeout(
    () => {

      removeHomeAnimationLayer(
        layer
      );

    },
    5200
  );

}

/* =====================================================
   UNBOUND
   FOLLOW THE LIGHTS

   hero-unbound-home.css already contains the
   corrupted particle animation classes.

   home.js only needs to create those particles.
   ===================================================== */

function launchUnboundHomeAnimation(){

  if(homeAnimationRunning){

    return;

  }


  homeAnimationRunning =
    true;


  const layer =
    document.createElement(
      'div'
    );


  layer.className =
    'home-confetti-layer is-corrupted';


  layer.setAttribute(
    'aria-hidden',
    'true'
  );


  const pieceCount =
    58;


  const particleClasses = [

    'home-confetti-shard',

    'home-confetti-strip',

    'home-confetti-drop'

  ];


  for(
    let index = 0;
    index < pieceCount;
    index += 1
  ){

    const piece =
      document.createElement(
        'span'
      );


    const particleClass =
      particleClasses[
        Math.floor(
          Math.random() *
          particleClasses.length
        )
      ];


    const color =
      1 +
      Math.floor(
        Math.random() *
        4
      );


    piece.className = [

      'home-confetti-piece',

      particleClass,

      `home-confetti-color-${color}`

    ].join(' ');


    piece.style.left =
      `${homeRandom(
        3,
        97
      )}vw`;


    piece.style.bottom =
      `${homeRandom(
        -8,
        12
      )}vh`;


    piece.style
      .animationDuration =
        `${homeRandom(
          1.8,
          3.8
        )}s`;


    piece.style
      .animationDelay =
        `${homeRandom(
          0,
          0.7
        )}s`;


    piece.style
      .setProperty(

        '--confetti-drift',

        `${homeRandom(
          -18,
          18
        )}vw`

      );


    piece.style
      .setProperty(

        '--confetti-spin',

        `${homeRandom(
          -540,
          540
        )}deg`

      );


    layer.appendChild(
      piece
    );

  }


  document.body.appendChild(
    layer
  );


  window.setTimeout(
    () => {

      removeHomeAnimationLayer(
        layer
      );

    },
    4700
  );

}

/* =====================================================
   VILLAIN UNBOUND
   FOLLOW THE LIGHTS

   Faeriewild virus breach:
   corrupted data + spores + root processes.
   ===================================================== */

function launchVillainUnboundHomeAnimation(){

  if(homeAnimationRunning){

    return;

  }


  homeAnimationRunning =
    true;


  const layer =
    document.createElement(
      'div'
    );


  layer.className =
    'vu-breach-layer';


  layer.setAttribute(
    'aria-hidden',
    'true'
  );


  /* ===================================================
     CORRUPTED DATA FRAGMENTS
     =================================================== */

  const fragments = [

    'ERR://PATH_NOT_FOUND',

    'FOLLOW',

    'THE',

    'LIGHTS',

    'ROOT_ACCESS',

    'FAE_PROCESS',

    '0xFAE',

    '???',

    'RETURN',

    'LOST',

    'SIGNAL',

    'WAKE',

    'DO_NOT_FOLLOW',

    'FOLLOW'

  ];


  for(
    let index = 0;
    index < 34;
    index += 1
  ){

    const fragment =
      document.createElement(
        'span'
      );


    fragment.className =
      'vu-breach-fragment';


    fragment.textContent =
      fragments[
        Math.floor(
          Math.random() *
          fragments.length
        )
      ];


    fragment.style.left =
      `${homeRandom(
        2,
        94
      )}vw`;


    fragment.style.bottom =
      `${homeRandom(
        -12,
        15
      )}vh`;


    fragment.style.fontSize =
      `${homeRandom(
        7,
        14
      )}px`;


    fragment.style.opacity =
      homeRandom(
        .42,
        .92
      );


    fragment.style.animationDuration =
      `${homeRandom(
        2.4,
        4.3
      )}s`;


    fragment.style.animationDelay =
      `${homeRandom(
        0,
        .65
      )}s`;


    fragment.style.setProperty(

      '--vu-fragment-drift',

      `${homeRandom(
        -15,
        15
      )}vw`

    );


    fragment.style.setProperty(

      '--vu-fragment-spin',

      `${homeRandom(
        -18,
        18
      )}deg`

    );


    layer.appendChild(
      fragment
    );

  }


  /* ===================================================
     FAE SPORES
     =================================================== */

  const sporeColors = [

    '#8dff73',

    '#45cfc3',

    '#bf4d86',

    '#efd18d'

  ];


  for(
    let index = 0;
    index < 42;
    index += 1
  ){

    const spore =
      document.createElement(
        'span'
      );


    spore.className =
      'vu-breach-spore';


    spore.style.left =
      `${homeRandom(
        1,
        99
      )}vw`;


    spore.style.bottom =
      `${homeRandom(
        -8,
        18
      )}vh`;


    spore.style.animationDuration =
      `${homeRandom(
        2.8,
        4.8
      )}s`;


    spore.style.animationDelay =
      `${homeRandom(
        0,
        .8
      )}s`;


    spore.style.setProperty(

      '--vu-spore-size',

      `${homeRandom(
        2,
        7
      )}px`

    );


    spore.style.setProperty(

      '--vu-spore-drift',

      `${homeRandom(
        -13,
        13
      )}vw`

    );


    spore.style.setProperty(

      '--vu-spore-color',

      sporeColors[
        Math.floor(
          Math.random() *
          sporeColors.length
        )
      ]

    );


    layer.appendChild(
      spore
    );

  }


  /* ===================================================
     ROOT / VIRUS GROWTH
     =================================================== */

  for(
    let index = 0;
    index < 16;
    index += 1
  ){

    const root =
      document.createElement(
        'span'
      );


    root.className =
      'vu-breach-root';


    root.style.setProperty(

      '--vu-root-x',

      `${homeRandom(
        2,
        98
      )}vw`

    );


    root.style.setProperty(

      '--vu-root-height',

      `${homeRandom(
        18,
        55
      )}vh`

    );


    root.style.setProperty(

      '--vu-root-angle',

      `${homeRandom(
        -18,
        18
      )}deg`

    );


    root.style.animationDelay =
      `${homeRandom(
        .15,
        1
      )}s`;


    layer.appendChild(
      root
    );

  }


  /* ===================================================
     GLITCH SCAN BARS
     =================================================== */

  for(
    let index = 0;
    index < 6;
    index += 1
  ){

    const scan =
      document.createElement(
        'span'
      );


    scan.className =
      'vu-breach-scan';


    scan.style.setProperty(

      '--vu-scan-y',

      `${homeRandom(
        5,
        95
      )}vh`

    );


    scan.style.setProperty(

      '--vu-scan-height',

      `${homeRandom(
        1,
        5
      )}px`

    );


    scan.style.animationDelay =
      `${homeRandom(
        0,
        1.6
      )}s`;


    layer.appendChild(
      scan
    );

  }


  document.body.appendChild(
    layer
  );


  window.setTimeout(
    () => {

      removeHomeAnimationLayer(
        layer
      );

    },
    5000
  );

}

/* =====================================================
   CONNECT STAY CURIOUS BUTTON
   ===================================================== */

function connectHomeCuriousButton(){

  const button =
    homeById(
      'futureIsYoursButton'
    );


  if(
    !button ||
    button.dataset.homeConnected
  ){

    return;

  }


  button.dataset.homeConnected =
    'true';


  button.addEventListener(
    'click',
    () => {

      const campaign =
        String(
          document.body.dataset.campaign ||
          ''
        )
          .toLowerCase();


      const reality =
        getHomeReality();


      console.log(
        'Home curiosity animation:',
        {
          campaign,
          reality
        }
      );


      /* ===============================================
         VILLAIN UNBOUND
         =============================================== */

      if(
        campaign ===
        'villain'
        &&
        reality ===
        'unbound'
      ){

        launchVillainUnboundHomeAnimation();

        return;

      }


      /* ===============================================
         HERO UNBOUND
         =============================================== */

      if(
        reality ===
        'unbound'
      ){

        launchUnboundHomeAnimation();

        return;

      }


      /* ===============================================
         VILLAIN CAST
         =============================================== */

      if(
        campaign ===
        'villain'
      ){

        launchVillainCastHomeAnimation();

        return;

      }


      /* ===============================================
         HERO CAST
         =============================================== */

      launchCastHomeAnimation();

    }
  );

}

/* =====================================================
   FULL RENDER
   ===================================================== */

function renderHome(){

  renderHomeIdentity();

  renderHomeProgramMetrics();

  renderHomeObjectives();

  renderHomeJournal();

  connectHomeNavigationButtons();

  connectHomeCuriousButton();

}


/* =====================================================
   DATA LOAD
   ===================================================== */

async function loadHomeData(){

  /*
    Do not let several realtime events launch
    overlapping Home database loads.
  */

  if(homeRefreshInFlight){

    homeRefreshQueued =
      true;

    return;

  }


  homeRefreshInFlight =
    true;


  try{

    await loadHomeCharacter();


    await Promise.all([

      loadHomeCompanyFile(),

      loadHomeObjectives(),

      loadHomeJournal()

    ]);


    renderHome();

  }
  finally{

    homeRefreshInFlight =
      false;


    /*
      If another update happened while this refresh was
      running, immediately perform one more clean refresh.
    */

    if(homeRefreshQueued){

      homeRefreshQueued =
        false;


      scheduleHomeRefresh(
        50
      );

    }

  }

}


/* =====================================================
   DEBOUNCED REFRESH
   ===================================================== */

function scheduleHomeRefresh(
  delay = 125
){

  window.clearTimeout(
    homeRefreshTimer
  );


  homeRefreshTimer =
    window.setTimeout(
      () => {


        loadHomeData()
          .catch(
            error => {

              console.error(
                'Home refresh failed:',
                error
              );

            }
          );


      },
      delay
    );

}


/* =====================================================
   REALTIME CLEANUP
   ===================================================== */

function disconnectHomeRealtime(){

  if(

    !homeRealtimeClient

    ||

    !homeRealtimeChannels.length

  ){

    homeRealtimeChannels =
      [];

    return;

  }


  homeRealtimeChannels
    .forEach(
      channel => {

        homeRealtimeClient
          .removeChannel(
            channel
          );

      }
    );


  homeRealtimeChannels =
    [];

}


/* =====================================================
   REALTIME
   ===================================================== */

function connectHomeRealtime(){

  const client =
    window.epcotAuth
      ?.client;


  if(!client){

    return;

  }


  homeRealtimeClient =
    client;


  /*
    Never stack duplicate subscriptions.
  */

  disconnectHomeRealtime();


  const characterId =
    homeCharacter?.id ||
    getHomeCharacterId();


  const campaign =
    getHomeCampaign();


  /*
    Character-specific subscriptions can be filtered.

    Objectives and Journal are campaign-specific.

    objective_subitems is intentionally broad because
    the table does not itself store campaign.
  */

  const subscriptions = [

    {

      table:
        'characters',

      filter:
        characterId
          ? `id=eq.${characterId}`
          : undefined

    },


    {

      table:
        'company_files',

      filter:
        characterId
          ? `character_id=eq.${characterId}`
          : undefined

    },


    {

      table:
        'objective_favorites',

      filter:
        characterId
          ? `character_id=eq.${characterId}`
          : undefined

    },


    {

      table:
        'objectives',

      filter:
        `campaign=eq.${campaign}`

    },


    {

      table:
        'objective_subitems'

    },


    {

      table:
        'journal_posts',

      filter:
        `campaign=eq.${campaign}`

    }

  ];


  subscriptions.forEach(
    subscription => {


      const config = {

        event:
          '*',

        schema:
          'public',

        table:
          subscription.table

      };


      if(
        subscription.filter
      ){

        config.filter =
          subscription.filter;

      }


      const channel =
        client

          .channel(

            `home-${
              subscription.table
            }-${
              characterId ||
              'player'
            }-${
              Math.random()
                .toString(36)
                .slice(2)
            }`

          )

          .on(

            'postgres_changes',

            config,

            () => {

              scheduleHomeRefresh();

            }

          )

          .subscribe();


      homeRealtimeChannels.push(
        channel
      );


    }
  );

}


/* =====================================================
   LOCAL APP EVENTS
   ===================================================== */

function connectHomeAppEvents(){

  if(homeControlsConnected){

    return;

  }


  homeControlsConnected =
    true;


  /*
    PLAYER SHELL READY

    This is particularly important if home.js initializes
    slightly before player-shell finishes its database
    work.
  */

  document.addEventListener(
    'epcot:player-ready',
    event => {


      const character =
        event.detail
          ?.character;


      if(
        character?.id
      ){

        document.body
          .dataset
          .characterId =
            character.id;

      }


      scheduleHomeRefresh(
        0
      );


      /*
        Rebuild realtime subscriptions now that we
        definitely know the player's character.
      */

      window.setTimeout(
        connectHomeRealtime,
        50
      );


    }
  );


  /*
    COMPANY FILE SAVED LOCALLY
  */

  document.addEventListener(
    'epcot:company-file-updated',
    () => {

      scheduleHomeRefresh(
        0
      );

    }
  );


  /*
    Some modules may dispatch a view-change event.
  */

  document.addEventListener(
    'epcot:view-changed',
    event => {


      if(

        String(
          event.detail?.view ||
          ''
        )
          .toLowerCase()
        ===
        'home'

      ){

        scheduleHomeRefresh(
          0
        );

      }


    }
  );


  /*
    Also refresh when the browser/tab becomes active
    again. This provides a lightweight safety net
    without polling.
  */

  window.addEventListener(
    'focus',
    () => {

      scheduleHomeRefresh(
        75
      );

    }
  );

}


/* =====================================================
   CLEANUP
   ===================================================== */

window.addEventListener(
  'beforeunload',
  disconnectHomeRealtime
);


/* =====================================================
   INITIALIZE
   ===================================================== */

async function initializeHome(){

  if(
    !homeHasDashboard()
  ){

    return;

  }


  /*
    Controls can be connected immediately because
    they do not require database data.
  */

  connectHomeAppEvents();

  connectHomeNavigationButtons();

  connectHomeCuriousButton();


  try{

    await loadHomeData();

    connectHomeRealtime();

  }
  catch(error){

    /*
      player-shell and Home both initialize on page
      startup.

      If Home simply arrived first, player-ready will
      call us again once character assignment completes.
    */

    const waitingForPlayer =
      !getHomeCharacterId();


    if(waitingForPlayer){

      console.info(
        'Home is waiting for player-shell to assign the active character.'
      );

      return;

    }


    console.error(
      'Home initialization failed:',
      error
    );

  }

}


/* =====================================================
   PUBLIC API
   ===================================================== */

window.epcotHome = {


  refresh:
    loadHomeData,


  getCharacter(){

    return homeCharacter;

  },


  getCompanyFile(){

    return homeCompanyFile;

  },


  getDisplayName:
    getHomeDisplayName,


  getDisplayImage:
    getHomeDisplayImage,


  getExplorerId:
    getHomeExplorerId


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
    initializeHome
  );

}
else{

  initializeHome();

}
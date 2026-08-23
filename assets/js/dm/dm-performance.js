/* =====================================================
   EPCOT DND
   DM PERFORMANCE RECORD ADMINISTRATION

   IMPORTANT CHARACTER IDENTITY ARCHITECTURE

   characters.name
   = LEGACY / INTERNAL IDENTIFIER ONLY.

   DO NOT use characters.name as the normal visible
   character identity when a Company File exists.

   CAST IDENTITY:
   company_files.display_name
   company_files.image_url

   UNBOUND IDENTITY:
   company_files.unbound_display_name
   company_files.unbound_image_url

   characters.name may only be used as a last-resort
   fallback when no Company File identity exists.

   Includes:
   - Player roster overview
   - Hero / Villain character records
   - Cast + Unbound identity editing
   - Core Performance Record editing
   - NSBI dice
   - Heroic Inspiration
   - D&D Beyond portal
   - Inventory
   - Character ability assignments
   - Master NSBI Ability Catalog
   - Realtime synchronization
   ===================================================== */


/* =====================================================
   CONFIGURATION
   ===================================================== */

const DM_PERFORMANCE_SKILLS = [

  {
    key:
      'dreamlight_die',

    label:
      'Dreamlight'
  },

  {
    key:
      'heartline_die',

    label:
      'Heartline'
  },

  {
    key:
      'mindwave_die',

    label:
      'Mindwave'
  },

  {
    key:
      'bravura_die',

    label:
      'Bravura'
  },

  {
    key:
      'craftspark_die',

    label:
      'Craftspark'
  },

  {
    key:
      'starpath_die',

    label:
      'Starpath'
  }

];


const DM_PERFORMANCE_DICE = [
  4,
  6,
  8,
  10,
  12
];


const DM_ABILITY_CATEGORIES = [
  'Dreamlight',
  'Heartline',
  'Mindwave',
  'Bravura',
  'Craftspark',
  'Starpath'
];


/* =====================================================
   STATE
   ===================================================== */

const DM_PERFORMANCE = {

  profiles: [],

  assignments: [],

  characters: [],

  companyFiles: [],

  abilities: [],

  characterAbilities: [],

  inventory: [],

  activeCharacterId:
    null,

  abilityCatalogOpen:
    false,

  abilityBeingEdited:
    null,

  inventoryBeingEdited:
    null,

  assignmentBeingEdited:
    null,

  realtimeChannel:
    null

};


/* =====================================================
   BASIC HELPERS
   ===================================================== */

function dmPerformanceById(id){

  return document.getElementById(id);

}


function dmPerformanceClient(){

  return window.epcotAuth?.client || null;

}


function dmPerformanceEscape(value){

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


function dmPerformanceNumber(
  value,
  fallback = 0
){

  const number =
    Number(value);


  return Number.isFinite(number)
    ? number
    : fallback;

}


function dmPerformanceCharacter(id){

  return DM_PERFORMANCE.characters.find(
    item =>
      item.id === id
  ) || null;

}


function dmPerformanceProfile(id){

  return DM_PERFORMANCE.profiles.find(
    item =>
      item.id === id
  ) || null;

}


function dmPerformanceAssignment(
  accountId
){

  return DM_PERFORMANCE.assignments.find(
    item =>
      item.account_id ===
      accountId
  ) || null;

}


function dmPerformanceCompanyFile(
  characterId
){

  return DM_PERFORMANCE.companyFiles.find(
    item =>
      item.character_id ===
      characterId
  ) || null;

}


function dmPerformanceAbility(id){

  return DM_PERFORMANCE.abilities.find(
    item =>
      item.id === id
  ) || null;

}


function dmPerformanceLinksForCharacter(
  characterId
){

  return DM_PERFORMANCE
    .characterAbilities
    .filter(
      item =>
        item.character_id ===
        characterId
    );

}


function dmPerformanceInventoryForCharacter(
  characterId
){

  return DM_PERFORMANCE
    .inventory
    .filter(
      item =>
        item.character_id ===
        characterId
    );

}


function dmPerformanceSideLabel(side){

  return side ===
    'villain'
      ? 'Villain'
      : 'Hero';

}


/* =====================================================
   CHARACTER IDENTITY HELPERS

   Company File is the visible identity source of truth.
   ===================================================== */

function dmPerformanceCastName(
  character
){

  if(!character){
    return '';
  }


  const file =
    dmPerformanceCompanyFile(
      character.id
    );


  return (
    file?.display_name ||
    'Unnamed Character'
  );

}


function dmPerformanceUnboundName(
  character
){

  if(!character){
    return '';
  }


  const file =
    dmPerformanceCompanyFile(
      character.id
    );


  return (
    file?.unbound_display_name ||
    file?.display_name ||
    'Unnamed Character'
  );

}


function dmPerformanceCastImage(
  character
){

  if(!character){
    return '';
  }


  const file =
    dmPerformanceCompanyFile(
      character.id
    );


  return (
    file?.image_url ||
    ''
  );

}


function dmPerformanceUnboundImage(
  character
){

  if(!character){
    return '';
  }


  const file =
    dmPerformanceCompanyFile(
      character.id
    );


  return (
    file?.unbound_image_url ||
    file?.image_url ||
    ''
  );

}


/* =====================================================
   STYLES
   ===================================================== */

function installDmPerformanceStyles(){

  if(
    dmPerformanceById(
      'dmPerformanceStyles'
    )
  ){
    return;
  }


  const style =
    document.createElement(
      'style'
    );


  style.id =
    'dmPerformanceStyles';


  style.textContent = `

    /* =================================================
       PERFORMANCE RECORD READABILITY

       Functional text stays at 11px or larger.
       ================================================= */

    .dm-perf-toolbar{
      display:flex;
      justify-content:space-between;
      align-items:center;
      gap:16px;
      flex-wrap:wrap;
      margin-bottom:18px;
    }


    .dm-perf-button{
      min-height:38px;
      padding:9px 14px;
      border:1px solid rgba(255,255,255,.18);
      border-radius:7px;
      background:rgba(255,255,255,.07);
      color:inherit;
      font:inherit;
      font-size:12px;
      font-weight:750;
      cursor:pointer;
    }


    .dm-perf-button.primary{
      background:#f4c96b;
      color:#142436;
      border-color:transparent;
    }


    .dm-perf-button.danger{
      background:#7f2d37;
      color:#fff;
      border-color:transparent;
    }


    .dm-perf-button.success{
      background:#2f6f5c;
      color:#fff;
      border-color:transparent;
    }


    .dm-perf-roster{
      display:grid;
      gap:16px;
    }


    .dm-perf-player{
      padding:18px;
    }


    .dm-perf-player-head{
      display:flex;
      justify-content:space-between;
      gap:14px;
      flex-wrap:wrap;
      margin-bottom:14px;
    }


    .dm-perf-player-head h2{
      margin:4px 0;
      font-size:20px;
    }


    .dm-perf-character-grid{
      display:grid;
      grid-template-columns:
        repeat(2,minmax(0,1fr));
      gap:12px;
    }


    .dm-perf-character-card{
      padding:14px;
      border:1px solid rgba(255,255,255,.12);
      border-radius:9px;
      background:rgba(255,255,255,.035);
    }


    .dm-perf-identities{
      display:grid;
      grid-template-columns:
        repeat(2,minmax(0,1fr));
      gap:10px;
    }


    .dm-perf-identity{
      display:grid;
      grid-template-columns:
        58px
        minmax(0,1fr);
      gap:11px;
      align-items:center;
      min-width:0;
      padding:10px;
      border:1px solid rgba(255,255,255,.1);
      background:rgba(0,0,0,.12);
    }


    .dm-perf-identity.cast{
      border-top:2px solid rgba(45,151,166,.7);
    }


    .dm-perf-identity.unbound{
      border-top:2px solid rgba(214,166,75,.75);
    }


    .dm-perf-avatar{
      width:58px;
      height:58px;
      overflow:hidden;
      display:grid;
      place-items:center;
      border:1px solid rgba(255,255,255,.16);
      border-radius:50%;
      background:rgba(255,255,255,.05);
      font-size:18px;
      font-weight:800;
    }


    .dm-perf-avatar img{
      width:100%;
      height:100%;
      object-fit:cover;
    }


    .dm-perf-identity-label{
      color:#8ea7ad;
      font-size:10px;
      font-weight:800;
      letter-spacing:.11em;
      text-transform:uppercase;
    }


    .dm-perf-character-name{
      margin-top:3px;
      color:#f0ede4;
      font-size:17px;
      font-weight:850;
      line-height:1.2;
    }


    .dm-perf-badges{
      display:flex;
      gap:6px;
      flex-wrap:wrap;
      margin-top:12px;
    }


    .dm-perf-badge{
      padding:5px 9px;
      border:1px solid rgba(255,255,255,.14);
      border-radius:999px;
      font-size:11px;
      font-weight:750;
    }


    .dm-perf-muted{
      opacity:.68;
      font-size:12px;
      line-height:1.45;
    }


    .dm-perf-account-status{
      display:flex;
      align-items:center;
      gap:8px;
      font-size:12px;
      font-weight:850;
      letter-spacing:.06em;
    }


    .dm-perf-status-light{
      width:10px;
      height:10px;
      flex:0 0 10px;
      border-radius:50%;
      box-shadow:
        0 0 0 3px rgba(255,255,255,.05);
    }


    .dm-perf-account-status.is-active{
      color:#8fda9c;
    }


    .dm-perf-account-status.is-active
    .dm-perf-status-light{
      background:#65c879;
      box-shadow:
        0 0 0 3px rgba(101,200,121,.12),
        0 0 10px rgba(101,200,121,.55);
    }


    .dm-perf-account-status.is-inactive{
      color:#d8b56d;
    }


    .dm-perf-account-status.is-inactive
    .dm-perf-status-light{
      background:#d8a92f;
      box-shadow:
        0 0 0 3px rgba(216,169,47,.12),
        0 0 10px rgba(216,169,47,.45);
    }


    .dm-perf-modal-backdrop{
      position:fixed;
      inset:0;
      z-index:11000;
      display:grid;
      place-items:center;
      padding:24px;
      background:rgba(2,8,14,.86);
      backdrop-filter:blur(5px);
    }


    .dm-perf-modal{
      width:min(1120px,100%);
      max-height:calc(100vh - 48px);
      overflow:auto;
      padding:24px;
      border:1px solid rgba(255,255,255,.2);
      border-radius:14px;
      background:#102433;
      box-shadow:
        0 24px 80px
        rgba(0,0,0,.5);
    }


    .dm-perf-modal-head{
      display:flex;
      justify-content:space-between;
      gap:14px;
      align-items:flex-start;
      margin-bottom:20px;
    }


    .dm-perf-modal-head h2{
      margin:4px 0;
      font-size:24px;
    }


    .dm-perf-close{
      border:0;
      background:transparent;
      color:inherit;
      font-size:28px;
      cursor:pointer;
    }


    .dm-perf-section{
      padding:16px;
      margin-bottom:16px;
      border:1px solid rgba(255,255,255,.13);
      border-radius:10px;
      background:rgba(255,255,255,.035);
    }


    .dm-perf-section h3{
      margin:0 0 14px;
      font-size:18px;
    }


    .dm-perf-form-grid{
      display:grid;
      grid-template-columns:
        repeat(2,minmax(0,1fr));
      gap:12px;
    }


    .dm-perf-field{
      display:flex;
      flex-direction:column;
      gap:6px;
    }


    .dm-perf-field.full{
      grid-column:1 / -1;
    }


    .dm-perf-field label{
      font-size:12px;
      font-weight:750;
    }


    .dm-perf-field input,
    .dm-perf-field select,
    .dm-perf-field textarea{
      box-sizing:border-box;
      width:100%;
      padding:10px 11px;
      border:1px solid rgba(255,255,255,.18);
      border-radius:7px;
      background:rgba(0,0,0,.18);
      color:inherit;
      font:inherit;
      font-size:13px;
    }


    .dm-perf-field select option{
      color:#111;
    }


    .dm-perf-field textarea{
      min-height:100px;
      resize:vertical;
    }


    .dm-perf-identity-editor{
      display:grid;
      grid-template-columns:
        repeat(2,minmax(0,1fr));
      gap:12px;
    }


    .dm-perf-identity-editor-card{
      padding:13px;
      border:1px solid rgba(255,255,255,.11);
      background:rgba(0,0,0,.12);
    }


    .dm-perf-identity-editor-card.cast{
      border-top:
        2px solid
        rgba(45,151,166,.7);
    }


    .dm-perf-identity-editor-card.unbound{
      border-top:
        2px solid
        rgba(214,166,75,.75);
    }


    .dm-perf-identity-editor-card h4{
      margin:0 0 12px;
      font-size:15px;
    }


    .dm-perf-skills{
      display:grid;
      grid-template-columns:
        repeat(3,minmax(0,1fr));
      gap:10px;
    }


    .dm-perf-skill{
      padding:10px;
      border:1px solid rgba(255,255,255,.12);
      border-radius:8px;
      background:rgba(0,0,0,.1);
    }


    .dm-perf-skill label{
      display:block;
      margin-bottom:6px;
      font-size:12px;
      font-weight:750;
    }


    .dm-perf-skill select{
      width:100%;
      padding:8px;
      border:1px solid rgba(255,255,255,.18);
      border-radius:7px;
      background:rgba(0,0,0,.18);
      color:inherit;
      font-size:13px;
    }


    .dm-perf-skill select option{
      color:#111;
    }


    .dm-perf-list{
      display:grid;
      gap:9px;
    }


    .dm-perf-list-item{
      display:flex;
      justify-content:space-between;
      gap:12px;
      align-items:flex-start;
      padding:11px;
      border:1px solid rgba(255,255,255,.11);
      border-radius:8px;
      background:rgba(0,0,0,.12);
      font-size:12px;
    }


    .dm-perf-list-item strong{
      font-size:13px;
    }


    .dm-perf-list-actions{
      display:flex;
      gap:7px;
      flex-wrap:wrap;
    }


    .dm-perf-portal{
      width:100%;
      min-height:620px;
      border:1px solid rgba(255,255,255,.15);
      border-radius:10px;
      background:#fff;
    }


    .dm-perf-modal-actions{
      display:flex;
      justify-content:flex-end;
      gap:9px;
      flex-wrap:wrap;
      margin-top:18px;
    }


    .dm-ability-toolbar{
      display:flex;
      justify-content:space-between;
      gap:12px;
      align-items:center;
      flex-wrap:wrap;
      margin-bottom:14px;
      font-size:12px;
    }


    .dm-ability-grid{
      display:grid;
      grid-template-columns:
        repeat(
          auto-fit,
          minmax(270px,1fr)
        );
      gap:12px;
    }


    .dm-ability-card{
      padding:14px;
      border:1px solid rgba(255,255,255,.12);
      border-radius:9px;
      background:rgba(255,255,255,.035);
    }


    .dm-ability-card h3{
      font-size:16px;
    }


    .dm-ability-card.is-retired{
      opacity:.55;
    }


    .dm-ability-description{
      margin-top:8px;
      opacity:.82;
      white-space:pre-wrap;
      font-size:12px;
      line-height:1.5;
    }


    .dm-ability-assigned{
      margin-top:8px;
      color:#f4c96b;
      font-size:11px;
    }


    @media(max-width:800px){

      .dm-perf-character-grid,
      .dm-perf-form-grid,
      .dm-perf-skills,
      .dm-perf-identities,
      .dm-perf-identity-editor{
        grid-template-columns:1fr;
      }

    }

  `;


  document.head.appendChild(
    style
  );

}


/* =====================================================
   LOAD ALL PERFORMANCE DATA
   ===================================================== */

async function loadDmPerformance(){

  const client =
    dmPerformanceClient();


  const mount =
    dmPerformanceById(
      'dmPerformanceMount'
    );


  if(
    !client ||
    !mount
  ){
    return;
  }


  mount.innerHTML = `

    <div class="dm-module-loading">
      Accessing Explorer Performance Archive...
    </div>

  `;


  try{

    const [
      profilesResult,
      charactersResult,
      companyFilesResult,
      abilitiesResult,
      characterAbilitiesResult,
      inventoryResult
    ] =
      await Promise.all([

        client
          .from('accounts')
          .select('*')
          .eq('role', 'player')
          .order('display_name'),

        client
          .from('characters')
          .select('*'),

        client
          .from('company_files')
          .select('*'),

        client
          .from('abilities')
          .select('*')
          .order('category')
          .order('name'),

        client
          .from('character_abilities')
          .select('*'),

        client
          .from('inventory')
          .select('*')
          .order('name')

      ]);


    const results = [
      profilesResult,
      charactersResult,
      companyFilesResult,
      abilitiesResult,
      characterAbilitiesResult,
      inventoryResult
    ];


    const failed =
      results.find(
        result =>
          result.error
      );


    if(failed){
      throw failed.error;
    }


    DM_PERFORMANCE.profiles =
      profilesResult.data || [];


    DM_PERFORMANCE.characters =
      charactersResult.data || [];


    /*
      player_characters no longer exists.

      Build the same useful assignment shape from
      characters.account_id + characters.campaign.
    */

    DM_PERFORMANCE.assignments =
      DM_PERFORMANCE.profiles.map(
        profile => {

          const hero =
            DM_PERFORMANCE.characters.find(
              character =>
                character.account_id ===
                  profile.id
                &&
                character.campaign ===
                  'hero'
            );


          const villain =
            DM_PERFORMANCE.characters.find(
              character =>
                character.account_id ===
                  profile.id
                &&
                character.campaign ===
                  'villain'
            );


          return {

            account_id:
              profile.id,

            hero_character_id:
              hero?.id || null,

            villain_character_id:
              villain?.id || null

          };

        }
      );


    DM_PERFORMANCE.companyFiles =
      companyFilesResult.data || [];


    DM_PERFORMANCE.abilities =
      abilitiesResult.data || [];


    DM_PERFORMANCE.characterAbilities =
      characterAbilitiesResult.data || [];


    DM_PERFORMANCE.inventory =
      inventoryResult.data || [];


    /*
      If the currently selected character disappeared,
      clear the selection.
    */

    if(
      DM_PERFORMANCE.activeCharacterId &&
      !dmPerformanceCharacter(
        DM_PERFORMANCE.activeCharacterId
      )
    ){

      DM_PERFORMANCE.activeCharacterId =
        null;

    }


    renderDmPerformance();

  }
  catch(error){

    console.error(
      'Performance Administration failed:',
      error
    );


    mount.innerHTML = `

      <div class="dm-module-loading">

        Performance Archive could not be loaded.

        Check the browser console for details.

      </div>

    `;

  }

}

/* =====================================================
   ROSTER
   ===================================================== */

function renderDmPerformance(){

  const mount =
    dmPerformanceById(
      'dmPerformanceMount'
    );


  if(!mount){
    return;
  }


  mount.innerHTML = `

    <div class="dm-perf-toolbar">

      <div>

        <div class="dm-page-kicker">
          PERFORMANCE ARCHIVE
        </div>

        <div class="dm-perf-muted">

          ${DM_PERFORMANCE.profiles.length}

          player account${
            DM_PERFORMANCE.profiles.length === 1
              ? ''
              : 's'
          }

        </div>

      </div>


      <button
        class="
          dm-perf-button
          primary
        "
        type="button"
        data-dm-perf-action="ability-catalog"
      >
        Manage NSBI Ability Catalog
      </button>

    </div>


    <div class="dm-perf-roster">

      ${
        DM_PERFORMANCE.profiles.length

          ? DM_PERFORMANCE.profiles
              .map(
                renderDmPerformancePlayer
              )
              .join('')

          : `
              <div
                class="dm-console-panel"
                style="padding:22px;"
              >
                No player accounts found.
              </div>
            `
      }

    </div>

  `;

}


/* =====================================================
   PLAYER CARD
   ===================================================== */

function renderDmPerformancePlayer(
  profile
){

const assignment =
    dmPerformanceAssignment(
      profile.id
    );


  const hero =
    assignment?.hero_character_id

      ? dmPerformanceCharacter(
          assignment.hero_character_id
        )

      : null;


  const villain =
    assignment?.villain_character_id

      ? dmPerformanceCharacter(
          assignment.villain_character_id
        )

      : null;


  return `

    <article
      class="
        dm-console-panel
        dm-perf-player
      "
    >

      <div class="dm-perf-player-head">

        <div>

          <div class="dm-page-kicker">
            EXPLORER ACCOUNT
          </div>

          <h2>

            ${dmPerformanceEscape(
              profile.display_name ||
              profile.username ||
              'Unnamed Player'
            )}

          </h2>

          ${
            profile.username

              ? `
                  <div class="dm-perf-muted">

                    @${dmPerformanceEscape(
                      profile.username
                    )}

                  </div>
                `

              : ''
          }

        </div>


        <div
          class="
            dm-perf-account-status
            ${
              profile.active
                ? 'is-active'
                : 'is-inactive'
            }
          "
        >

          <span
            class="dm-perf-status-light"
            aria-hidden="true"
          ></span>

          <span>

            ${
              profile.active
                ? 'ACTIVE'
                : 'INACTIVE'
            }

          </span>

        </div>

      </div>


      <div class="dm-perf-character-grid">

        ${renderDmCharacterSummary(
          hero,
          'hero'
        )}

        ${renderDmCharacterSummary(
          villain,
          'villain'
        )}

      </div>

    </article>

  `;

}


/* =====================================================
   IDENTITY SUMMARY
   ===================================================== */

function renderDmIdentitySummary(
  character,
  reality
){

  const isUnbound =
    reality ===
    'unbound';


  const name =
    isUnbound

      ? dmPerformanceUnboundName(
          character
        )

      : dmPerformanceCastName(
          character
        );


  const image =
    isUnbound

      ? dmPerformanceUnboundImage(
          character
        )

      : dmPerformanceCastImage(
          character
        );


  const initial =
    String(
      name ||
      '?'
    )
      .charAt(0)
      .toUpperCase();


  return `

    <div
      class="
        dm-perf-identity
        ${reality}
      "
    >

      <div class="dm-perf-avatar">

        ${
          image

            ? `
                <img
                  src="${dmPerformanceEscape(
                    image
                  )}"
                  alt="${dmPerformanceEscape(
                    name
                  )}"
                >
              `

            : dmPerformanceEscape(
                initial
              )
        }

      </div>


      <div>

        <div class="dm-perf-identity-label">

          ${
            isUnbound
              ? 'UNBOUND IDENTITY'
              : 'CAST IDENTITY'
          }

        </div>

        <div class="dm-perf-character-name">

          ${dmPerformanceEscape(
            name
          )}

        </div>

      </div>

    </div>

  `;

}


/* =====================================================
   CHARACTER SUMMARY
   ===================================================== */

function renderDmCharacterSummary(
  character,
  side
){

  if(!character){

    return `

      <div class="dm-perf-character-card">

        <div class="dm-page-kicker">
          ${side.toUpperCase()}
        </div>

        <div class="dm-perf-muted">

          No ${dmPerformanceSideLabel(
            side
          )} character assigned.

        </div>

      </div>

    `;

  }


  const abilityCount =
    dmPerformanceLinksForCharacter(
      character.id
    ).length;


  const inventoryCount =
    dmPerformanceInventoryForCharacter(
      character.id
    ).length;


  return `

    <div class="dm-perf-character-card">

      <div class="dm-page-kicker">

        ${dmPerformanceSideLabel(
          side
        ).toUpperCase()}

        CHARACTER

      </div>


      <div class="dm-perf-identities">

        ${renderDmIdentitySummary(
          character,
          'cast'
        )}

        ${renderDmIdentitySummary(
          character,
          'unbound'
        )}

      </div>


      <div class="dm-perf-badges">

        <span class="dm-perf-badge">
          LEVEL ${character.level ?? 1}
        </span>

        <span class="dm-perf-badge">
          ALIGNMENT ${character.alignment ?? 0}
        </span>

        <span class="dm-perf-badge">
          EXHAUSTION ${character.exhaustion ?? 0}
        </span>

        <span class="dm-perf-badge">
  TICKETS ${character.downtime_tickets ?? 0}
</span>

        <span class="dm-perf-badge">

          ${
            character.heroic_inspiration
              ? 'INSPIRED'
              : 'NO INSPIRATION'
          }

        </span>

        <span class="dm-perf-badge">

          ${abilityCount}

          ${
            abilityCount === 1
              ? 'ABILITY'
              : 'ABILITIES'
          }

        </span>

        <span class="dm-perf-badge">

          ${inventoryCount}

          ${
            inventoryCount === 1
              ? 'ITEM'
              : 'ITEMS'
          }

        </span>

        <span class="dm-perf-badge">

          ${
            character.dndbeyond_url
              ? 'D&D BEYOND CONNECTED'
              : 'NO D&D BEYOND'
          }

        </span>

      </div>


      <div style="margin-top:12px;">

        <button
          class="
            dm-perf-button
            primary
          "
          type="button"
          data-dm-perf-action="open-character"
          data-character-id="${character.id}"
        >
          Open Full Record
        </button>

      </div>

    </div>

  `;

}


/* =====================================================
   OPEN CHARACTER RECORD
   ===================================================== */

function openDmCharacterRecord(
  characterId
){

  const character =
    dmPerformanceCharacter(
      characterId
    );


  if(!character){
    return;
  }


  DM_PERFORMANCE.activeCharacterId =
    characterId;


  const backdrop =
    document.createElement(
      'div'
    );


  backdrop.id =
    'dmPerformanceCharacterModal';


  backdrop.className =
    'dm-perf-modal-backdrop';


  backdrop.innerHTML = `

    <div class="dm-perf-modal">

      <div class="dm-perf-modal-head">

        <div>

          <div class="dm-page-kicker">
            EXPLORER PERFORMANCE RECORD
          </div>

          <h2>

            ${dmPerformanceEscape(
              dmPerformanceCastName(
                character
              )
            )}

          </h2>

          <div class="dm-perf-muted">

            ${dmPerformanceSideLabel(
              character.side
            )}

            Character

            //

            Unbound:
            ${dmPerformanceEscape(
              dmPerformanceUnboundName(
                character
              )
            )}

          </div>

        </div>


        <button
          class="dm-perf-close"
          type="button"
          data-dm-perf-action="close-character"
        >
          ×
        </button>

      </div>


      ${renderDmCharacterIdentityEditor(
        character
      )}


      ${renderDmCharacterCoreEditor(
        character
      )}


      ${renderDmCharacterAbilities(
        character
      )}


      ${renderDmCharacterInventory(
        character
      )}


      ${renderDmDndBeyondPortal(
        character
      )}


      <div class="dm-perf-modal-actions">

        <button
          class="dm-perf-button"
          type="button"
          data-dm-perf-action="close-character"
        >
          Close
        </button>


        <button
          class="
            dm-perf-button
            primary
          "
          type="button"
          data-dm-perf-action="save-character"
        >
          Save Performance Record
        </button>

      </div>

    </div>

  `;


  document.body.appendChild(
    backdrop
  );

}


/* =====================================================
   CAST + UNBOUND IDENTITY EDITOR
   ===================================================== */

function renderDmCharacterIdentityEditor(
  character
){

  const file =
    dmPerformanceCompanyFile(
      character.id
    );


  return `

    <section class="dm-perf-section">

      <h3>
        Character Identities
      </h3>


      <div class="dm-perf-identity-editor">


        <div
          class="
            dm-perf-identity-editor-card
            cast
          "
        >

          <h4>
            Cast Identity
          </h4>


          <div class="dm-perf-field">

            <label for="dmPerfCastName">
              Cast Name
            </label>

            <input
              id="dmPerfCastName"
              type="text"
              value="${dmPerformanceEscape(
                file?.display_name ||
''
              )}"
            >

          </div>


          <div class="dm-perf-field">

            <label for="dmPerfCastImage">
              Cast Image URL
            </label>

            <input
              id="dmPerfCastImage"
              type="url"
              value="${dmPerformanceEscape(
 file?.image_url ||
''
              )}"
            >

          </div>

        </div>



        <div
          class="
            dm-perf-identity-editor-card
            unbound
          "
        >

          <h4>
            Unbound Identity
          </h4>


          <div class="dm-perf-field">

            <label for="dmPerfUnboundName">
              Unbound Name
            </label>

            <input
              id="dmPerfUnboundName"
              type="text"
              value="${dmPerformanceEscape(
file?.unbound_display_name ||
file?.display_name ||
''
              )}"
            >

          </div>


          <div class="dm-perf-field">

            <label for="dmPerfUnboundImage">
              Unbound Image URL
            </label>

            <input
              id="dmPerfUnboundImage"
              type="url"
              value="${dmPerformanceEscape(
file?.unbound_image_url ||
file?.image_url ||
''
              )}"
            >

          </div>

        </div>


      </div>

    </section>

  `;

}


/* =====================================================
   CORE RECORD EDITOR
   ===================================================== */

function renderDmCharacterCoreEditor(
  character
){

  return `

    <section class="dm-perf-section">

      <h3>
        Core Performance Record
      </h3>


      <div class="dm-perf-form-grid">


        <div class="dm-perf-field">

          <label for="dmPerfLevel">
            Level
          </label>

          <input
            id="dmPerfLevel"
            type="number"
            min="1"
            value="${character.level ?? 1}"
          >

        </div>


        <div class="dm-perf-field">

          <label for="dmPerfAlignment">
            Alignment Units
          </label>

          <input
            id="dmPerfAlignment"
            type="number"
            value="${character.alignment ?? 0}"
          >

        </div>


        <div class="dm-perf-field">

          <label for="dmPerfExhaustion">
            Exhaustion
          </label>

          <input
            id="dmPerfExhaustion"
            type="number"
            min="0"
            value="${character.exhaustion ?? 0}"
          >

        </div>

        <div class="dm-perf-field">

  <label for="dmPerfTickets">
    Downtime Tickets
  </label>

  <input
    id="dmPerfTickets"
    type="number"
    min="0"
    value="${character.downtime_tickets ?? 0}"
  >

</div>

        <div class="dm-perf-field">

          <label>
            Heroic Inspiration
          </label>

          <label
            style="
              display:flex;
              align-items:center;
              gap:8px;
              padding:9px 0;
            "
          >

            <input
              id="dmPerfInspiration"
              type="checkbox"
              ${
                character.heroic_inspiration
                  ? 'checked'
                  : ''
              }
            >

            Inspired

          </label>

        </div>


      </div>

    </section>


    <section class="dm-perf-section">

      <h3>
        NSBI Skill Dice
      </h3>


      <div class="dm-perf-skills">

        ${DM_PERFORMANCE_SKILLS
          .map(
            skill => `

              <div class="dm-perf-skill">

                <label>
                  ${skill.label}
                </label>

                <select
                  id="dmPerfSkill_${skill.key}"
                >

                  ${DM_PERFORMANCE_DICE
                    .map(
                      die => `

                        <option
                          value="${die}"
                          ${
                            Number(
                              character[
                                skill.key
                              ]
                            ) === die
                              ? 'selected'
                              : ''
                          }
                        >
                          d${die}
                        </option>

                      `
                    )
                    .join('')
                  }

                </select>

              </div>

            `
          )
          .join('')
        }

      </div>

    </section>

  `;

}


/* =====================================================
   SAVE COMPANY FILE IDENTITY
   ===================================================== */

async function saveDmPerformanceIdentity(
  character
){

  const client =
    dmPerformanceClient();


  if(!client){
    return;
  }


  const existing =
    dmPerformanceCompanyFile(
      character.id
    );


  const body = {

    character_id:
      character.id,

    display_name:
      dmPerformanceById(
        'dmPerfCastName'
)?.value.trim() ||
null,

    image_url:
      dmPerformanceById(
        'dmPerfCastImage'
      )?.value.trim() ||
      null,

    unbound_display_name:
      dmPerformanceById(
        'dmPerfUnboundName'
      )?.value.trim() ||
      null,

    unbound_image_url:
      dmPerformanceById(
        'dmPerfUnboundImage'
      )?.value.trim() ||
      null,

    updated_at:
      new Date()
        .toISOString()

  };


  let result;


  if(existing){

    result =
      await client
        .from(
          'company_files'
        )
        .update(
          body
        )
        .eq(
          'id',
          existing.id
        )
        .select()
        .single();

  }
  else{

    result =
      await client
        .from(
          'company_files'
        )
        .insert(
          body
        )
        .select()
        .single();

  }


  if(result.error){

    throw result.error;

  }


  if(existing){

    Object.assign(
      existing,
      result.data ||
      body
    );

  }
  else{

    DM_PERFORMANCE.companyFiles.push(
      result.data
    );

  }

}


/* =====================================================
   SAVE CORE CHARACTER + IDENTITY
   ===================================================== */

async function saveDmCharacterRecord(){

  const client =
    dmPerformanceClient();


  const character =
    dmPerformanceCharacter(
      DM_PERFORMANCE.activeCharacterId
    );


  if(
    !client ||
    !character
  ){
    return;
  }


  /*
    DO NOT update characters.name here.

    characters.name is legacy/internal.

    Cast and Unbound visible names are saved
    through company_files.
  */

  const body = {

    level:
      Math.max(
        1,
        dmPerformanceNumber(
          dmPerformanceById(
            'dmPerfLevel'
          )?.value,
          1
        )
      ),

    alignment:
      dmPerformanceNumber(
        dmPerformanceById(
          'dmPerfAlignment'
        )?.value,
        0
      ),

    exhaustion:
      Math.max(
        0,
        dmPerformanceNumber(
          dmPerformanceById(
            'dmPerfExhaustion'
          )?.value,
          0
        )
      ),

downtime_tickets:
  Math.max(
    0,
    dmPerformanceNumber(
      dmPerformanceById(
        'dmPerfTickets'
      )?.value,
      0
    )
  ),

    heroic_inspiration:
      Boolean(
        dmPerformanceById(
          'dmPerfInspiration'
        )?.checked
      ),

    dndbeyond_url:
      dmPerformanceById(
        'dmPerfDndUrl'
      )?.value.trim() ||
      null

  };


  DM_PERFORMANCE_SKILLS
    .forEach(
      skill => {

        body[
          skill.key
        ] =
          dmPerformanceNumber(
            dmPerformanceById(
              `dmPerfSkill_${skill.key}`
            )?.value,
            4
          );

      }
    );


  try{

    const [
      characterResult
    ] =
      await Promise.all([

        client
          .from(
            'characters'
          )
          .update(
            body
          )
          .eq(
            'id',
            character.id
          )
          .select()
          .single(),

        saveDmPerformanceIdentity(
          character
        )

      ]);


    if(
      characterResult.error
    ){

      throw characterResult.error;

    }


    Object.assign(
      character,
      characterResult.data ||
      body
    );


    alert(
      'Performance Record saved.'
    );


    closeDmCharacterRecord();


    await loadDmPerformance();

  }
  catch(error){

    console.error(
      'Performance Record save failed:',
      error
    );


    alert(
      `Performance Record could not be saved.\n\n${
        error?.message ||
        String(error)
      }`
    );

  }

}


/* =====================================================
   CHARACTER ABILITIES
   ===================================================== */

function renderDmCharacterAbilities(
  character
){

  const links =
    dmPerformanceLinksForCharacter(
      character.id
    );


  return `

    <section class="dm-perf-section">

      <div class="dm-ability-toolbar">

        <h3 style="margin:0;">
          Assigned NSBI Abilities
        </h3>


        <button
          class="dm-perf-button"
          type="button"
          data-dm-perf-action="assign-ability"
        >
          + Assign Ability
        </button>

      </div>


      <div class="dm-perf-list">

        ${
          links.length

            ? links
                .map(
                  link => {

                    const ability =
                      dmPerformanceAbility(
                        link.ability_id
                      );


                    return `

                      <div class="dm-perf-list-item">

                        <div>

                          <strong>

                            ${dmPerformanceEscape(
                              ability?.name ||
                              'Unknown Ability'
                            )}

                          </strong>

                          <div class="dm-perf-muted">

                            ${dmPerformanceEscape(
                              ability?.category ||
                              'Uncategorized'
                            )}

                          </div>

                          ${
                            link.chosen_skill

                              ? `
                                  <div class="dm-perf-muted">

                                    Chosen Skill:
                                    ${dmPerformanceEscape(
                                      link.chosen_skill
                                    )}

                                  </div>
                                `

                              : ''
                          }

                          ${
                            link.level_selected

                              ? `
                                  <div class="dm-perf-muted">

                                    Selected at Level
                                    ${link.level_selected}

                                  </div>
                                `

                              : ''
                          }

                        </div>


                        <div class="dm-perf-list-actions">

                          <button
                            class="dm-perf-button"
                            type="button"
                            data-dm-perf-action="edit-assignment"
                            data-link-id="${link.id}"
                          >
                            Edit
                          </button>

                          <button
                            class="
                              dm-perf-button
                              danger
                            "
                            type="button"
                            data-dm-perf-action="remove-assignment"
                            data-link-id="${link.id}"
                          >
                            Remove
                          </button>

                        </div>

                      </div>

                    `;

                  }
                )
                .join('')

            : `
                <div class="dm-perf-muted">
                  No abilities assigned.
                </div>
              `
        }

      </div>

    </section>

  `;

}


/* =====================================================
   ASSIGN ABILITY MODAL
   ===================================================== */

function openDmAssignAbilityModal(){

  const character =
    dmPerformanceCharacter(
      DM_PERFORMANCE.activeCharacterId
    );


  if(!character){
    return;
  }


  const currentIds =
    new Set(
      dmPerformanceLinksForCharacter(
        character.id
      )
        .map(
          item =>
            item.ability_id
        )
    );


  const available =
    DM_PERFORMANCE.abilities.filter(
      item =>
        item.is_active &&
        !currentIds.has(
          item.id
        )
    );


  const modal =
    document.createElement(
      'div'
    );


  modal.id =
    'dmPerformanceSubModal';


  modal.className =
    'dm-perf-modal-backdrop';


  modal.innerHTML = `

    <div
      class="dm-perf-modal"
      style="width:min(650px,100%);"
    >

      <div class="dm-perf-modal-head">

        <div>

          <div class="dm-page-kicker">
            ABILITY ASSIGNMENT
          </div>

          <h2>
            Assign NSBI Ability
          </h2>

        </div>


        <button
          class="dm-perf-close"
          type="button"
          data-dm-perf-action="close-submodal"
        >
          ×
        </button>

      </div>


      <div class="dm-perf-field">

        <label for="dmPerfAbilitySelect">
          Ability
        </label>

        <select id="dmPerfAbilitySelect">

          <option value="">
            Choose ability...
          </option>

          ${available
            .map(
              ability => `

                <option
                  value="${ability.id}"
                >

                  ${dmPerformanceEscape(
                    ability.category ||
                    ''
                  )}

                  //

                  ${dmPerformanceEscape(
                    ability.name
                  )}

                </option>

              `
            )
            .join('')
          }

        </select>

      </div>


      <div class="dm-perf-field">

        <label for="dmPerfAbilitySkill">
          Chosen Skill
        </label>

        <input
          id="dmPerfAbilitySkill"
          type="text"
          placeholder="Only if the ability requires one"
        >

      </div>


      <div class="dm-perf-field">

        <label for="dmPerfAbilityLevel">
          Level Selected
        </label>

        <input
          id="dmPerfAbilityLevel"
          type="number"
          min="1"
          value="${character.level ?? 1}"
        >

      </div>


      <div class="dm-perf-modal-actions">

        <button
          class="dm-perf-button"
          type="button"
          data-dm-perf-action="close-submodal"
        >
          Cancel
        </button>

        <button
          class="
            dm-perf-button
            primary
          "
          type="button"
          data-dm-perf-action="save-assignment"
        >
          Assign Ability
        </button>

      </div>

    </div>

  `;


  document.body.appendChild(
    modal
  );

}


/* =====================================================
   SAVE NEW ASSIGNMENT
   ===================================================== */

async function saveDmAbilityAssignment(){

  const client =
    dmPerformanceClient();


  const character =
    dmPerformanceCharacter(
      DM_PERFORMANCE.activeCharacterId
    );


  const abilityId =
    dmPerformanceById(
      'dmPerfAbilitySelect'
    )?.value;


  if(
    !client ||
    !character ||
    !abilityId
  ){

    alert(
      'Choose an ability.'
    );

    return;

  }


  const body = {

    character_id:
      character.id,

    ability_id:
      abilityId,

    chosen_skill:
      dmPerformanceById(
        'dmPerfAbilitySkill'
      )?.value.trim() ||
      null,

    level_selected:
      dmPerformanceNumber(
        dmPerformanceById(
          'dmPerfAbilityLevel'
        )?.value,
        character.level ?? 1
      )

  };


  const {
    data,
    error
  } =
    await client
      .from(
        'character_abilities'
      )
      .insert(
        body
      )
      .select()
      .single();


  if(error){

    alert(
      `Ability could not be assigned.\n\n${error.message}`
    );

    return;

  }


  DM_PERFORMANCE.characterAbilities.push(
    data
  );


  closeDmPerformanceSubModal();


  refreshDmCharacterModal();

}


/* =====================================================
   EDIT ASSIGNMENT
   ===================================================== */

function openDmAbilityAssignmentEditor(
  linkId
){

  const link =
    DM_PERFORMANCE.characterAbilities.find(
      item =>
        item.id ===
        linkId
    );


  if(!link){
    return;
  }


  DM_PERFORMANCE.assignmentBeingEdited =
    link;


  const ability =
    dmPerformanceAbility(
      link.ability_id
    );


  const modal =
    document.createElement(
      'div'
    );


  modal.id =
    'dmPerformanceSubModal';


  modal.className =
    'dm-perf-modal-backdrop';


  modal.innerHTML = `

    <div
      class="dm-perf-modal"
      style="width:min(600px,100%);"
    >

      <div class="dm-perf-modal-head">

        <div>

          <div class="dm-page-kicker">
            CHARACTER ABILITY
          </div>

          <h2>

            ${dmPerformanceEscape(
              ability?.name ||
              'Ability'
            )}

          </h2>

        </div>


        <button
          class="dm-perf-close"
          type="button"
          data-dm-perf-action="close-submodal"
        >
          ×
        </button>

      </div>


      <div class="dm-perf-field">

        <label for="dmPerfAbilitySkill">
          Chosen Skill
        </label>

        <input
          id="dmPerfAbilitySkill"
          type="text"
          value="${dmPerformanceEscape(
            link.chosen_skill ||
            ''
          )}"
        >

      </div>


      <div class="dm-perf-field">

        <label for="dmPerfAbilityLevel">
          Level Selected
        </label>

        <input
          id="dmPerfAbilityLevel"
          type="number"
          min="1"
          value="${link.level_selected ?? ''}"
        >

      </div>


      <div class="dm-perf-modal-actions">

        <button
          class="dm-perf-button"
          type="button"
          data-dm-perf-action="close-submodal"
        >
          Cancel
        </button>

        <button
          class="
            dm-perf-button
            primary
          "
          type="button"
          data-dm-perf-action="save-assignment-edit"
        >
          Save
        </button>

      </div>

    </div>

  `;


  document.body.appendChild(
    modal
  );

}


async function saveDmAbilityAssignmentEdit(){

  const link =
    DM_PERFORMANCE.assignmentBeingEdited;


  const client =
    dmPerformanceClient();


  if(
    !link ||
    !client
  ){
    return;
  }


  const body = {

    chosen_skill:
      dmPerformanceById(
        'dmPerfAbilitySkill'
      )?.value.trim() ||
      null,

    level_selected:
      dmPerformanceById(
        'dmPerfAbilityLevel'
      )?.value

        ? dmPerformanceNumber(
            dmPerformanceById(
              'dmPerfAbilityLevel'
            ).value,
            null
          )

        : null

  };


  const {
    data,
    error
  } =
    await client
      .from(
        'character_abilities'
      )
      .update(
        body
      )
      .eq(
        'id',
        link.id
      )
      .select()
      .single();


  if(error){

    alert(
      `Ability assignment could not be updated.\n\n${error.message}`
    );

    return;

  }


  Object.assign(
    link,
    data ||
    body
  );


  DM_PERFORMANCE.assignmentBeingEdited =
    null;


  closeDmPerformanceSubModal();


  refreshDmCharacterModal();

}


/* =====================================================
   REMOVE ASSIGNMENT
   ===================================================== */

async function removeDmAbilityAssignment(
  linkId
){

  const link =
    DM_PERFORMANCE.characterAbilities.find(
      item =>
        item.id ===
        linkId
    );


  if(!link){
    return;
  }


  const ability =
    dmPerformanceAbility(
      link.ability_id
    );


  if(
    !confirm(
      `Remove "${ability?.name || 'this ability'}" from this character?`
    )
  ){
    return;
  }


  const client =
    dmPerformanceClient();


  const {
    error
  } =
    await client
      .from(
        'character_abilities'
      )
      .delete()
      .eq(
        'id',
        link.id
      );


  if(error){

    alert(
      `Ability could not be removed.\n\n${error.message}`
    );

    return;

  }


  DM_PERFORMANCE.characterAbilities =
    DM_PERFORMANCE
      .characterAbilities
      .filter(
        item =>
          item.id !==
          link.id
      );


  refreshDmCharacterModal();

}


/* =====================================================
   INVENTORY
   ===================================================== */

function renderDmCharacterInventory(
  character
){

  const items =
    dmPerformanceInventoryForCharacter(
      character.id
    );


  return `

    <section class="dm-perf-section">

      <div class="dm-ability-toolbar">

        <h3 style="margin:0;">
          Inventory
        </h3>

        <button
          class="dm-perf-button"
          type="button"
          data-dm-perf-action="add-inventory"
        >
          + Add Item
        </button>

      </div>


      <div class="dm-perf-list">

        ${
          items.length

            ? items
                .map(
                  item => `

                    <div class="dm-perf-list-item">

                      <div>

                        <strong>

                          ${dmPerformanceEscape(
                            item.name ||
                            'Unnamed Item'
                          )}

                        </strong>

                        <div class="dm-perf-muted">

                          Quantity:
                          ${item.quantity ?? 1}

                        </div>

                        ${
                          item.description

                            ? `
                                <div
                                  style="
                                    margin-top:6px;
                                    line-height:1.45;
                                  "
                                >

                                  ${dmPerformanceEscape(
                                    item.description
                                  )}

                                </div>
                              `

                            : ''
                        }

                      </div>


                      <div class="dm-perf-list-actions">

                        <button
                          class="dm-perf-button"
                          type="button"
                          data-dm-perf-action="edit-inventory"
                          data-item-id="${item.id}"
                        >
                          Edit
                        </button>

                        <button
                          class="
                            dm-perf-button
                            danger
                          "
                          type="button"
                          data-dm-perf-action="delete-inventory"
                          data-item-id="${item.id}"
                        >
                          Delete
                        </button>

                      </div>

                    </div>

                  `
                )
                .join('')

            : `
                <div class="dm-perf-muted">
                  Inventory is empty.
                </div>
              `
        }

      </div>

    </section>

  `;

}


function openDmInventoryEditor(
  itemId = null
){

  const item =
    itemId

      ? DM_PERFORMANCE.inventory.find(
          entry =>
            entry.id ===
            itemId
        )

      : null;


  DM_PERFORMANCE.inventoryBeingEdited =
    item;


  const modal =
    document.createElement(
      'div'
    );


  modal.id =
    'dmPerformanceSubModal';


  modal.className =
    'dm-perf-modal-backdrop';


  modal.innerHTML = `

    <div
      class="dm-perf-modal"
      style="width:min(600px,100%);"
    >

      <div class="dm-perf-modal-head">

        <div>

          <div class="dm-page-kicker">
            INVENTORY RECORD
          </div>

          <h2>

            ${
              item
                ? 'Edit Item'
                : 'Add Item'
            }

          </h2>

        </div>


        <button
          class="dm-perf-close"
          type="button"
          data-dm-perf-action="close-submodal"
        >
          ×
        </button>

      </div>


      <div class="dm-perf-field">

        <label for="dmPerfItemName">
          Name
        </label>

        <input
          id="dmPerfItemName"
          type="text"
          value="${dmPerformanceEscape(
            item?.name ||
            ''
          )}"
        >

      </div>


      <div class="dm-perf-field">

        <label for="dmPerfItemDescription">
          Description
        </label>

        <textarea
          id="dmPerfItemDescription"
        >${dmPerformanceEscape(
          item?.description ||
          ''
        )}</textarea>

      </div>


      <div class="dm-perf-field">

        <label for="dmPerfItemQuantity">
          Quantity
        </label>

        <input
          id="dmPerfItemQuantity"
          type="number"
          min="1"
          value="${item?.quantity ?? 1}"
        >

      </div>


      <div class="dm-perf-modal-actions">

        <button
          class="dm-perf-button"
          type="button"
          data-dm-perf-action="close-submodal"
        >
          Cancel
        </button>

        <button
          class="
            dm-perf-button
            primary
          "
          type="button"
          data-dm-perf-action="save-inventory"
        >
          Save Item
        </button>

      </div>

    </div>

  `;


  document.body.appendChild(
    modal
  );

}


async function saveDmInventoryItem(){

  const client =
    dmPerformanceClient();


  const character =
    dmPerformanceCharacter(
      DM_PERFORMANCE.activeCharacterId
    );


  const name =
    dmPerformanceById(
      'dmPerfItemName'
    )?.value.trim();


  if(
    !client ||
    !character ||
    !name
  ){

    alert(
      'Item name is required.'
    );

    return;

  }


  const body = {

    name,

    description:
      dmPerformanceById(
        'dmPerfItemDescription'
      )?.value.trim() ||
      null,

    quantity:
      Math.max(
        1,
        dmPerformanceNumber(
          dmPerformanceById(
            'dmPerfItemQuantity'
          )?.value,
          1
        )
      )

  };


  let result;


  if(
    DM_PERFORMANCE.inventoryBeingEdited
  ){

    result =
      await client
        .from(
          'inventory'
        )
        .update(
          body
        )
        .eq(
          'id',
          DM_PERFORMANCE
            .inventoryBeingEdited
            .id
        )
        .select()
        .single();

  }
  else{

    result =
      await client
        .from(
          'inventory'
        )
        .insert({

          character_id:
            character.id,

          ...body

        })
        .select()
        .single();

  }


  if(result.error){

    alert(
      `Inventory item could not be saved.\n\n${result.error.message}`
    );

    return;

  }


  if(
    DM_PERFORMANCE.inventoryBeingEdited
  ){

    Object.assign(
      DM_PERFORMANCE.inventoryBeingEdited,
      result.data
    );

  }
  else{

    DM_PERFORMANCE.inventory.push(
      result.data
    );

  }


  DM_PERFORMANCE.inventoryBeingEdited =
    null;


  closeDmPerformanceSubModal();


  refreshDmCharacterModal();

}


async function deleteDmInventoryItem(
  itemId
){

  const item =
    DM_PERFORMANCE.inventory.find(
      entry =>
        entry.id ===
        itemId
    );


  if(
    !item ||
    !confirm(
      `Delete "${item.name}" from this character's inventory?`
    )
  ){
    return;
  }


  const client =
    dmPerformanceClient();


  const {
    error
  } =
    await client
      .from(
        'inventory'
      )
      .delete()
      .eq(
        'id',
        item.id
      );


  if(error){

    alert(
      `Inventory item could not be deleted.\n\n${error.message}`
    );

    return;

  }


  DM_PERFORMANCE.inventory =
    DM_PERFORMANCE.inventory.filter(
      entry =>
        entry.id !==
        item.id
    );


  refreshDmCharacterModal();

}


/* =====================================================
   D&D BEYOND
   ===================================================== */

function renderDmDndBeyondPortal(
  character
){

  return `

    <section class="dm-perf-section">

      <h3>
        D&D Beyond Portal
      </h3>


      <div class="dm-perf-field full">

        <label for="dmPerfDndUrl">
          D&D Beyond URL
        </label>

        <input
          id="dmPerfDndUrl"
          type="url"
          value="${dmPerformanceEscape(
            character.dndbeyond_url ||
            ''
          )}"
          placeholder="https://www.dndbeyond.com/..."
        >

      </div>


      ${
        character.dndbeyond_url

          ? `
              <div
                style="
                  display:flex;
                  gap:8px;
                  margin:12px 0;
                "
              >

                <a
                  class="
                    dm-perf-button
                    primary
                  "
                  href="${dmPerformanceEscape(
                    character.dndbeyond_url
                  )}"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Open D&D Beyond
                </a>

              </div>


              <iframe
                class="dm-perf-portal"
                src="${dmPerformanceEscape(
                  character.dndbeyond_url
                )}"
                title="D&D Beyond Character Portal"
              ></iframe>
            `

          : `
              <div class="dm-perf-muted">
                No D&D Beyond portal assigned.
              </div>
            `
      }

    </section>

  `;

}


/* =====================================================
   CHARACTER MODAL REFRESH
   ===================================================== */

function refreshDmCharacterModal(){

  const id =
    DM_PERFORMANCE.activeCharacterId;


  closeDmCharacterRecord(
    false
  );


  if(id){

    openDmCharacterRecord(
      id
    );

  }

}


function closeDmCharacterRecord(
  clearId = true
){

  dmPerformanceById(
    'dmPerformanceCharacterModal'
  )?.remove();


  if(clearId){

    DM_PERFORMANCE.activeCharacterId =
      null;

  }

}


/* =====================================================
   ABILITY CATALOG
   ===================================================== */

function openDmAbilityCatalog(){

  DM_PERFORMANCE.abilityCatalogOpen =
    true;


  const backdrop =
    document.createElement(
      'div'
    );


  backdrop.id =
    'dmAbilityCatalogModal';


  backdrop.className =
    'dm-perf-modal-backdrop';


  backdrop.innerHTML = `

    <div class="dm-perf-modal">

      <div class="dm-perf-modal-head">

        <div>

          <div class="dm-page-kicker">
            NSBI MASTER SYSTEM
          </div>

          <h2>
            Ability Catalog
          </h2>

          <div class="dm-perf-muted">

            Editing an ability here changes the
            master definition for every character.

          </div>

        </div>


        <button
          class="dm-perf-close"
          type="button"
          data-dm-perf-action="close-catalog"
        >
          ×
        </button>

      </div>


      <div class="dm-ability-toolbar">

        <div>

          ${DM_PERFORMANCE.abilities.length}

          catalog entries

        </div>


        <button
          class="
            dm-perf-button
            primary
          "
          type="button"
          data-dm-perf-action="add-catalog-ability"
        >
          + Add NSBI Ability
        </button>

      </div>


      <div class="dm-ability-grid">

        ${DM_PERFORMANCE.abilities
          .map(
            renderDmCatalogAbility
          )
          .join('')
        }

      </div>

    </div>

  `;


  document.body.appendChild(
    backdrop
  );

}


/* =====================================================
   ABILITY CATALOG CARD
   ===================================================== */

function renderDmCatalogAbility(
  ability
){

  const assignedCount =
    DM_PERFORMANCE
      .characterAbilities
      .filter(
        item =>
          item.ability_id ===
          ability.id
      )
      .length;


  return `

    <article
      class="
        dm-ability-card
        ${
          ability.is_active
            ? ''
            : 'is-retired'
        }
      "
    >

      <div class="dm-page-kicker">

        ${dmPerformanceEscape(
          ability.category ||
          'UNCATEGORIZED'
        )}

      </div>


      <h3>

        ${dmPerformanceEscape(
          ability.name
        )}

      </h3>


      <div class="dm-perf-badges">

        <span class="dm-perf-badge">

          ${
            ability.is_active
              ? 'ACTIVE'
              : 'RETIRED'
          }

        </span>


        ${
          ability.requires_skill_choice

            ? `
                <span class="dm-perf-badge">
                  SKILL CHOICE
                </span>
              `

            : ''
        }

      </div>


      ${
        ability.description

          ? `
              <div class="dm-ability-description">

                ${dmPerformanceEscape(
                  ability.description
                )}

              </div>
            `

          : ''
      }


      <div class="dm-ability-assigned">

        Assigned to
        ${assignedCount}

        ${
          assignedCount === 1
            ? 'character'
            : 'characters'
        }

      </div>


      <div
        class="dm-perf-list-actions"
        style="margin-top:12px;"
      >

        <button
          class="dm-perf-button"
          type="button"
          data-dm-perf-action="edit-catalog-ability"
          data-ability-id="${ability.id}"
        >
          Edit
        </button>


        <button
          class="
            dm-perf-button
            ${
              ability.is_active
                ? ''
                : 'success'
            }
          "
          type="button"
          data-dm-perf-action="toggle-catalog-ability"
          data-ability-id="${ability.id}"
        >

          ${
            ability.is_active
              ? 'Retire'
              : 'Reactivate'
          }

        </button>


        <button
          class="
            dm-perf-button
            danger
          "
          type="button"
          data-dm-perf-action="delete-catalog-ability"
          data-ability-id="${ability.id}"
        >
          Delete
        </button>

      </div>

    </article>

  `;

}


/* =====================================================
   ABILITY CATALOG EDITOR
   ===================================================== */

function openDmCatalogAbilityEditor(
  abilityId = null
){

  const ability =
    abilityId

      ? dmPerformanceAbility(
          abilityId
        )

      : null;


  DM_PERFORMANCE.abilityBeingEdited =
    ability;


  const modal =
    document.createElement(
      'div'
    );


  modal.id =
    'dmPerformanceSubModal';


  modal.className =
    'dm-perf-modal-backdrop';


  modal.innerHTML = `

    <div
      class="dm-perf-modal"
      style="width:min(680px,100%);"
    >

      <div class="dm-perf-modal-head">

        <div>

          <div class="dm-page-kicker">
            NSBI ABILITY CATALOG
          </div>

          <h2>

            ${
              ability
                ? 'Edit Ability'
                : 'Add Ability'
            }

          </h2>

        </div>


        <button
          class="dm-perf-close"
          type="button"
          data-dm-perf-action="close-submodal"
        >
          ×
        </button>

      </div>


      <div class="dm-perf-field">

        <label for="dmCatalogAbilityName">
          Ability Name *
        </label>

        <input
          id="dmCatalogAbilityName"
          type="text"
          value="${dmPerformanceEscape(
            ability?.name ||
            ''
          )}"
        >

      </div>


      <div class="dm-perf-field">

        <label for="dmCatalogAbilityCategory">
          NSBI Category
        </label>

        <select id="dmCatalogAbilityCategory">

          <option value="">
            Uncategorized
          </option>

          ${DM_ABILITY_CATEGORIES
            .map(
              category => `

                <option
                  value="${category}"
                  ${
                    ability?.category ===
                    category

                      ? 'selected'

                      : ''
                  }
                >
                  ${category}
                </option>

              `
            )
            .join('')
          }

        </select>

      </div>


      <div class="dm-perf-field">

        <label for="dmCatalogAbilityDescription">
          Description / Effect
        </label>

        <textarea
          id="dmCatalogAbilityDescription"
        >${dmPerformanceEscape(
          ability?.description ||
          ''
        )}</textarea>

      </div>


      <label
        style="
          display:flex;
          gap:8px;
          align-items:center;
          margin:12px 0;
          font-size:12px;
        "
      >

        <input
          id="dmCatalogAbilitySkillChoice"
          type="checkbox"
          ${
            ability?.requires_skill_choice
              ? 'checked'
              : ''
          }
        >

        Requires a chosen skill when assigned

      </label>


      <div class="dm-perf-modal-actions">

        <button
          class="dm-perf-button"
          type="button"
          data-dm-perf-action="close-submodal"
        >
          Cancel
        </button>

        <button
          class="
            dm-perf-button
            primary
          "
          type="button"
          data-dm-perf-action="save-catalog-ability"
        >
          Save Ability
        </button>

      </div>

    </div>

  `;


  document.body.appendChild(
    modal
  );

}


/* =====================================================
   SAVE CATALOG ABILITY
   ===================================================== */

async function saveDmCatalogAbility(){

  const client =
    dmPerformanceClient();


  const name =
    dmPerformanceById(
      'dmCatalogAbilityName'
    )?.value.trim();


  if(
    !client ||
    !name
  ){

    alert(
      'Ability Name is required.'
    );

    return;

  }


  const body = {

    name,

    category:
      dmPerformanceById(
        'dmCatalogAbilityCategory'
      )?.value ||
      null,

    description:
      dmPerformanceById(
        'dmCatalogAbilityDescription'
      )?.value.trim() ||
      null,

    requires_skill_choice:
      Boolean(
        dmPerformanceById(
          'dmCatalogAbilitySkillChoice'
        )?.checked
      )

  };


  let result;


  if(
    DM_PERFORMANCE.abilityBeingEdited
  ){

    result =
      await client
        .from(
          'abilities'
        )
        .update(
          body
        )
        .eq(
          'id',
          DM_PERFORMANCE
            .abilityBeingEdited
            .id
        )
        .select()
        .single();

  }
  else{

    result =
      await client
        .from(
          'abilities'
        )
        .insert({

          ...body,

          replaces_ability_id:
            null,

          is_active:
            true

        })
        .select()
        .single();

  }


  if(result.error){

    alert(
      `Ability could not be saved.\n\n${result.error.message}`
    );

    return;

  }


  if(
    DM_PERFORMANCE.abilityBeingEdited
  ){

    Object.assign(
      DM_PERFORMANCE.abilityBeingEdited,
      result.data
    );

  }
  else{

    DM_PERFORMANCE.abilities.push(
      result.data
    );


    DM_PERFORMANCE.abilities.sort(
      (
        a,
        b
      ) =>
        String(
          a.name
        )
          .localeCompare(
            String(
              b.name
            )
          )
    );

  }


  DM_PERFORMANCE.abilityBeingEdited =
    null;


  closeDmPerformanceSubModal();


  refreshDmAbilityCatalog();

}


/* =====================================================
   RETIRE / REACTIVATE ABILITY
   ===================================================== */

async function toggleDmCatalogAbility(
  abilityId
){

  const ability =
    dmPerformanceAbility(
      abilityId
    );


  if(!ability){
    return;
  }


  const client =
    dmPerformanceClient();


  const {
    data,
    error
  } =
    await client
      .from(
        'abilities'
      )
      .update({

        is_active:
          !ability.is_active

      })
      .eq(
        'id',
        ability.id
      )
      .select()
      .single();


  if(error){

    alert(
      `Ability status could not be changed.\n\n${error.message}`
    );

    return;

  }


  Object.assign(
    ability,
    data
  );


  refreshDmAbilityCatalog();

}


/* =====================================================
   DELETE CATALOG ABILITY
   ===================================================== */

async function deleteDmCatalogAbility(
  abilityId
){

  const ability =
    dmPerformanceAbility(
      abilityId
    );


  if(!ability){
    return;
  }


  const assigned =
    DM_PERFORMANCE.characterAbilities.filter(
      item =>
        item.ability_id ===
        ability.id
    );


  if(assigned.length){

    alert(

      `"${ability.name}" is assigned to ` +

      `${assigned.length} character` +

      `${
        assigned.length === 1
          ? ''
          : 's'
      }.\n\n` +

      `Remove it from those characters before permanently deleting it. ` +

      `You can retire it instead.`

    );


    return;

  }


  if(
    !confirm(
      `Permanently delete "${ability.name}" from the NSBI Ability Catalog?\n\nThis cannot be undone.`
    )
  ){
    return;
  }


  const client =
    dmPerformanceClient();


  const {
    error
  } =
    await client
      .from(
        'abilities'
      )
      .delete()
      .eq(
        'id',
        ability.id
      );


  if(error){

    alert(
      `Ability could not be deleted.\n\n${error.message}`
    );

    return;

  }


  DM_PERFORMANCE.abilities =
    DM_PERFORMANCE.abilities.filter(
      item =>
        item.id !==
        ability.id
    );


  refreshDmAbilityCatalog();

}


/* =====================================================
   CATALOG REFRESH
   ===================================================== */

function refreshDmAbilityCatalog(){

  dmPerformanceById(
    'dmAbilityCatalogModal'
  )?.remove();


  openDmAbilityCatalog();

}


/* =====================================================
   SUBMODAL
   ===================================================== */

function closeDmPerformanceSubModal(){

  dmPerformanceById(
    'dmPerformanceSubModal'
  )?.remove();


  DM_PERFORMANCE.inventoryBeingEdited =
    null;


  DM_PERFORMANCE.assignmentBeingEdited =
    null;

}


/* =====================================================
   CLICK EVENTS
   ===================================================== */

function handleDmPerformanceClick(
  event
){

  const button =
    event.target.closest(
      '[data-dm-perf-action]'
    );


  if(!button){
    return;
  }


  const action =
    button.dataset
      .dmPerfAction;


  if(
    action ===
    'open-character'
  ){

    openDmCharacterRecord(
      button.dataset.characterId
    );

    return;

  }


  if(
    action ===
    'close-character'
  ){

    closeDmCharacterRecord();

    return;

  }


  if(
    action ===
    'save-character'
  ){

    saveDmCharacterRecord();

    return;

  }


  if(
    action ===
    'assign-ability'
  ){

    openDmAssignAbilityModal();

    return;

  }


  if(
    action ===
    'save-assignment'
  ){

    saveDmAbilityAssignment();

    return;

  }


  if(
    action ===
    'edit-assignment'
  ){

    openDmAbilityAssignmentEditor(
      button.dataset.linkId
    );

    return;

  }


  if(
    action ===
    'save-assignment-edit'
  ){

    saveDmAbilityAssignmentEdit();

    return;

  }


  if(
    action ===
    'remove-assignment'
  ){

    removeDmAbilityAssignment(
      button.dataset.linkId
    );

    return;

  }


  if(
    action ===
    'add-inventory'
  ){

    openDmInventoryEditor();

    return;

  }


  if(
    action ===
    'edit-inventory'
  ){

    openDmInventoryEditor(
      button.dataset.itemId
    );

    return;

  }


  if(
    action ===
    'save-inventory'
  ){

    saveDmInventoryItem();

    return;

  }


  if(
    action ===
    'delete-inventory'
  ){

    deleteDmInventoryItem(
      button.dataset.itemId
    );

    return;

  }


  if(
    action ===
    'ability-catalog'
  ){

    openDmAbilityCatalog();

    return;

  }


  if(
    action ===
    'close-catalog'
  ){

    dmPerformanceById(
      'dmAbilityCatalogModal'
    )?.remove();


    DM_PERFORMANCE.abilityCatalogOpen =
      false;


    return;

  }


  if(
    action ===
    'add-catalog-ability'
  ){

    openDmCatalogAbilityEditor();

    return;

  }


  if(
    action ===
    'edit-catalog-ability'
  ){

    openDmCatalogAbilityEditor(
      button.dataset.abilityId
    );

    return;

  }


  if(
    action ===
    'save-catalog-ability'
  ){

    saveDmCatalogAbility();

    return;

  }


  if(
    action ===
    'toggle-catalog-ability'
  ){

    toggleDmCatalogAbility(
      button.dataset.abilityId
    );

    return;

  }


  if(
    action ===
    'delete-catalog-ability'
  ){

    deleteDmCatalogAbility(
      button.dataset.abilityId
    );

    return;

  }


  if(
    action ===
    'close-submodal'
  ){

    closeDmPerformanceSubModal();

  }

}


/* =====================================================
   REALTIME
   ===================================================== */

function connectDmPerformanceRealtime(){

  const client =
    dmPerformanceClient();


  if(
    !client ||
    !client.channel
  ){
    return;
  }


  if(
    DM_PERFORMANCE.realtimeChannel
  ){

    client.removeChannel(
      DM_PERFORMANCE.realtimeChannel
    );

  }


  let timer =
    null;


  const refresh =
    () => {

      clearTimeout(
        timer
      );


      timer =
        setTimeout(
          async () => {

            const activeId =
              DM_PERFORMANCE.activeCharacterId;


            const catalogOpen =
              Boolean(
                dmPerformanceById(
                  'dmAbilityCatalogModal'
                )
              );


            await loadDmPerformance();


            if(activeId){

              dmPerformanceById(
                'dmPerformanceCharacterModal'
              )?.remove();


              DM_PERFORMANCE.activeCharacterId =
                activeId;


              openDmCharacterRecord(
                activeId
              );

            }


            if(catalogOpen){

              dmPerformanceById(
                'dmAbilityCatalogModal'
              )?.remove();


              openDmAbilityCatalog();

            }

          },
          150
        );

    };


  let channel =
    client.channel(
      'dm-performance-live'
    );


  [
    'characters',
    'company_files',
    'inventory',
    'character_abilities',
    'abilities'
  ]
    .forEach(
      table => {

        channel =
          channel.on(
            'postgres_changes',
            {
              event:'*',
              schema:'public',
              table
            },
            refresh
          );

      }
    );


  DM_PERFORMANCE.realtimeChannel =
    channel.subscribe();

}


/* =====================================================
   INITIALIZE
   ===================================================== */

async function initializeDmPerformance(){

  if(
    !dmPerformanceById(
      'dmPerformanceMount'
    )
  ){
    return;
  }


  installDmPerformanceStyles();


  document.addEventListener(
    'click',
    handleDmPerformanceClick
  );


  await loadDmPerformance();


  connectDmPerformanceRealtime();

}


document.addEventListener(
  'DOMContentLoaded',
  initializeDmPerformance
);
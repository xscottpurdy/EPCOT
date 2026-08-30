/* =====================================================
   EPCOT DND
   VISTACORP DM HOME

   Owns the Admin Home dashboard only:
   - Live Field Feeds
   - Tonight's Control Deck
   - Current Adventures placeholder
   - Alert Feed
   - Attention Required
   - System Overview
   - Conscience Network

   Reality Control remains in dm-reality-control.js.
   ===================================================== */


/* =====================================================
   CONFIGURATION
   ===================================================== */

const DM_HOME_SKILLS = [
  {
    key:'dreamlight_die',
    label:'Dreamlight',
    short:'DR'
  },
  {
    key:'heartline_die',
    label:'Heartline',
    short:'HL'
  },
  {
    key:'mindwave_die',
    label:'Mindwave',
    short:'MW'
  },
  {
    key:'bravura_die',
    label:'Bravura',
    short:'BR'
  },
  {
    key:'craftspark_die',
    label:'Craftspark',
    short:'CS'
  },
  {
    key:'starpath_die',
    label:'Starpath',
    short:'SP'
  }
];


const DM_HOME_RELATIONSHIPS = [
  {
    min:0,
    max:10,
    label:'HOSTILE',
    color:'#a64141'
  },
  {
    min:11,
    max:20,
    label:'AGGRESSIVE',
    color:'#c45a45'
  },
  {
    min:21,
    max:30,
    label:'UNFRIENDLY',
    color:'#d47b4c'
  },
  {
    min:31,
    max:40,
    label:'DISLIKED',
    color:'#d7a04f'
  },
  {
    min:41,
    max:50,
    label:'NEUTRAL',
    color:'#9b9c89'
  },
  {
    min:51,
    max:60,
    label:'LIKED',
    color:'#78a982'
  },
  {
    min:61,
    max:70,
    label:'FRIENDLY',
    color:'#54b59a'
  },
  {
    min:71,
    max:89,
    label:'TRUSTWORTHY',
    color:'#45a9b5'
  },
{
  min:90,
  max:100,
  label:'LOYAL',
  color:'#655bb5'
}
];


const DM_HOME_COMPANIES = [
  'Progress Dynamics',
  'VistaCorp',
  'Monsanto',
  'Fordham Mobility',
  'WestHouse Systems',
  'Disney Enterprises',
  'Unaffiliated'
];


const DM_HOME_COMPANY_COLORS = [
  '#45a9b5',
  '#d6a64b',
  '#76aa82',
  '#8a78b6',
  '#bb765d',
  '#5a91c4',
  '#8b918e'
];


const DM_HOME_STATUS_COLORS = {

  discovered:
    '#45a9b5',

  undiscovered:
    '#59656a',

  reassigned:
    '#9e3d48'

};


/* =====================================================
   STATE
   ===================================================== */

const DM_HOME = {

  profiles: [],

  assignments: [],

  states: [],

  characters: [],

  companyFiles: [],

  objectives: [],

  subitems: [],

  favorites: [],

  journalPosts: [],

  abilities: [],

  characterAbilities: [],

  npcs: [],

  npcCampaignStates: [],

  notes:
    '',

  notesSaving:
    false,

  notesSaveTimer:
    null,

  relationshipCampaign:
    'hero',

  personnelStatusMode:
    'total',

  realtimeChannel:
    null,

  realtimeTimer:
    null,

  initialized:
    false

};


/* =====================================================
   HELPERS
   ===================================================== */

function dmHomeById(id){

  return document.getElementById(id);

}


function dmHomeClient(){

  return window.epcotAuth?.client || null;

}


function dmHomeEscape(value){

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


function dmHomeNumber(
  value,
  fallback = 0
){

  const number =
    Number(value);


  return Number.isFinite(number)
    ? number
    : fallback;

}


function dmHomeAverage(values){

  const valid =
    values
      .map(
        value =>
          Number(value)
      )
      .filter(
        Number.isFinite
      );


  if(!valid.length){

    return 0;

  }


  return valid.reduce(
    (
      sum,
      value
    ) =>
      sum + value,
    0
  ) / valid.length;

}


function dmHomeRound(
  value,
  digits = 1
){

  const factor =
    10 ** digits;


  return Math.round(
    value * factor
  ) / factor;

}


function dmHomeFormatTimestamp(
  timestamp
){

  const date =
    new Date(timestamp);


  if(
    Number.isNaN(
      date.getTime()
    )
  ){

    return '';

  }


  return date.toLocaleString(
    [],
    {
      month:'short',
      day:'numeric',
      hour:'numeric',
      minute:'2-digit'
    }
  );

}


function dmHomeTruncate(
  value,
  length = 180
){

  const text =
    String(
      value ?? ''
    ).trim();


  return text.length > length

    ? `${text.slice(
        0,
        length
      ).trim()}…`

    : text;

}


function dmHomeNavigate(view){

  const missionCampaign =
    view === 'hero-adventures'
      ? 'hero'
      : view === 'villain-adventures'
        ? 'villain'
        : null;


  if(missionCampaign){

    document
      .querySelector(
        '.dm-nav-button[data-dm-view="missions"]'
      )
      ?.click();


    document
      .querySelector(
        `[data-mission-campaign="${missionCampaign}"]`
      )
      ?.click();


    return;

  }


  document
    .querySelector(
      `.dm-nav-button[data-dm-view="${view}"]`
    )
    ?.click();

}


function sanitizeDmHomeRichText(
  html
){

  const wrapper =
    document.createElement(
      'div'
    );


  wrapper.innerHTML =
    html || '';


  const allowed =
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
          !allowed.has(
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


        [
          ...element.attributes
        ]
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


function dmHomePanelError(
  title,
  error
){

  return `

    <div class="dm-home-error">

      <strong>
        ${dmHomeEscape(title)}
      </strong>

      <span>
        ${dmHomeEscape(
          error?.message ||
          String(error)
        )}
      </span>

    </div>

  `;

}


/* =====================================================
   LOOKUPS
   ===================================================== */

function dmHomeAssignment(
  accountId
){

  return DM_HOME.assignments.find(
    row =>
      row.account_id ===
      accountId
  ) || null;

}


function dmHomeState(
  accountId
){

  return DM_HOME.states.find(
    row =>
      row.account_id ===
      accountId
  ) || null;

}


function dmHomeCharacter(
  characterId
){

  return DM_HOME.characters.find(
    row =>
      row.id ===
      characterId
  ) || null;

}


function dmHomeCompanyFile(
  characterId
){

  return DM_HOME.companyFiles.find(
    row =>
      row.character_id ===
      characterId
  ) || null;

}


function dmHomeObjective(
  objectiveId
){

  return DM_HOME.objectives.find(
    row =>
      row.id ===
      objectiveId
  ) || null;

}


function dmHomeSubitem(
  subitemId
){

  return DM_HOME.subitems.find(
    row =>
      row.id ===
      subitemId
  ) || null;

}


function dmHomeAbility(
  abilityId
){

  return DM_HOME.abilities.find(
    row =>
      row.id ===
      abilityId
  ) || null;

}


function dmHomeNpcState(
  npcId,
  campaign
){

  return DM_HOME
    .npcCampaignStates
    .find(
      row =>
        row.npc_id === npcId
        &&
        row.campaign === campaign
    ) || null;

}


function dmHomeAssignedCharacterIds(){

  return new Set(

    DM_HOME.assignments
      .flatMap(
        row => [
          row.hero_character_id,
          row.villain_character_id
        ]
      )
      .filter(Boolean)

  );

}


function dmHomeAssignedCharacters(){

  const ids =
    dmHomeAssignedCharacterIds();


  return DM_HOME.characters.filter(
    character =>
      ids.has(
        character.id
      )
  );

}


function dmHomeCampaignCharacterIds(
  campaign
){

  return new Set(

    DM_HOME.assignments
      .map(
        row =>
          campaign === 'villain'
            ? row.villain_character_id
            : row.hero_character_id
      )
      .filter(Boolean)

  );

}


/* =====================================================
   DATA LOAD
   ===================================================== */

async function loadDmHomeData(){

  const client =
    dmHomeClient();


  if(!client){
    return;
  }


  const results =
    await Promise.all([

      client
        .from('accounts')
        .select('*')
        .eq('role','player')
        .eq('active',true)
        .order('display_name'),


      client
        .from('player_reality_state')
        .select('*'),


      client
        .from('characters')
        .select('*'),


      client
        .from('company_files')
        .select('*'),


      client
        .from('objectives')
        .select('*'),


      client
        .from('objective_subitems')
        .select('*'),


      client
        .from('objective_favorites')
        .select('*'),


      client
        .from('journal_posts')
        .select(`
          id,
          campaign,
          reality_posted,
          author_character_id,
          author_name,
          author_image_url,
          content,
          created_at
        `)
        .order(
          'created_at',
          {
            ascending:false
          }
        )
        .limit(10),


      client
        .from('abilities')
        .select('*'),


      client
        .from('character_abilities')
        .select('*'),


      client
        .from('npcs')
        .select('*')
        .order(
          'name_cast',
          {
            ascending:true
          }
        ),


      client
        .from('npc_campaign_state')
        .select('*'),


      client
        .from('dm_home_notes')
        .select('*')
        .eq(
          'id',
          'tonight'
        )
        .maybeSingle()

    ]);


  const failed =
    results.find(
      result =>
        result.error
    );


  if(failed){
    throw failed.error;
  }


  const [
    profiles,
    states,
    characters,
    companyFiles,
    objectives,
    subitems,
    favorites,
    journalPosts,
    abilities,
    characterAbilities,
    npcs,
    npcCampaignStates,
    notes
  ] =
    results;


  DM_HOME.profiles =
    profiles.data || [];


  DM_HOME.states =
    states.data || [];


  DM_HOME.characters =
    characters.data || [];


  /*
    Build the old assignment shape locally.

    There is no player_characters table anymore.

    Each account owns one Hero and one Villain
    directly through characters.account_id.
  */

  DM_HOME.assignments =
    DM_HOME.profiles.map(
      profile => {

        const hero =
          DM_HOME.characters.find(
            character =>
              character.account_id ===
                profile.id
              &&
              character.campaign ===
                'hero'
          );


        const villain =
          DM_HOME.characters.find(
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


  DM_HOME.companyFiles =
    companyFiles.data || [];


  DM_HOME.objectives =
    objectives.data || [];


  DM_HOME.subitems =
    subitems.data || [];


  DM_HOME.favorites =
    favorites.data || [];


  DM_HOME.journalPosts =
    journalPosts.data || [];


  DM_HOME.abilities =
    abilities.data || [];


  DM_HOME.characterAbilities =
    characterAbilities.data || [];


  DM_HOME.npcs =
    npcs.data || [];


  DM_HOME.npcCampaignStates =
    npcCampaignStates.data || [];

DM_HOME.notes =
  notes.data?.content ||
  '';

}


/* =====================================================
   CURRENT ADVENTURES
   ===================================================== */

/* =====================================================
   CURRENT ADVENTURES
   ===================================================== */

const DM_HOME_ADVENTURE_SAVE_TIMERS = {
  hero:null,
  villain:null
};


function dmHomeAdventureCampaignLabel(
  campaign
){

  return (
    campaign === 'villain'
      ? 'Villain Campaign'
      : 'Hero Campaign'
  );

}


function dmHomeAdventureDesk(
  campaign
){

  return (
    campaign === 'villain'

      ? window.epcotAdventureDesk
          ?.villain

      : window.epcotAdventureDesk
          ?.hero
  );

}


function dmHomeAdventureChapter(
  chapters,
  chapterId
){

  return (
    chapters.find(
      chapter =>
        chapter.id ===
        chapterId
    ) ||
    null
  );

}


function dmHomeAdventureOrderedModules(
  chapters,
  modules,
  campaign
){

  const campaignChapters =
    chapters
      .filter(
        chapter =>
          chapter.campaign ===
          campaign
      )
      .sort(
        (a,b) => {

          if(
            a.sort_order !==
            b.sort_order
          ){

            return (
              a.sort_order -
              b.sort_order
            );

          }

          return String(
            a.created_at
          )
            .localeCompare(
              String(
                b.created_at
              )
            );

        }
      );


  const ordered =
    [];


  campaignChapters
    .forEach(
      chapter => {

        const chapterModules =
          modules
            .filter(
              module =>
                module.campaign ===
                  campaign &&
                module.chapter_id ===
                  chapter.id
            )
            .sort(
              (a,b) => {

                if(
                  a.sort_order !==
                  b.sort_order
                ){

                  return (
                    a.sort_order -
                    b.sort_order
                  );

                }

                return String(
                  a.created_at
                )
                  .localeCompare(
                    String(
                      b.created_at
                    )
                  );

              }
            );


        ordered.push(
          ...chapterModules
        );

      }
    );


  return ordered;

}


function dmHomeAdventureCardMarkup({
  campaign,
  chapters,
  modules
}){

  const ordered =
    dmHomeAdventureOrderedModules(
      chapters,
      modules,
      campaign
    );


  const current =
    ordered.find(
      module =>
        module.is_starred ===
        true
    ) ||
    null;


  const campaignLabel =
    dmHomeAdventureCampaignLabel(
      campaign
    );


  if(!current){

    return `

      <article
        class="
          dm-adventure-card
          ${campaign}
          dm-current-adventure-card
          is-empty
        "
      >

        <div class="dm-adventure-symbol">

          ${
            campaign === 'villain'
              ? 'V'
              : 'H'
          }

        </div>


        <div
          class="dm-current-adventure-main"
        >

          <div
            class="dm-adventure-type"
          >
            ${campaignLabel}
          </div>


          <div
            class="dm-adventure-name"
          >
            No Current Module
          </div>


          <div
            class="dm-adventure-session"
          >
            Star a module in the
            ${campaignLabel}
            Adventure Book to make it
            appear here.
          </div>

        </div>


        <button
          class="dm-adventure-open"
          type="button"
          data-dm-open-view="${campaign}-adventures"
        >
          Open Desk →
        </button>

      </article>

    `;

  }


  const chapter =
    dmHomeAdventureChapter(
      chapters,
      current.chapter_id
    );


  const index =
    ordered.findIndex(
      module =>
        module.id ===
        current.id
    );


  const previous =
    index > 0
      ? ordered[index - 1]
      : null;


  const next =
    (
      index >= 0 &&
      index <
        ordered.length - 1
    )
      ? ordered[index + 1]
      : null;


  const safeContent =
    sanitizeDmHomeRichText(
      current.content_html ||
      ''
    );


  return `

    <article
      class="
        dm-adventure-card
        ${campaign}
        dm-current-adventure-card
      "
      data-dm-current-adventure="${campaign}"
    >

      <div class="dm-adventure-symbol">

        ${
          campaign === 'villain'
            ? 'V'
            : 'H'
        }

      </div>


      <div
        class="dm-current-adventure-main"
      >

        <div
          class="dm-current-adventure-heading"
        >

          <div>

            <div
              class="dm-adventure-type"
            >
              ${campaignLabel}
            </div>


            <div
              class="dm-current-adventure-chapter"
            >

              ${dmHomeEscape(
                chapter?.chapter_label ||
                'Chapter'
              )}

              ·

              ${dmHomeEscape(
                chapter?.title ||
                'Untitled Chapter'
              )}

            </div>


            <div
              class="dm-adventure-name"
            >

              ★

              ${dmHomeEscape(
                current.module_label ||
                'Module'
              )}

              ·

              ${dmHomeEscape(
                current.title ||
                'Untitled Module'
              )}

            </div>

          </div>


          <div
            class="dm-current-adventure-position"
          >
            ${index + 1}
            /
            ${ordered.length}
          </div>

        </div>


        <div
          class="
            dm-current-adventure-preview
          "
          contenteditable="true"
          spellcheck="true"
          data-dm-adventure-preview="${campaign}"
          data-module-id="${current.id}"
          data-placeholder="Add quick session notes..."
        >${safeContent}</div>


        <div
          class="dm-current-adventure-save"
          data-dm-adventure-save-status="${campaign}"
        >
          Quick Edit Ready
        </div>


        <div
          class="dm-current-adventure-controls"
        >

          <button
            class="dm-adventure-page-mini"
            type="button"
            data-dm-adventure-action="previous"
            data-campaign="${campaign}"
            data-module-id="${
              previous?.id ||
              ''
            }"
            ${
              previous
                ? ''
                : 'disabled'
            }
          >
            ← Previous
          </button>


          <button
            class="
              dm-adventure-page-mini
              primary
            "
            type="button"
            data-dm-adventure-action="open"
            data-campaign="${campaign}"
            data-module-id="${current.id}"
          >
            Open Module ↗
          </button>


          <button
            class="dm-adventure-page-mini"
            type="button"
            data-dm-adventure-action="next"
            data-campaign="${campaign}"
            data-module-id="${
              next?.id ||
              ''
            }"
            ${
              next
                ? ''
                : 'disabled'
            }
          >
            Next →
          </button>

        </div>

      </div>


      <button
        class="dm-adventure-open"
        type="button"
        data-dm-open-view="${campaign}-adventures"
      >
        Open Desk →
      </button>

    </article>

  `;

}


async function dmHomeLoadAdventureData(){

  const client =
    dmHomeClient();


  if(!client){

    throw new Error(
      'Supabase client unavailable.'
    );

  }


  const [
    chaptersResult,
    modulesResult
  ] =
    await Promise.all([

      client
        .from(
          'adventure_chapters'
        )
        .select('*')
        .order(
          'sort_order',
          {
            ascending:true
          }
        ),

      client
        .from(
          'adventure_modules'
        )
        .select('*')
        .order(
          'sort_order',
          {
            ascending:true
          }
        )

    ]);


  if(chaptersResult.error){

    throw chaptersResult.error;

  }


  if(modulesResult.error){

    throw modulesResult.error;

  }


  return {

    chapters:
      chaptersResult.data ||
      [],

    modules:
      modulesResult.data ||
      []

  };

}


async function dmHomeSetCurrentAdventure(
  campaign,
  moduleId
){

  if(!moduleId){
    return;
  }


  const client =
    dmHomeClient();


  if(!client){
    return;
  }


  try{

    const {
      error:clearError
    } =
      await client

        .from(
          'adventure_modules'
        )

        .update({
          is_starred:false
        })

        .eq(
          'campaign',
          campaign
        )

        .eq(
          'is_starred',
          true
        );


    if(clearError){

      throw clearError;

    }


    const {
      error:setError
    } =
      await client

        .from(
          'adventure_modules'
        )

        .update({

          is_starred:true,

          updated_at:
            new Date()
              .toISOString()

        })

        .eq(
          'id',
          moduleId
        )

        .eq(
          'campaign',
          campaign
        );


    if(setError){

      throw setError;

    }


    const desk =
      dmHomeAdventureDesk(
        campaign
      );


    if(desk){

      await desk.loadData();

      desk.render();

    }


    await renderDmCurrentAdventures();


    document.dispatchEvent(

      new CustomEvent(
        'epcot:adventure-current-changed',
        {

          detail:{

            campaign,

            moduleId

          }

        }
      )

    );

  }
  catch(error){

    console.error(
      'Current Adventure update failed:',
      error
    );


    alert(
      `Current Adventure could not be changed.\n\n${
        error?.message ||
        String(error)
      }`
    );

  }

}


async function dmHomeOpenAdventureModule(
  campaign,
  moduleId
){

  if(!moduleId){
    return;
  }


  try{

    const desk =
      dmHomeAdventureDesk(
        campaign
      );


    if(!desk){

      throw new Error(
        'Adventure Desk is not ready.'
      );

    }


    await desk.loadData();

    desk.render();


    desk.openPopout(
      moduleId
    );

  }
  catch(error){

    console.error(
      'Adventure module pop-out failed:',
      error
    );


    alert(
      `Adventure Module could not be opened.\n\n${
        error?.message ||
        String(error)
      }`
    );

  }

}


async function dmHomeSaveAdventurePreview(
  campaign,
  moduleId,
  editor
){

  const client =
    dmHomeClient();


  const status =
    dmHomeById(
      'dmCurrentAdventuresMount'
    )
      ?.querySelector(
        `[data-dm-adventure-save-status="${campaign}"]`
      );


  if(
    !client ||
    !editor ||
    !moduleId
  ){

    return;

  }


  if(status){

    status.textContent =
      'Saving...';

  }


  try{

    const content =
      sanitizeDmHomeRichText(
        editor.innerHTML
      );


    const {
      error
    } =
      await client

        .from(
          'adventure_modules'
        )

        .update({

          content_html:
            content,

          updated_at:
            new Date()
              .toISOString()

        })

        .eq(
          'id',
          moduleId
        )

        .eq(
          'campaign',
          campaign
        );


    if(error){

      throw error;

    }


    const desk =
      dmHomeAdventureDesk(
        campaign
      );


    const module =
      desk?.modules
        ?.find(
          item =>
            item.id ===
            moduleId
        );


    if(module){

      module.content_html =
        content;

    }


    if(status){

      status.textContent =
        'Saved';

    }


    window.setTimeout(
      () => {

        const currentStatus =
          dmHomeById(
            'dmCurrentAdventuresMount'
          )
            ?.querySelector(
              `[data-dm-adventure-save-status="${campaign}"]`
            );


        if(currentStatus){

          currentStatus.textContent =
            'Quick Edit Ready';

        }

      },
      1200
    );

  }
  catch(error){

    console.error(
      'Adventure Home quick edit failed:',
      error
    );


    if(status){

      status.textContent =
        'Save Failed';

    }

  }

}


function dmHomeScheduleAdventurePreviewSave(
  campaign,
  moduleId,
  editor
){

  const status =
    dmHomeById(
      'dmCurrentAdventuresMount'
    )
      ?.querySelector(
        `[data-dm-adventure-save-status="${campaign}"]`
      );


  if(status){

    status.textContent =
      'Unsaved Changes';

  }


  clearTimeout(
    DM_HOME_ADVENTURE_SAVE_TIMERS[
      campaign
    ]
  );


  DM_HOME_ADVENTURE_SAVE_TIMERS[
    campaign
  ] =
    window.setTimeout(
      () => {

        dmHomeSaveAdventurePreview(
          campaign,
          moduleId,
          editor
        );

      },
      750
    );

}


function connectDmCurrentAdventureControls(){

  const mount =
    dmHomeById(
      'dmCurrentAdventuresMount'
    );


  if(!mount){
    return;
  }


  mount
    .querySelectorAll(
      '[data-dm-adventure-action]'
    )
    .forEach(
      button => {

        button.addEventListener(
          'click',
          async () => {

            const action =
              button.dataset
                .dmAdventureAction;


            const campaign =
              button.dataset
                .campaign ===
                'villain'

                ? 'villain'

                : 'hero';


            const moduleId =
              button.dataset
                .moduleId;


            if(
              action ===
                'previous' ||
              action ===
                'next'
            ){

              await dmHomeSetCurrentAdventure(
                campaign,
                moduleId
              );


              return;

            }


            if(
              action ===
              'open'
            ){

              await dmHomeOpenAdventureModule(
                campaign,
                moduleId
              );

            }

          }
        );

      }
    );


  mount
    .querySelectorAll(
      '[data-dm-adventure-preview]'
    )
    .forEach(
      editor => {

        editor.addEventListener(
          'input',
          () => {

            const campaign =
              editor.dataset
                .dmAdventurePreview ===
                'villain'

                ? 'villain'

                : 'hero';


            dmHomeScheduleAdventurePreviewSave(

              campaign,

              editor.dataset
                .moduleId,

              editor

            );

          }
        );

      }
    );

}


async function renderDmCurrentAdventures(){

  const mount =
    dmHomeById(
      'dmCurrentAdventuresMount'
    );


  if(!mount){

    return;

  }


  mount.innerHTML = `

    <header class="dm-panel-header">

      <div>

        <h2 class="dm-panel-title">
          Current Adventures
        </h2>

        <div class="dm-panel-subtitle">
          Active Adventure Modules
        </div>

      </div>

      <div class="dm-panel-status">
        Live
      </div>

    </header>


    <div
      class="dm-current-adventure-loading"
    >
      Loading current modules...
    </div>

  `;


  try{

    const {
      chapters,
      modules
    } =
      await dmHomeLoadAdventureData();


    mount.innerHTML = `

      <header class="dm-panel-header">

        <div>

          <h2 class="dm-panel-title">
            Current Adventures
          </h2>

          <div class="dm-panel-subtitle">
            Active Adventure Modules
          </div>

        </div>

        <div class="dm-panel-status">
          Live
        </div>

      </header>


      <div class="dm-adventure-list">

        ${dmHomeAdventureCardMarkup({

          campaign:'hero',

          chapters,

          modules

        })}


        ${dmHomeAdventureCardMarkup({

          campaign:'villain',

          chapters,

          modules

        })}

      </div>

    `;


    connectDmCurrentAdventureControls();

  }
  catch(error){

    console.error(
      'Current Adventures failed to load:',
      error
    );


    mount.innerHTML = `

      <header class="dm-panel-header">

        <div>

          <h2 class="dm-panel-title">
            Current Adventures
          </h2>

          <div class="dm-panel-subtitle">
            Adventure Connection Error
          </div>

        </div>

        <div class="dm-panel-status">
          Offline
        </div>

      </header>


      <div
        class="dm-current-adventure-error"
      >

        Current Adventure modules
        could not be loaded.

        <br><br>

        ${dmHomeEscape(
          error?.message ||
          'Unknown error'
        )}

      </div>

    `;

  }

}

/* =====================================================
   LIVE FIELD FEEDS
   ===================================================== */

function getDmFieldPlayerState(
  profile
){

  const assignment =
    dmHomeAssignment(
      profile.id
    );


  const state =
    dmHomeState(
      profile.id
    );


  const campaign =
    state?.campaign ===
    'villain'
      ? 'villain'
      : 'hero';


  const reality =
    state?.reality ===
    'unbound'
      ? 'unbound'
      : 'cast';


  const characterId =
    campaign ===
    'villain'

      ? assignment?.villain_character_id

      : assignment?.hero_character_id;


  return {

    profile,

    assignment,

    state,

    campaign,

    reality,

    character:
      dmHomeCharacter(
        characterId
      ),

    companyFile:
      dmHomeCompanyFile(
        characterId
      )

  };

}


function getDmFieldDisplayName(
  feed
){

  if(
    feed.reality ===
    'unbound'
  ){

    return (
      feed.companyFile
        ?.unbound_display_name
      ||
      feed.companyFile
        ?.display_name
      ||
      feed.character
        ?.name
      ||
      'Unknown Explorer'
    );

  }


  return (
    feed.companyFile
      ?.display_name
    ||
    feed.character
      ?.name
    ||
    'Unknown Explorer'
  );

}


function getDmFieldImage(
  feed
){

  if(
    feed.reality ===
    'unbound'
  ){

    return (
      feed.companyFile
        ?.unbound_image_url
      ||
      feed.character
        ?.unbound_portrait_url
      ||
      feed.character
        ?.portrait_url
      ||
      feed.companyFile
        ?.image_url
      ||
      ''
    );

  }


  return (
    feed.companyFile
      ?.image_url
    ||
    feed.character
      ?.cast_portrait_url
    ||
    feed.character
      ?.portrait_url
    ||
    feed.companyFile
      ?.unbound_image_url
    ||
    ''
  );

}


function renderDmFieldStat(
  label,
  value
){

  return `

    <div class="dm-field-stat">

      <span>
        ${dmHomeEscape(label)}
      </span>

      <strong>
        ${dmHomeEscape(
          value ?? '—'
        )}
      </strong>

    </div>

  `;

}


function renderDmFieldNsbiStats(
  feed
){

  const character =
    feed.character;


  if(!character){

    return `

      <div class="dm-field-no-record">
        No Performance Record assigned.
      </div>

    `;

  }


  return `

    <div class="dm-field-core-stats">

      ${renderDmFieldStat(
        'LVL',
        character.level ?? 1
      )}

      ${renderDmFieldStat(
        'ALIGN',
        character.alignment ?? 0
      )}

      ${renderDmFieldStat(
        'EXH',
        character.exhaustion ?? 0
      )}

    </div>


    <div class="dm-field-skill-grid">

      ${DM_HOME_SKILLS
        .map(
          skill =>
            renderDmFieldStat(
              skill.short,

              character[skill.key]
                ? `d${character[skill.key]}`
                : '—'
            )
        )
        .join('')
      }

    </div>

  `;

}


function renderDmFieldFeedCard(
  feed
){

  const displayName =
    getDmFieldDisplayName(
      feed
    );


  const image =
    getDmFieldImage(
      feed
    );


  const realityLabel =
    `${
      feed.campaign === 'villain'
        ? 'VILLAIN'
        : 'HERO'
    } // ${
      feed.reality === 'unbound'
        ? 'UNBOUND'
        : 'CAST'
    }`;


  return `

    <article
      class="
        dm-field-card
        dm-field-${feed.campaign}
        dm-field-${feed.reality}
      "
    >

      <div class="dm-field-camera">

        ${
          image
            ? `
                <img
                  src="${dmHomeEscape(image)}"
                  alt="${dmHomeEscape(displayName)}"
                >
              `
            : `
                <div class="dm-field-no-image">

                  <span>
                    NO VISUAL
                  </span>

                </div>
              `
        }


        <div class="dm-field-rec">

          <span
            class="dm-field-rec-light"
          ></span>

          LIVE

        </div>


        <div class="dm-field-reality">
          ${dmHomeEscape(realityLabel)}
        </div>

      </div>


      <div class="dm-field-identity">

        <div>

          <div class="dm-field-player-name">

            ${dmHomeEscape(
              feed.profile
                ?.display_name ||
              'Explorer'
            )}

          </div>

          <div class="dm-field-character-name">
            ${dmHomeEscape(displayName)}
          </div>

        </div>


        <span
          class="
            dm-field-status-light
            ${
              feed.state
                ? 'is-connected'
                : ''
            }
          "
          aria-hidden="true"
        ></span>

      </div>


      <div class="dm-field-performance">

        ${renderDmFieldNsbiStats(
          feed
        )}

      </div>

    </article>

  `;

}


function getDmActiveObjectiveCount(){

  return DM_HOME.objectives.filter(
    objective =>
      !objective.archived
      &&
      !objective.completed
  ).length;

}


function getDmDiscoveredNpcCount(){

  return DM_HOME.npcs.filter(
    npc => {

      if(
        npc.is_reassigned
      ){

        return false;

      }


      return (
        Boolean(
          dmHomeNpcState(
            npc.id,
            'hero'
          )?.is_visible
        )
        ||
        Boolean(
          dmHomeNpcState(
            npc.id,
            'villain'
          )?.is_visible
        )
      );

    }
  ).length;

}


function renderDmFieldStatusStrip(
  feeds
){

  const heroCount =
    feeds.filter(
      feed =>
        feed.campaign ===
        'hero'
    ).length;


  const villainCount =
    feeds.filter(
      feed =>
        feed.campaign ===
        'villain'
    ).length;


  const castCount =
    feeds.filter(
      feed =>
        feed.reality ===
        'cast'
    ).length;


  const unboundCount =
    feeds.filter(
      feed =>
        feed.reality ===
        'unbound'
    ).length;


  const metrics = [

    [
      feeds.length,
      'Explorers'
    ],

    [
      heroCount,
      'Hero'
    ],

    [
      villainCount,
      'Villain'
    ],

    [
      castCount,
      'Cast'
    ],

    [
      unboundCount,
      'Unbound'
    ],

    [
      getDmActiveObjectiveCount(),
      'Active Objectives'
    ],

    [
      getDmDiscoveredNpcCount(),
      'NPCs Discovered'
    ]

  ];


  return `

    <div class="dm-field-status-strip">

      ${metrics
        .map(
          (
            [
              value,
              label
            ]
          ) => `

            <div>

              <strong>
                ${dmHomeEscape(value)}
              </strong>

              <span>
                ${dmHomeEscape(label)}
              </span>

            </div>

          `
        )
        .join('')
      }

    </div>

  `;

}


function renderDmFieldFeeds(){

  const mount =
    dmHomeById(
      'dmFieldFeedsMount'
    );


  if(!mount){

    return;

  }


  const feeds =
    DM_HOME.profiles.map(
      getDmFieldPlayerState
    );


  mount.innerHTML = `

    <header class="dm-panel-header">

      <div>

        <h2 class="dm-panel-title">
          Live Field Feeds
        </h2>

        <div class="dm-panel-subtitle">
          VistaCorp Observation Network
        </div>

      </div>


      <div class="dm-panel-status">

        <span
          class="dm-field-header-light"
        ></span>

        Live Monitoring

      </div>

    </header>


    ${renderDmFieldStatusStrip(
      feeds
    )}


    ${
      feeds.length

        ? `
            <div class="dm-field-feed-layout">

              ${feeds
                .map(
                  renderDmFieldFeedCard
                )
                .join('')
              }

            </div>
          `

        : `
            <div class="dm-field-empty">
              No active explorers are currently assigned.
            </div>
          `
    }

  `;

}


/* =====================================================
   TONIGHT'S CONTROL DECK
   ===================================================== */

function resolveDmFavorite(
  favorite
){

  if(
    favorite.objective_id
  ){

    const objective =
      dmHomeObjective(
        favorite.objective_id
      );


    if(!objective){

      return null;

    }


    return {

      key:
        `objective:${objective.id}`,

      campaign:
        objective.campaign ===
        'villain'
          ? 'villain'
          : 'hero',

      name:
        objective.name,

      parentName:
        null,

      completed:
        Boolean(
          objective.completed
        ),

      characterId:
        favorite.character_id

    };

  }


  if(
    favorite.subobjective_id
  ){

    const subitem =
      dmHomeSubitem(
        favorite.subobjective_id
      );


    const parent =
      subitem
        ? dmHomeObjective(
            subitem.objective_id
          )
        : null;


    if(
      !subitem ||
      !parent
    ){

      return null;

    }


    return {

      key:
        `subitem:${subitem.id}`,

      campaign:
        parent.campaign ===
        'villain'
          ? 'villain'
          : 'hero',

      name:
        subitem.name,

      parentName:
        parent.name,

      completed:
        Boolean(
          subitem.completed
        ),

      characterId:
        favorite.character_id

    };

  }


  return null;

}


function getDmTopFavorites(
  campaign
){

  const campaignCharacterIds =
    dmHomeCampaignCharacterIds(
      campaign
    );


  const grouped =
    new Map();


  DM_HOME.favorites
    .map(
      resolveDmFavorite
    )
    .filter(
      item =>
        item
        &&
        item.campaign ===
        campaign
        &&
        campaignCharacterIds.has(
          item.characterId
        )
    )
    .forEach(
      item => {

        if(
          !grouped.has(
            item.key
          )
        ){

          grouped.set(
            item.key,
            {

              ...item,

              characterIds:
                new Set()

            }
          );

        }


        grouped
          .get(
            item.key
          )
          .characterIds
          .add(
            item.characterId
          );

      }
    );


  return [
    ...grouped.values()
  ]
    .map(
      item => ({

        ...item,

        count:
          item
            .characterIds
            .size

      })
    )
    .sort(
      (
        a,
        b
      ) =>
        b.count -
        a.count
        ||
        Number(
          a.completed
        ) -
        Number(
          b.completed
        )
        ||
        String(
          a.name
        )
          .localeCompare(
            String(
              b.name
            )
          )
    )
    .slice(
      0,
      3
    );

}


function renderDmFavoriteSlot(
  campaign,
  item
){

  if(!item){

    return `

      <div
        class="
          dm-tonight-objective
          ${campaign}
          is-empty
        "
      >

        <span class="dm-tonight-star">
          ☆
        </span>


        <div class="dm-tonight-objective-copy">

          <strong>
            No Starred Objective
          </strong>

          <span>
            No player selection
          </span>

        </div>

      </div>

    `;

  }


  return `

    <div
      class="
        dm-tonight-objective
        ${campaign}
        ${
          item.completed
            ? 'is-complete'
            : ''
        }
      "
    >

      <span class="dm-tonight-star">
        ★
      </span>


      <div class="dm-tonight-objective-copy">

        <strong>
          ${dmHomeEscape(
            item.name
          )}
        </strong>

        <span>

          ${
            item.parentName

              ? `Sub-objective of ${
                  dmHomeEscape(
                    item.parentName
                  )
                }`

              : 'Campaign Objective'
          }

        </span>

      </div>


      <div class="dm-tonight-star-count">

        ${item.count}

        <span>

          ${
            item.count === 1
              ? 'PLAYER'
              : 'PLAYERS'
          }

        </span>

      </div>

    </div>

  `;

}


function renderDmFavoriteList(
  campaign
){

  const items = [
    ...getDmTopFavorites(
      campaign
    )
  ];


  while(
    items.length < 3
  ){

    items.push(
      null
    );

  }


  return items
    .map(
      item =>
        renderDmFavoriteSlot(
          campaign,
          item
        )
    )
    .join('');

}


function renderDmTonightControl(){

  const mount =
    dmHomeById(
      'dmTonightControlMount'
    );


  if(!mount){

    return;

  }


  mount.innerHTML = `

    <header class="dm-panel-header">

      <div>

        <h2 class="dm-panel-title">
          Tonight's Control Deck
        </h2>

        <div class="dm-panel-subtitle">
          Immediate Session Priorities
        </div>

      </div>


      <div
        class="dm-panel-status"
        id="dmTonightSaveStatus"
      >
        Notes Ready
      </div>

    </header>


    <div class="dm-tonight-layout">


      <section class="dm-tonight-notes">

        <div class="dm-tonight-section-head">

          <div>

            <div class="dm-tonight-kicker">
              DM Memory Buffer
            </div>

            <h3>
              Tonight's Notes
            </h3>

          </div>


          <button
            class="dm-tonight-clear"
            type="button"
            data-dm-tonight-action="clear-notes"
          >
            Clear Notes
          </button>

        </div>


        <div class="dm-tonight-format-toolbar">

          <button
            type="button"
            data-dm-tonight-command="bold"
            title="Bold"
          >
            <strong>B</strong>
          </button>

          <button
            type="button"
            data-dm-tonight-command="italic"
            title="Italic"
          >
            <em>I</em>
          </button>

          <button
            type="button"
            data-dm-tonight-command="underline"
            title="Underline"
          >
            <u>U</u>
          </button>

          <button
            type="button"
            data-dm-tonight-command="insertUnorderedList"
            title="Bulleted List"
          >
            • List
          </button>

          <button
            type="button"
            data-dm-tonight-command="insertOrderedList"
            title="Numbered List"
          >
            1. List
          </button>

        </div>


        <div
          class="dm-tonight-editor"
          id="dmTonightNotesEditor"
          contenteditable="true"
          data-placeholder="What do you need to remember tonight?"
          aria-label="Tonight's Notes"
        >${sanitizeDmHomeRichText(
          DM_HOME.notes
        )}</div>


        <div class="dm-tonight-note-help">
          Saves automatically while you type.
          Clear it when the session is over.
        </div>

      </section>



      <section class="dm-tonight-priorities">

        <div class="dm-tonight-section-head">

          <div>

            <div class="dm-tonight-kicker">
              Priority Directives
            </div>

            <h3>
              Player-Starred Objectives
            </h3>

          </div>

        </div>


        <div class="dm-tonight-campaigns">


          <div class="dm-tonight-campaign">

            <div
              class="
                dm-tonight-campaign-head
                hero
              "
            >

              <span>
                Hero Campaign
              </span>

              <strong>
                Top 3
              </strong>

            </div>

            <div class="dm-tonight-objective-list">

              ${renderDmFavoriteList(
                'hero'
              )}

            </div>

          </div>



          <div class="dm-tonight-campaign">

            <div
              class="
                dm-tonight-campaign-head
                villain
              "
            >

              <span>
                Villain Campaign
              </span>

              <strong>
                Top 3
              </strong>

            </div>

            <div class="dm-tonight-objective-list">

              ${renderDmFavoriteList(
                'villain'
              )}

            </div>

          </div>


        </div>

      </section>


    </div>

  `;

}


async function saveDmTonightNotes(){

  const client =
    dmHomeClient();


  const editor =
    dmHomeById(
      'dmTonightNotesEditor'
    );


  const status =
    dmHomeById(
      'dmTonightSaveStatus'
    );


  if(
    !client
    ||
    !editor
    ||
    DM_HOME.notesSaving
  ){

    return;

  }


  DM_HOME.notesSaving =
    true;


  const content =
    sanitizeDmHomeRichText(
      editor.innerHTML
    );


  if(status){

    status.textContent =
      'Saving...';

  }


  try{

    const {
  error
} =
  await client
    .from(
      'dm_home_notes'
    )
    .upsert({

      id:
        'tonight',

      content,

      updated_at:
        new Date()
          .toISOString()

    });


    if(error){

      throw error;

    }


    DM_HOME.notes =
      content;


    if(status){

      status.textContent =
        'Saved';

    }


    setTimeout(
      () => {

        const current =
          dmHomeById(
            'dmTonightSaveStatus'
          );


        if(current){

          current.textContent =
            'Notes Ready';

        }

      },
      1200
    );

  }
  catch(error){

    console.error(
      'Tonight Notes save failed:',
      error
    );


    if(status){

      status.textContent =
        'Save Failed';

    }

  }
  finally{

    DM_HOME.notesSaving =
      false;

  }

}


function scheduleDmTonightSave(){

  const status =
    dmHomeById(
      'dmTonightSaveStatus'
    );


  if(status){

    status.textContent =
      'Unsaved Changes';

  }


  clearTimeout(
    DM_HOME.notesSaveTimer
  );


  DM_HOME.notesSaveTimer =
    setTimeout(
      saveDmTonightNotes,
      650
    );

}


function runDmTonightFormattingCommand(
  command
){

  const editor =
    dmHomeById(
      'dmTonightNotesEditor'
    );


  if(!editor){

    return;

  }


  editor.focus();


  document.execCommand(
    command,
    false,
    null
  );


  scheduleDmTonightSave();

}


async function clearDmTonightNotes(){

  if(
    !confirm(
      "Clear Tonight's Notes?\n\nThis cannot be undone."
    )
  ){

    return;

  }


  const editor =
    dmHomeById(
      'dmTonightNotesEditor'
    );


  if(!editor){

    return;

  }


  editor.innerHTML =
    '';


  clearTimeout(
    DM_HOME.notesSaveTimer
  );


  await saveDmTonightNotes();

}


/* =====================================================
   ALERT FEED
   ===================================================== */

function renderDmJournalAvatar(
  post
){

  if(
    post.author_image_url
  ){

    return `

      <img
        src="${dmHomeEscape(
          post.author_image_url
        )}"
        alt="${dmHomeEscape(
          post.author_name ||
          'Journal author'
        )}"
      >

    `;

  }


  return `

    <span>

      ${dmHomeEscape(
        String(
          post.author_name ||
          '?'
        )
          .charAt(0)
          .toUpperCase()
      )}

    </span>

  `;

}


function renderDmAlertFeed(){

  const mount =
    dmHomeById(
      'dmAlertFeedMount'
    );


  if(!mount){

    return;

  }


  mount.innerHTML = `

    <header class="dm-panel-header">

      <div>

        <h2 class="dm-panel-title">
          Alert Feed
        </h2>

        <div class="dm-panel-subtitle">
          Latest 10 Journal Entries
        </div>

      </div>


      <button
        class="dm-panel-link"
        type="button"
        data-dm-open-view="journal"
      >
        Open Journal →
      </button>

    </header>


    ${
      DM_HOME.journalPosts.length

        ? `
            <div class="dm-alert-list">

              ${DM_HOME.journalPosts
                .map(
                  post => `

                    <button
                      class="dm-alert-row"
                      type="button"
                      data-dm-open-view="journal"
                    >

                      <div class="dm-alert-avatar">

                        ${renderDmJournalAvatar(
                          post
                        )}

                      </div>


                      <div class="dm-alert-copy">

                        <div class="dm-alert-heading">

                          <strong>

                            ${dmHomeEscape(
                              post.author_name ||
                              'Unknown Explorer'
                            )}

                          </strong>


                          <span
                            class="
                              dm-alert-campaign
                              ${
                                post.campaign ===
                                'villain'

                                  ? 'villain'

                                  : 'hero'
                              }
                            "
                          >

                            ${dmHomeEscape(
                              post.campaign ||
                              'hero'
                            )}

                          </span>


                          <span>

                            ${
                              post.reality_posted ===
                              'unbound'

                                ? 'Unbound'

                                : 'Cast'
                            }

                          </span>

                        </div>


                        <div class="dm-alert-message">

                          ${dmHomeEscape(
                            dmHomeTruncate(
                              post.content,
                              220
                            )
                          )}

                        </div>

                      </div>


                      <div class="dm-alert-time">

                        ${dmHomeEscape(
                          dmHomeFormatTimestamp(
                            post.created_at
                          )
                        )}

                      </div>

                    </button>

                  `
                )
                .join('')
              }

            </div>
          `

        : `
            <div class="dm-home-empty">
              No journal entries have been posted yet.
            </div>
          `
    }

  `;

}


/* =====================================================
   ATTENTION REQUIRED
   ===================================================== */

function getDmAttentionItems(){

  const items = [];


  const assigned =
    dmHomeAssignedCharacters();


  const exhausted =
    assigned.filter(
      character =>
        dmHomeNumber(
          character.exhaustion
        ) >= 3
    );


  if(
    exhausted.length
  ){

    items.push({

      severity:
        'warning',

      title:
        `${exhausted.length} Explorer${
          exhausted.length === 1
            ? ''
            : 's'
        } at 3+ Exhaustion`,

copy:
  exhausted
    .map(
      character =>
        `${
          dmHomeCompanyFile(character.id)?.display_name ||
          dmHomeCompanyFile(character.id)?.unbound_display_name ||
          'Unnamed Character'
        } (${character.exhaustion})`
    )
    .join(', '),

      view:
        'performance'

    });

  }


  const missingVisuals =
    DM_HOME.profiles
      .map(
        getDmFieldPlayerState
      )
      .filter(
        feed =>
          !getDmFieldImage(
            feed
          )
      );


  if(
    missingVisuals.length
  ){

    items.push({

      severity:
        'notice',

      title:
        `${missingVisuals.length} live feed${
          missingVisuals.length === 1
            ? ''
            : 's'
        } missing a visual`,

      copy:
        missingVisuals
          .map(
            feed =>
              feed.profile
                ?.display_name ||
              'Explorer'
          )
          .join(', '),

      view:
        'performance'

    });

  }


  const unassignedCompany =
    DM_HOME.npcs.filter(
      npc =>
        !npc.is_reassigned
        &&
        !npc.company_association
    );


  if(
    unassignedCompany.length
  ){

    items.push({

      severity:
        'notice',

      title:
        `${unassignedCompany.length} Personnel record${
          unassignedCompany.length === 1
            ? ''
            : 's'
        } missing Company Association`,

      copy:
        unassignedCompany
          .slice(
            0,
            5
          )
          .map(
            npc =>
              npc.name_cast
          )
          .join(', ')
        +
        (
          unassignedCompany.length > 5
            ? '…'
            : ''
        ),

      view:
        'personnel'

    });

  }


  return items;

}


function renderDmAttentionRequired(){

  const mount =
    dmHomeById(
      'dmAttentionRequiredMount'
    );


  if(!mount){

    return;

  }


  const items =
    getDmAttentionItems();


  if(!items.length){

    mount.hidden =
      true;


    mount.innerHTML =
      '';


    return;

  }


  mount.hidden =
    false;


  mount.innerHTML = `

    <header class="dm-panel-header">

      <div>

        <h2 class="dm-panel-title">
          Attention Required
        </h2>

        <div class="dm-panel-subtitle">
          Exceptions Requiring Executive Review
        </div>

      </div>


      <div class="dm-panel-status">

        ${items.length}

        Flag${
          items.length === 1
            ? ''
            : 's'
        }

      </div>

    </header>


    <div class="dm-attention-list">

      ${items
        .map(
          item => `

            <button
              class="
                dm-attention-item
                ${item.severity}
              "
              type="button"
              data-dm-open-view="${item.view}"
            >

              <span class="dm-attention-mark">
                !
              </span>


              <span>

                <strong>
                  ${dmHomeEscape(
                    item.title
                  )}
                </strong>

                <small>
                  ${dmHomeEscape(
                    item.copy
                  )}
                </small>

              </span>


              <span class="dm-attention-arrow">
                →
              </span>

            </button>

          `
        )
        .join('')
      }

    </div>

  `;

}


/* =====================================================
   SYSTEM OVERVIEW
   ===================================================== */

function getDmSystemStats(){

  const characters =
    dmHomeAssignedCharacters();


  return {

    averageLevel:
      dmHomeRound(
        dmHomeAverage(
          characters.map(
            character =>
              character.level ?? 1
          )
        ),
        1
      ),

    averageAlignment:
      dmHomeRound(
        dmHomeAverage(
          characters.map(
            character =>
              character.alignment ?? 0
          )
        ),
        1
      ),

averageExhaustion:
  dmHomeRound(
    dmHomeAverage(
      characters.map(
        character =>
          character.exhaustion ?? 0
      )
    ),
    1
  ),

averageTickets:
  dmHomeRound(
    dmHomeAverage(
      characters.map(
        character =>
          character.downtime_tickets ?? 0
      )
    ),
    1
  ),

activeObjectives:
  getDmActiveObjectiveCount()

  };

}


function getDmSkillAverages(){

  const characters =
    dmHomeAssignedCharacters();


  return DM_HOME_SKILLS.map(
    skill => ({

      ...skill,

      value:
        dmHomeRound(
          dmHomeAverage(
            characters.map(
              character =>
                character[
                  skill.key
                ]
            )
          ),
          1
        )

    })
  );

}


function getDmCommonAbilities(){

  const assignedIds =
    dmHomeAssignedCharacterIds();


  const counts =
    new Map();


  DM_HOME.characterAbilities
    .filter(
      link =>
        assignedIds.has(
          link.character_id
        )
    )
    .forEach(
      link => {

        counts.set(
          link.ability_id,

          (
            counts.get(
              link.ability_id
            ) || 0
          ) + 1
        );

      }
    );


  return [
    ...counts.entries()
  ]
    .map(
      (
        [
          abilityId,
          count
        ]
      ) => ({

        ability:
          dmHomeAbility(
            abilityId
          ),

        count

      })
    )
    .filter(
      item =>
        item.ability
    )
    .sort(
      (
        a,
        b
      ) =>
        b.count -
        a.count
        ||
        String(
          a.ability.name
        )
          .localeCompare(
            String(
              b.ability.name
            )
          )
    )
    .slice(
      0,
      8
    );

}


function getDmLevelRows(){

  return DM_HOME.profiles.map(
    profile => {

      const assignment =
        dmHomeAssignment(
          profile.id
        );


      const hero =
        dmHomeCharacter(
          assignment
            ?.hero_character_id
        );


      const villain =
        dmHomeCharacter(
          assignment
            ?.villain_character_id
        );


      return {

        player:
          profile.display_name ||
          'Explorer',

        hero:
          hero?.level ??
          null,

        villain:
          villain?.level ??
          null

      };

    }
  );

}


function renderDmSystemOverview(){

  const mount =
    dmHomeById(
      'dmSystemOverviewMount'
    );


  if(!mount){

    return;

  }


  const stats =
    getDmSystemStats();


  const skillAverages =
    getDmSkillAverages();


  const commonAbilities =
    getDmCommonAbilities();


  const levelRows =
    getDmLevelRows();


  const maxSkill =
    Math.max(
      20,
      ...skillAverages.map(
        item =>
          item.value || 0
      )
    );


  mount.innerHTML = `

    <header class="dm-panel-header">

      <div>

        <h2 class="dm-panel-title">
          System Overview
        </h2>

        <div class="dm-panel-subtitle">
          Explorer & Campaign Analytics
        </div>

      </div>

      <div class="dm-panel-status">
        Live Dataset
      </div>

    </header>


    <div class="dm-kpi-grid">

      ${[
        [
          'Average Level',
          stats.averageLevel
        ],
        [
          'Average Alignment',
          stats.averageAlignment
        ],
[
  'Average Exhaustion',
  stats.averageExhaustion
],
[
  'Average Tickets',
  stats.averageTickets
],
[
  'Active Objectives',
  stats.activeObjectives
]
      ]
        .map(
          (
            [
              label,
              value
            ]
          ) => `

            <div class="dm-kpi-card">

              <strong>
                ${dmHomeEscape(value)}
              </strong>

              <span>
                ${dmHomeEscape(label)}
              </span>

            </div>

          `
        )
        .join('')
      }

    </div>


    <div class="dm-system-analytics-grid">


      <section
        class="
          dm-analytics-card
          dm-skill-average-card
        "
      >

        <div class="dm-analytics-heading">

          <div>

            <span>
              NSBI TELEMETRY
            </span>

            <h3>
              Average Magic Domain Die
            </h3>

          </div>

        </div>


        <div class="dm-horizontal-bars">

          ${skillAverages
            .map(
              skill => `

                <div class="dm-bar-row">

                  <span class="dm-bar-label">
                    ${dmHomeEscape(
                      skill.label
                    )}
                  </span>


                  <div class="dm-bar-track">

                    <span
                      style="
                        width:${
                          Math.max(
                            0,
                            Math.min(
                              100,
                              (
                                skill.value /
                                maxSkill
                              ) * 100
                            )
                          )
                        }%;
                      "
                    ></span>

                  </div>


                  <strong>

                    ${
                      skill.value
                        ? `d${skill.value}`
                        : '—'
                    }

                  </strong>

                </div>

              `
            )
            .join('')
          }

        </div>

      </section>



      <section class="dm-analytics-card">

        <div class="dm-analytics-heading">

          <div>

            <span>
              ABILITY ADOPTION
            </span>

            <h3>
              Most Common Abilities
            </h3>

          </div>

        </div>


        ${
          commonAbilities.length

            ? `
                <div class="dm-ranked-list">

                  ${commonAbilities
                    .map(
                      (
                        item,
                        index
                      ) => `

                        <div class="dm-ranked-row">

                          <span>
                            ${String(
                              index + 1
                            ).padStart(
                              2,
                              '0'
                            )}
                          </span>

                          <strong>
                            ${dmHomeEscape(
                              item.ability.name
                            )}
                          </strong>

                          <small>
                            ${dmHomeEscape(
                              item.ability.category ||
                              'Uncategorized'
                            )}
                          </small>

                          <b>
                            ${item.count}
                          </b>

                        </div>

                      `
                    )
                    .join('')
                  }

                </div>
              `

            : `
                <div class="dm-home-empty">
                  No abilities have been assigned yet.
                </div>
              `
        }

      </section>



      <section
        class="
          dm-analytics-card
          dm-level-card
        "
      >

        <div class="dm-analytics-heading">

          <div>

            <span>
              LEVEL MATRIX
            </span>

            <h3>
              Explorer Levels
            </h3>

          </div>

        </div>


        <div class="dm-level-table-wrap">

          <table class="dm-level-table">

            <thead>

              <tr>

                <th>
                  Explorer
                </th>

                <th>
                  Hero
                </th>

                <th>
                  Villain
                </th>

              </tr>

            </thead>


            <tbody>

              ${levelRows
                .map(
                  row => `

                    <tr>

                      <td>
                        ${dmHomeEscape(
                          row.player
                        )}
                      </td>

                      <td>
                        ${row.hero ?? '—'}
                      </td>

                      <td>
                        ${row.villain ?? '—'}
                      </td>

                    </tr>

                  `
                )
                .join('')
              }

            </tbody>

          </table>

        </div>

      </section>


    </div>

  `;

}


/* =====================================================
   CONSCIENCE NETWORK
   ===================================================== */

function dmHomeRelationshipLabel(
  score
){

  const numeric =
    Math.max(
      0,
      Math.min(
        100,
        dmHomeNumber(
          score,
          50
        )
      )
    );


  return DM_HOME_RELATIONSHIPS
    .find(
      item =>
        numeric >= item.min
        &&
        numeric <= item.max
    )
    ?.label
    ||
    'NEUTRAL';

}


function getDmCompanyDistribution(){

  const counts =
    new Map(
      DM_HOME_COMPANIES
        .map(
          company => [
            company,
            0
          ]
        )
    );


  DM_HOME.npcs.forEach(
    npc => {

      const company =
        DM_HOME_COMPANIES.includes(
          npc.company_association
        )
          ? npc.company_association
          : 'Unaffiliated';


      counts.set(
        company,
        (
          counts.get(
            company
          ) || 0
        ) + 1
      );

    }
  );


  return DM_HOME_COMPANIES.map(
    (
      company,
      index
    ) => ({

      label:
        company,

      value:
        counts.get(
          company
        ) || 0,

      color:
        DM_HOME_COMPANY_COLORS[
          index
        ]

    })
  );

}


function getDmRelationshipDistribution(
  campaign
){

  const counts =
    new Map(
      DM_HOME_RELATIONSHIPS
        .map(
          item => [
            item.label,
            0
          ]
        )
    );


  DM_HOME.npcs
    .filter(
      npc =>
        !npc.is_reassigned
    )
    .forEach(
      npc => {

        const state =
          dmHomeNpcState(
            npc.id,
            campaign
          );


        if(!state){

          return;

        }


        const label =
          dmHomeRelationshipLabel(
            state.relationship_score
          );


        counts.set(
          label,
          (
            counts.get(
              label
            ) || 0
          ) + 1
        );

      }
    );


  return DM_HOME_RELATIONSHIPS.map(
    item => ({

      label:
        item.label,

      value:
        counts.get(
          item.label
        ) || 0,

      color:
        item.color

    })
  );

}


function getDmPersonnelStatus(
  mode
){

  const counts = {

    discovered:
      0,

    undiscovered:
      0,

    reassigned:
      0

  };


  DM_HOME.npcs.forEach(
    npc => {

      if(
        npc.is_reassigned
      ){

        counts.reassigned +=
          1;


        return;

      }


      const heroVisible =
        Boolean(
          dmHomeNpcState(
            npc.id,
            'hero'
          )?.is_visible
        );


      const villainVisible =
        Boolean(
          dmHomeNpcState(
            npc.id,
            'villain'
          )?.is_visible
        );


      const discovered =
        mode === 'hero'

          ? heroVisible

          : mode === 'villain'

            ? villainVisible

            : heroVisible ||
              villainVisible;


      counts[
        discovered
          ? 'discovered'
          : 'undiscovered'
      ] +=
        1;

    }
  );


  return [

    {
      label:
        'Discovered',

      value:
        counts.discovered,

      color:
        DM_HOME_STATUS_COLORS
          .discovered
    },

    {
      label:
        'Undiscovered',

      value:
        counts.undiscovered,

      color:
        DM_HOME_STATUS_COLORS
          .undiscovered
    },

    {
      label:
        'Reassigned',

      value:
        counts.reassigned,

      color:
        DM_HOME_STATUS_COLORS
          .reassigned
    }

  ];

}


function getDmRelationshipAverage(
  campaign
){

  const scores =
    DM_HOME.npcs
      .filter(
        npc =>
          !npc.is_reassigned
      )
      .map(
        npc =>
          dmHomeNpcState(
            npc.id,
            campaign
          )
            ?.relationship_score
      )
      .filter(
        value =>
          value !== null
          &&
          value !== undefined
      );


  return dmHomeRound(
    dmHomeAverage(
      scores
    ),
    1
  );

}


function getDmRelationshipRecords(
  campaign
){

  return DM_HOME.npcs
    .filter(
      npc =>
        !npc.is_reassigned
    )
    .map(
      npc => {

        const state =
          dmHomeNpcState(
            npc.id,
            campaign
          );


        if(!state){

          return null;

        }


        return {

          npc,

          score:
            Math.max(
              0,
              Math.min(
                100,
                dmHomeNumber(
                  state.relationship_score,
                  50
                )
              )
            ),

          label:
            dmHomeRelationshipLabel(
              state.relationship_score
            ),

          visible:
            Boolean(
              state.is_visible
            )

        };

      }
    )
    .filter(Boolean);

}


function getDmRelationshipWatch(
  campaign
){

  const thresholds = [
    11,
    21,
    31,
    41,
    51,
    61,
    71,
    90
  ];


  return getDmRelationshipRecords(
    campaign
  )
    .map(
      record => {

        let best =
          null;


        thresholds.forEach(
          threshold => {

            const upwardDistance =
              threshold -
              record.score;


            const downwardDistance =
              record.score -
              (
                threshold -
                1
              );


            if(
              upwardDistance >= 1
              &&
              upwardDistance <= 2
            ){

              const candidate = {

                distance:
                  upwardDistance,

                direction:
                  'up',

                targetScore:
                  threshold,

                targetLabel:
                  dmHomeRelationshipLabel(
                    threshold
                  )

              };


              if(
                !best
                ||
                candidate.distance <
                best.distance
              ){

                best =
                  candidate;

              }

            }


            if(
              downwardDistance >= 1
              &&
              downwardDistance <= 2
            ){

              const candidate = {

                distance:
                  downwardDistance,

                direction:
                  'down',

                targetScore:
                  threshold - 1,

                targetLabel:
                  dmHomeRelationshipLabel(
                    threshold - 1
                  )

              };


              if(
                !best
                ||
                candidate.distance <
                best.distance
              ){

                best =
                  candidate;

              }

            }

          }
        );


        return best

          ? {
              ...record,
              ...best
            }

          : null;

      }
    )
    .filter(Boolean)
    .sort(
      (
        a,
        b
      ) =>
        a.distance -
        b.distance
        ||
        a.score -
        b.score
    )
    .slice(
      0,
      8
    );

}


function buildDmDonutGradient(
  items
){

  const total =
    items.reduce(
      (
        sum,
        item
      ) =>
        sum +
        item.value,
      0
    );


  if(!total){

    return `conic-gradient(
      #2b3d43 0 100%
    )`;

  }


  let cursor =
    0;


  const stops =
    items
      .filter(
        item =>
          item.value > 0
      )
      .map(
        item => {

          const start =
            cursor;


          cursor +=
            (
              item.value /
              total
            ) * 100;


          return `${
            item.color
          } ${
            start
          }% ${
            cursor
          }%`;

        }
      );


  return `conic-gradient(
    ${stops.join(',')}
  )`;

}


function renderDmDonut({
  title,
  kicker,
  items,
  centerValue,
  centerLabel,
  controls = ''
}){

  const total =
    items.reduce(
      (
        sum,
        item
      ) =>
        sum +
        item.value,
      0
    );


  const radius =
    42;


  const circumference =
    2 *
    Math.PI *
    radius;


  let offset =
    0;


  const segments =
    items
      .map(
        (
          item,
          index
        ) => {

          const fraction =
            total
              ? item.value / total
              : 0;


          const length =
            fraction *
            circumference;


          const gap =
            item.value > 0
              ? 1.2
              : 0;


          const dashLength =
            Math.max(
              0,
              length - gap
            );


          const dashOffset =
            -offset;


          offset +=
            length;


          if(
            item.value <= 0
          ){

            return '';

          }


          return `

            <circle
              class="dm-donut-segment"
              data-dm-donut-index="${index}"
              cx="50"
              cy="50"
              r="${radius}"
              fill="none"
              stroke="${item.color}"
              stroke-width="13"
              stroke-dasharray="
                ${dashLength}
                ${
                  circumference -
                  dashLength
                }
              "
              stroke-dashoffset="${dashOffset}"
            ></circle>

          `;

        }
      )
      .join('');


  return `

    <section
      class="
        dm-analytics-card
        dm-donut-card
      "
    >

      <div class="dm-analytics-heading">

        <div>

          <span>
            ${dmHomeEscape(kicker)}
          </span>

          <h3>
            ${dmHomeEscape(title)}
          </h3>

        </div>


        ${controls}

      </div>


      <div class="dm-donut-layout">


        <div class="dm-donut">

          <svg
            class="dm-donut-svg"
            viewBox="0 0 100 100"
            role="img"
            aria-label="${dmHomeEscape(title)}"
          >

            <circle
              class="dm-donut-track"
              cx="50"
              cy="50"
              r="${radius}"
              fill="none"
              stroke-width="13"
            ></circle>


            <g
              transform="
                rotate(
                  -90
                  50
                  50
                )
              "
            >

              ${segments}

            </g>

          </svg>


          <div class="dm-donut-hole">

            <strong>
              ${dmHomeEscape(
                centerValue
              )}
            </strong>

            <span>
              ${dmHomeEscape(
                centerLabel
              )}
            </span>

          </div>

        </div>



        <div class="dm-donut-legend">

          ${items
            .map(
              (
                item,
                index
              ) => `

                <div
                  class="dm-donut-legend-row"
                  data-dm-donut-index="${index}"
                >

                  <i
                    style="
                      background:${
                        item.color
                      };
                    "
                  ></i>

                  <span>
                    ${dmHomeEscape(
                      item.label
                    )}
                  </span>

                  <strong>
                    ${item.value}
                  </strong>

                  <small>

                    ${
                      total
                        ? `${
                            dmHomeRound(
                              (
                                item.value /
                                total
                              ) *
                              100,
                              1
                            )
                          }%`

                        : '0%'
                    }

                  </small>

                </div>

              `
            )
            .join('')
          }

        </div>


      </div>

    </section>

  `;

}


function renderDmCampaignToggle(){

  return `

    <div
      class="dm-mini-toggle"
      aria-label="Relationship campaign"
    >

      <button
        type="button"
        data-dm-home-action="relationship-campaign"
        data-value="hero"
        class="${
          DM_HOME.relationshipCampaign ===
          'hero'

            ? 'active'

            : ''
        }"
      >
        Hero
      </button>

      <button
        type="button"
        data-dm-home-action="relationship-campaign"
        data-value="villain"
        class="${
          DM_HOME.relationshipCampaign ===
          'villain'

            ? 'active'

            : ''
        }"
      >
        Villain
      </button>

    </div>

  `;

}


function renderDmPersonnelStatusToggle(){

  return `

    <div
      class="dm-mini-toggle"
      aria-label="Personnel status view"
    >

      ${[
        'hero',
        'villain',
        'total'
      ]
        .map(
          value => `

            <button
              type="button"
              data-dm-home-action="personnel-status-mode"
              data-value="${value}"
              class="${
                DM_HOME.personnelStatusMode ===
                value

                  ? 'active'

                  : ''
              }"
            >

              ${
                value
                  .charAt(0)
                  .toUpperCase()
                +
                value.slice(1)
              }

            </button>

          `
        )
        .join('')
      }

    </div>

  `;

}


function renderDmRelationshipWatch(
  campaign
){

  const items =
    getDmRelationshipWatch(
      campaign
    );


  return `

    <section class="dm-analytics-card">

      <div class="dm-analytics-heading">

        <div>

          <span>
            THRESHOLD MONITOR
          </span>

          <h3>
            Relationship Watch
          </h3>

        </div>

      </div>


      ${
        items.length

          ? `
              <div class="dm-relationship-watch">

                ${items
                  .map(
                    item => `

                      <div class="dm-watch-row">

                        <div>

                          <strong>
                            ${dmHomeEscape(
                              item.npc.name_cast
                            )}
                          </strong>

                          <span>

                            ${item.score}
                            ·
                            ${dmHomeEscape(
                              item.label
                            )}

                          </span>

                        </div>


                        <div
                          class="
                            dm-watch-shift
                            ${item.direction}
                          "
                        >

                          ${
                            item.direction ===
                            'up'

                              ? '↑'

                              : '↓'
                          }

                          ${item.distance}

                          <small>

                            →
                            ${dmHomeEscape(
                              item.targetLabel
                            )}

                          </small>

                        </div>

                      </div>

                    `
                  )
                  .join('')
                }

              </div>
            `

          : `
              <div class="dm-home-empty">
                No personnel are within 2 points
                of a relationship threshold.
              </div>
            `
      }

    </section>

  `;

}


function renderDmRelationshipRankings(
  campaign
){

  const records =
    getDmRelationshipRecords(
      campaign
    );


  const strongest = [
    ...records
  ]
    .sort(
      (
        a,
        b
      ) =>
        b.score -
        a.score
    )
    .slice(
      0,
      5
    );


  const threats = [
    ...records
  ]
    .sort(
      (
        a,
        b
      ) =>
        a.score -
        b.score
    )
    .slice(
      0,
      5
    );


  function list(
    title,
    kicker,
    items
  ){

    return `

      <section class="dm-analytics-card">

        <div class="dm-analytics-heading">

          <div>

            <span>
              ${kicker}
            </span>

            <h3>
              ${title}
            </h3>

          </div>

        </div>


        ${
          items.length

            ? `
                <div class="dm-personnel-ranking">

                  ${items
                    .map(
                      (
                        item,
                        index
                      ) => `

                        <div>

                          <span>
                            ${index + 1}
                          </span>

                          <strong>
                            ${dmHomeEscape(
                              item.npc.name_cast
                            )}
                          </strong>

                          <small>
                            ${dmHomeEscape(
                              item.label
                            )}
                          </small>

                          <b>
                            ${item.score}
                          </b>

                        </div>

                      `
                    )
                    .join('')
                  }

                </div>
              `

            : `
                <div class="dm-home-empty">
                  No relationship data yet.
                </div>
              `
        }

      </section>

    `;

  }


  return `

    <div class="dm-relationship-rankings">

      ${list(
        'Strongest Relationships',
        'NETWORK ALLIES',
        strongest
      )}

      ${list(
        'Relationship Threats',
        'NETWORK RISKS',
        threats
      )}

    </div>

  `;

}


function renderDmConscienceNetwork(){

  const mount =
    dmHomeById(
      'dmConscienceNetworkMount'
    );


  if(!mount){

    return;

  }


  const companyDistribution =
    getDmCompanyDistribution();


  const relationshipDistribution =
    getDmRelationshipDistribution(
      DM_HOME.relationshipCampaign
    );


  const relationshipAverage =
    getDmRelationshipAverage(
      DM_HOME.relationshipCampaign
    );


  const statusDistribution =
    getDmPersonnelStatus(
      DM_HOME.personnelStatusMode
    );


  mount.innerHTML = `

    <header class="dm-panel-header">

      <div>

        <h2 class="dm-panel-title">
          Conscience Network
        </h2>

        <div class="dm-panel-subtitle">
          Personnel Intelligence & Relationship Analytics
        </div>

      </div>


      <button
        class="dm-panel-link"
        type="button"
        data-dm-open-view="personnel"
      >
        Open Personnel →
      </button>

    </header>


    <div class="dm-conscience-grid">


      ${renderDmDonut({

        title:
          'Company Distribution',

        kicker:
          'ORGANIZATIONAL FOOTPRINT',

        items:
          companyDistribution,

        centerValue:
          DM_HOME.npcs.length,

        centerLabel:
          'Personnel'

      })}



      ${renderDmDonut({

        title:
          'NPC Relationship Health',

        kicker:
          'SOCIAL TEMPERATURE',

        items:
          relationshipDistribution,

        centerValue:
          relationshipAverage,

        centerLabel:
          dmHomeRelationshipLabel(
            relationshipAverage
          ),

        controls:
          renderDmCampaignToggle()

      })}



      ${renderDmDonut({

        title:
          'Personnel Status',

        kicker:
          'DISCOVERY NETWORK',

        items:
          statusDistribution,

        centerValue:
          DM_HOME.npcs.length,

        centerLabel:
          DM_HOME.personnelStatusMode ===
          'total'

            ? 'Total NPCs'

            : `${
                DM_HOME.personnelStatusMode
              } View`,

        controls:
          renderDmPersonnelStatusToggle()

      })}


    </div>


    <div class="dm-conscience-secondary">

      ${renderDmRelationshipWatch(
        DM_HOME.relationshipCampaign
      )}

      ${renderDmRelationshipRankings(
        DM_HOME.relationshipCampaign
      )}

    </div>

  `;

}


/* =====================================================
   RENDER ALL HOME MODULES
   ===================================================== */

function renderDmHomeModules(){

  renderDmCurrentAdventures();

  renderDmFieldFeeds();

  renderDmTonightControl();

  renderDmAlertFeed();

  renderDmAttentionRequired();

  renderDmSystemOverview();

  renderDmConscienceNetwork();

}


async function refreshDmHome(){

  try{

    await loadDmHomeData();

    renderDmHomeModules();

  }
  catch(error){

    console.error(
      'DM Home failed to load:',
      error
    );


    [
      [
        'dmFieldFeedsMount',
        'Live Field Feeds'
      ],
      [
        'dmTonightControlMount',
        "Tonight's Control Deck"
      ],
      [
        'dmAlertFeedMount',
        'Alert Feed'
      ],
      [
        'dmSystemOverviewMount',
        'System Overview'
      ],
      [
        'dmConscienceNetworkMount',
        'Conscience Network'
      ]
    ]
      .forEach(
        (
          [
            id,
            title
          ]
        ) => {

          const mount =
            dmHomeById(id);


          if(mount){

            mount.innerHTML =
              dmHomePanelError(
                `${title} unavailable`,
                error
              );

          }

        }
      );

  }

}


/* =====================================================
   EVENTS
   ===================================================== */

function handleDmHomeInput(
  event
){

  if(
    event.target.id ===
    'dmTonightNotesEditor'
  ){

    scheduleDmTonightSave();

  }

}


function handleDmHomeClick(
  event
){

  const formatButton =
    event.target.closest(
      '[data-dm-tonight-command]'
    );


  if(formatButton){

    runDmTonightFormattingCommand(
      formatButton.dataset
        .dmTonightCommand
    );


    return;

  }


  const tonightButton =
    event.target.closest(
      '[data-dm-tonight-action]'
    );


  if(
    tonightButton
      ?.dataset
      .dmTonightAction ===
    'clear-notes'
  ){

    clearDmTonightNotes();


    return;

  }


  const homeAction =
    event.target.closest(
      '[data-dm-home-action]'
    );


  if(homeAction){

    const action =
      homeAction.dataset
        .dmHomeAction;


    const value =
      homeAction.dataset
        .value;


    if(
      action ===
      'relationship-campaign'
    ){

      DM_HOME.relationshipCampaign =
        value === 'villain'
          ? 'villain'
          : 'hero';


      renderDmConscienceNetwork();


      return;

    }


    if(
      action ===
      'personnel-status-mode'
    ){

      DM_HOME.personnelStatusMode =
        [
          'hero',
          'villain',
          'total'
        ]
          .includes(
            value
          )
            ? value
            : 'total';


      renderDmConscienceNetwork();


      return;

    }

  }


  const nav =
    event.target.closest(
      '[data-dm-open-view]'
    );


  if(nav){

    dmHomeNavigate(
      nav.dataset
        .dmOpenView
    );

  }

}


function connectDmHomeEvents(){

  if(
    DM_HOME.initialized
  ){

    return;

  }


  DM_HOME.initialized =
    true;


  document.addEventListener(
    'input',
    handleDmHomeInput
  );


  document.addEventListener(
    'click',
    handleDmHomeClick
  );


  document.addEventListener(
    'epcot:dm-reality-changed',
    event => {

      const profileId =
        event.detail?.accountId;


      const updatedState =
        event.detail?.state;


      if(
        !profileId
        ||
        !updatedState
      ){

        return;

      }


      const index =
        DM_HOME.states.findIndex(
          state =>
            state.account_id ===
            profileId
        );


      if(
        index >= 0
      ){

        DM_HOME.states[index] =
          updatedState;

      }
      else{

        DM_HOME.states.push(
          updatedState
        );

      }


      renderDmFieldFeeds();

    }
  );

}

/* =====================================================
   DONUT HOVER LINKING

   Hovering a chart segment highlights its legend row.
   Hovering the legend highlights the chart segment.
   ===================================================== */

function setDmDonutHighlight(
  target,
  active
){

  const card =
    target.closest(
      '.dm-donut-card'
    );


  if(!card){
    return;
  }


  const index =
    target.dataset
      .dmDonutIndex;


  if(
    index === undefined
  ){
    return;
  }


  card
    .querySelectorAll(
      '[data-dm-donut-index]'
    )
    .forEach(
      element => {

        const matching =
          element.dataset
            .dmDonutIndex ===
          index;


        element.classList.toggle(
          'is-donut-active',
          active &&
          matching
        );


        element.classList.toggle(
          'is-donut-muted',
          active &&
          !matching
        );

      }
    );

}


document.addEventListener(
  'mouseover',
  event => {

    const target =
      event.target.closest(
        '[data-dm-donut-index]'
      );


    if(!target){
      return;
    }


    setDmDonutHighlight(
      target,
      true
    );

  }
);


document.addEventListener(
  'mouseout',
  event => {

    const target =
      event.target.closest(
        '[data-dm-donut-index]'
      );


    if(!target){
      return;
    }


    const next =
      event.relatedTarget;


    if(
      next &&
      target.contains(
        next
      )
    ){
      return;
    }


    const card =
      target.closest(
        '.dm-donut-card'
      );


    if(!card){
      return;
    }


    card
      .querySelectorAll(
        '[data-dm-donut-index]'
      )
      .forEach(
        element => {

          element.classList.remove(
            'is-donut-active',
            'is-donut-muted'
          );

        }
      );

  }
);

/* =====================================================
   REALTIME
   ===================================================== */

function connectDmHomeRealtime(){

  const client =
    dmHomeClient();


  if(
    !client?.channel
  ){

    return;

  }


  if(
    DM_HOME.realtimeChannel
  ){

    client.removeChannel(
      DM_HOME.realtimeChannel
    );

  }


  const refresh =
    () => {

      clearTimeout(
        DM_HOME.realtimeTimer
      );


      DM_HOME.realtimeTimer =
        setTimeout(
          refreshDmHome,
          180
        );

    };


const tables = [

  'accounts',

  'player_reality_state',

  'characters',

  'company_files',

  'objectives',

  'objective_subitems',

  'objective_favorites',

  'journal_posts',

  'abilities',

  'character_abilities',

  'npcs',

  'npc_campaign_state',

  'adventure_chapters',

  'adventure_modules'

];


  let channel =
    client.channel(
      'dm-home-live'
    );


  tables.forEach(
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


  DM_HOME.realtimeChannel =
    channel.subscribe(
      (
        status,
        error
      ) => {

        if(error){

          console.error(
            'DM Home Realtime error:',
            error
          );

        }


        console.log(
          'DM Home Realtime:',
          status
        );

      }
    );

}


/* =====================================================
   INITIALIZE
   ===================================================== */

async function initializeDmHome(){

  if(
    !dmHomeById(
      'dmHomeView'
    )
  ){

    return;

  }


  connectDmHomeEvents();


  await refreshDmHome();


  connectDmHomeRealtime();

}


document.addEventListener(
  'epcot:dm-ready',
  initializeDmHome
);
/* =====================================================
   EPCOT DND
   WORLD ENGINE

   PLAYER-FACING WORLD SYSTEM

   New World structure:

   1. EPCOT Cast World
   2. Unbound World
   3. Outer Rings
   4. Systems & Society

   Preserves:
   - Campaign visibility
   - Supersection details
   - Section details
   - Media
   - Shared notes
   - Downtime placeholders
   - Realtime updates
   ===================================================== */


/* =====================================================
   CONFIGURATION
   ===================================================== */

const WORLD_CAST_RING_KEYS = [
  'residential_ring',
  'green_belt',
  'hub'
];


const WORLD_OUTER_RING_KEYS = [
  'industry_park',
  'theme_park',
  'airport',
  'underground',
  'arcots'
];


const WORLD_SYSTEM_KEYS = [
  'transportation',
  'board_of_tomorrow',
  'epcot_iteration',
  'culture',
  'annual_holidays',
  'quarterly_celebrations',
  'species',
  'language'
];


const WORLD_UNBOUND_KEY =
  'unbound_world';


const WORLD_UNBOUND_NEIGHBORHOOD_KEYS = [

  'unbound_blair_quarter',
  'unbound_davis_vista',
  'unbound_gurr_district',
  'unbound_joerger_commons',
  'unbound_chao_terrace',
  'unbound_irvine_passage',
  'unbound_mckim_portal',
  'unbound_chapman_gate',
  'unbound_burns_gardens',
  'unbound_crump_works',
  'unbound_baxter_forge',
  'unbound_broggie_yard',
  'unbound_gracey_foundry',
  'unbound_coats_line',
  'unbound_toombs_gardens',
  'unbound_atencio_reach',
  'unbound_ryman_fields',
  'unbound_anderson_ward'

];


/* =====================================================
   STATE
   ===================================================== */

let worldSupersections = [];

let worldSections = [];

let worldNotes = [];

let worldCampaignVisibility = [];

let worldActiveTarget = null;

let worldActiveTab =
  'cast';

let worldRealtimeChannel = null;

let worldEventsConnected =
  false;


/* =====================================================
   BASIC HELPERS
   ===================================================== */

function worldById(id){

  return document.getElementById(
    id
  );

}


function getWorldCampaign(){

  const explicit =
    document.body.dataset.campaign;


  if(
    explicit === 'hero' ||
    explicit === 'villain'
  ){

    return explicit;

  }


  const fileName =
    window.location.pathname
      .split('/')
      .pop()
      .toLowerCase();


  return fileName.includes(
    'villain'
  )
    ? 'villain'
    : 'hero';

}


function getWorldReality(){

  return String(
    document.body.dataset.reality ||
    'cast'
  )
    .toLowerCase() ===
    'unbound'
      ? 'unbound'
      : 'cast';

}


function worldEscapeHtml(value){

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


function worldShowError(
  title,
  error
){

  console.error(
    title,
    error
  );


  alert(
    `${title}\n\n${error?.message || String(error)}`
  );

}


/* =====================================================
   SAFE RICH TEXT
   ===================================================== */

function sanitizeWorldText(html){

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
   LOOKUPS
   ===================================================== */

function getWorldSupersectionByKey(
  key
){

  return worldSupersections.find(
    item =>
      item.key === key
  ) || null;

}


function getWorldSupersectionById(
  id
){

  return worldSupersections.find(
    item =>
      item.id === id
  ) || null;

}


function getWorldSectionById(
  id
){

  return worldSections.find(
    item =>
      item.id === id
  ) || null;

}


function getWorldSectionByKey(
  key
){

  return worldSections.find(
    item =>
      item.key === key
  ) || null;

}


function getSectionsForSupersection(
  supersectionId
){

  return worldSections

    .filter(
      section =>
        section.supersection_id ===
        supersectionId
    )

    .sort(
      (a,b) =>
        (a.sort_order ?? 0) -
        (b.sort_order ?? 0)
    );

}


function getVisibleSectionsForSupersection(
  supersectionId
){

  return getSectionsForSupersection(
    supersectionId
  )
    .filter(
      section =>
        section.visible_to_players
    );

}


/* =====================================================
   NOTES
   ===================================================== */

function getWorldNoteForSupersection(
  supersectionId
){

  return worldNotes.find(
    note =>
      note.supersection_id ===
        supersectionId
      &&
      note.section_id ===
        null
  ) || null;

}


function getWorldNoteForSection(
  sectionId
){

  return worldNotes.find(
    note =>
      note.section_id ===
        sectionId
      &&
      note.supersection_id ===
        null
  ) || null;

}


/* =====================================================
   CAMPAIGN VISIBILITY
   ===================================================== */

function getWorldCampaignVisibilityRow(
  type,
  id,
  campaign
){

  return worldCampaignVisibility.find(
    row => {

      if(
        row.campaign !==
        campaign
      ){

        return false;

      }


      if(
        type ===
        'supersection'
      ){

        return (
          row.supersection_id === id &&
          row.section_id === null
        );

      }


      return (
        row.section_id === id &&
        row.supersection_id === null
      );

    }
  ) || null;

}


function applyWorldCampaignVisibility(){

  const campaign =
    getWorldCampaign();


  worldSupersections.forEach(
    item => {

      const row =
        getWorldCampaignVisibilityRow(
          'supersection',
          item.id,
          campaign
        );


      if(row){

        item.visible_to_players =
          Boolean(
            row.is_visible
          );

      }

    }
  );


  worldSections.forEach(
    item => {

      const row =
        getWorldCampaignVisibilityRow(
          'section',
          item.id,
          campaign
        );


      if(row){

        item.visible_to_players =
          Boolean(
            row.is_visible
          );

      }

    }
  );

}


/* =====================================================
   FORMAT DESCRIPTION
   ===================================================== */

function formatWorldDescription(
  value
){

  const escaped =
    worldEscapeHtml(
      value
    );


  return escaped
    .replaceAll(
      '\r\n',
      '\n'
    )
    .replaceAll(
      '\n\n',
      '</p><p>'
    )
    .replaceAll(
      '\n',
      '<br>'
    );

}


/* =====================================================
   MEDIA
   ===================================================== */

function renderWorldMediaPreview(
  item,
  compact = false
){

  if(
    !item?.map_url
  ){

    return '';

  }


  return `

    <figure
      class="
        world-map-preview
        ${compact ? 'is-compact' : ''}
      "
    >

      <img
        src="${worldEscapeHtml(item.map_url)}"
        alt="${worldEscapeHtml(
          item.map_caption ||
          `${item.name} media`
        )}"
      >

      ${
        item.map_caption
          ? `
              <figcaption>

                ${worldEscapeHtml(
                  item.map_caption
                )}

              </figcaption>
            `
          : ''
      }

    </figure>

  `;

}


/* =====================================================
   NEW WORLD UI STYLES
   ===================================================== */

function installWorldTabStyles(){

  if(
    worldById(
      'worldTabbedStyles'
    )
  ){

    return;

  }


  const style =
    document.createElement(
      'style'
    );


  style.id =
    'worldTabbedStyles';


  style.textContent = `

    /* ===================================================
       WORLD TAB BAR
       =================================================== */

    .world-tab-shell{
      width:100%;
    }


    .world-tab-bar{
      display:grid;

      grid-template-columns:
        repeat(
          4,
          minmax(0,1fr)
        );

      gap:8px;

      margin-bottom:20px;

      padding:8px;

      border:
        1px solid
        rgba(23,58,86,.16);

      border-radius:16px;

      background:
        rgba(255,254,248,.78);

      box-shadow:
        0 6px 18px
        rgba(23,58,86,.06);
    }


    .world-tab-button{
      appearance:none;

      min-height:54px;

      padding:
        8px 13px;

      border:
        1px solid
        rgba(23,58,86,.15);

      border-radius:11px;

      background:
        rgba(255,255,255,.78);

      color:
        var(--navy, #173a56);

      font:inherit;

      font-size:12px;
      font-weight:900;

      letter-spacing:.045em;

      cursor:pointer;

      transition:
        transform .16s ease,
        background .16s ease,
        color .16s ease,
        box-shadow .16s ease;
    }


    .world-tab-button:hover{
      transform:
        translateY(-1px);
    }


    .world-tab-button.is-active{
      border-color:
        transparent;

      background:
        var(--navy, #173a56);

      color:white;

      box-shadow:
        0 5px 14px
        rgba(23,58,86,.18);
    }


    .world-tab-button.is-unbound{
      border-style:dashed;
    }


    .world-tab-content{
      min-width:0;
    }


    /* ===================================================
       TAB HERO
       =================================================== */

    .world-tab-hero{
      position:relative;

      margin-bottom:18px;

      padding:
        20px 22px;

      overflow:hidden;

      border:
        1px solid
        rgba(23,58,86,.16);

      border-radius:15px;

      background:
        linear-gradient(
          135deg,
          rgba(255,254,248,.96),
          rgba(224,241,242,.86)
        );
    }


    .world-tab-hero::after{
      content:"";

      position:absolute;

      width:190px;
      height:190px;

      right:-92px;
      top:-98px;

      border:
        2px solid
        rgba(39,166,162,.18);

      border-radius:50%;

      box-shadow:
        0 0 0 25px
        rgba(46,134,166,.05),
        0 0 0 50px
        rgba(239,184,63,.035);

      pointer-events:none;
    }


    .world-tab-hero h2{
      position:relative;

      z-index:1;

      margin:
        4px 0 5px;

      color:
        var(--navy, #173a56);

      font-family:
        "Segoe Print",
        "Comic Sans MS",
        cursive;

      font-size:
        clamp(
          25px,
          3vw,
          36px
        );
    }


    .world-tab-hero p{
      position:relative;

      z-index:1;

      max-width:760px;

      margin:
        8px 0 0;

      line-height:1.6;
    }


    /* ===================================================
       CAST WORLD
       =================================================== */

    .world-cast-overview{
      margin-bottom:20px;
    }


    .world-cast-ring-section{
      margin-top:20px;
    }


    /* ===================================================
       GENERIC CATEGORY GRID
       =================================================== */

    .world-category-grid{
      display:grid;

      grid-template-columns:
        repeat(
          auto-fit,
          minmax(220px,1fr)
        );

      gap:12px;
    }


    .world-category-card{
      appearance:none;

      position:relative;

      min-height:128px;

      padding:18px;

      text-align:left;

      border:
        1px solid
        rgba(23,58,86,.18);

      border-radius:14px;

      background:
        rgba(255,254,248,.94);

      color:inherit;

      font:inherit;

      cursor:pointer;

      overflow:hidden;

      transition:
        transform .16s ease,
        box-shadow .16s ease,
        border-color .16s ease;
    }


    .world-category-card:hover{
      transform:
        translateY(-2px);

      border-color:
        rgba(39,166,162,.52);

      box-shadow:
        0 8px 19px
        rgba(23,58,86,.09);
    }


    .world-category-card::after{
      content:"";

      position:absolute;

      width:90px;
      height:90px;

      right:-35px;
      bottom:-38px;

      border:
        2px solid
        rgba(39,166,162,.12);

      border-radius:50%;
    }


    .world-category-card strong{
      display:block;

      position:relative;

      z-index:1;

      color:
        var(--navy, #173a56);

      font-size:17px;
    }


    .world-category-card span{
      display:block;

      position:relative;

      z-index:1;

      margin-top:7px;

      color:
        var(--muted, #667783);

      font-size:12px;

      line-height:1.45;
    }


    .world-category-empty{
      padding:22px;

      border:
        1px dashed
        rgba(23,58,86,.22);

      border-radius:14px;

      background:
        rgba(255,255,255,.46);

      color:
        var(--muted, #667783);

      line-height:1.55;
    }


    /* ===================================================
       SYSTEM GROUPS
       =================================================== */

    .world-system-group{
      margin-top:22px;
    }


    .world-system-group:first-child{
      margin-top:0;
    }


    .world-system-group-title{
      margin:
        0 0 10px;

      color:
        var(--navy, #173a56);

      font-size:13px;
      font-weight:900;

      letter-spacing:.09em;

      text-transform:uppercase;
    }


    /* ===================================================
       UNBOUND NEIGHBORHOOD ORBIT
       =================================================== */

    .world-unbound-stage{
      display:grid;

      grid-template-columns:
        minmax(0,1fr)
        270px;

      gap:26px;

      align-items:start;
    }


    .world-unbound-radial{
      --world-orbit-radius:
        min(
          31vw,
          255px
        );

      position:relative;

      width:
        min(
          100%,
          650px
        );

      aspect-ratio:1;

      margin:
        12px auto;

      border:none;

      border-radius:50%;

      background:
        transparent;

      box-shadow:none;

      isolation:isolate;
    }


    /*
      Three subtle orbit lines.
      These are NOT the old EPCOT rings.
      They simply give the navigator structure.
    */

    .world-unbound-radial::before{
      content:"";

      position:absolute;

      inset:8%;

      border:
        1px solid
        rgba(23,58,86,.15);

      border-radius:50%;

      box-shadow:

        0 0 0 38px
        rgba(23,58,86,.025),

        0 0 0 39px
        rgba(23,58,86,.09),

        0 0 0 78px
        rgba(23,58,86,.018),

        0 0 0 79px
        rgba(23,58,86,.055);

      pointer-events:none;

      z-index:0;
    }


    .world-unbound-radial::after{
      content:"";

      position:absolute;

      left:50%;
      top:50%;

      width:2px;
      height:84%;

      transform:
        translate(-50%,-50%);

      background:
        linear-gradient(
          transparent,
          rgba(23,58,86,.08),
          transparent
        );

      pointer-events:none;
    }


    .world-unbound-center{
      position:absolute;

      left:50%;
      top:50%;

      width:
        clamp(
          130px,
          24%,
          160px
        );

      aspect-ratio:1;

      transform:
        translate(-50%,-50%);

      display:flex;

      align-items:center;
      justify-content:center;

      padding:18px;

      text-align:center;

      border:
        1px solid
        rgba(39,166,162,.34);

      border-radius:50%;

      background:
        radial-gradient(
          circle at 35% 30%,
          #295c70,
          #173a56 62%,
          #102b40
        );

      color:white;

      font-family:
        "Segoe Print",
        "Comic Sans MS",
        cursive;

      font-size:
        clamp(
          15px,
          2vw,
          21px
        );

      line-height:1.25;

      box-shadow:

        0 10px 30px
        rgba(23,58,86,.2),

        0 0 0 9px
        rgba(39,166,162,.05);

      z-index:3;
    }


    /*
      Nodes are spread around the actual circumference.

      The important change from the old version:
      translateY now uses the radius of the WHOLE
      navigator rather than a percentage of each tiny
      button's own height.
    */

    .world-unbound-node{
      appearance:none;

      position:absolute;

      left:50%;
      top:50%;

      width:
        clamp(
          78px,
          10vw,
          104px
        );

      min-height:
        clamp(
          44px,
          6vw,
          58px
        );

      padding:
        7px 8px;

      transform:

        translate(-50%,-50%)

        rotate(
          var(--world-angle)
        )

        translateY(
          calc(
            -1 *
            var(--world-orbit-radius)
          )
        )

        rotate(
          calc(
            -1 *
            var(--world-angle)
          )
        );

      border:
        1px solid
        rgba(23,58,86,.24);

      border-radius:12px;

      background:
        rgba(255,254,248,.97);

      color:
        var(--navy,#173a56);

      font:inherit;

      font-size:
        clamp(
          9px,
          1.05vw,
          11px
        );

      font-weight:900;

      line-height:1.15;

      cursor:pointer;

      box-shadow:
        0 5px 14px
        rgba(23,58,86,.1);

      transition:

        border-color .18s ease,
        background .18s ease,
        box-shadow .18s ease,
        filter .18s ease;

      z-index:2;
    }


    .world-unbound-node:not(:disabled):hover{
      z-index:6;

      border-color:
        rgba(39,166,162,.8);

      background:white;

      box-shadow:

        0 8px 22px
        rgba(23,58,86,.16),

        0 0 0 4px
        rgba(39,166,162,.10);

      filter:
        brightness(1.04);
    }


    .world-unbound-node.is-locked{
      border-style:dashed;

      border-color:
        rgba(23,58,86,.12);

      background:
        rgba(23,58,86,.035);

      color:
        rgba(23,58,86,.27);

      cursor:default;

      box-shadow:none;
    }


    .world-unbound-node-number{
      display:block;

      margin-bottom:3px;

      opacity:.48;

      font-size:8px;

      letter-spacing:.11em;
    }


    /* ===================================================
       UNBOUND DIRECTORY
       =================================================== */

    .world-unbound-key{
      position:sticky;

      top:18px;

      display:flex;

      flex-direction:column;

      gap:7px;

      max-height:
        calc(100vh - 90px);

      padding-right:4px;

      overflow-y:auto;
    }


    .world-unbound-key-item{
      appearance:none;

      width:100%;

      padding:
        9px 11px;

      text-align:left;

      border:
        1px solid
        rgba(23,58,86,.16);

      border-radius:9px;

      background:
        rgba(255,254,248,.88);

      color:inherit;

      font:inherit;

      cursor:pointer;

      transition:
        transform .15s ease,
        border-color .15s ease;
    }


    .world-unbound-key-item:hover:not(:disabled){
      transform:
        translateX(-2px);

      border-color:
        rgba(39,166,162,.55);
    }


    .world-unbound-key-item strong{
      display:block;

      color:
        var(--navy,#173a56);

      font-size:11px;
    }


    .world-unbound-key-item span{
      display:block;

      margin-top:2px;

      color:
        var(--muted,#667783);

      font-size:9px;
    }


    .world-unbound-key-item.is-locked{
      opacity:.36;

      border-style:dashed;

      cursor:default;
    }


    /* ===================================================
       WORLD DETAIL NAVIGATION
       =================================================== */

    /*
      Once a detail panel is opened, keep its own header
      available while the user reads long notes/content.
    */

    .world-detail-panel
    .world-detail-header{
      position:sticky;

      top:8px;

      z-index:30;

      padding:
        12px 14px;

      background:
        rgba(255,254,248,.96);

      backdrop-filter:
        blur(10px);

      box-shadow:
        0 5px 18px
        rgba(23,58,86,.08);
    }


    .world-detail-close{
      position:relative;

      z-index:31;

      flex:0 0 auto;
    }


    /* ===================================================
       UNBOUND PAGE SKIN
       =================================================== */

    body[data-reality="unbound"]
    .world-tab-bar{

      border-radius:0;

      border-color:
        rgba(224,179,79,.24);

      background:
        rgba(6,13,20,.86);

      box-shadow:none;

    }


    body[data-reality="unbound"]
    .world-tab-button{

      border-radius:0;

      border-color:
        rgba(224,179,79,.22);

      background:
        rgba(10,20,30,.9);

      color:#c9c0b1;

    }


    body[data-reality="unbound"]
    .world-tab-button.is-active{

      border-color:
        rgba(47,197,191,.5);

      background:
        linear-gradient(
          135deg,
          #151425,
          #081713
        );

      color:#eee4d0;

      box-shadow:
        inset 0 -2px 0
        rgba(199,90,145,.65);

    }


    body[data-reality="unbound"]
    .world-tab-hero{

      border-radius:0;

      border-color:
        rgba(224,179,79,.24);

      background:

        radial-gradient(
          circle at 88% 10%,
          rgba(199,90,145,.08),
          transparent 30%
        ),

        linear-gradient(
          145deg,
          #09131d,
          #141425 62%,
          #0a1b18
        );

      color:#d2c8b8;

    }


    body[data-reality="unbound"]
    .world-tab-hero h2{
      color:#c75a91;
    }


    body[data-reality="unbound"]
    .world-category-card,
    body[data-reality="unbound"]
    .world-unbound-key-item{

      border-radius:0;

      border-color:
        rgba(224,179,79,.22);

      background:
        linear-gradient(
          145deg,
          #09131d,
          #141425
        );

      color:#d2c8b8;

    }


    body[data-reality="unbound"]
    .world-category-card strong,
    body[data-reality="unbound"]
    .world-unbound-key-item strong{
      color:#eee4d0;
    }


    body[data-reality="unbound"]
    .world-category-card span,
    body[data-reality="unbound"]
    .world-unbound-key-item span{
      color:#918b82;
    }


    body[data-reality="unbound"]
    .world-category-empty{

      border-radius:0;

      border-color:
        rgba(224,179,79,.22);

      background:
        rgba(6,13,20,.56);

      color:#918b82;
    }


    body[data-reality="unbound"]
    .world-system-group-title{
      color:#2fc5bf;
    }


    /*
      UNBOUND ORBIT

      Deliberately does NOT reproduce the Cast ring.
    */

    body[data-reality="unbound"]
    .world-unbound-radial{

      background:
        radial-gradient(
          circle at center,
          rgba(199,90,145,.07),
          transparent 28%
        );

    }


    body[data-reality="unbound"]
    .world-unbound-radial::before{

      border-color:
        rgba(224,179,79,.14);

      box-shadow:

        0 0 0 38px
        rgba(47,197,191,.018),

        0 0 0 39px
        rgba(47,197,191,.08),

        0 0 0 78px
        rgba(199,90,145,.012),

        0 0 0 79px
        rgba(199,90,145,.055);

    }


    body[data-reality="unbound"]
    .world-unbound-radial::after{

      background:
        linear-gradient(
          transparent,
          rgba(224,179,79,.09),
          transparent
        );

    }


    body[data-reality="unbound"]
    .world-unbound-center{

      border-color:
        rgba(199,90,145,.58);

      background:
        radial-gradient(
          circle at 35% 30%,
          #1a1a2a,
          #070e16
        );

      color:#c75a91;

      box-shadow:

        0 0 30px
        rgba(199,90,145,.12),

        0 0 0 9px
        rgba(47,197,191,.025);

    }


    body[data-reality="unbound"]
    .world-unbound-node{

      border-radius:3px;

      border-color:
        rgba(224,179,79,.25);

      background:
        linear-gradient(
          145deg,
          #0b141d,
          #12111d
        );

      color:#eee4d0;

      box-shadow:
        0 5px 16px
        rgba(0,0,0,.35);

    }


    body[data-reality="unbound"]
    .world-unbound-node:not(:disabled):hover{

      border-color:#2fc5bf;

      box-shadow:

        0 8px 22px
        rgba(0,0,0,.55),

        0 0 18px
        rgba(47,197,191,.13);

    }


    body[data-reality="unbound"]
    .world-unbound-node.is-locked{

      background:
        rgba(6,13,20,.48);

      border-color:
        rgba(224,179,79,.09);

      color:
        rgba(238,228,208,.20);

    }


    body[data-reality="unbound"]
    .world-detail-panel
    .world-detail-header{

      background:
        rgba(6,13,20,.94);

      border-color:
        rgba(224,179,79,.2);

      box-shadow:
        0 6px 24px
        rgba(0,0,0,.38);

    }


    /* ===================================================
       RESPONSIVE
       =================================================== */

    @media(max-width:1000px){

      .world-unbound-stage{
        grid-template-columns:1fr;
      }


      .world-unbound-key{
        position:static;

        display:grid;

        grid-template-columns:
          repeat(
            3,
            minmax(0,1fr)
          );

        max-height:none;

        overflow:visible;
      }

    }


    @media(max-width:900px){

      .world-tab-bar{
        grid-template-columns:
          repeat(
            2,
            minmax(0,1fr)
          );
      }


      .world-unbound-radial{

        --world-orbit-radius:
          min(
            35vw,
            230px
          );

      }

    }


    @media(max-width:680px){

      .world-unbound-key{

        grid-template-columns:
          repeat(
            2,
            minmax(0,1fr)
          );

      }


      .world-unbound-node{

        width:74px;

        min-height:42px;

        padding:5px;

        font-size:8px;

      }


      .world-unbound-radial{

        --world-orbit-radius:
          min(
            37vw,
            185px
          );

      }

    }


    @media(max-width:520px){

      .world-tab-bar{
        grid-template-columns:1fr;
      }


      .world-unbound-key{
        grid-template-columns:1fr;
      }


      .world-unbound-node{

        width:66px;

        min-height:38px;

      }

    }

    /* ===================================================
       WORLD DETAIL OVERLAY

       World records no longer expand the page itself.
       They open over the World screen and scroll
       independently.
       =================================================== */

    #worldDetailMount:not(:empty){

      position:fixed;

      inset:0;

      z-index:10000;

      display:flex;

      align-items:flex-start;
      justify-content:center;

      padding:
        clamp(18px, 4vh, 42px)
        clamp(16px, 4vw, 50px);

      overflow-y:auto;

      background:
        rgba(4,13,21,.72);

      backdrop-filter:
        blur(5px);

    }


#worldDetailMount:not(:empty)
.world-detail-panel{

  position:relative;

  width:
    min(
      1100px,
      100%
    );

  max-height:
    calc(100vh - 70px);

  margin:0 !important;

  /*
    The base World CSS gives detail panels padding.
    Keep the side/bottom padding, but remove the top
    padding so the sticky header sits directly against
    the top edge of the scrolling panel.
  */

  padding-top:0 !important;

  overflow-y:auto;

  overscroll-behavior:
    contain;

  border-radius:15px;

  box-shadow:
    0 28px 80px
    rgba(0,0,0,.38);

}


    /*
      The detail header stays available while the
      record itself scrolls.
    */

#worldDetailMount:not(:empty)
.world-detail-header{

  position:sticky;

  /*
    Breadcrumb now lives INSIDE the header,
    so there is no reason to leave a gap above it.
  */

  top:0;

  z-index:100;

  isolation:isolate;

  margin:
    0
    -20px
    26px;

  padding:
    14px
    20px
    22px;

  background:
    #fffef8;

  backdrop-filter:none;

  box-shadow:
    0 10px 0
    #fffef8,
    0 14px 18px
    rgba(23,58,86,.10);

}


/* ===================================================
   INTEGRATED BREADCRUMB
   =================================================== */

.world-breadcrumb-integrated{

  display:flex;

  align-items:center;

  gap:7px;

  margin:
    0 0 10px;

  padding:0;

  border:0;

  color:
    var(--muted,#667783);

  font-size:10px;
  font-weight:800;

  letter-spacing:.055em;

  text-transform:uppercase;

}


.world-breadcrumb-integrated button{

  appearance:none;

  padding:0;

  border:0;

  background:none;

  color:
    inherit;

  font:inherit;

  font-weight:900;

  cursor:pointer;

  text-decoration:none;

}


.world-breadcrumb-integrated button:hover{

  color:
    var(--teal,#27a6a2);

  text-decoration:underline;

}


.world-breadcrumb-integrated span{

  opacity:.45;

}


.world-breadcrumb-integrated strong{

  color:inherit;

  font:inherit;

  font-weight:900;

}


    /*
      Prevent the page behind the overlay from
      responding to accidental wheel overscroll.
    */

    body.world-detail-open{

      overflow:hidden;

    }


    /* ===================================================
       UNBOUND DETAIL OVERLAY
       =================================================== */

    body[data-reality="unbound"]
    #worldDetailMount:not(:empty){

      background:
        rgba(0,4,9,.82);

    }


    body[data-reality="unbound"]
    #worldDetailMount:not(:empty)
    .world-detail-panel{

      border-radius:0;

      box-shadow:
        0 30px 90px
        rgba(0,0,0,.72);

    }


body[data-reality="unbound"]
#worldDetailMount:not(:empty)
.world-detail-header{

  /*
    Fully opaque so neighborhood cards cannot
    bleed through while scrolling.
  */

  background:
    #060d14;

  backdrop-filter:none;

  box-shadow:
    0 10px 0
    #060d14,
    0 16px 24px
    rgba(0,0,0,.55);

}


    @media(max-width:680px){

      #worldDetailMount:not(:empty){

        padding:10px;

      }


      #worldDetailMount:not(:empty)
      .world-detail-panel{

        max-height:
          calc(100vh - 20px);

      }

    }

  `;


  document.head.appendChild(
    style
  );

}


/* =====================================================
   TAB AVAILABILITY
   ===================================================== */

function isWorldUnboundTabVisible(){

  const unbound =
    getWorldSupersectionByKey(
      WORLD_UNBOUND_KEY
    );


  return Boolean(
    unbound?.visible_to_players
  );

}


/* =====================================================
   VALIDATE ACTIVE TAB
   ===================================================== */

function validateWorldActiveTab(){

  if(
    worldActiveTab ===
      'unbound'
    &&
    !isWorldUnboundTabVisible()
  ){

    worldActiveTab =
      'cast';

  }

}


/* =====================================================
   LOAD
   ===================================================== */

async function loadWorldData(){

  const campaign =
    getWorldCampaign();


  worldSupersections =
    await supabaseGet(
      'world_supersections?select=*&order=sort_order.asc'
    );


  worldSections =
    await supabaseGet(
      'world_sections?select=*&order=sort_order.asc'
    );


  worldCampaignVisibility =
    await supabaseGet(
      `world_campaign_visibility?select=*&campaign=eq.${campaign}`
    );


  worldNotes =
    await supabaseGet(
      `world_notes?select=*&campaign=eq.${campaign}`
    );


  applyWorldCampaignVisibility();

  validateWorldActiveTab();

  validateWorldActiveTarget();

  renderWorld();

}


/* =====================================================
   MASTER RENDER
   ===================================================== */

function renderWorld(){

  /*
    The new tabbed interface lives in the first
    existing mount.

    The old ring/directory mounts remain in the HTML,
    but are intentionally cleared.
  */

  const ringsMount =
    worldById(
      'worldRingsMount'
    );


  const directoryMount =
    worldById(
      'worldDirectoryMount'
    );


  if(ringsMount){

    ringsMount.innerHTML =
      '';

  }


  if(directoryMount){

    directoryMount.innerHTML =
      '';

  }


  renderWorldTabbedLanding();


  if(worldActiveTarget){

    redrawWorldActiveTarget();

  }

}


/* =====================================================
   TAB LANDING
   ===================================================== */

function renderWorldTabbedLanding(){

  const mount =
    worldById(
      'worldOverviewMount'
    );


  if(!mount){

    return;

  }


  const showUnbound =
    isWorldUnboundTabVisible();


  mount.innerHTML = `

    <section class="world-tab-shell">


      <div
        class="world-tab-bar"
        role="tablist"
        aria-label="World directories"
      >


        ${renderWorldTabButton(
          'cast',
          'EPCOT Cast World'
        )}


        ${
          showUnbound
            ? renderWorldTabButton(
                'unbound',
                'Unbound World',
                true
              )
            : ''
        }


        ${renderWorldTabButton(
          'outer',
          'Outer Rings'
        )}


        ${renderWorldTabButton(
          'systems',
          'Systems & Society'
        )}


      </div>


      <div
        class="world-tab-content"
        id="worldTabContent"
      >

        ${renderWorldActiveTab()}

      </div>


    </section>

  `;

}


/* =====================================================
   TAB BUTTON
   ===================================================== */

function renderWorldTabButton(
  key,
  label,
  unbound = false
){

  return `

    <button
      class="
        world-tab-button
        ${worldActiveTab === key ? 'is-active' : ''}
        ${unbound ? 'is-unbound' : ''}
      "
      type="button"
      role="tab"
      aria-selected="${worldActiveTab === key}"
      data-world-action="switch-tab"
      data-world-tab="${key}"
    >

      ${worldEscapeHtml(label)}

    </button>

  `;

}


/* =====================================================
   ACTIVE TAB
   ===================================================== */

function renderWorldActiveTab(){

  if(
    worldActiveTab ===
    'unbound'
  ){

    return renderUnboundWorldTab();

  }


  if(
    worldActiveTab ===
    'outer'
  ){

    return renderOuterRingsTab();

  }


  if(
    worldActiveTab ===
    'systems'
  ){

    return renderSystemsWorldTab();

  }


  return renderCastWorldTab();

}


/* =====================================================
   CAST WORLD TAB
   ===================================================== */

function renderCastWorldTab(){

  const epcot =
    getWorldSupersectionByKey(
      'epcot'
    );


  return `

    <div class="world-tab-panel">


      <section class="world-tab-hero">

        <div class="world-eyebrow">
          World Discovery Program
        </div>

        <h2>
          EPCOT Cast World
        </h2>

        <p>
          Explore the planned community as it is
          presented to Cast Members: the City Center,
          Green Belt, Residential Ring, and published
          neighborhood records.
        </p>

      </section>


      ${
        epcot?.visible_to_players

          ? `
              <div class="world-cast-overview">

                ${renderWorldOverviewCard(
                  epcot
                )}

              </div>
            `

          : ''
      }


      ${renderCastRingNavigator()}


    </div>

  `;

}


/* =====================================================
   EPCOT OVERVIEW CARD
   ===================================================== */

function renderWorldOverviewCard(
  epcot
){

  return `

    <article
      class="world-overview-card"
    >


      <div class="world-overview-copy">


        <div class="world-eyebrow">
          Community Reference
        </div>


        <h1>

          ${worldEscapeHtml(
            epcot.name
          )}

        </h1>


        ${
          epcot.subtitle

            ? `
                <div class="world-overview-subtitle">

                  ${worldEscapeHtml(
                    epcot.subtitle
                  )}

                </div>
              `

            : ''
        }


        <div class="world-overview-description">

          ${
            epcot.description

              ? formatWorldDescription(
                  epcot.description
                )

              : `
                  <span class="world-muted">
                    World information has not yet been published.
                  </span>
                `
          }

        </div>


        <button
          class="world-open-button"
          type="button"
          data-world-action="open-supersection"
          data-world-supersection-id="${epcot.id}"
        >
          Open EPCOT Overview
        </button>


      </div>


      ${renderWorldMediaPreview(
        epcot,
        true
      )}


    </article>

  `;

}


/* =====================================================
   CAST RING NAVIGATOR
   ===================================================== */

function renderCastRingNavigator(){

  const residential =
    getWorldSupersectionByKey(
      'residential_ring'
    );


  const green =
    getWorldSupersectionByKey(
      'green_belt'
    );


  const hub =
    getWorldSupersectionByKey(
      'hub'
    );


  const anythingVisible =

    residential?.visible_to_players
    ||
    green?.visible_to_players
    ||
    hub?.visible_to_players;


  if(
    !anythingVisible
  ){

    return '';

  }


  return `

    <section
      class="
        world-rings-section
        world-cast-ring-section
      "
    >


      <div class="world-section-heading">

        <div>

          <div class="world-eyebrow">
            EPCOT Community Plan
          </div>

          <h2>
            The Rings
          </h2>

          <p>
            Navigate the core city through EPCOT's
            concentric community plan.
          </p>

        </div>

      </div>


      <div class="world-rings-layout">


        <div
          class="world-ring-diagram"
          aria-label="Interactive EPCOT ring diagram"
        >


          ${
            residential?.visible_to_players

              ? `
                  <button
                    class="
                      world-ring
                      world-ring-residential
                    "
                    type="button"
                    data-world-action="open-supersection"
                    data-world-supersection-id="${residential.id}"
                    aria-label="Open Residential Ring"
                  >

                    <span>
                      Residential Ring
                    </span>

                  </button>
                `

              : ''
          }


          ${
            green?.visible_to_players

              ? `
                  <button
                    class="
                      world-ring
                      world-ring-green
                    "
                    type="button"
                    data-world-action="open-supersection"
                    data-world-supersection-id="${green.id}"
                    aria-label="Open Green Belt"
                  >

                    <span>
                      Green Belt
                    </span>

                  </button>
                `

              : ''
          }


          ${
            hub?.visible_to_players

              ? `
                  <button
                    class="
                      world-ring
                      world-ring-hub
                    "
                    type="button"
                    data-world-action="open-supersection"
                    data-world-supersection-id="${hub.id}"
                    aria-label="Open City Center"
                  >

                    <span>
                      City Center
                    </span>

                  </button>
                `

              : ''
          }


        </div>


        <div class="world-ring-key">

          ${renderWorldRingKeyItem(
            hub
          )}

          ${renderWorldRingKeyItem(
            green
          )}

          ${renderWorldRingKeyItem(
            residential
          )}

        </div>


      </div>


    </section>

  `;

}


/* =====================================================
   RING KEY
   ===================================================== */

function renderWorldRingKeyItem(
  item
){

  if(
    !item ||
    !item.visible_to_players
  ){

    return '';

  }


  const sections =
    getVisibleSectionsForSupersection(
      item.id
    );


  return `

    <button
      class="world-ring-key-item"
      type="button"
      data-world-action="open-supersection"
      data-world-supersection-id="${item.id}"
    >

      <strong>

        ${worldEscapeHtml(
          item.name
        )}

      </strong>


      ${
        item.subtitle

          ? `
              <span>

                ${worldEscapeHtml(
                  item.subtitle
                )}

              </span>
            `

          : ''
      }


      ${
        sections.length

          ? `
              <span>
                ${sections.length}
                ${
                  sections.length === 1
                    ? 'record'
                    : 'records'
                }
              </span>
            `

          : ''
      }

    </button>

  `;

}


/* =====================================================
   UNBOUND WORLD TAB
   ===================================================== */

function renderUnboundWorldTab(){

  const unbound =
    getWorldSupersectionByKey(
      WORLD_UNBOUND_KEY
    );


  if(
    !unbound ||
    !unbound.visible_to_players
  ){

    return '';

  }


  const allNeighborhoods =
    WORLD_UNBOUND_NEIGHBORHOOD_KEYS
      .map(
        key =>
          getWorldSectionByKey(
            key
          )
      )
      .filter(Boolean);


  const visibleCount =
    allNeighborhoods.filter(
      item =>
        item.visible_to_players
    ).length;


  return `

    <div class="world-tab-panel">


      <section class="world-tab-hero">

        <div class="world-eyebrow">
          Unbound Geographic Record
        </div>

        <h2>
          Unbound World
        </h2>

        <p>

          Only discovered records may be opened.

        </p>

      </section>


      <div class="world-unbound-stage">


        <div
          class="world-unbound-radial"
          aria-label="Unbound neighborhood ring"
        >

          <div class="world-unbound-center">

            Unbound
            <br>
            Reality

          </div>


          ${
            allNeighborhoods

              .map(
                (
                  section,
                  index
                ) =>
                  renderUnboundRadialNode(
                    section,
                    index,
                    allNeighborhoods.length
                  )
              )

              .join('')
          }


        </div>


        <aside class="world-unbound-key">


          <div class="world-eyebrow">
            Neighborhood Record
          </div>


          ${
            allNeighborhoods

              .map(
                (
                  section,
                  index
                ) =>
                  renderUnboundKeyItem(
                    section,
                    index
                  )
              )

              .join('')
          }


          <div class="world-category-empty">

            ${visibleCount}
            of
            ${allNeighborhoods.length}
            neighborhood records discovered.

          </div>


        </aside>


      </div>


    </div>

  `;

}


/* =====================================================
   UNBOUND RADIAL NODE
   ===================================================== */

function renderUnboundRadialNode(
  section,
  index,
  total
){

  const angle =
    (
      index /
      total
    ) *
    360;


  const visible =
    Boolean(
      section.visible_to_players
    );


  return `

    <button
      class="
        world-unbound-node
        ${visible ? '' : 'is-locked'}
      "
      type="button"
      style="--world-angle:${angle}deg"
      ${
        visible
          ? `
              data-world-action="open-section"
              data-world-section-id="${section.id}"
            `
          : 'disabled'
      }
      aria-label="${
        visible
          ? worldEscapeHtml(section.name)
          : `Unknown neighborhood ${index + 1}`
      }"
    >

      <span class="world-unbound-node-number">
        ${String(index + 1).padStart(2,'0')}
      </span>

      ${
        visible

          ? worldEscapeHtml(
              section.name
            )

          : 'UNKNOWN'
      }

    </button>

  `;

}


/* =====================================================
   UNBOUND KEY
   ===================================================== */

function renderUnboundKeyItem(
  section,
  index
){

  const visible =
    Boolean(
      section.visible_to_players
    );


  return `

    <button
      class="
        world-unbound-key-item
        ${visible ? '' : 'is-locked'}
      "
      type="button"
      ${
        visible
          ? `
              data-world-action="open-section"
              data-world-section-id="${section.id}"
            `
          : 'disabled'
      }
    >

      <strong>

        ${String(index + 1).padStart(2,'0')}
        //

        ${
          visible
            ? worldEscapeHtml(
                section.name
              )
            : 'Undiscovered'
        }

      </strong>


      <span>

        ${
          visible
            ? 'Neighborhood record available'
            : 'Record unavailable'
        }

      </span>

    </button>

  `;

}


/* =====================================================
   OUTER RINGS TAB
   ===================================================== */

function renderOuterRingsTab(){

  const items =
    WORLD_OUTER_RING_KEYS

      .map(
        key =>
          getWorldSupersectionByKey(
            key
          )
      )

      .filter(
        item =>
          item &&
          item.visible_to_players
      );


  return `

    <div class="world-tab-panel">


      <section class="world-tab-hero">

        <div class="world-eyebrow">
          Extended EPCOT Infrastructure
        </div>

        <h2>
          Outer Rings
        </h2>

        <p>
          Locations beyond the central residential
          community become available here as they
          are discovered.
        </p>

      </section>


      ${
        items.length

          ? `
              <div class="world-category-grid">

                ${
                  items
                    .map(
                      renderWorldCategoryCard
                    )
                    .join('')
                }

              </div>
            `

          : `
              <div class="world-category-empty">

                No Outer Ring records have been
                released to your campaign.

              </div>
            `
      }


    </div>

  `;

}


/* =====================================================
   SYSTEMS & SOCIETY TAB
   ===================================================== */

function renderSystemsWorldTab(){

  const normalKeys = [

    'transportation',
    'board_of_tomorrow',
    'epcot_iteration',
    'culture'

  ];


  const calendarKeys = [

    'annual_holidays',
    'quarterly_celebrations'

  ];


  const peopleKeys = [

    'species',
    'language'

  ];


  return `

    <div class="world-tab-panel">


      <section class="world-tab-hero">

        <div class="world-eyebrow">
          Community Systems Reference
        </div>

        <h2>
          Systems & Society
        </h2>

        <p>
          Institutions, transportation, policy,
          culture, calendars, species, and language
          records used throughout EPCOT.
        </p>

      </section>


      ${renderWorldSystemGroup(
        'Systems & Governance',
        normalKeys
      )}


      ${renderWorldSystemGroup(
        'Calendar',
        calendarKeys
      )}


      ${renderWorldSystemGroup(
        'People & Language',
        peopleKeys
      )}


    </div>

  `;

}


/* =====================================================
   SYSTEM GROUP
   ===================================================== */

function renderWorldSystemGroup(
  title,
  keys
){

  const items =
    keys

      .map(
        key =>
          getWorldSupersectionByKey(
            key
          )
      )

      .filter(
        item =>
          item &&
          item.visible_to_players
      );


  if(
    !items.length
  ){

    return '';

  }


  return `

    <section class="world-system-group">

      <h3 class="world-system-group-title">

        ${worldEscapeHtml(
          title
        )}

      </h3>


      <div class="world-category-grid">

        ${
          items
            .map(
              renderWorldCategoryCard
            )
            .join('')
        }

      </div>

    </section>

  `;

}


/* =====================================================
   CATEGORY CARD
   ===================================================== */

function renderWorldCategoryCard(
  item
){

  const sectionCount =
    getVisibleSectionsForSupersection(
      item.id
    ).length;


  return `

    <button
      class="world-category-card"
      type="button"
      data-world-action="open-supersection"
      data-world-supersection-id="${item.id}"
    >

      <strong>

        ${worldEscapeHtml(
          item.name
        )}

      </strong>


      <span>

        ${
          item.subtitle

            ? worldEscapeHtml(
                item.subtitle
              )

            : (
                sectionCount

                  ? `${sectionCount} ${
                      sectionCount === 1
                        ? 'record'
                        : 'records'
                    } available`

                  : 'Open reference'
              )
        }

      </span>

    </button>

  `;

}


/* =====================================================
   DETAIL ACCENT
   ===================================================== */

function getWorldAccentClass(
  item
){

  if(
    !item
  ){

    return '';

  }


  const parent =
    item.supersection_id

      ? getWorldSupersectionById(
          item.supersection_id
        )

      : item;


  const key =
    parent?.key ||
    '';


  if(
    key ===
    WORLD_UNBOUND_KEY
  ){

    return 'world-accent-unbound';

  }


  if(
    WORLD_OUTER_RING_KEYS.includes(
      key
    )
  ){

    return 'world-accent-outer';

  }


  if(
    WORLD_SYSTEM_KEYS.includes(
      key
    )
  ){

    return 'world-accent-systems';

  }


  return '';

}


/* =====================================================
   DETAIL HEADER
   ===================================================== */

function renderWorldDetailHeader(
  item
){

  return `

    <header
      class="
        world-detail-header
        ${getWorldAccentClass(item)}
      "
    >


      <div>


        <div class="world-eyebrow">
          EPCOT World File
        </div>


        <h2>

          ${worldEscapeHtml(
            item.name
          )}

        </h2>


        ${
          item.subtitle

            ? `
                <div class="world-detail-subtitle">

                  ${worldEscapeHtml(
                    item.subtitle
                  )}

                </div>
              `

            : ''
        }


      </div>


      <button
        class="world-detail-close"
        type="button"
        data-world-action="close-detail"
        aria-label="Close World detail"
      >
        ×
      </button>


    </header>

  `;

}


/* =====================================================
   SECTION CARD
   ===================================================== */

function renderWorldSectionCard(
  section
){

  return `

    <button
      class="world-section-card"
      type="button"
      data-world-action="open-section"
      data-world-section-id="${section.id}"
    >


      <div class="world-section-card-title">

        ${worldEscapeHtml(
          section.name
        )}

      </div>


      ${
        section.subtitle

          ? `
              <div class="world-section-card-subtitle">

                ${worldEscapeHtml(
                  section.subtitle
                )}

              </div>
            `

          : ''
      }


      ${
        section.downtime_enabled

          ? `
              <span class="world-downtime-badge">
                Downtime Activities
              </span>
            `

          : ''
      }


      ${
        section.map_url

          ? `
              <span class="world-map-badge">
                Media Available
              </span>
            `

          : ''
      }


    </button>

  `;

}


/* =====================================================
   OPEN SUPERSECTION
   ===================================================== */

function openWorldSupersection(
  supersectionId,
  scroll = true
){

  const supersection =
    getWorldSupersectionById(
      supersectionId
    );


  if(
    !supersection ||
    !supersection.visible_to_players
  ){

    return;

  }


  worldActiveTarget = {

    type:
      'supersection',

    id:
      supersection.id

  };


  const sections =
    getVisibleSectionsForSupersection(
      supersection.id
    );


  const note =
    getWorldNoteForSupersection(
      supersection.id
    );


  const mount =
    worldById(
      'worldDetailMount'
    );


  if(
    !mount
  ){

    return;

  }


  mount.innerHTML = `

    <article class="world-detail-panel">


      ${renderWorldDetailHeader(
        supersection
      )}


      ${renderWorldMediaPreview(
        supersection
      )}


      <section class="world-detail-description">

        <h3>
          Overview
        </h3>


        ${
          supersection.description

            ? `
                <div>

                  <p>

                    ${formatWorldDescription(
                      supersection.description
                    )}

                  </p>

                </div>
              `

            : `
                <div class="world-muted">
                  No published information yet.
                </div>
              `
        }

      </section>


      ${
        sections.length

          ? `
              <section class="world-detail-sections">

                <div class="world-eyebrow">
                  Available Records
                </div>

                <h3>
                  Explore
                </h3>

                <div class="world-section-grid">

                  ${
                    sections
                      .map(
                        renderWorldSectionCard
                      )
                      .join('')
                  }

                </div>

              </section>
            `

          : ''
      }


      ${renderWorldSharedNotes({

        type:
          'supersection',

        id:
          supersection.id,

        note

      })}


    </article>

  `;


  window.epcotPlayerWidgets
    ?.hydrateWorldDowntime?.(
      mount
    );


  if(
    scroll
  ){

    scrollWorldDetailIntoView();

  }

}


/* =====================================================
   OPEN SECTION
   ===================================================== */

function openWorldSection(
  sectionId,
  scroll = true
){

  const section =
    getWorldSectionById(
      sectionId
    );


  if(
    !section ||
    !section.visible_to_players
  ){

    return;

  }


  const parent =
    getWorldSupersectionById(
      section.supersection_id
    );


  if(
    !parent ||
    !parent.visible_to_players
  ){

    return;

  }


  worldActiveTarget = {

    type:
      'section',

    id:
      section.id

  };


  const note =
    getWorldNoteForSection(
      section.id
    );


  const mount =
    worldById(
      'worldDetailMount'
    );


  if(
    !mount
  ){

    return;

  }


  mount.innerHTML = `

    <article class="world-detail-panel">


      <header
  class="
    world-detail-header
    ${getWorldAccentClass(section)}
  "
>


  <div>


    <div class="world-breadcrumb world-breadcrumb-integrated">


      <button
        type="button"
        data-world-action="open-supersection"
        data-world-supersection-id="${parent.id}"
      >

        ${worldEscapeHtml(
          parent.name
        )}

      </button>


      <span>
        ›
      </span>


      <strong>

        ${worldEscapeHtml(
          section.name
        )}

      </strong>


    </div>


    <div class="world-eyebrow">
      EPCOT World File
    </div>


    <h2>

      ${worldEscapeHtml(
        section.name
      )}

    </h2>


    ${
      section.subtitle

        ? `
            <div class="world-detail-subtitle">

              ${worldEscapeHtml(
                section.subtitle
              )}

            </div>
          `

        : ''
    }


  </div>


  <button
    class="world-detail-close"
    type="button"
    data-world-action="close-detail"
    aria-label="Close World detail"
  >
    ×
  </button>


</header>


      ${renderWorldMediaPreview(
        section
      )}


      <section class="world-detail-description">

        <h3>
          Overview
        </h3>


        ${
          section.description

            ? `
                <div>

                  <p>

                    ${formatWorldDescription(
                      section.description
                    )}

                  </p>

                </div>
              `

            : `
                <div class="world-muted">
                  No published information yet.
                </div>
              `
        }

      </section>


      ${
        section.downtime_enabled

          ? renderWorldDowntimePlaceholder(
              section
            )

          : ''
      }


      ${renderWorldSharedNotes({

        type:
          'section',

        id:
          section.id,

        note

      })}


    </article>

  `;


  window.epcotPlayerWidgets
    ?.hydrateWorldDowntime?.(
      mount
    );


  if(
    scroll
  ){

    scrollWorldDetailIntoView();

  }

}


/* =====================================================
   DOWNTIME
   ===================================================== */

function renderWorldDowntimePlaceholder(
  section
){

  return `

    <section class="world-downtime-panel">


      <div class="world-eyebrow">
        Downtime Activities
      </div>


      <h3>

        ${worldEscapeHtml(
          section.name
        )}

      </h3>


      <p>
        Authorized activities available at this
        location appear below.
      </p>


<div
  data-world-downtime-host
  data-world-section-id="${worldEscapeHtml(
    section.id
  )}"
  data-world-widget-ids="${worldEscapeHtml(
    (
      section.downtime_widget_ids ||
      []
    ).join(',')
  )}"
>

        <div class="world-muted">
          Checking activity authorization...
        </div>

      </div>


    </section>

  `;

}


/* =====================================================
   SHARED NOTES
   ===================================================== */

function renderWorldSharedNotes({
  type,
  id,
  note
}){

  const content =
    sanitizeWorldText(
      note?.content ||
      ''
    );


  return `

    <section class="world-notes-panel">


      <div class="world-notes-header">


        <div>

          <div class="world-eyebrow">
            Campaign Record
          </div>

          <h3>
            Shared Notes
          </h3>

          <p>

            Notes entered here are shared with your

            ${worldEscapeHtml(
              capitalizeWorldCampaign()
            )}

            campaign.

          </p>

        </div>


        <button
          class="world-save-notes-button"
          type="button"
          data-world-action="save-notes"
          data-world-note-type="${type}"
          data-world-note-target="${id}"
        >
          Save Notes
        </button>


      </div>


      <div class="world-format-toolbar">


        <button
          type="button"
          data-world-command="bold"
          title="Bold"
        >
          <strong>B</strong>
        </button>


        <button
          type="button"
          data-world-command="italic"
          title="Italic"
        >
          <em>I</em>
        </button>


        <button
          type="button"
          data-world-command="underline"
          title="Underline"
        >
          <u>U</u>
        </button>


        <button
          type="button"
          data-world-command="insertUnorderedList"
          title="Bulleted List"
        >
          • List
        </button>


        <button
          type="button"
          data-world-command="insertOrderedList"
          title="Numbered List"
        >
          1. List
        </button>


      </div>


      <div
        class="world-notes-editor"
        id="worldSharedNotesEditor"
        contenteditable="true"
        data-world-note-type="${type}"
        data-world-note-target="${id}"
        aria-label="Shared World notes"
      >${content}</div>


    </section>

  `;

}


/* =====================================================
   CAMPAIGN NAME
   ===================================================== */

function capitalizeWorldCampaign(){

  return getWorldCampaign() ===
    'villain'
      ? 'Villain'
      : 'Hero';

}


/* =====================================================
   SAVE NOTES
   ===================================================== */

async function saveWorldNotes(
  type,
  targetId
){

  const editor =
    worldById(
      'worldSharedNotesEditor'
    );


  if(
    !editor
  ){

    return;

  }


  const content =
    sanitizeWorldText(
      editor.innerHTML
    );


  const campaign =
    getWorldCampaign();


  const existing =

    type ===
    'section'

      ? getWorldNoteForSection(
          targetId
        )

      : getWorldNoteForSupersection(
          targetId
        );


  const button =
    document.querySelector(
      `[data-world-action="save-notes"][data-world-note-target="${CSS.escape(targetId)}"]`
    );


  if(
    button
  ){

    button.disabled =
      true;

    button.textContent =
      'Saving...';

  }


  try{

    if(
      existing
    ){

      const updated =
        await supabasePatch(
          `world_notes?id=eq.${encodeURIComponent(existing.id)}`,
          {

            content:
              content || null,

            updated_at:
              new Date()
                .toISOString()

          }
        );


      existing.content =
        updated[0]?.content ??
        content;


      existing.updated_at =
        updated[0]?.updated_at ??
        new Date()
          .toISOString();

    }
    else{

      const body = {

        campaign,

        content:
          content || null,

        updated_at:
          new Date()
            .toISOString()

      };


      if(
        type ===
        'section'
      ){

        body.section_id =
          targetId;

        body.supersection_id =
          null;

      }
      else{

        body.supersection_id =
          targetId;

        body.section_id =
          null;

      }


      const inserted =
        await supabasePost(
          'world_notes',
          body
        );


      if(
        !inserted[0]
      ){

        throw new Error(
          'Supabase did not return the World notes record.'
        );

      }


      worldNotes.push(
        inserted[0]
      );

    }


    if(
      button
    ){

      button.textContent =
        'Saved';


      window.setTimeout(
        () => {

          if(
            button.isConnected
          ){

            button.textContent =
              'Save Notes';

          }

        },
        1200
      );

    }

  }
  catch(error){

    worldShowError(
      'World notes could not be saved.',
      error
    );


    if(
      button
    ){

      button.textContent =
        'Save Notes';

    }

  }
  finally{

    if(
      button
    ){

      button.disabled =
        false;

    }

  }

}


/* =====================================================
   FORMATTING
   ===================================================== */

function runWorldFormattingCommand(
  command
){

  const editor =
    worldById(
      'worldSharedNotesEditor'
    );


  if(
    !editor
  ){

    return;

  }


  editor.focus();


  document.execCommand(
    command,
    false,
    null
  );

}


/* =====================================================
   ACTIVE TARGET VALIDATION
   ===================================================== */

function validateWorldActiveTarget(){

  if(
    !worldActiveTarget
  ){

    return;

  }


  if(
    worldActiveTarget.type ===
    'supersection'
  ){

    const item =
      getWorldSupersectionById(
        worldActiveTarget.id
      );


    if(
      !item ||
      !item.visible_to_players
    ){

      closeWorldDetail();

    }


    return;

  }


  const section =
    getWorldSectionById(
      worldActiveTarget.id
    );


  const parent =
    section
      ? getWorldSupersectionById(
          section.supersection_id
        )
      : null;


  if(
    !section ||
    !section.visible_to_players ||
    !parent ||
    !parent.visible_to_players
  ){

    closeWorldDetail();

  }

}


/* =====================================================
   REDRAW ACTIVE DETAIL
   ===================================================== */

function redrawWorldActiveTarget(){

  if(
    !worldActiveTarget
  ){

    return;

  }


  if(
    worldActiveTarget.type ===
    'section'
  ){

    openWorldSection(
      worldActiveTarget.id,
      false
    );

  }
  else{

    openWorldSupersection(
      worldActiveTarget.id,
      false
    );

  }

}


/* =====================================================
   CLOSE DETAIL
   ===================================================== */

function closeWorldDetail(){

  worldActiveTarget =
    null;


  const mount =
    worldById(
      'worldDetailMount'
    );


  if(
    mount
  ){

    mount.innerHTML =
      '';

  }


  /*
    Restore normal page scrolling.

    Because the detail is now an overlay,
    the underlying World page never moved.
  */

  document.body.classList.remove(
    'world-detail-open'
  );

}


/* =====================================================
   DETAIL SCROLL
   ===================================================== */

function scrollWorldDetailIntoView(){

  /*
    World records are fixed overlays.

    Never move the underlying page when a record opens.
  */

  document.body.classList.add(
    'world-detail-open'
  );


  const panel =
    document.querySelector(
      '#worldDetailMount .world-detail-panel'
    );


  if(
    panel
  ){

    panel.scrollTop =
      0;

  }

}


/* =====================================================
   TAB SWITCH
   ===================================================== */

function switchWorldTab(
  tab
){

  const allowed =
    new Set([

      'cast',
      'outer',
      'systems'

    ]);


  if(
    isWorldUnboundTabVisible()
  ){

    allowed.add(
      'unbound'
    );

  }


  if(
    !allowed.has(
      tab
    )
  ){

    return;

  }


  worldActiveTab =
    tab;


  closeWorldDetail();

  renderWorldTabbedLanding();

}


/* =====================================================
   EVENTS
   ===================================================== */

function connectWorldEvents(){

  if(
    worldEventsConnected
  ){

    return;

  }


  const view =
    worldById(
      'worldView'
    );


  if(
    !view
  ){

    return;

  }


  worldEventsConnected =
    true;


  view.addEventListener(
    'click',
    event => {


      const commandButton =
        event.target.closest(
          '[data-world-command]'
        );


      if(
        commandButton
      ){

        runWorldFormattingCommand(
          commandButton.dataset.worldCommand
        );

        return;

      }


      const button =
        event.target.closest(
          '[data-world-action]'
        );


      if(
        !button
      ){

        return;

      }


      const action =
        button.dataset.worldAction;


      if(
        action ===
        'switch-tab'
      ){

        switchWorldTab(
          button.dataset.worldTab
        );

        return;

      }


      if(
        action ===
        'open-supersection'
      ){

        const id =
          button.dataset.worldSupersectionId;


        if(
          id
        ){

          openWorldSupersection(
            id
          );

        }


        return;

      }


      if(
        action ===
        'open-section'
      ){

        const id =
          button.dataset.worldSectionId;


        if(
          id
        ){

          openWorldSection(
            id
          );

        }


        return;

      }


      if(
        action ===
        'close-detail'
      ){

        closeWorldDetail();

        return;

      }


      if(
        action ===
        'save-notes'
      ){

        const type =
          button.dataset.worldNoteType;


        const targetId =
          button.dataset.worldNoteTarget;


        if(
          type &&
          targetId
        ){

          saveWorldNotes(
            type,
            targetId
          );

        }

      }

    }
  );

}


/* =====================================================
   REALTIME
   ===================================================== */

function subscribeToWorldRealtime(){

  const client =
    window.epcotAuth?.client;


  if(
    !client ||
    !client.channel
  ){

    console.warn(
      'World realtime unavailable: Supabase client not found.'
    );

    return;

  }


  if(
    worldRealtimeChannel
  ){

    client.removeChannel(
      worldRealtimeChannel
    );

  }


  const campaign =
    getWorldCampaign();


  const refresh =
    async () => {

      try{

        await loadWorldData();

      }
      catch(error){

        console.error(
          'Live World refresh failed:',
          error
        );

      }

    };


  worldRealtimeChannel =
    client

      .channel(
        `world-live-${campaign}-${Math.random().toString(36).slice(2)}`
      )

      .on(

        'postgres_changes',

        {
          event:'*',
          schema:'public',
          table:'world_supersections'
        },

        refresh

      )

      .on(

        'postgres_changes',

        {
          event:'*',
          schema:'public',
          table:'world_sections'
        },

        refresh

      )

      .on(

        'postgres_changes',

        {
          event:'*',
          schema:'public',
          table:'world_campaign_visibility',
          filter:`campaign=eq.${campaign}`
        },

        refresh

      )

      .on(

        'postgres_changes',

        {
          event:'*',
          schema:'public',
          table:'world_notes',
          filter:`campaign=eq.${campaign}`
        },

        refresh

      )

      .subscribe(
        (
          status,
          error
        ) => {

          console.log(
            'World realtime status:',
            status
          );


          if(
            error
          ){

            console.error(
              'World realtime error:',
              error
            );

          }

        }
      );

}


/* =====================================================
   PUBLIC REFRESH
   ===================================================== */

window.epcotWorld = {

  refresh:
    loadWorldData,

  openTab:
    switchWorldTab

};


/* =====================================================
   INITIALIZE
   ===================================================== */

async function initializeWorld(){

  if(
    !worldById(
      'worldView'
    )
  ){

    return;

  }


  installWorldTabStyles();

  connectWorldEvents();


  try{

    await loadWorldData();

    subscribeToWorldRealtime();

  }
  catch(error){

    console.error(
      'World load failed:',
      error
    );


    const overview =
      worldById(
        'worldOverviewMount'
      );


    if(
      overview
    ){

      overview.innerHTML = `

        <div class="world-load-error">

          <strong>
            World data could not be loaded.
          </strong>

          <p>

            ${worldEscapeHtml(
              error.message
            )}

          </p>

        </div>

      `;

    }

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
    initializeWorld
  );

}
else{

  initializeWorld();

}
/* =====================================================
   EPCOT DND
   DM WORLD CONTROL

   Four-part World architecture:

   1. EPCOT Cast World
   2. Unbound World
   3. Outer Rings
   4. Systems & Society

   Preserves:
   - Explorer preview
   - Editor
   - Hero / Villain visibility
   - Supersection CRUD
   - Section CRUD
   - Drag section ordering
   - Move sections between parents
   - Supersection ordering
   - Media
   - Downtime
   - System keys
   - Shared-note preview
   - Realtime
   ===================================================== */


/* =====================================================
   CONFIGURATION
   ===================================================== */

const DM_WORLD_CAST_KEYS = [
  'epcot',
  'hub',
  'green_belt',
  'residential_ring'
];


const DM_WORLD_UNBOUND_KEY =
  'unbound_world';


const DM_WORLD_OUTER_KEYS = [
  'industry_park',
  'theme_park',
  'airport',
  'underground',
  'arcots'
];


const DM_WORLD_SYSTEM_KEYS = [
  'transportation',
  'board_of_tomorrow',
  'epcot_iteration',
  'culture',
  'annual_holidays',
  'quarterly_celebrations',
  'species',
  'language'
];


const DM_WORLD_UNBOUND_SECTION_KEYS = [
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


const DM_WORLD_DISPLAY_TYPES = [
  'standard',
  'overview',
  'ring',
  'reference',
  'hidden'
];
const DM_WORLD_DOWNTIME_WIDGETS = [

  {
    id:'downtime-training',
    name:'Magic Kingdom Training'
  },

  {
    id:'downtime-gathering',
    name:'Animal Kingdom Gathering'
  },

  {
    id:'downtime-crafting',
    name:'Backstage Crafting'
  },

  {
    id:'downtime-social',
    name:'Pavilions Social Events'
  },

  {
    id:'downtime-potion-brewing',
    name:'Potion Brewing'
  }

];

/* =====================================================
   STATE
   ===================================================== */

const DM_WORLD = {

  mode:
    'explorer',

  campaign:
    'hero',

  tab:
    'cast',

  supersections: [],

  sections: [],

  visibility: [],

  notes: [],

  explorerTarget:
    null,

  editingType:
    null,

  editingId:
    null,

  dragType:
    null,

  dragId:
    null,

  suppressRealtime:
    false,

  initialized:
    false

};


let dmWorldRealtimeChannel =
  null;


/* =====================================================
   BASIC HELPERS
   ===================================================== */

function dmWorldById(id){

  return document.getElementById(id);

}


function dmWorldClient(){

  return (
    window.epcotAuth?.client ||
    null
  );

}


function dmWorldEscape(value){

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


function dmWorldSlug(value){

  return String(
    value || ''
  )
    .trim()
    .toLowerCase()
    .replace(
      /[^a-z0-9]+/g,
      '_'
    )
    .replace(
      /^_+|_+$/g,
      ''
    );

}


function dmWorldSupersection(id){

  return DM_WORLD.supersections.find(
    item =>
      item.id === id
  ) || null;

}


function dmWorldSection(id){

  return DM_WORLD.sections.find(
    item =>
      item.id === id
  ) || null;

}


function dmWorldSupersectionByKey(key){

  return DM_WORLD.supersections.find(
    item =>
      item.key === key
  ) || null;

}


function dmWorldSectionByKey(key){

  return DM_WORLD.sections.find(
    item =>
      item.key === key
  ) || null;

}


function dmWorldSectionsFor(
  supersectionId
){

  return DM_WORLD.sections

    .filter(
      item =>
        item.supersection_id ===
        supersectionId
    )

    .sort(
      (a,b) =>
        (a.sort_order ?? 0) -
        (b.sort_order ?? 0)
    );

}


function dmWorldNextSupersectionSort(){

  if(
    !DM_WORLD.supersections.length
  ){

    return 10;

  }


  return (
    Math.max(
      ...DM_WORLD.supersections.map(
        item =>
          item.sort_order ?? 0
      )
    ) +
    10
  );

}


function dmWorldNextSectionSort(
  parentId
){

  const sections =
    dmWorldSectionsFor(
      parentId
    );


  if(
    !sections.length
  ){

    return 10;

  }


  return (
    Math.max(
      ...sections.map(
        item =>
          item.sort_order ?? 0
      )
    ) +
    10
  );

}


/* =====================================================
   VISIBILITY
   ===================================================== */

function dmWorldVisibilityRow(
  type,
  id,
  campaign
){

  return DM_WORLD.visibility.find(
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
          row.supersection_id ===
            id
          &&
          row.section_id ===
            null
        );

      }


      return (
        row.section_id ===
          id
        &&
        row.supersection_id ===
          null
      );

    }
  ) || null;

}


function dmWorldIsVisible(
  type,
  item,
  campaign = DM_WORLD.campaign
){

  if(!item){

    return false;

  }


  const row =
    dmWorldVisibilityRow(
      type,
      item.id,
      campaign
    );


  if(row){

    return Boolean(
      row.is_visible
    );

  }


  return Boolean(
    item.visible_to_players
  );

}


function dmWorldVisibilityBadge(
  type,
  item,
  campaign
){

  const visible =
    dmWorldIsVisible(
      type,
      item,
      campaign
    );


  return `

    <span
      class="
        dm-world-badge
        ${visible ? 'visible' : 'hidden'}
      "
    >

      ${campaign === 'hero' ? 'Hero' : 'Villain'}:
      ${visible ? 'Visible' : 'Hidden'}

    </span>

  `;

}


/* =====================================================
   NOTES
   ===================================================== */

function dmWorldNoteForSupersection(
  id
){

  return DM_WORLD.notes.find(
    note =>
      note.campaign ===
        DM_WORLD.campaign
      &&
      note.supersection_id ===
        id
      &&
      note.section_id ===
        null
  ) || null;

}


function dmWorldNoteForSection(
  id
){

  return DM_WORLD.notes.find(
    note =>
      note.campaign ===
        DM_WORLD.campaign
      &&
      note.section_id ===
        id
      &&
      note.supersection_id ===
        null
  ) || null;

}


function dmWorldSafeHtml(html){

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


/* =====================================================
   CATEGORY HELPERS
   ===================================================== */

function dmWorldCategoryForSupersection(
  item
){

  if(!item){

    return 'systems';

  }


  if(
    DM_WORLD_CAST_KEYS.includes(
      item.key
    )
  ){

    return 'cast';

  }


  if(
    item.key ===
    DM_WORLD_UNBOUND_KEY
  ){

    return 'unbound';

  }


  if(
    DM_WORLD_OUTER_KEYS.includes(
      item.key
    )
  ){

    return 'outer';

  }


  return 'systems';

}


function dmWorldSupersectionsForTab(
  tab
){

  if(
    tab ===
    'cast'
  ){

    return DM_WORLD_CAST_KEYS
      .map(
        key =>
          dmWorldSupersectionByKey(
            key
          )
      )
      .filter(Boolean);

  }


  if(
    tab ===
    'unbound'
  ){

    const item =
      dmWorldSupersectionByKey(
        DM_WORLD_UNBOUND_KEY
      );


    return item
      ? [item]
      : [];

  }


  if(
    tab ===
    'outer'
  ){

    return DM_WORLD_OUTER_KEYS
      .map(
        key =>
          dmWorldSupersectionByKey(
            key
          )
      )
      .filter(Boolean);

  }


  const known =
    new Set([
      ...DM_WORLD_CAST_KEYS,
      DM_WORLD_UNBOUND_KEY,
      ...DM_WORLD_OUTER_KEYS
    ]);


  return DM_WORLD.supersections
    .filter(
      item =>
        !known.has(
          item.key
        )
    )
    .sort(
      (a,b) =>
        (a.sort_order ?? 0) -
        (b.sort_order ?? 0)
    );

}


/* =====================================================
   STYLES
   ===================================================== */

function installDmWorldStyles(){

  if(
    dmWorldById(
      'dmWorldAdminStyles'
    )
  ){

    return;

  }


  const style =
    document.createElement(
      'style'
    );


  style.id =
    'dmWorldAdminStyles';


  style.textContent = `

    /* ================================================
       MAIN CONTROLS
       ================================================ */

    .dm-world-controlbar{
      display:flex;
      justify-content:space-between;
      align-items:center;
      gap:14px;
      flex-wrap:wrap;
      margin-bottom:14px;
      padding:12px;
      border:1px solid rgba(255,255,255,.12);
      background:rgba(0,0,0,.16);
    }


    .dm-world-switches{
      display:flex;
      gap:7px;
      flex-wrap:wrap;
    }


    .dm-world-switch{
      appearance:none;
      padding:9px 14px;
      border:1px solid rgba(255,255,255,.17);
      border-radius:6px;
      background:rgba(255,255,255,.05);
      color:inherit;
      font:inherit;
      font-weight:850;
      cursor:pointer;
    }


    .dm-world-switch.is-active{
      border-color:transparent;
      background:#f4c96b;
      color:#142436;
    }


    /* ================================================
       WORLD CATEGORY TABS
       ================================================ */

    .dm-world-tabs{
      display:grid;
      grid-template-columns:repeat(4,minmax(0,1fr));
      gap:8px;
      margin-bottom:18px;
      padding:7px;
      border:1px solid rgba(255,255,255,.12);
      background:rgba(0,0,0,.12);
    }


    .dm-world-tab{
      appearance:none;
      min-height:54px;
      padding:9px 12px;
      border:1px solid rgba(255,255,255,.13);
      background:rgba(255,255,255,.035);
      color:inherit;
      font:inherit;
      font-size:.8rem;
      font-weight:900;
      letter-spacing:.045em;
      cursor:pointer;
    }


    .dm-world-tab:hover{
      border-color:rgba(244,201,107,.45);
    }


    .dm-world-tab.is-active{
      background:#102f3d;
      border-color:#f4c96b;
      color:#f4c96b;
    }


    .dm-world-tab.unbound.is-active{
      border-color:#c75a91;
      color:#e170a8;
      background:linear-gradient(135deg,#151425,#081713);
    }


    /* ================================================
       HERO / PANEL
       ================================================ */

    .dm-world-tab-hero{
      position:relative;
      overflow:hidden;
      margin-bottom:18px;
      padding:19px 21px;
      border:1px solid rgba(255,255,255,.12);
      background:
        linear-gradient(
          135deg,
          rgba(14,42,54,.9),
          rgba(11,25,36,.92)
        );
    }


    .dm-world-tab-hero::after{
      content:"";
      position:absolute;
      width:170px;
      height:170px;
      right:-80px;
      top:-90px;
      border:2px solid rgba(47,197,191,.12);
      border-radius:50%;
      box-shadow:
        0 0 0 26px rgba(244,201,107,.025),
        0 0 0 52px rgba(199,90,145,.02);
    }


    .dm-world-tab-hero h2{
      position:relative;
      z-index:1;
      margin:.2rem 0;
      color:#f4c96b;
      font-size:1.65rem;
    }


    .dm-world-tab-hero p{
      position:relative;
      z-index:1;
      max-width:780px;
      margin:.4rem 0 0;
      opacity:.72;
      line-height:1.55;
    }


    /* ================================================
       EXPLORER
       ================================================ */

    .dm-world-explorer{
      display:grid;
      gap:16px;
    }


    .dm-world-explorer-grid{
      display:grid;
      grid-template-columns:repeat(auto-fit,minmax(220px,1fr));
      gap:11px;
    }


    .dm-world-explorer-card{
      appearance:none;
      min-height:122px;
      padding:16px;
      text-align:left;
      border:1px solid rgba(255,255,255,.13);
      background:rgba(255,255,255,.035);
      color:inherit;
      font:inherit;
      cursor:pointer;
    }


    .dm-world-explorer-card:hover{
      border-color:rgba(244,201,107,.5);
      transform:translateY(-1px);
    }


    .dm-world-explorer-card strong{
      display:block;
      font-size:1rem;
    }


    .dm-world-explorer-card span{
      display:block;
      margin-top:6px;
      opacity:.6;
      font-size:.78rem;
    }


    .dm-world-empty{
      padding:20px;
      border:1px dashed rgba(255,255,255,.15);
      opacity:.68;
    }


    /* ================================================
       CAST RING
       ================================================ */

    .dm-world-rings-layout{
      display:grid;
      grid-template-columns:minmax(300px,1fr) minmax(220px,.65fr);
      gap:24px;
      align-items:center;
    }


    .dm-world-ring-diagram{
      position:relative;
      width:min(520px,100%);
      aspect-ratio:1;
      margin:auto;
    }


.dm-world-ring{
  appearance:none !important;
  -webkit-appearance:none !important;

  position:absolute;

  left:50%;
  top:50%;

  display:flex;

  justify-content:center;
  align-items:flex-start;

  /*
    Completely neutralize inherited dashboard
    button dimensions and decoration.
  */

  min-width:0 !important;
  min-height:0 !important;

  margin:0 !important;

  padding:0 !important;

  border-radius:50%;

  background-color:transparent;

  box-shadow:none !important;

  outline:none !important;

  text-indent:0;

  transform:
    translate(-50%,-50%);

  font:inherit;

  font-weight:900;

  cursor:pointer;

  overflow:hidden;
}


.dm-world-ring::before,
.dm-world-ring::after{

  content:none !important;

  display:none !important;

  width:0 !important;
  height:0 !important;

  background:none !important;

  box-shadow:none !important;

}


/*
  Some dashboard button styles use pseudo-elements.
  Circular World rings should not inherit them.
*/

.dm-world-ring::before,
.dm-world-ring::after{

  content:none !important;

  display:none !important;

}


.dm-world-ring-residential{
  width:96% !important;
  height:96% !important;

  border:
    2px solid
    rgba(74,157,191,.8);

  background:

    radial-gradient(
      circle at center,
      transparent 0 63%,
      rgba(74,157,191,.10) 63% 100%
    ) !important;

  color:#a9d7e8;
}


.dm-world-ring-residential span{
  margin-top:8%;
}


.dm-world-ring-green{
  width:69% !important;
  height:69% !important;

  border:
    2px solid
    rgba(82,185,158,.8);

  background:

    radial-gradient(
      circle at center,
      transparent 0 53%,
      rgba(82,185,158,.13) 53% 100%
    ) !important;

  color:#9de0cb;
}


.dm-world-ring-green span{
  margin-top:11%;
}


.dm-world-ring-hub{
  width:35% !important;
  height:35% !important;

  align-items:center;

  border:
    2px solid
    #d6a844;

  background:

    radial-gradient(
      circle at 40% 35%,
      #f4d781,
      #b9872b
    ) !important;

  color:#102433;
}


.dm-world-ring span{
  position:relative;

  z-index:2;

  display:inline-block;

  padding:
    5px 9px;

  border-radius:999px;

  background:
    rgba(4,20,28,.92);

  line-height:1.1;

  pointer-events:none;
}

.dm-world-ring-hub span{

  background:
    rgba(255,246,210,.94);

  color:
    #102433;

  border:
    1px solid
    rgba(185,135,43,.32);

  font-weight:900;

}

/* ================================================
   CAST RING ANIMATION
   ================================================ */

@keyframes dmWorldResidentialPulse{

  0%,
  100%{
    transform:
      translate(-50%,-50%)
      scale(1);
  }

  50%{
    transform:
      translate(-50%,-50%)
      scale(1.018);
  }

}


@keyframes dmWorldGreenPulse{

  0%,
  100%{
    transform:
      translate(-50%,-50%)
      scale(1);
  }

  50%{
    transform:
      translate(-50%,-50%)
      scale(.978);
  }

}


@keyframes dmWorldHubPulse{

  0%,
  100%{
    transform:
      translate(-50%,-50%)
      scale(1);
  }

  50%{
    transform:
      translate(-50%,-50%)
      scale(1.035);
  }

}


.dm-world-ring-residential{
  animation:
    dmWorldResidentialPulse
    7s
    ease-in-out
    infinite;
}


.dm-world-ring-green{
  animation:
    dmWorldGreenPulse
    5.8s
    ease-in-out
    infinite;
}


.dm-world-ring-hub{
  animation:
    dmWorldHubPulse
    4.6s
    ease-in-out
    infinite;
}


/*
  Hover feedback without reintroducing
  the inherited dashboard shadow.
*/

.dm-world-ring:hover{
  filter:
    brightness(1.13)
    saturate(1.08);
}


.dm-world-ring:active{
  filter:
    brightness(1.2)
    saturate(1.12);
}

    .dm-world-ring-key{
      display:grid;
      gap:8px;
    }


.dm-world-ring-key button{
  appearance:none;

  position:relative;

  padding:
    12px 13px;

  text-align:left;

  border:
    1px solid
    rgba(255,255,255,.12);

  background:
    rgba(255,255,255,.035);

  color:inherit;

  font:inherit;

  cursor:pointer;

  overflow:hidden;

  transform:
    translateX(0);

  transition:
    transform .22s ease,
    border-color .22s ease,
    background .22s ease,
    box-shadow .22s ease;
}


/*
  Quiet scanning line gives the directory
  controls the same "alive" feeling as the rings.
*/

.dm-world-ring-key button::after{

  content:"";

  position:absolute;

  top:0;
  bottom:0;

  left:-35%;

  width:24%;

  background:
    linear-gradient(
      90deg,
      transparent,
      rgba(244,201,107,.09),
      transparent
    );

  transform:
    skewX(-18deg);

  animation:
    dmWorldKeyScan
    6s
    ease-in-out
    infinite;

  pointer-events:none;

}


.dm-world-ring-key button:nth-child(2)::after{

  animation-delay:
    1.1s;

}


.dm-world-ring-key button:nth-child(3)::after{

  animation-delay:
    2.2s;

}


.dm-world-ring-key button:hover{

  transform:
    translateX(6px);

  border-color:
    rgba(47,197,191,.62);

  background:
    rgba(47,197,191,.07);

  box-shadow:
    -4px 0 0
    rgba(47,197,191,.55);

}


.dm-world-ring-key button:active{

  transform:
    translateX(3px)
    scale(.995);

}


@keyframes dmWorldKeyScan{

  0%,
  65%{

    left:-35%;

    opacity:0;

  }


  72%{

    opacity:1;

  }


  88%{

    left:120%;

    opacity:.7;

  }


  100%{

    left:120%;

    opacity:0;

  }

}


    /* ================================================
       UNBOUND ORBIT
       ================================================ */

    .dm-world-unbound-layout{
      display:grid;
      grid-template-columns:minmax(0,1fr) 275px;
      gap:26px;
      align-items:start;
    }


    .dm-world-orbit{
      --dm-world-orbit-radius:min(29vw,245px);
      position:relative;
      width:min(620px,100%);
      aspect-ratio:1;
      margin:10px auto;
      isolation:isolate;
    }


    .dm-world-orbit::before{
      content:"";
      position:absolute;
      inset:8%;
      border:1px solid rgba(47,197,191,.14);
      border-radius:50%;
      box-shadow:
        0 0 0 40px rgba(47,197,191,.025),
        0 0 0 41px rgba(47,197,191,.065),
        0 0 0 80px rgba(199,90,145,.015),
        0 0 0 81px rgba(199,90,145,.05);
    }


    .dm-world-orbit-center{
      position:absolute;
      left:50%;
      top:50%;
      width:145px;
      aspect-ratio:1;
      transform:translate(-50%,-50%);
      display:grid;
      place-items:center;
      padding:15px;
      text-align:center;
      border:1px solid rgba(199,90,145,.6);
      border-radius:50%;
      background:radial-gradient(circle,#181725,#060d14);
      color:#e170a8;
      font-weight:900;
      z-index:3;
    }


    .dm-world-orbit-node{
      appearance:none;
      position:absolute;
      left:50%;
      top:50%;
      width:96px;
      min-height:52px;
      padding:6px;
      transform:
        translate(-50%,-50%)
        rotate(var(--dm-world-angle))
        translateY(calc(-1 * var(--dm-world-orbit-radius)))
        rotate(calc(-1 * var(--dm-world-angle)));
      border:1px solid rgba(244,201,107,.22);
      background:#0b141d;
      color:#ded6c8;
      font:inherit;
      font-size:.68rem;
      font-weight:850;
      cursor:pointer;
      z-index:2;
    }


    .dm-world-orbit-node.visible{
      border-color:#2fc5bf;
      color:#fff;
    }


    .dm-world-orbit-node.hidden{
      opacity:.42;
      border-style:dashed;
    }


    .dm-world-orbit-node:hover{
      z-index:6;
      border-color:#e170a8;
    }


    .dm-world-orbit-list{
      display:grid;
      gap:6px;
      max-height:620px;
      overflow-y:auto;
    }


    .dm-world-orbit-list button{
      appearance:none;
      padding:9px 10px;
      text-align:left;
      border:1px solid rgba(255,255,255,.11);
      background:rgba(255,255,255,.035);
      color:inherit;
      font:inherit;
      font-size:.76rem;
      cursor:pointer;
    }


    .dm-world-orbit-list button.hidden{
      opacity:.42;
      border-style:dashed;
    }


    /* ================================================
       EXPLORER DETAIL OVERLAY
       ================================================ */

    .dm-world-detail-backdrop{
      position:fixed;
      inset:0;
      z-index:12000;
      display:flex;
      align-items:flex-start;
      justify-content:center;
      padding:clamp(18px,4vh,42px) clamp(16px,4vw,48px);
      background:rgba(1,7,12,.82);
      backdrop-filter:blur(5px);
    }


    .dm-world-detail-panel{
      width:min(1080px,100%);
      max-height:calc(100vh - 70px);
      overflow-y:auto;
      border:1px solid rgba(244,201,107,.25);
      background:#0b1721;
      box-shadow:0 28px 90px rgba(0,0,0,.55);
    }


    .dm-world-detail-header{
      position:sticky;
      top:0;
      z-index:20;
      display:flex;
      justify-content:space-between;
      gap:18px;
      align-items:flex-start;
      padding:18px 20px;
      border-bottom:1px solid rgba(244,201,107,.25);
      background:#07131c;
    }


    .dm-world-detail-header h2{
      margin:.25rem 0;
      color:#f4c96b;
      font-size:1.7rem;
    }


    .dm-world-breadcrumb{
      display:flex;
      gap:7px;
      align-items:center;
      margin-bottom:8px;
      font-size:.7rem;
      letter-spacing:.05em;
      text-transform:uppercase;
      opacity:.72;
    }


    .dm-world-breadcrumb button{
      border:0;
      padding:0;
      background:none;
      color:#2fc5bf;
      font:inherit;
      cursor:pointer;
    }


    .dm-world-detail-close{
      appearance:none;
      width:38px;
      height:38px;
      border:1px solid rgba(244,201,107,.35);
      background:transparent;
      color:#f4c96b;
      font-size:1.2rem;
      cursor:pointer;
    }


    .dm-world-detail-body{
      padding:20px;
    }


    .dm-world-detail-description{
      white-space:pre-wrap;
      line-height:1.65;
      opacity:.85;
    }


    .dm-world-detail-media{
      margin:18px 0;
    }


    .dm-world-detail-media img{
      display:block;
      max-width:100%;
      max-height:560px;
      margin:auto;
      object-fit:contain;
    }


    .dm-world-detail-sections{
      display:grid;
      grid-template-columns:repeat(auto-fit,minmax(190px,1fr));
      gap:9px;
      margin-top:18px;
    }


    .dm-world-detail-section{
      appearance:none;
      padding:12px;
      text-align:left;
      border:1px solid rgba(255,255,255,.12);
      background:rgba(255,255,255,.035);
      color:inherit;
      font:inherit;
      cursor:pointer;
    }


    .dm-world-detail-note{
      margin-top:22px;
      padding:16px;
      border:1px solid rgba(47,197,191,.2);
      background:rgba(3,18,26,.65);
    }


    .dm-world-detail-note h3{
      margin:.2rem 0 .6rem;
      color:#2fc5bf;
    }


    /* ================================================
       EDITOR
       ================================================ */

    .dm-world-editor-toolbar{
      display:flex;
      justify-content:space-between;
      gap:12px;
      align-items:center;
      flex-wrap:wrap;
      margin-bottom:14px;
    }


    .dm-world-editor-help{
      opacity:.62;
      font-size:.8rem;
    }


    .dm-world-btn{
      appearance:none;
      padding:9px 13px;
      border:1px solid rgba(255,255,255,.17);
      background:rgba(255,255,255,.055);
      color:inherit;
      font:inherit;
      font-weight:800;
      cursor:pointer;
    }


    .dm-world-btn.primary{
      border-color:transparent;
      background:#f4c96b;
      color:#142436;
    }


    .dm-world-btn.danger{
      border-color:transparent;
      background:#7f2d37;
      color:white;
    }


    .dm-world-editor-list{
      display:grid;
      gap:13px;
    }


    .dm-world-editor-parent{
      padding:16px;
      border:1px solid rgba(255,255,255,.12);
      background:rgba(0,0,0,.11);
    }


    .dm-world-editor-parent.is-dragging,
    .dm-world-editor-child.is-dragging{
      opacity:.4;
    }


    .dm-world-editor-parent.is-drop-target{
      border-color:#f4c96b;
    }


    .dm-world-editor-parent-head{
      display:flex;
      justify-content:space-between;
      gap:15px;
      align-items:flex-start;
      flex-wrap:wrap;
    }


    .dm-world-editor-title-row{
      display:flex;
      gap:10px;
      align-items:center;
    }


    .dm-world-drag{
      appearance:none;
      width:31px;
      height:31px;
      display:grid;
      place-items:center;
      flex:0 0 31px;
      border:1px solid rgba(255,255,255,.15);
      background:rgba(255,255,255,.04);
      color:inherit;
      cursor:grab;
    }


    .dm-world-editor-parent h3{
      margin:.1rem 0;
      font-size:1.15rem;
    }


    .dm-world-key{
      margin-top:3px;
      opacity:.5;
      font-family:monospace;
      font-size:.72rem;
    }


    .dm-world-badges{
      display:flex;
      gap:6px;
      flex-wrap:wrap;
      margin-top:8px;
    }


    .dm-world-badge{
      padding:3px 8px;
      border:1px solid rgba(255,255,255,.14);
      border-radius:999px;
      font-size:.69rem;
      font-weight:800;
    }


    .dm-world-badge.visible{
      color:#8de2c8;
    }


    .dm-world-badge.hidden{
      opacity:.4;
    }


    .dm-world-editor-actions{
      display:flex;
      gap:6px;
      flex-wrap:wrap;
    }


    .dm-world-editor-children{
      display:grid;
      gap:7px;
      min-height:42px;
      margin-top:13px;
      padding:4px;
    }


    .dm-world-editor-children.is-drop-target{
      outline:1px dashed rgba(244,201,107,.6);
      background:rgba(244,201,107,.05);
    }


    .dm-world-editor-child{
      display:flex;
      justify-content:space-between;
      gap:12px;
      align-items:center;
      padding:10px;
      border:1px solid rgba(255,255,255,.1);
      background:rgba(255,255,255,.025);
    }


    .dm-world-editor-child.is-drop-before{
      border-top:3px solid #f4c96b;
    }


    .dm-world-editor-child.is-drop-after{
      border-bottom:3px solid #f4c96b;
    }


    .dm-world-editor-child-main{
      display:flex;
      gap:9px;
      align-items:center;
      min-width:0;
    }


    .dm-world-editor-child strong{
      display:block;
    }


    /* ================================================
       EDIT MODAL
       ================================================ */

    .dm-world-modal-backdrop{
      position:fixed;
      inset:0;
      z-index:15000;
      display:grid;
      place-items:center;
      padding:24px;
      background:rgba(2,8,14,.88);
      backdrop-filter:blur(5px);
    }


    .dm-world-modal{
      width:min(900px,100%);
      max-height:calc(100vh - 48px);
      overflow-y:auto;
      padding:23px;
      border:1px solid rgba(244,201,107,.25);
      background:#102433;
      box-shadow:0 25px 90px rgba(0,0,0,.55);
    }


    .dm-world-modal-head{
      display:flex;
      justify-content:space-between;
      gap:14px;
      align-items:flex-start;
      margin-bottom:18px;
    }


    .dm-world-modal-head h2{
      margin:.2rem 0;
      color:#f4c96b;
    }


    .dm-world-close{
      appearance:none;
      border:0;
      background:transparent;
      color:inherit;
      font-size:1.6rem;
      cursor:pointer;
    }


    .dm-world-grid{
      display:grid;
      grid-template-columns:1fr 1fr;
      gap:13px;
    }


    .dm-world-field{
      display:flex;
      flex-direction:column;
      gap:6px;
      margin-bottom:12px;
    }


    .dm-world-field.full{
      grid-column:1 / -1;
    }


    .dm-world-field label{
      font-weight:800;
    }


    .dm-world-field input,
    .dm-world-field textarea,
    .dm-world-field select{
      box-sizing:border-box;
      width:100%;
      padding:10px 11px;
      border:1px solid rgba(255,255,255,.18);
      background:rgba(0,0,0,.2);
      color:inherit;
      font:inherit;
    }


    .dm-world-field select option{
      color:#111;
    }


    .dm-world-field textarea{
      min-height:135px;
      resize:vertical;
    }


    .dm-world-visibility-editor{
      display:grid;
      grid-template-columns:1fr 1fr;
      gap:10px;
      margin-top:7px;
    }


    .dm-world-visibility-option{
      display:flex;
      gap:9px;
      align-items:flex-start;
      padding:11px;
      border:1px solid rgba(255,255,255,.13);
      background:rgba(255,255,255,.03);
    }


    .dm-world-help{
      opacity:.58;
      font-size:.76rem;
      line-height:1.45;
    }


    .dm-world-modal-actions{
      display:flex;
      justify-content:flex-end;
      gap:8px;
      flex-wrap:wrap;
      margin-top:18px;
    }


    body.dm-world-overlay-open{
      overflow:hidden;
    }


    @media(max-width:900px){

      .dm-world-tabs{
        grid-template-columns:repeat(2,minmax(0,1fr));
      }


      .dm-world-unbound-layout,
      .dm-world-rings-layout{
        grid-template-columns:1fr;
      }


      .dm-world-orbit{
        --dm-world-orbit-radius:min(35vw,220px);
      }

    }


    @media(max-width:700px){

      .dm-world-grid,
      .dm-world-visibility-editor{
        grid-template-columns:1fr;
      }


      .dm-world-editor-child{
        align-items:flex-start;
        flex-direction:column;
      }

    }


    @media(max-width:520px){

      .dm-world-tabs{
        grid-template-columns:1fr;
      }


      .dm-world-orbit-node{
        width:72px;
        min-height:42px;
        font-size:.55rem;
      }

    }

  `;


  document.head.appendChild(
    style
  );

}


/* =====================================================
   LOAD DATA
   ===================================================== */

async function loadDmWorld(){

  const client =
    dmWorldClient();


  const mount =
    dmWorldById(
      'dmWorldMount'
    );


  if(
    !client ||
    !mount
  ){

    return;

  }


  mount.innerHTML = `

    <div class="dm-module-loading">
      Accessing World Control...
    </div>

  `;


  try{

    const [
      supersectionsResult,
      sectionsResult,
      visibilityResult,
      notesResult
    ] =
      await Promise.all([

        client
          .from(
            'world_supersections'
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
            'world_sections'
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
            'world_campaign_visibility'
          )
          .select('*'),

        client
          .from(
            'world_notes'
          )
          .select('*')

      ]);


    for(
      const result of [
        supersectionsResult,
        sectionsResult,
        visibilityResult,
        notesResult
      ]
    ){

      if(
        result.error
      ){

        throw result.error;

      }

    }


    DM_WORLD.supersections =
      supersectionsResult.data ||
      [];


    DM_WORLD.sections =
      sectionsResult.data ||
      [];


    DM_WORLD.visibility =
      visibilityResult.data ||
      [];


    DM_WORLD.notes =
      notesResult.data ||
      [];


    validateDmWorldTarget();

    renderDmWorld();

  }
  catch(error){

    console.error(
      'DM World failed to load:',
      error
    );


    mount.innerHTML = `

      <div class="dm-console-panel dm-world-empty">

        <strong>
          World Control Unavailable
        </strong>

        <p>
          ${dmWorldEscape(
            error?.message ||
            String(error)
          )}
        </p>

      </div>

    `;

  }

}


/* =====================================================
   MASTER RENDER
   ===================================================== */

function renderDmWorld(){

  const mount =
    dmWorldById(
      'dmWorldMount'
    );


  if(!mount){

    return;

  }


  mount.innerHTML = `

    ${renderDmWorldControlBar()}

    ${renderDmWorldTabs()}

    <div id="dmWorldModeMount"></div>

  `;


  if(
    DM_WORLD.mode ===
    'editor'
  ){

    renderDmWorldEditor();

  }
  else{

    renderDmWorldExplorer();

  }


  if(
    DM_WORLD.explorerTarget &&
    DM_WORLD.mode ===
    'explorer'
  ){

    renderDmWorldDetailOverlay();

  }

}


/* =====================================================
   CONTROL BAR
   ===================================================== */

function renderDmWorldControlBar(){

  return `

    <div class="dm-world-controlbar">


      <div class="dm-world-switches">

        <button
          class="
            dm-world-switch
            ${
              DM_WORLD.mode ===
              'explorer'
                ? 'is-active'
                : ''
            }
          "
          type="button"
          data-dm-world-action="mode"
          data-value="explorer"
        >
          Explorer View
        </button>


        <button
          class="
            dm-world-switch
            ${
              DM_WORLD.mode ===
              'editor'
                ? 'is-active'
                : ''
            }
          "
          type="button"
          data-dm-world-action="mode"
          data-value="editor"
        >
          Editor
        </button>

      </div>


      <div class="dm-world-switches">

        <button
          class="
            dm-world-switch
            ${
              DM_WORLD.campaign ===
              'hero'
                ? 'is-active'
                : ''
            }
          "
          type="button"
          data-dm-world-action="campaign"
          data-value="hero"
        >
          Hero
        </button>


        <button
          class="
            dm-world-switch
            ${
              DM_WORLD.campaign ===
              'villain'
                ? 'is-active'
                : ''
            }
          "
          type="button"
          data-dm-world-action="campaign"
          data-value="villain"
        >
          Villain
        </button>

      </div>


    </div>

  `;

}


/* =====================================================
   FOUR TABS
   ===================================================== */

function renderDmWorldTabs(){

  const unbound =
    dmWorldSupersectionByKey(
      DM_WORLD_UNBOUND_KEY
    );


  const unboundVisible =
    dmWorldIsVisible(
      'supersection',
      unbound,
      DM_WORLD.campaign
    );


  return `

    <div class="dm-world-tabs">


      ${renderDmWorldTab(
        'cast',
        'EPCOT Cast World'
      )}


      ${renderDmWorldTab(
        'unbound',
        `Unbound World${
          DM_WORLD.mode ===
          'editor'
            ? ''
            : (
                unboundVisible
                  ? ''
                  : ' // HIDDEN'
              )
        }`,
        true
      )}


      ${renderDmWorldTab(
        'outer',
        'Outer Rings'
      )}


      ${renderDmWorldTab(
        'systems',
        'Systems & Society'
      )}


    </div>

  `;

}


function renderDmWorldTab(
  key,
  label,
  unbound = false
){

  return `

    <button
      class="
        dm-world-tab
        ${unbound ? 'unbound' : ''}
        ${
          DM_WORLD.tab === key
            ? 'is-active'
            : ''
        }
      "
      type="button"
      data-dm-world-action="tab"
      data-value="${key}"
    >

      ${dmWorldEscape(label)}

    </button>

  `;

}


/* =====================================================
   EXPLORER
   ===================================================== */

function renderDmWorldExplorer(){

  const mount =
    dmWorldById(
      'dmWorldModeMount'
    );


  if(!mount){

    return;

  }


  if(
    DM_WORLD.tab ===
    'unbound'
  ){

    renderDmWorldExplorerUnbound(
      mount
    );

    return;

  }


  if(
    DM_WORLD.tab ===
    'outer'
  ){

    renderDmWorldExplorerCategory(
      mount,
      'Outer Rings',
      'Extended EPCOT infrastructure and restricted locations.',
      DM_WORLD_OUTER_KEYS
    );

    return;

  }


  if(
    DM_WORLD.tab ===
    'systems'
  ){

    renderDmWorldExplorerSystems(
      mount
    );

    return;

  }


  renderDmWorldExplorerCast(
    mount
  );

}


/* =====================================================
   CAST EXPLORER
   ===================================================== */

function renderDmWorldExplorerCast(
  mount
){

  const epcot =
    dmWorldSupersectionByKey(
      'epcot'
    );


  const hub =
    dmWorldSupersectionByKey(
      'hub'
    );


  const green =
    dmWorldSupersectionByKey(
      'green_belt'
    );


  const residential =
    dmWorldSupersectionByKey(
      'residential_ring'
    );


  mount.innerHTML = `

    <div class="dm-world-explorer">


      ${renderDmWorldHero(
        'WORLD DISCOVERY PROGRAM',
        'EPCOT Cast World',
        `Previewing the ${DM_WORLD.campaign} campaign's published Cast-world information.`
      )}


      ${
        epcot &&
        dmWorldIsVisible(
          'supersection',
          epcot
        )

          ? `
              <button
                class="dm-world-explorer-card"
                type="button"
                data-dm-world-action="explorer-supersection"
                data-world-id="${epcot.id}"
              >

                <strong>
                  ${dmWorldEscape(
                    epcot.name
                  )}
                </strong>

                <span>
                  EPCOT Overview
                </span>

              </button>
            `

          : `
              <div class="dm-world-empty">
                EPCOT Overview is hidden for this campaign.
              </div>
            `
      }


      ${renderDmWorldCastRing(
        residential,
        green,
        hub
      )}


    </div>

  `;

}


function renderDmWorldCastRing(
  residential,
  green,
  hub
){

  const visibleResidential =
    dmWorldIsVisible(
      'supersection',
      residential
    );


  const visibleGreen =
    dmWorldIsVisible(
      'supersection',
      green
    );


  const visibleHub =
    dmWorldIsVisible(
      'supersection',
      hub
    );


  if(
    !visibleResidential &&
    !visibleGreen &&
    !visibleHub
  ){

    return `

      <div class="dm-world-empty">
        All Cast-world ring records are hidden for this campaign.
      </div>

    `;

  }


  return `

    <section class="dm-console-panel" style="padding:20px;">


      <div class="dm-page-kicker">
        EPCOT COMMUNITY PLAN
      </div>

      <h2 style="margin:.25rem 0 1rem;">
        The Rings
      </h2>


      <div class="dm-world-rings-layout">


        <div class="dm-world-ring-diagram">


          ${
            visibleResidential

              ? `
                  <button
                    class="
                      dm-world-ring
                      dm-world-ring-residential
                    "
                    type="button"
                    data-dm-world-action="explorer-supersection"
                    data-world-id="${residential.id}"
                  >
                    <span>
                      Residential Ring
                    </span>
                  </button>
                `

              : ''
          }


          ${
            visibleGreen

              ? `
                  <button
                    class="
                      dm-world-ring
                      dm-world-ring-green
                    "
                    type="button"
                    data-dm-world-action="explorer-supersection"
                    data-world-id="${green.id}"
                  >
                    <span>
                      Green Belt
                    </span>
                  </button>
                `

              : ''
          }


          ${
            visibleHub

              ? `
                  <button
                    class="
                      dm-world-ring
                      dm-world-ring-hub
                    "
                    type="button"
                    data-dm-world-action="explorer-supersection"
                    data-world-id="${hub.id}"
                  >
                    <span>
                      City Center
                    </span>
                  </button>
                `

              : ''
          }


        </div>


        <div class="dm-world-ring-key">

          ${
            [
              hub,
              green,
              residential
            ]
              .filter(
                item =>
                  dmWorldIsVisible(
                    'supersection',
                    item
                  )
              )
              .map(
                item => `

                  <button
                    type="button"
                    data-dm-world-action="explorer-supersection"
                    data-world-id="${item.id}"
                  >

                    <strong>
                      ${dmWorldEscape(
                        item.name
                      )}
                    </strong>

                  </button>

                `
              )
              .join('')
          }

        </div>


      </div>


    </section>

  `;

}


/* =====================================================
   UNBOUND EXPLORER
   ===================================================== */

function renderDmWorldExplorerUnbound(
  mount
){

  const parent =
    dmWorldSupersectionByKey(
      DM_WORLD_UNBOUND_KEY
    );


  if(
    !parent ||
    !dmWorldIsVisible(
      'supersection',
      parent
    )
  ){

    mount.innerHTML = `

      ${renderDmWorldHero(
        'UNBOUND GEOGRAPHIC RECORD',
        'Unbound World',
        `This tab is hidden from the ${DM_WORLD.campaign} campaign.`
      )}

      <div class="dm-world-empty">
        Reveal Unbound World in Editor mode to make this tab available to players.
      </div>

    `;

    return;

  }


  const neighborhoods =
    DM_WORLD_UNBOUND_SECTION_KEYS

      .map(
        key =>
          dmWorldSectionByKey(
            key
          )
      )

      .filter(Boolean);


  mount.innerHTML = `

    ${renderDmWorldHero(
      'UNBOUND GEOGRAPHIC RECORD',
      'Unbound World',
      `Previewing discovered neighborhoods for the ${DM_WORLD.campaign} campaign.`
    )}


    <div class="dm-world-unbound-layout">


      <div class="dm-world-orbit">


        <div class="dm-world-orbit-center">
          UNBOUND
          <br>
          REALITY
        </div>


        ${
          neighborhoods

            .map(
              (
                item,
                index
              ) =>
                renderDmWorldOrbitNode(
                  item,
                  index,
                  neighborhoods.length,
                  false
                )
            )

            .join('')
        }


      </div>


      <div class="dm-world-orbit-list">

        ${
          neighborhoods

            .map(
              (
                item,
                index
              ) => {

                const visible =
                  dmWorldIsVisible(
                    'section',
                    item
                  );


                return `

                  <button
                    class="${visible ? '' : 'hidden'}"
                    type="button"
                    ${
                      visible
                        ? `
                            data-dm-world-action="explorer-section"
                            data-world-id="${item.id}"
                          `
                        : 'disabled'
                    }
                  >

                    ${String(index + 1).padStart(2,'0')}
                    //

                    ${
                      visible
                        ? dmWorldEscape(
                            item.name
                          )
                        : 'Undiscovered'
                    }

                  </button>

                `;

              }
            )

            .join('')
        }

      </div>


    </div>

  `;

}


/* =====================================================
   ORBIT NODE
   ===================================================== */

function renderDmWorldOrbitNode(
  item,
  index,
  total,
  editorMode
){

  const angle =
    (
      index /
      total
    ) *
    360;


  const visible =
    dmWorldIsVisible(
      'section',
      item
    );


  return `

    <button
      class="
        dm-world-orbit-node
        ${visible ? 'visible' : 'hidden'}
      "
      type="button"
      style="--dm-world-angle:${angle}deg"
      ${
        editorMode

          ? `
              data-dm-world-action="edit-section"
              data-world-id="${item.id}"
            `

          : (
              visible

                ? `
                    data-dm-world-action="explorer-section"
                    data-world-id="${item.id}"
                  `

                : 'disabled'
            )
      }
    >

      ${String(index + 1).padStart(2,'0')}
      <br>

      ${
        editorMode ||
        visible

          ? dmWorldEscape(
              item.name
            )

          : 'UNKNOWN'
      }

    </button>

  `;

}


/* =====================================================
   OUTER / GENERIC EXPLORER
   ===================================================== */

function renderDmWorldExplorerCategory(
  mount,
  title,
  description,
  keys
){

  const items =
    keys

      .map(
        key =>
          dmWorldSupersectionByKey(
            key
          )
      )

      .filter(
        item =>
          item &&
          dmWorldIsVisible(
            'supersection',
            item
          )
      );


  mount.innerHTML = `

    ${renderDmWorldHero(
      'WORLD DISCOVERY PROGRAM',
      title,
      description
    )}


    ${
      items.length

        ? `
            <div class="dm-world-explorer-grid">

              ${
                items

                  .map(
                    item =>
                      renderDmWorldExplorerCard(
                        item
                      )
                  )

                  .join('')
              }

            </div>
          `

        : `
            <div class="dm-world-empty">
              No records in this category are visible for the ${DM_WORLD.campaign} campaign.
            </div>
          `
    }

  `;

}


/* =====================================================
   SYSTEMS EXPLORER
   ===================================================== */

function renderDmWorldExplorerSystems(
  mount
){

  const groups = [

    {
      title:
        'Systems & Governance',

      keys: [
        'transportation',
        'board_of_tomorrow',
        'epcot_iteration',
        'culture'
      ]
    },

    {
      title:
        'Calendar',

      keys: [
        'annual_holidays',
        'quarterly_celebrations'
      ]
    },

    {
      title:
        'People & Language',

      keys: [
        'species',
        'language'
      ]
    }

  ];


  mount.innerHTML = `

    ${renderDmWorldHero(
      'COMMUNITY SYSTEMS REFERENCE',
      'Systems & Society',
      `Previewing institutional and cultural records for the ${DM_WORLD.campaign} campaign.`
    )}


    ${
      groups
        .map(
          group =>
            renderDmWorldExplorerGroup(
              group.title,
              group.keys
            )
        )
        .join('')
    }

  `;

}


function renderDmWorldExplorerGroup(
  title,
  keys
){

  const items =
    keys

      .map(
        key =>
          dmWorldSupersectionByKey(
            key
          )
      )

      .filter(
        item =>
          item &&
          dmWorldIsVisible(
            'supersection',
            item
          )
      );


  if(
    !items.length
  ){

    return '';

  }


  return `

    <section style="margin-bottom:20px;">

      <div
        class="dm-page-kicker"
        style="margin-bottom:9px;"
      >
        ${dmWorldEscape(title)}
      </div>

      <div class="dm-world-explorer-grid">

        ${
          items
            .map(
              item =>
                renderDmWorldExplorerCard(
                  item
                )
            )
            .join('')
        }

      </div>

    </section>

  `;

}


/* =====================================================
   EXPLORER CARD / HERO
   ===================================================== */

function renderDmWorldExplorerCard(
  item
){

  const sections =
    dmWorldSectionsFor(
      item.id
    )
      .filter(
        section =>
          dmWorldIsVisible(
            'section',
            section
          )
      );


  return `

    <button
      class="dm-world-explorer-card"
      type="button"
      data-dm-world-action="explorer-supersection"
      data-world-id="${item.id}"
    >

      <strong>
        ${dmWorldEscape(
          item.name
        )}
      </strong>

      ${
        item.subtitle

          ? `
              <span>
                ${dmWorldEscape(
                  item.subtitle
                )}
              </span>
            `

          : ''
      }

      <span>
        ${sections.length}
        ${sections.length === 1 ? 'record' : 'records'}
      </span>

    </button>

  `;

}


function renderDmWorldHero(
  kicker,
  title,
  text
){

  return `

    <section class="dm-world-tab-hero">

      <div class="dm-page-kicker">
        ${dmWorldEscape(kicker)}
      </div>

      <h2>
        ${dmWorldEscape(title)}
      </h2>

      <p>
        ${dmWorldEscape(text)}
      </p>

    </section>

  `;

}


/* =====================================================
   EXPLORER DETAIL
   ===================================================== */

function validateDmWorldTarget(){

  if(
    !DM_WORLD.explorerTarget
  ){

    return;

  }


  const target =
    DM_WORLD.explorerTarget;


  if(
    target.type ===
    'supersection'
  ){

    const item =
      dmWorldSupersection(
        target.id
      );


    if(
      !item ||
      !dmWorldIsVisible(
        'supersection',
        item
      )
    ){

      DM_WORLD.explorerTarget =
        null;

    }


    return;

  }


  const section =
    dmWorldSection(
      target.id
    );


  const parent =
    section
      ? dmWorldSupersection(
          section.supersection_id
        )
      : null;


  if(
    !section ||
    !parent ||
    !dmWorldIsVisible(
      'section',
      section
    ) ||
    !dmWorldIsVisible(
      'supersection',
      parent
    )
  ){

    DM_WORLD.explorerTarget =
      null;

  }

}


function renderDmWorldDetailOverlay(){

  closeDmWorldDetailOverlay();


  const target =
    DM_WORLD.explorerTarget;


  if(!target){

    return;

  }


  const backdrop =
    document.createElement(
      'div'
    );


  backdrop.id =
    'dmWorldDetailBackdrop';


  backdrop.className =
    'dm-world-detail-backdrop';


  if(
    target.type ===
    'section'
  ){

    backdrop.innerHTML =
      renderDmWorldSectionDetail(
        target.id
      );

  }
  else{

    backdrop.innerHTML =
      renderDmWorldSupersectionDetail(
        target.id
      );

  }


  document.body.appendChild(
    backdrop
  );


  document.body.classList.add(
    'dm-world-overlay-open'
  );

}


function renderDmWorldSupersectionDetail(
  id
){

  const item =
    dmWorldSupersection(
      id
    );


  if(!item){

    return '';

  }


  const sections =
    dmWorldSectionsFor(
      item.id
    )
      .filter(
        section =>
          dmWorldIsVisible(
            'section',
            section
          )
      );


  const note =
    dmWorldNoteForSupersection(
      item.id
    );


  return `

    <article class="dm-world-detail-panel">


      <header class="dm-world-detail-header">

        <div>

          <div class="dm-page-kicker">
            EPCOT WORLD FILE
          </div>

          <h2>
            ${dmWorldEscape(
              item.name
            )}
          </h2>

          ${
            item.subtitle

              ? `
                  <div class="dm-world-help">
                    ${dmWorldEscape(
                      item.subtitle
                    )}
                  </div>
                `

              : ''
          }

        </div>


        <button
          class="dm-world-detail-close"
          type="button"
          data-dm-world-action="close-detail"
        >
          ×
        </button>

      </header>


      <div class="dm-world-detail-body">

        ${renderDmWorldMedia(
          item
        )}


        <div class="dm-page-kicker">
          OVERVIEW
        </div>

        <div class="dm-world-detail-description">

          ${
            item.description
              ? dmWorldEscape(
                  item.description
                )
              : 'No published information yet.'
          }

        </div>


        ${
          sections.length

            ? `
                <div class="dm-world-detail-sections">

                  ${
                    sections
                      .map(
                        section => `

                          <button
                            class="dm-world-detail-section"
                            type="button"
                            data-dm-world-action="explorer-section"
                            data-world-id="${section.id}"
                          >

                            <strong>
                              ${dmWorldEscape(
                                section.name
                              )}
                            </strong>

                          </button>

                        `
                      )
                      .join('')
                  }

                </div>
              `

            : ''
        }


        ${renderDmWorldNote(
          note
        )}


      </div>


    </article>

  `;

}


function renderDmWorldSectionDetail(
  id
){

  const item =
    dmWorldSection(
      id
    );


  if(!item){

    return '';

  }


  const parent =
    dmWorldSupersection(
      item.supersection_id
    );


  const note =
    dmWorldNoteForSection(
      item.id
    );


  return `

    <article class="dm-world-detail-panel">


      <header class="dm-world-detail-header">

        <div>


          <div class="dm-world-breadcrumb">

            <button
              type="button"
              data-dm-world-action="explorer-supersection"
              data-world-id="${parent?.id || ''}"
            >
              ${dmWorldEscape(
                parent?.name ||
                'World'
              )}
            </button>

            <span>
              ›
            </span>

            <strong>
              ${dmWorldEscape(
                item.name
              )}
            </strong>

          </div>


          <div class="dm-page-kicker">
            EPCOT WORLD FILE
          </div>

          <h2>
            ${dmWorldEscape(
              item.name
            )}
          </h2>

        </div>


        <button
          class="dm-world-detail-close"
          type="button"
          data-dm-world-action="close-detail"
        >
          ×
        </button>

      </header>


      <div class="dm-world-detail-body">


        ${renderDmWorldMedia(
          item
        )}


        <div class="dm-page-kicker">
          OVERVIEW
        </div>

        <div class="dm-world-detail-description">

          ${
            item.description
              ? dmWorldEscape(
                  item.description
                )
              : 'No published information yet.'
          }

        </div>


        ${
          item.downtime_enabled

            ? `
                <div
                  class="dm-world-detail-note"
                  style="margin-top:18px;"
                >

                  <div class="dm-page-kicker">
                    DOWNTIME
                  </div>

                  Downtime Activities enabled.

                </div>
              `

            : ''
        }


        ${renderDmWorldNote(
          note
        )}


      </div>


    </article>

  `;

}


function renderDmWorldMedia(
  item
){

  if(
    !item?.map_url
  ){

    return '';

  }


  return `

    <figure class="dm-world-detail-media">

      <img
        src="${dmWorldEscape(
          item.map_url
        )}"
        alt="${dmWorldEscape(
          item.map_caption ||
          item.name
        )}"
      >

      ${
        item.map_caption

          ? `
              <figcaption
                style="
                  text-align:center;
                  opacity:.6;
                  margin-top:7px;
                "
              >
                ${dmWorldEscape(
                  item.map_caption
                )}
              </figcaption>
            `

          : ''
      }

    </figure>

  `;

}


function renderDmWorldNote(
  note
){

  if(
    !note?.content
  ){

    return `

      <section class="dm-world-detail-note">

        <div class="dm-page-kicker">
          CAMPAIGN RECORD
        </div>

        <h3>
          Shared Notes
        </h3>

        <div class="dm-world-help">
          No shared player notes yet.
        </div>

      </section>

    `;

  }


  return `

    <section class="dm-world-detail-note">

      <div class="dm-page-kicker">
        CAMPAIGN RECORD
      </div>

      <h3>
        Shared Notes
      </h3>

      <div>
        ${dmWorldSafeHtml(
          note.content
        )}
      </div>

    </section>

  `;

}


function closeDmWorldDetailOverlay(){

  dmWorldById(
    'dmWorldDetailBackdrop'
  )?.remove();


  document.body.classList.remove(
    'dm-world-overlay-open'
  );

}


/* =====================================================
   EDITOR
   ===================================================== */

function renderDmWorldEditor(){

  const mount =
    dmWorldById(
      'dmWorldModeMount'
    );


  if(!mount){

    return;

  }


  if(
    DM_WORLD.tab ===
    'unbound'
  ){

    renderDmWorldEditorUnbound(
      mount
    );

    return;

  }


  const items =
    dmWorldSupersectionsForTab(
      DM_WORLD.tab
    );


  mount.innerHTML = `

    ${renderDmWorldHero(
      'WORLD ADMINISTRATION',
      dmWorldEditorTabTitle(),
      'Everything remains visible to the DM here regardless of player visibility.'
    )}


    <div class="dm-world-editor-toolbar">

      <div class="dm-world-editor-help">
        Drag records to reorder them. Drag child records between parents to move them.
      </div>

      <button
        class="dm-world-btn primary"
        type="button"
        data-dm-world-action="add-supersection"
      >
        + Add Area
      </button>

    </div>


    ${
      items.length

        ? `
            <div class="dm-world-editor-list">

              ${
                items
                  .map(
                    item =>
                      renderDmWorldEditorParent(
                        item
                      )
                  )
                  .join('')
              }

            </div>
          `

        : `
            <div class="dm-world-empty">
              No records in this World category.
            </div>
          `
    }

  `;

}


function dmWorldEditorTabTitle(){

  if(
    DM_WORLD.tab ===
    'cast'
  ){

    return 'EPCOT Cast World';

  }


  if(
    DM_WORLD.tab ===
    'outer'
  ){

    return 'Outer Rings';

  }


  if(
    DM_WORLD.tab ===
    'systems'
  ){

    return 'Systems & Society';

  }


  return 'Unbound World';

}


/* =====================================================
   UNBOUND EDITOR
   ===================================================== */

function renderDmWorldEditorUnbound(
  mount
){

  const parent =
    dmWorldSupersectionByKey(
      DM_WORLD_UNBOUND_KEY
    );


  if(!parent){

    mount.innerHTML = `

      ${renderDmWorldHero(
        'WORLD ADMINISTRATION',
        'Unbound World',
        'The Unbound World parent record does not exist.'
      )}

      <button
        class="dm-world-btn primary"
        type="button"
        data-dm-world-action="add-supersection"
      >
        + Add Unbound World
      </button>

    `;

    return;

  }


  const neighborhoods =
    DM_WORLD_UNBOUND_SECTION_KEYS
      .map(
        key =>
          dmWorldSectionByKey(
            key
          )
      )
      .filter(Boolean);


  mount.innerHTML = `

    ${renderDmWorldHero(
      'WORLD ADMINISTRATION',
      'Unbound World',
      'All neighborhood records remain administratively accessible even while hidden from players.'
    )}


    <div class="dm-world-editor-toolbar">

      <div>

        ${dmWorldVisibilityBadge(
          'supersection',
          parent,
          'hero'
        )}

        ${dmWorldVisibilityBadge(
          'supersection',
          parent,
          'villain'
        )}

      </div>


      <div class="dm-world-editor-actions">

        <button
          class="dm-world-btn"
          type="button"
          data-dm-world-action="edit-supersection"
          data-world-id="${parent.id}"
        >
          Edit Unbound World
        </button>

        <button
          class="dm-world-btn primary"
          type="button"
          data-dm-world-action="add-section"
          data-supersection-id="${parent.id}"
        >
          + Add Neighborhood
        </button>

      </div>

    </div>


    <div class="dm-world-unbound-layout">


      <div class="dm-world-orbit">

        <div class="dm-world-orbit-center">
          UNBOUND
          <br>
          REALITY
        </div>

        ${
          neighborhoods
            .map(
              (
                item,
                index
              ) =>
                renderDmWorldOrbitNode(
                  item,
                  index,
                  neighborhoods.length,
                  true
                )
            )
            .join('')
        }

      </div>


      <div class="dm-world-orbit-list">

        ${
          neighborhoods
            .map(
              (
                item,
                index
              ) => {

                const visible =
                  dmWorldIsVisible(
                    'section',
                    item
                  );


                return `

                  <button
                    class="${visible ? '' : 'hidden'}"
                    type="button"
                    data-dm-world-action="edit-section"
                    data-world-id="${item.id}"
                  >

                    ${String(index + 1).padStart(2,'0')}
                    //

                    ${dmWorldEscape(
                      item.name
                    )}

                  </button>

                `;

              }
            )
            .join('')
        }

      </div>


    </div>


    <div style="margin-top:22px;">

      ${renderDmWorldEditorParent(
        parent,
        false
      )}

    </div>

  `;

}


/* =====================================================
   EDITOR PARENT
   ===================================================== */

function renderDmWorldEditorParent(
  item,
  draggable = true
){

  const children =
    dmWorldSectionsFor(
      item.id
    );


  return `

    <article
      class="dm-world-editor-parent"
      data-dm-world-supersection="${item.id}"
    >


      <div class="dm-world-editor-parent-head">


        <div>


          <div class="dm-world-editor-title-row">


            ${
              draggable

                ? `
                    <span
                      class="dm-world-drag"
                      draggable="true"
                      data-dm-world-drag-type="supersection"
                      data-dm-world-drag-id="${item.id}"
                    >
                      ⋮⋮
                    </span>
                  `

                : ''
            }


            <div>

              <h3>
                ${dmWorldEscape(
                  item.name
                )}
              </h3>

              <div class="dm-world-key">
                ${dmWorldEscape(
                  item.key
                )}
              </div>

            </div>


          </div>


          <div class="dm-world-badges">

            ${dmWorldVisibilityBadge(
              'supersection',
              item,
              'hero'
            )}

            ${dmWorldVisibilityBadge(
              'supersection',
              item,
              'villain'
            )}

          </div>


        </div>


        <div class="dm-world-editor-actions">

          <button
            class="dm-world-btn"
            type="button"
            data-dm-world-action="add-section"
            data-supersection-id="${item.id}"
          >
            + Section
          </button>

          <button
            class="dm-world-btn"
            type="button"
            data-dm-world-action="edit-supersection"
            data-world-id="${item.id}"
          >
            Edit
          </button>

        </div>


      </div>


      <div
        class="dm-world-editor-children"
        data-dm-world-section-container="${item.id}"
      >

        ${
          children.length

            ? children
                .map(
                  child =>
                    renderDmWorldEditorChild(
                      child
                    )
                )
                .join('')

            : `
                <div class="dm-world-help">
                  No child sections.
                </div>
              `
        }

      </div>


    </article>

  `;

}


/* =====================================================
   EDITOR CHILD
   ===================================================== */

function renderDmWorldEditorChild(
  item
){

  return `

    <div
      class="dm-world-editor-child"
      data-dm-world-section="${item.id}"
    >


      <div class="dm-world-editor-child-main">


        <span
          class="dm-world-drag"
          draggable="true"
          data-dm-world-drag-type="section"
          data-dm-world-drag-id="${item.id}"
        >
          ⋮⋮
        </span>


        <div>

          <strong>
            ${dmWorldEscape(
              item.name
            )}
          </strong>

          <div class="dm-world-key">
            ${dmWorldEscape(
              item.key
            )}
          </div>


          <div class="dm-world-badges">

            ${dmWorldVisibilityBadge(
              'section',
              item,
              'hero'
            )}

            ${dmWorldVisibilityBadge(
              'section',
              item,
              'villain'
            )}

            ${
              item.downtime_enabled

                ? `
                    <span class="dm-world-badge visible">
                      Downtime
                    </span>
                  `

                : ''
            }

          </div>

        </div>


      </div>


      <button
        class="dm-world-btn"
        type="button"
        data-dm-world-action="edit-section"
        data-world-id="${item.id}"
      >
        Edit
      </button>


    </div>

  `;

}


/* =====================================================
   EDIT MODAL HELPERS
   ===================================================== */

function closeDmWorldModal(){

  dmWorldById(
    'dmWorldModalBackdrop'
  )?.remove();


  DM_WORLD.editingType =
    null;


  DM_WORLD.editingId =
    null;

}


function dmWorldVisibilityEditor(
  type,
  item
){

  return `

    <div class="dm-world-visibility-editor">


      <label class="dm-world-visibility-option">

        <input
          id="dmWorldHeroVisible"
          type="checkbox"
          ${
            item &&
            dmWorldIsVisible(
              type,
              item,
              'hero'
            )
              ? 'checked'
              : ''
          }
        >

        <span>

          <strong>
            Hero Visible
          </strong>

          <br>

          <span class="dm-world-help">
            Hero campaign may access this record.
          </span>

        </span>

      </label>


      <label class="dm-world-visibility-option">

        <input
          id="dmWorldVillainVisible"
          type="checkbox"
          ${
            item &&
            dmWorldIsVisible(
              type,
              item,
              'villain'
            )
              ? 'checked'
              : ''
          }
        >

        <span>

          <strong>
            Villain Visible
          </strong>

          <br>

          <span class="dm-world-help">
            Villain campaign may access this record.
          </span>

        </span>

      </label>


    </div>

  `;

}


/* =====================================================
   SUPERSECTION MODAL
   ===================================================== */

function openDmWorldSupersectionModal(
  id = null
){

  closeDmWorldModal();


  const item =
    id
      ? dmWorldSupersection(
          id
        )
      : null;


  if(
    id &&
    !item
  ){

    return;

  }


  DM_WORLD.editingType =
    'supersection';


  DM_WORLD.editingId =
    id;


  const backdrop =
    document.createElement(
      'div'
    );


  backdrop.id =
    'dmWorldModalBackdrop';


  backdrop.className =
    'dm-world-modal-backdrop';


  backdrop.innerHTML = `

    <div class="dm-world-modal">


      <div class="dm-world-modal-head">

        <div>

          <div class="dm-page-kicker">
            WORLD CONTROL // AREA
          </div>

          <h2>
            ${
              item
                ? 'Edit Area'
                : 'Add Area'
            }
          </h2>

        </div>

        <button
          class="dm-world-close"
          type="button"
          data-dm-world-action="close-modal"
        >
          ×
        </button>

      </div>


      <div class="dm-world-grid">


        <div class="dm-world-field">

          <label for="dmWorldName">
            Name *
          </label>

          <input
            id="dmWorldName"
            type="text"
            value="${dmWorldEscape(
              item?.name ||
              ''
            )}"
          >

        </div>


        <div class="dm-world-field">

          <label for="dmWorldKey">
            System Key
          </label>

          <input
            id="dmWorldKey"
            type="text"
            value="${dmWorldEscape(
              item?.key ||
              ''
            )}"
          >

          <div class="dm-world-help">
            Leave blank for automatic generation.
          </div>

        </div>


        <div class="dm-world-field full">

          <label for="dmWorldSubtitle">
            Subtitle
          </label>

          <input
            id="dmWorldSubtitle"
            type="text"
            value="${dmWorldEscape(
              item?.subtitle ||
              ''
            )}"
          >

        </div>


        <div class="dm-world-field full">

          <label for="dmWorldDescription">
            Description
          </label>

          <textarea
            id="dmWorldDescription"
          >${dmWorldEscape(
            item?.description ||
            ''
          )}</textarea>

        </div>


        <div class="dm-world-field">

          <label for="dmWorldMapUrl">
            Image / Media URL
          </label>

          <input
            id="dmWorldMapUrl"
            type="text"
            value="${dmWorldEscape(
              item?.map_url ||
              ''
            )}"
          >

        </div>


        <div class="dm-world-field">

          <label for="dmWorldMapCaption">
            Media Caption
          </label>

          <input
            id="dmWorldMapCaption"
            type="text"
            value="${dmWorldEscape(
              item?.map_caption ||
              ''
            )}"
          >

        </div>


        <div class="dm-world-field">

          <label for="dmWorldDisplayType">
            Display Type
          </label>

          <select id="dmWorldDisplayType">

            ${
              DM_WORLD_DISPLAY_TYPES
                .map(
                  value => `

                    <option
                      value="${value}"
                      ${
                        value ===
                        (
                          item?.display_type ||
                          'standard'
                        )
                          ? 'selected'
                          : ''
                      }
                    >
                      ${value}
                    </option>

                  `
                )
                .join('')
            }

          </select>

        </div>


        <div class="dm-world-field full">

          <label>
            Player Visibility
          </label>

          ${dmWorldVisibilityEditor(
            'supersection',
            item
          )}

        </div>


      </div>


      <div class="dm-world-modal-actions">


        ${
          item

            ? `
                <button
                  class="dm-world-btn danger"
                  type="button"
                  data-dm-world-action="delete"
                >
                  Permanently Delete
                </button>
              `

            : ''
        }


        <button
          class="dm-world-btn"
          type="button"
          data-dm-world-action="close-modal"
        >
          Cancel
        </button>


        <button
          class="dm-world-btn primary"
          type="button"
          data-dm-world-action="save"
        >
          Save Area
        </button>


      </div>


    </div>

  `;


  document.body.appendChild(
    backdrop
  );

}


/* =====================================================
   SECTION MODAL
   ===================================================== */

function openDmWorldSectionModal(
  id = null,
  parentId = null
){

  closeDmWorldModal();


  const item =
    id
      ? dmWorldSection(
          id
        )
      : null;


  if(
    id &&
    !item
  ){

    return;

  }


  DM_WORLD.editingType =
    'section';


  DM_WORLD.editingId =
    id;


  const selectedParent =
    item?.supersection_id ||
    parentId ||
    DM_WORLD.supersections[0]?.id ||
    '';


  const backdrop =
    document.createElement(
      'div'
    );


  backdrop.id =
    'dmWorldModalBackdrop';


  backdrop.className =
    'dm-world-modal-backdrop';


  backdrop.innerHTML = `

    <div class="dm-world-modal">


      <div class="dm-world-modal-head">

        <div>

          <div class="dm-page-kicker">
            WORLD CONTROL // SECTION
          </div>

          <h2>
            ${
              item
                ? 'Edit Section'
                : 'Add Section'
            }
          </h2>

        </div>

        <button
          class="dm-world-close"
          type="button"
          data-dm-world-action="close-modal"
        >
          ×
        </button>

      </div>


      <div class="dm-world-grid">


        <div class="dm-world-field">

          <label for="dmWorldParent">
            Parent Area *
          </label>

          <select id="dmWorldParent">

            ${
              DM_WORLD.supersections
                .map(
                  parent => `

                    <option
                      value="${parent.id}"
                      ${
                        parent.id ===
                        selectedParent
                          ? 'selected'
                          : ''
                      }
                    >
                      ${dmWorldEscape(
                        parent.name
                      )}
                    </option>

                  `
                )
                .join('')
            }

          </select>

        </div>


        <div class="dm-world-field">

          <label for="dmWorldName">
            Name *
          </label>

          <input
            id="dmWorldName"
            type="text"
            value="${dmWorldEscape(
              item?.name ||
              ''
            )}"
          >

        </div>


        <div class="dm-world-field">

          <label for="dmWorldKey">
            System Key
          </label>

          <input
            id="dmWorldKey"
            type="text"
            value="${dmWorldEscape(
              item?.key ||
              ''
            )}"
          >

        </div>


        <div class="dm-world-field full">

          <label for="dmWorldSubtitle">
            Subtitle
          </label>

          <input
            id="dmWorldSubtitle"
            type="text"
            value="${dmWorldEscape(
              item?.subtitle ||
              ''
            )}"
          >

        </div>


        <div class="dm-world-field full">

          <label for="dmWorldDescription">
            Description
          </label>

          <textarea
            id="dmWorldDescription"
          >${dmWorldEscape(
            item?.description ||
            ''
          )}</textarea>

        </div>


        <div class="dm-world-field">

          <label for="dmWorldMapUrl">
            Image / Media URL
          </label>

          <input
            id="dmWorldMapUrl"
            type="text"
            value="${dmWorldEscape(
              item?.map_url ||
              ''
            )}"
          >

        </div>


        <div class="dm-world-field">

          <label for="dmWorldMapCaption">
            Media Caption
          </label>

          <input
            id="dmWorldMapCaption"
            type="text"
            value="${dmWorldEscape(
              item?.map_caption ||
              ''
            )}"
          >

        </div>


        <div class="dm-world-field">

          <label for="dmWorldDisplayType">
            Display Type
          </label>

          <select id="dmWorldDisplayType">

            ${
              DM_WORLD_DISPLAY_TYPES
                .map(
                  value => `

                    <option
                      value="${value}"
                      ${
                        value ===
                        (
                          item?.display_type ||
                          'standard'
                        )
                          ? 'selected'
                          : ''
                      }
                    >
                      ${value}
                    </option>

                  `
                )
                .join('')
            }

          </select>

        </div>


<div class="dm-world-field full">

  <label>

    <input
      id="dmWorldDowntime"
      type="checkbox"
      ${
        item?.downtime_enabled
          ? 'checked'
          : ''
      }
    >

    Downtime Activities Enabled

  </label>


  <div
    style="
      display:grid;
      grid-template-columns:
        repeat(auto-fit,minmax(210px,1fr));
      gap:8px;
      margin-top:10px;
    "
  >

    ${
      DM_WORLD_DOWNTIME_WIDGETS
        .map(
          widget => `

            <label
              style="
                display:flex;
                align-items:center;
                gap:8px;
                padding:8px 10px;
                border:1px solid rgba(113,140,150,.32);
              "
            >

              <input
                type="checkbox"
                data-dm-world-downtime-widget
                value="${widget.id}"
                ${
                  (
                    item?.downtime_widget_ids ||
                    []
                  )
                    .includes(
                      widget.id
                    )
                      ? 'checked'
                      : ''
                }
              >

              ${widget.name}

            </label>

          `
        )
        .join('')
    }

  </div>


  <small
    style="
      display:block;
      margin-top:8px;
      opacity:.7;
    "
  >
    Choose which authorized player widgets
    are available from this World location.
  </small>

</div>


        <div class="dm-world-field full">

          <label>
            Player Visibility
          </label>

          ${dmWorldVisibilityEditor(
            'section',
            item
          )}

        </div>


      </div>


      <div class="dm-world-modal-actions">


        ${
          item

            ? `
                <button
                  class="dm-world-btn danger"
                  type="button"
                  data-dm-world-action="delete"
                >
                  Permanently Delete
                </button>
              `

            : ''
        }


        <button
          class="dm-world-btn"
          type="button"
          data-dm-world-action="close-modal"
        >
          Cancel
        </button>


        <button
          class="dm-world-btn primary"
          type="button"
          data-dm-world-action="save"
        >
          Save Section
        </button>


      </div>


    </div>

  `;


  document.body.appendChild(
    backdrop
  );

}


/* =====================================================
   SAVE VISIBILITY
   ===================================================== */

async function saveDmWorldVisibility(
  type,
  id,
  campaign,
  isVisible
){

  const client =
    dmWorldClient();


  const existing =
    dmWorldVisibilityRow(
      type,
      id,
      campaign
    );


  if(existing){

    const {
      error
    } =
      await client

        .from(
          'world_campaign_visibility'
        )

        .update({

          is_visible:
            Boolean(
              isVisible
            ),

          updated_at:
            new Date()
              .toISOString()

        })

        .eq(
          'id',
          existing.id
        );


    if(error){

      throw error;

    }


    return;

  }


  const body = {

    campaign,

    is_visible:
      Boolean(
        isVisible
      )

  };


  if(
    type ===
    'supersection'
  ){

    body.supersection_id =
      id;

    body.section_id =
      null;

  }
  else{

    body.section_id =
      id;

    body.supersection_id =
      null;

  }


  const {
    error
  } =
    await client

      .from(
        'world_campaign_visibility'
      )

      .insert(
        body
      );


  if(error){

    throw error;

  }

}


/* =====================================================
   SAVE ITEM
   ===================================================== */

async function saveDmWorldItem(){

  const client =
    dmWorldClient();


  if(!client){

    return;

  }


  const name =
    dmWorldById(
      'dmWorldName'
    )
      ?.value
      .trim() ||
    '';


  if(!name){

    alert(
      'Name is required.'
    );

    return;

  }


  let key =
    dmWorldById(
      'dmWorldKey'
    )
      ?.value
      .trim() ||
    '';


  if(!key){

    key =
      dmWorldSlug(
        name
      );

  }


  if(!key){

    alert(
      'A System Key could not be generated.'
    );

    return;

  }


  const heroVisible =
    Boolean(
      dmWorldById(
        'dmWorldHeroVisible'
      )?.checked
    );


  const villainVisible =
    Boolean(
      dmWorldById(
        'dmWorldVillainVisible'
      )?.checked
    );


  const now =
    new Date()
      .toISOString();


  try{

    DM_WORLD.suppressRealtime =
      true;


    let id =
      DM_WORLD.editingId;


    if(
      DM_WORLD.editingType ===
      'supersection'
    ){

      const existing =
        id
          ? dmWorldSupersection(
              id
            )
          : null;


      const body = {

        key,

        name,

        subtitle:
          dmWorldById(
            'dmWorldSubtitle'
          )
            ?.value
            .trim() ||
          null,

        description:
          dmWorldById(
            'dmWorldDescription'
          )
            ?.value
            .trim() ||
          null,

        map_url:
          dmWorldById(
            'dmWorldMapUrl'
          )
            ?.value
            .trim() ||
          null,

        map_caption:
          dmWorldById(
            'dmWorldMapCaption'
          )
            ?.value
            .trim() ||
          null,

        display_type:
          dmWorldById(
            'dmWorldDisplayType'
          )?.value ||
          existing?.display_type ||
          'standard',

        visible_to_players:
          heroVisible ||
          villainVisible,

        sort_order:
          existing?.sort_order ??
          dmWorldNextSupersectionSort(),

        updated_at:
          now

      };


      if(id){

        const {
          error
        } =
          await client

            .from(
              'world_supersections'
            )

            .update(
              body
            )

            .eq(
              'id',
              id
            );


        if(error){

          throw error;

        }

      }
      else{

        const {
          data,
          error
        } =
          await client

            .from(
              'world_supersections'
            )

            .insert(
              body
            )

            .select(
              'id'
            )

            .single();


        if(error){

          throw error;

        }


        id =
          data?.id;

      }

    }
    else{

      const existing =
        id
          ? dmWorldSection(
              id
            )
          : null;


      const parentId =
        dmWorldById(
          'dmWorldParent'
        )?.value;


      if(!parentId){

        throw new Error(
          'A parent area is required.'
        );

      }


      const moved =
        existing &&
        existing.supersection_id !==
        parentId;


      const body = {

        supersection_id:
          parentId,

        key,

        name,

        subtitle:
          dmWorldById(
            'dmWorldSubtitle'
          )
            ?.value
            .trim() ||
          null,

        description:
          dmWorldById(
            'dmWorldDescription'
          )
            ?.value
            .trim() ||
          null,

        map_url:
          dmWorldById(
            'dmWorldMapUrl'
          )
            ?.value
            .trim() ||
          null,

        map_caption:
          dmWorldById(
            'dmWorldMapCaption'
          )
            ?.value
            .trim() ||
          null,

        display_type:
          dmWorldById(
            'dmWorldDisplayType'
          )?.value ||
          existing?.display_type ||
          'standard',

downtime_enabled:
  Boolean(
    dmWorldById(
      'dmWorldDowntime'
    )?.checked
  ),

downtime_widget_ids:
  Boolean(
    dmWorldById(
      'dmWorldDowntime'
    )?.checked
  )

    ? Array
        .from(
          document.querySelectorAll(
            '[data-dm-world-downtime-widget]:checked'
          )
        )
        .map(
          input =>
            input.value
        )

    : [],

visible_to_players:
          heroVisible ||
          villainVisible,

        sort_order:
          moved

            ? dmWorldNextSectionSort(
                parentId
              )

            : (
                existing?.sort_order ??
                dmWorldNextSectionSort(
                  parentId
                )
              ),

        updated_at:
          now

      };


      if(id){

        const {
          error
        } =
          await client

            .from(
              'world_sections'
            )

            .update(
              body
            )

            .eq(
              'id',
              id
            );


        if(error){

          throw error;

        }

      }
      else{

        const {
          data,
          error
        } =
          await client

            .from(
              'world_sections'
            )

            .insert(
              body
            )

            .select(
              'id'
            )

            .single();


        if(error){

          throw error;

        }


        id =
          data?.id;

      }

    }


    if(!id){

      throw new Error(
        'Supabase did not return the saved World record ID.'
      );

    }


    await saveDmWorldVisibility(
      DM_WORLD.editingType,
      id,
      'hero',
      heroVisible
    );


    await saveDmWorldVisibility(
      DM_WORLD.editingType,
      id,
      'villain',
      villainVisible
    );


    closeDmWorldModal();

  }
  catch(error){

    console.error(
      'World save failed:',
      error
    );


    alert(
      `World record could not be saved.\n\n${
        error?.message ||
        String(error)
      }`
    );

  }
  finally{

    DM_WORLD.suppressRealtime =
      false;

  }


  await loadDmWorld();

}


/* =====================================================
   DELETE
   ===================================================== */

async function deleteDmWorldItem(){

  const client =
    dmWorldClient();


  if(
    !client ||
    !DM_WORLD.editingId
  ){

    return;

  }


  const type =
    DM_WORLD.editingType;


  const id =
    DM_WORLD.editingId;


  const item =
    type ===
      'supersection'

      ? dmWorldSupersection(
          id
        )

      : dmWorldSection(
          id
        );


  if(!item){

    return;

  }


  let warning =
    `Permanently delete "${item.name}"?`;


  if(
    type ===
    'supersection'
  ){

    warning +=
      '\n\nThis also deletes all sections and notes inside this area.';

  }
  else{

    warning +=
      '\n\nThis also deletes notes attached to this section.';

  }


  warning +=
    '\n\nThis cannot be undone.';


  if(
    !confirm(
      warning
    )
  ){

    return;

  }


  try{

    DM_WORLD.suppressRealtime =
      true;


    if(
      type ===
      'section'
    ){

      await deleteDmWorldSectionData(
        id
      );

    }
    else{

      const children =
        dmWorldSectionsFor(
          id
        );


      for(
        const child of
        children
      ){

        await deleteDmWorldSectionData(
          child.id
        );

      }


      let result;


      result =
        await client
          .from(
            'world_notes'
          )
          .delete()
          .eq(
            'supersection_id',
            id
          );


      if(
        result.error
      ){

        throw result.error;

      }


      result =
        await client
          .from(
            'world_campaign_visibility'
          )
          .delete()
          .eq(
            'supersection_id',
            id
          );


      if(
        result.error
      ){

        throw result.error;

      }


      result =
        await client
          .from(
            'world_supersections'
          )
          .delete()
          .eq(
            'id',
            id
          );


      if(
        result.error
      ){

        throw result.error;

      }

    }


    closeDmWorldModal();

  }
  catch(error){

    console.error(
      'World deletion failed:',
      error
    );


    alert(
      `World record could not be deleted.\n\n${
        error?.message ||
        String(error)
      }`
    );

  }
  finally{

    DM_WORLD.suppressRealtime =
      false;

  }


  await loadDmWorld();

}


async function deleteDmWorldSectionData(
  id
){

  const client =
    dmWorldClient();


  let result;


  result =
    await client
      .from(
        'world_notes'
      )
      .delete()
      .eq(
        'section_id',
        id
      );


  if(
    result.error
  ){

    throw result.error;

  }


  result =
    await client
      .from(
        'world_campaign_visibility'
      )
      .delete()
      .eq(
        'section_id',
        id
      );


  if(
    result.error
  ){

    throw result.error;

  }


  result =
    await client
      .from(
        'world_sections'
      )
      .delete()
      .eq(
        'id',
        id
      );


  if(
    result.error
  ){

    throw result.error;

  }

}


/* =====================================================
   DRAG HELPERS
   ===================================================== */

function clearDmWorldDragStyles(){

  document
    .querySelectorAll(
      '.is-dragging, .is-drop-target, .is-drop-before, .is-drop-after'
    )
    .forEach(
      element => {

        element.classList.remove(
          'is-dragging',
          'is-drop-target',
          'is-drop-before',
          'is-drop-after'
        );

      }
    );

}


/* =====================================================
   DRAG START
   ===================================================== */

function handleDmWorldDragStart(
  event
){

  if(
    DM_WORLD.mode !==
    'editor'
  ){

    return;

  }


  const handle =
    event.target.closest(
      '[data-dm-world-drag-type]'
    );


  if(!handle){

    return;

  }


  DM_WORLD.dragType =
    handle.dataset.dmWorldDragType;


  DM_WORLD.dragId =
    handle.dataset.dmWorldDragId;


  event.dataTransfer.effectAllowed =
    'move';


  event.dataTransfer.setData(
    'text/plain',
    DM_WORLD.dragId
  );


  const card =
    DM_WORLD.dragType ===
      'supersection'

      ? handle.closest(
          '[data-dm-world-supersection]'
        )

      : handle.closest(
          '[data-dm-world-section]'
        );


  card?.classList.add(
    'is-dragging'
  );

}


function handleDmWorldDragEnd(){

  clearDmWorldDragStyles();


  DM_WORLD.dragType =
    null;


  DM_WORLD.dragId =
    null;

}


/* =====================================================
   DRAG OVER
   ===================================================== */

function handleDmWorldDragOver(
  event
){

  if(
    DM_WORLD.mode !==
    'editor'
  ){

    return;

  }


  if(
    !DM_WORLD.dragType ||
    !DM_WORLD.dragId
  ){

    return;

  }


  if(
    DM_WORLD.dragType ===
    'supersection'
  ){

    const target =
      event.target.closest(
        '[data-dm-world-supersection]'
      );


    if(
      !target ||
      target.dataset
        .dmWorldSupersection ===
        DM_WORLD.dragId
    ){

      return;

    }


    event.preventDefault();

    clearDmWorldDragStyles();

    target.classList.add(
      'is-drop-target'
    );


    document
      .querySelector(
        `[data-dm-world-supersection="${DM_WORLD.dragId}"]`
      )
      ?.classList
      .add(
        'is-dragging'
      );


    return;

  }


  const targetSection =
    event.target.closest(
      '[data-dm-world-section]'
    );


  if(
    targetSection &&
    targetSection.dataset
      .dmWorldSection !==
      DM_WORLD.dragId
  ){

    event.preventDefault();

    clearDmWorldDragStyles();


    const rect =
      targetSection
        .getBoundingClientRect();


    const after =
      event.clientY >
      (
        rect.top +
        rect.height / 2
      );


    targetSection.classList.add(
      after
        ? 'is-drop-after'
        : 'is-drop-before'
    );


    document
      .querySelector(
        `[data-dm-world-section="${DM_WORLD.dragId}"]`
      )
      ?.classList
      .add(
        'is-dragging'
      );


    return;

  }


  const container =
    event.target.closest(
      '[data-dm-world-section-container]'
    );


  if(container){

    event.preventDefault();

    clearDmWorldDragStyles();

    container.classList.add(
      'is-drop-target'
    );

  }

}


/* =====================================================
   DROP
   ===================================================== */

async function handleDmWorldDrop(
  event
){

  if(
    DM_WORLD.mode !==
    'editor'
  ){

    return;

  }


  if(
    !DM_WORLD.dragType ||
    !DM_WORLD.dragId
  ){

    return;

  }


  event.preventDefault();


  try{

    if(
      DM_WORLD.dragType ===
      'supersection'
    ){

      const target =
        event.target.closest(
          '[data-dm-world-supersection]'
        );


      if(
        target &&
        target.dataset
          .dmWorldSupersection !==
          DM_WORLD.dragId
      ){

        const rect =
          target
            .getBoundingClientRect();


        const after =
          event.clientY >
          (
            rect.top +
            rect.height / 2
          );


        await moveDmWorldSupersection(
          DM_WORLD.dragId,
          target.dataset
            .dmWorldSupersection,
          after
        );

      }

    }
    else{

      const targetSection =
        event.target.closest(
          '[data-dm-world-section]'
        );


      if(
        targetSection &&
        targetSection.dataset
          .dmWorldSection !==
          DM_WORLD.dragId
      ){

        const rect =
          targetSection
            .getBoundingClientRect();


        const after =
          event.clientY >
          (
            rect.top +
            rect.height / 2
          );


        await moveDmWorldSectionRelative(
          DM_WORLD.dragId,
          targetSection.dataset
            .dmWorldSection,
          after
        );

      }
      else{

        const container =
          event.target.closest(
            '[data-dm-world-section-container]'
          );


        if(container){

          await moveDmWorldSectionToEnd(
            DM_WORLD.dragId,
            container.dataset
              .dmWorldSectionContainer
          );

        }

      }

    }

  }
  catch(error){

    console.error(
      'World drag-and-drop failed:',
      error
    );


    alert(
      `World ordering could not be saved.\n\n${
        error?.message ||
        String(error)
      }`
    );

  }
  finally{

    clearDmWorldDragStyles();


    DM_WORLD.dragType =
      null;


    DM_WORLD.dragId =
      null;

  }

}


/* =====================================================
   SUPERSECTION REORDER
   ===================================================== */

async function moveDmWorldSupersection(
  draggedId,
  targetId,
  after
){

  const tabItems =
    dmWorldSupersectionsForTab(
      DM_WORLD.tab
    );


  const draggedIndex =
    tabItems.findIndex(
      item =>
        item.id ===
        draggedId
    );


  if(
    draggedIndex <
    0
  ){

    return;

  }


  const [
    dragged
  ] =
    tabItems.splice(
      draggedIndex,
      1
    );


  let targetIndex =
    tabItems.findIndex(
      item =>
        item.id ===
        targetId
    );


  if(
    targetIndex <
    0
  ){

    return;

  }


  if(after){

    targetIndex +=
      1;

  }


  tabItems.splice(
    targetIndex,
    0,
    dragged
  );


  await saveDmWorldSupersectionOrder(
    tabItems
  );

}


/* =====================================================
   SECTION MOVE
   ===================================================== */

async function moveDmWorldSectionRelative(
  draggedId,
  targetId,
  after
){

  const dragged =
    dmWorldSection(
      draggedId
    );


  const target =
    dmWorldSection(
      targetId
    );


  if(
    !dragged ||
    !target
  ){

    return;

  }


  const targetParent =
    target.supersection_id;


  const sourceParent =
    dragged.supersection_id;


  const targetList =
    dmWorldSectionsFor(
      targetParent
    )
      .filter(
        item =>
          item.id !==
          draggedId
      );


  let targetIndex =
    targetList.findIndex(
      item =>
        item.id ===
        targetId
    );


  if(
    targetIndex <
    0
  ){

    return;

  }


  if(after){

    targetIndex +=
      1;

  }


  targetList.splice(
    targetIndex,
    0,
    {
      ...dragged,
      supersection_id:
        targetParent
    }
  );


  const sourceList =
    sourceParent ===
    targetParent

      ? null

      : dmWorldSectionsFor(
          sourceParent
        )
          .filter(
            item =>
              item.id !==
              draggedId
          );


  await saveDmWorldSectionOrders(
    targetList,
    sourceList
  );

}


async function moveDmWorldSectionToEnd(
  draggedId,
  parentId
){

  const dragged =
    dmWorldSection(
      draggedId
    );


  if(!dragged){

    return;

  }


  const sourceParent =
    dragged.supersection_id;


  const targetList =
    dmWorldSectionsFor(
      parentId
    )
      .filter(
        item =>
          item.id !==
          draggedId
      );


  targetList.push({
    ...dragged,
    supersection_id:
      parentId
  });


  const sourceList =
    sourceParent ===
    parentId

      ? null

      : dmWorldSectionsFor(
          sourceParent
        )
          .filter(
            item =>
              item.id !==
              draggedId
          );


  await saveDmWorldSectionOrders(
    targetList,
    sourceList
  );

}


/* =====================================================
   SAVE ORDERS
   ===================================================== */

async function saveDmWorldSupersectionOrder(
  ordered
){

  const client =
    dmWorldClient();


  if(!client){

    return;

  }


  DM_WORLD.suppressRealtime =
    true;


  try{

    for(
      let index = 0;
      index < ordered.length;
      index += 1
    ){

      const {
        error
      } =
        await client

          .from(
            'world_supersections'
          )

          .update({

            sort_order:
              (
                index +
                1
              ) *
              10,

            updated_at:
              new Date()
                .toISOString()

          })

          .eq(
            'id',
            ordered[index].id
          );


      if(error){

        throw error;

      }

    }

  }
  finally{

    DM_WORLD.suppressRealtime =
      false;

  }


  await loadDmWorld();

}


async function saveDmWorldSectionOrders(
  primary,
  secondary = null
){

  const client =
    dmWorldClient();


  if(!client){

    return;

  }


  DM_WORLD.suppressRealtime =
    true;


  try{

    const lists =
      secondary
        ? [
            primary,
            secondary
          ]
        : [
            primary
          ];


    for(
      const list of lists
    ){

      for(
        let index = 0;
        index < list.length;
        index += 1
      ){

        const item =
          list[index];


        const {
          error
        } =
          await client

            .from(
              'world_sections'
            )

            .update({

              supersection_id:
                item.supersection_id,

              sort_order:
                (
                  index +
                  1
                ) *
                10,

              updated_at:
                new Date()
                  .toISOString()

            })

            .eq(
              'id',
              item.id
            );


        if(error){

          throw error;

        }

      }

    }

  }
  finally{

    DM_WORLD.suppressRealtime =
      false;

  }


  await loadDmWorld();

}


/* =====================================================
   CLICK EVENTS
   ===================================================== */

function handleDmWorldClick(
  event
){

  const button =
    event.target.closest(
      '[data-dm-world-action]'
    );


  if(!button){

    return;

  }


  const action =
    button.dataset
      .dmWorldAction;


  if(
    action ===
    'mode'
  ){

    DM_WORLD.mode =
      button.dataset.value ===
      'editor'
        ? 'editor'
        : 'explorer';


    DM_WORLD.explorerTarget =
      null;


    closeDmWorldDetailOverlay();

    renderDmWorld();

    return;

  }


  if(
    action ===
    'campaign'
  ){

    DM_WORLD.campaign =
      button.dataset.value ===
      'villain'
        ? 'villain'
        : 'hero';


    DM_WORLD.explorerTarget =
      null;


    closeDmWorldDetailOverlay();

    renderDmWorld();

    return;

  }


  if(
    action ===
    'tab'
  ){

    DM_WORLD.tab =
      [
        'cast',
        'unbound',
        'outer',
        'systems'
      ]
        .includes(
          button.dataset.value
        )
          ? button.dataset.value
          : 'cast';


    DM_WORLD.explorerTarget =
      null;


    closeDmWorldDetailOverlay();

    renderDmWorld();

    return;

  }


  if(
    action ===
    'explorer-supersection'
  ){

    DM_WORLD.explorerTarget = {
      type:
        'supersection',

      id:
        button.dataset.worldId
    };


    closeDmWorldDetailOverlay();

    renderDmWorldDetailOverlay();

    return;

  }


  if(
    action ===
    'explorer-section'
  ){

    DM_WORLD.explorerTarget = {
      type:
        'section',

      id:
        button.dataset.worldId
    };


    closeDmWorldDetailOverlay();

    renderDmWorldDetailOverlay();

    return;

  }


  if(
    action ===
    'close-detail'
  ){

    DM_WORLD.explorerTarget =
      null;


    closeDmWorldDetailOverlay();

    return;

  }


  if(
    action ===
    'add-supersection'
  ){

    openDmWorldSupersectionModal();

    return;

  }


  if(
    action ===
    'edit-supersection'
  ){

    openDmWorldSupersectionModal(
      button.dataset.worldId
    );

    return;

  }


  if(
    action ===
    'add-section'
  ){

    openDmWorldSectionModal(
      null,
      button.dataset
        .supersectionId
    );

    return;

  }


  if(
    action ===
    'edit-section'
  ){

    openDmWorldSectionModal(
      button.dataset.worldId
    );

    return;

  }


  if(
    action ===
    'close-modal'
  ){

    closeDmWorldModal();

    return;

  }


  if(
    action ===
    'save'
  ){

    saveDmWorldItem();

    return;

  }


  if(
    action ===
    'delete'
  ){

    deleteDmWorldItem();

  }

}


/* =====================================================
   BACKDROP CLICK
   ===================================================== */

function handleDmWorldBackdropClick(
  event
){

  if(
    event.target.id ===
    'dmWorldDetailBackdrop'
  ){

    DM_WORLD.explorerTarget =
      null;

    closeDmWorldDetailOverlay();

  }


  if(
    event.target.id ===
    'dmWorldModalBackdrop'
  ){

    closeDmWorldModal();

  }

}


/* =====================================================
   REALTIME
   ===================================================== */

function connectDmWorldRealtime(){

  const client =
    dmWorldClient();


  if(
    !client?.channel
  ){

    return;

  }


  if(
    dmWorldRealtimeChannel
  ){

    client.removeChannel(
      dmWorldRealtimeChannel
    );

  }


  const refresh =
    () => {

      if(
        DM_WORLD.suppressRealtime
      ){

        return;

      }


      loadDmWorld();

    };


  dmWorldRealtimeChannel =
    client

      .channel(
        'dm-world-live'
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
          table:'world_campaign_visibility'
        },
        refresh
      )

      .on(
        'postgres_changes',
        {
          event:'*',
          schema:'public',
          table:'world_notes'
        },
        refresh
      )

      .subscribe();

}


/* =====================================================
   INITIALIZE
   ===================================================== */

async function initializeDmWorld(){

  if(
    DM_WORLD.initialized
  ){

    return;

  }


  if(
    !dmWorldById(
      'dmWorldMount'
    )
  ){

    return;

  }


  DM_WORLD.initialized =
    true;


  installDmWorldStyles();


  document.addEventListener(
    'click',
    handleDmWorldClick
  );


  document.addEventListener(
    'click',
    handleDmWorldBackdropClick
  );


  document.addEventListener(
    'dragstart',
    handleDmWorldDragStart
  );


  document.addEventListener(
    'dragend',
    handleDmWorldDragEnd
  );


  document.addEventListener(
    'dragover',
    handleDmWorldDragOver
  );


  document.addEventListener(
    'drop',
    handleDmWorldDrop
  );


  await loadDmWorld();


  connectDmWorldRealtime();

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
    initializeDmWorld
  );

}
else{

  initializeDmWorld();

}
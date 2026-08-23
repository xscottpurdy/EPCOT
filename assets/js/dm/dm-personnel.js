/* =====================================================
   EPCOT DND
   DM PERSONNEL ADMINISTRATION

   npcs
   = universal NPC identity

   npc_campaign_state
   = campaign-specific discovery, details,
     and relationship score
   ===================================================== */


/* =====================================================
   FIXED OPTIONS
   ===================================================== */

const DM_PERSONNEL_COMPANIES = [
  'Progress Dynamics',
  'VistaCorp',
  'Monsanto',
  'Fordham Mobility',
  'WestHouse Systems',
  'Disney Enterprises',
  'Unaffiliated'
];


const DM_PERSONNEL_MAGIC_DOMAINS = [
  'Bravura',
  'Starpath',
  'Craftspark',
  'Mindwave',
  'Heartline',
  'Dreamlight'
];


const DM_PERSONNEL_NEIGHBORHOODS = [
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
   D&D 5.5e SKILLS
   ===================================================== */

const DM_PERSONNEL_SKILLS = [
  'Acrobatics',
  'Animal Handling',
  'Arcana',
  'Athletics',
  'Deception',
  'History',
  'Insight',
  'Intimidation',
  'Investigation',
  'Medicine',
  'Nature',
  'Perception',
  'Performance',
  'Persuasion',
  'Religion',
  'Sleight of Hand',
  'Stealth',
  'Survival'
];


/* =====================================================
   STATE
   ===================================================== */

let dmPersonnelNpcs = [];

let dmPersonnelCampaignStates = [];

let dmPersonnelEditingId = null;


/* =====================================================
   HELPERS
   ===================================================== */

function dmPersonnelById(id){

  return document.getElementById(id);

}


function dmPersonnelClient(){

  return window.epcotAuth?.client || null;

}


function dmPersonnelEscape(value){

  return String(value ?? '')
    .replaceAll('&','&amp;')
    .replaceAll('<','&lt;')
    .replaceAll('>','&gt;')
    .replaceAll('"','&quot;')
    .replaceAll("'","&#039;");

}


function dmPersonnelCampaignState(
  npcId,
  campaign
){

  return dmPersonnelCampaignStates.find(
    row =>
      row.npc_id === npcId &&
      row.campaign === campaign
  ) || null;

}


function dmPersonnelOptions(
  options,
  selectedValue,
  placeholder
){

  return `

    <option value="">
      ${dmPersonnelEscape(placeholder)}
    </option>

    ${options.map(
      option => `
        <option
          value="${dmPersonnelEscape(option)}"
          ${option === selectedValue ? 'selected' : ''}
        >
          ${dmPersonnelEscape(option)}
        </option>
      `
    ).join('')}

  `;

}


/* =====================================================
   RELATIONSHIP SYSTEM
   ===================================================== */

function dmPersonnelClampRelationship(value){

  const number =
    Number(value);


  if(
    !Number.isFinite(number)
  ){
    return 50;
  }


  return Math.max(
    0,
    Math.min(
      100,
      Math.round(number)
    )
  );

}


function dmPersonnelRelationshipLabel(score){

  const value =
    dmPersonnelClampRelationship(score);


  if(value <= 10){
    return 'HOSTILE';
  }

  if(value <= 20){
    return 'AGGRESSIVE';
  }

  if(value <= 30){
    return 'UNFRIENDLY';
  }

  if(value <= 40){
    return 'DISLIKED';
  }

  if(value <= 50){
    return 'NEUTRAL';
  }

  if(value <= 60){
    return 'LIKED';
  }

  if(value <= 70){
    return 'FRIENDLY';
  }

  if(value <= 89){
    return 'TRUSTWORTHY';
  }

  return 'LOYAL';

}


function updateDmRelationshipPreview(campaign){

  const slider =
    dmPersonnelById(
      `dmNpc${campaign}Relationship`
    );


  const number =
    dmPersonnelById(
      `dmNpc${campaign}RelationshipNumber`
    );


  const output =
    dmPersonnelById(
      `dmNpc${campaign}RelationshipOutput`
    );


  if(
    !slider ||
    !number ||
    !output
  ){
    return;
  }


  const score =
    dmPersonnelClampRelationship(
      slider.value
    );


  slider.value =
    score;


  number.value =
    score;


  output.textContent =
    `${score} · ${dmPersonnelRelationshipLabel(score)}`;

}


/* =====================================================
   SAFE DETAILS HTML
   ===================================================== */

function dmPersonnelCleanHtml(html){

  const wrapper =
    document.createElement('div');


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
   STYLES
   ===================================================== */

function installDmPersonnelStyles(){

  if(
    dmPersonnelById(
      'dmPersonnelAdminStyles'
    )
  ){
    return;
  }


  const style =
    document.createElement('style');


  style.id =
    'dmPersonnelAdminStyles';


  style.textContent = `

    .dm-personnel-toolbar{
      display:flex;
      justify-content:space-between;
      align-items:center;
      gap:16px;
      flex-wrap:wrap;
      margin-bottom:18px;
    }

    .dm-personnel-primary,
    .dm-personnel-secondary,
    .dm-personnel-danger{
      border-radius:8px;
      padding:10px 16px;
      font:inherit;
      font-weight:700;
      cursor:pointer;
    }

    .dm-personnel-primary{
      border:0;
      background:#f4c96b;
      color:#142436;
    }

    .dm-personnel-secondary{
      color:inherit;
      border:1px solid rgba(255,255,255,.2);
      background:rgba(255,255,255,.08);
    }

    .dm-personnel-danger{
      border:0;
      background:#7f2d37;
      color:#fff;
    }

    .dm-personnel-grid{
      display:grid;
      grid-template-columns:
        repeat(auto-fit,minmax(300px,1fr));
      gap:16px;
    }

    .dm-personnel-card{
      padding:18px;
      display:flex;
      flex-direction:column;
      gap:14px;
    }

    .dm-personnel-card-head{
      display:flex;
      gap:14px;
      align-items:flex-start;
    }

    .dm-personnel-portrait{
      width:76px;
      height:76px;
      flex:0 0 76px;
      border-radius:10px;
      overflow:hidden;
      border:1px solid rgba(255,255,255,.2);
      background:rgba(255,255,255,.04);
      display:grid;
      place-items:center;
    }

    .dm-personnel-portrait img{
      width:100%;
      height:100%;
      object-fit:cover;
    }

    .dm-personnel-name{
      margin:2px 0 4px;
    }

    .dm-personnel-muted{
      opacity:.65;
      font-size:.9rem;
    }

    .dm-personnel-meta{
      display:flex;
      flex-wrap:wrap;
      gap:6px;
    }

    .dm-personnel-chip{
      border-radius:999px;
      padding:4px 9px;
      font-size:.78rem;
      border:1px solid rgba(255,255,255,.18);
      background:rgba(255,255,255,.06);
    }

    .dm-personnel-campaigns{
      display:grid;
      grid-template-columns:1fr 1fr;
      gap:10px;
    }

    .dm-personnel-campaign-card{
      padding:11px;
      border-radius:8px;
      border:1px solid rgba(255,255,255,.13);
      background:rgba(255,255,255,.035);
    }

    .dm-personnel-campaign-card strong{
      display:block;
      margin-bottom:5px;
    }

    .dm-personnel-known{
      color:#f4c96b;
    }

    .dm-personnel-unknown{
      opacity:.55;
    }

    .dm-personnel-modal-backdrop{
      position:fixed;
      inset:0;
      z-index:10000;
      background:rgba(2,8,14,.82);
      backdrop-filter:blur(5px);
      display:grid;
      place-items:center;
      padding:24px;
    }

    .dm-personnel-modal{
      width:min(1000px,100%);
      max-height:calc(100vh - 48px);
      overflow:auto;
      border-radius:14px;
      border:1px solid rgba(255,255,255,.2);
      padding:24px;
      background:#102433;
      box-shadow:
        0 24px 80px rgba(0,0,0,.45);
    }

    .dm-personnel-modal-header{
      display:flex;
      justify-content:space-between;
      align-items:flex-start;
      gap:16px;
      margin-bottom:22px;
    }

    .dm-personnel-close{
      border:0;
      background:transparent;
      color:inherit;
      cursor:pointer;
      font-size:1.7rem;
    }

    .dm-personnel-section{
      padding:18px;
      margin-bottom:16px;
      border-radius:10px;
      border:1px solid rgba(255,255,255,.14);
      background:rgba(255,255,255,.035);
    }

    .dm-personnel-section h3{
      margin:0 0 14px;
    }

    .dm-personnel-form-grid{
      display:grid;
      grid-template-columns:1fr 1fr;
      gap:14px;
    }

    .dm-personnel-field{
      display:flex;
      flex-direction:column;
      gap:6px;
    }

    .dm-personnel-field label{
      font-weight:700;
      font-size:.9rem;
    }

    .dm-personnel-field input,
    .dm-personnel-field select{
      width:100%;
      box-sizing:border-box;
      border-radius:7px;
      border:1px solid rgba(255,255,255,.18);
      background:rgba(0,0,0,.18);
      color:inherit;
      padding:10px 11px;
      font:inherit;
    }

    .dm-personnel-field select option{
      color:#111;
    }

    .dm-personnel-skills{
      display:grid;
      grid-template-columns:
        repeat(3,minmax(0,1fr));
      gap:8px;
    }

    .dm-personnel-skill{
      display:flex;
      align-items:center;
      gap:8px;
      padding:9px;
      border-radius:7px;
      border:1px solid rgba(255,255,255,.13);
      cursor:pointer;
    }

    .dm-personnel-campaign-editor{
      display:grid;
      grid-template-columns:1fr 1fr;
      gap:14px;
    }

    .dm-personnel-campaign-panel{
      padding:14px;
      border-radius:8px;
      border:1px solid rgba(255,255,255,.13);
    }

    .dm-personnel-toggle{
      display:flex;
      align-items:center;
      gap:8px;
      font-weight:700;
      margin-bottom:14px;
    }

    .dm-personnel-relationship{
      margin-top:14px;
    }

    .dm-personnel-relationship-row{
      display:grid;
      grid-template-columns:1fr 72px;
      gap:10px;
      align-items:center;
    }

    .dm-personnel-relationship-row input[type="range"]{
      width:100%;
    }

    .dm-personnel-relationship-row input[type="number"]{
      width:100%;
      box-sizing:border-box;
      border-radius:7px;
      border:1px solid rgba(255,255,255,.18);
      background:rgba(0,0,0,.18);
      color:inherit;
      padding:8px;
      font:inherit;
    }

    .dm-personnel-relationship-output{
      margin-top:7px;
      font-weight:800;
      color:#f4c96b;
    }

    .dm-personnel-details-editor{
      min-height:130px;
      margin-top:6px;
      padding:11px;
      border-radius:7px;
      border:1px solid rgba(255,255,255,.18);
      background:rgba(0,0,0,.18);
      outline:none;
    }

    .dm-personnel-help{
      opacity:.62;
      font-size:.8rem;
    }

    .dm-personnel-modal-actions{
      display:flex;
      justify-content:flex-end;
      gap:10px;
      flex-wrap:wrap;
      margin-top:20px;
    }

    @media(max-width:720px){

      .dm-personnel-form-grid,
      .dm-personnel-campaign-editor,
      .dm-personnel-campaigns{
        grid-template-columns:1fr;
      }

      .dm-personnel-skills{
        grid-template-columns:
          repeat(2,minmax(0,1fr));
      }

    }

  `;


  document.head.appendChild(style);

}


/* =====================================================
   LOAD DATA
   ===================================================== */

async function loadDmPersonnelNpcs(){

  const client =
    dmPersonnelClient();


  if(!client){

    throw new Error(
      'Supabase client is unavailable.'
    );

  }


  const {
    data,
    error
  } =
    await client
      .from('npcs')
.select(`
  id,
  name_cast,
  name_unbound,
  cast_image_url,
  unbound_image_url,
  company_association,
  title,
  magic_domain,
  neighborhood,
  skill_training,
  visibility,
  is_reassigned,
  created_at
`)
      .order(
        'name_cast',
        {
          ascending:true
        }
      );


  if(error){
    throw error;
  }


  dmPersonnelNpcs =
    data || [];

}


async function loadDmPersonnelCampaignStates(){

  const client =
    dmPersonnelClient();


  const {
    data,
    error
  } =
    await client
      .from('npc_campaign_state')
.select(`
  id,
  npc_id,
  campaign,
  details,
  relationship_tag,
  relationship_score,
  is_visible
`)


  if(error){
    throw error;
  }


  dmPersonnelCampaignStates =
    data || [];

}


/* =====================================================
   PERSONNEL CARD
   ===================================================== */

function renderDmPersonnelCard(npc){

  const heroState =
    dmPersonnelCampaignState(
      npc.id,
      'hero'
    );


  const villainState =
    dmPersonnelCampaignState(
      npc.id,
      'villain'
    );


  const skills =
    Array.isArray(
      npc.skill_training
    )
      ? npc.skill_training.filter(Boolean)
      : [];


  const portrait =
    npc.cast_image_url
      ? `
          <img
            src="${dmPersonnelEscape(
              npc.cast_image_url
            )}"
            alt="${dmPersonnelEscape(
              npc.name_cast
            )}"
          >
        `
      : '?';


  function campaignCard(
    title,
    state
  ){

    if(
  !state ||
  !state.is_visible
){

      return `

        <div class="dm-personnel-campaign-card">

          <strong>
            ${title}
          </strong>

          <span class="dm-personnel-unknown">
            Not Discovered
          </span>

        </div>

      `;

    }


    const score =
      dmPersonnelClampRelationship(
        state.relationship_score
      );


    return `

      <div class="dm-personnel-campaign-card">

        <strong>
          ${title}
        </strong>

        <span class="dm-personnel-known">
          Known
        </span>

        <div>
          ${score}
          ·
          ${dmPersonnelRelationshipLabel(score)}
        </div>

      </div>

    `;

  }


return `

  <article
    class="
      dm-console-panel
      dm-personnel-card
    "
    style="
      position:relative;
      overflow:hidden;
      ${npc.is_reassigned
        ? 'filter:saturate(.35);'
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
                z-index:5;
                pointer-events:none;
                background:
                  linear-gradient(
                    135deg,
                    transparent 0 36%,
                    rgba(110,15,24,.82) 36% 47%,
                    rgba(20,3,6,.94) 47% 53%,
                    rgba(110,15,24,.82) 53% 64%,
                    transparent 64% 100%
                  );
                display:flex;
                align-items:center;
                justify-content:center;
              "
            >

              <div
                style="
                  transform:rotate(-12deg);
                  border:4px solid rgba(255,220,205,.92);
                  padding:8px 24px;
                  font-size:1.55rem;
                  font-weight:900;
                  letter-spacing:.18em;
                  color:#ffe1d7;
                  background:rgba(65,5,12,.78);
                  box-shadow:
                    0 0 0 3px rgba(65,5,12,.65),
                    0 8px 25px rgba(0,0,0,.45);
                  text-shadow:
                    0 2px 2px rgba(0,0,0,.8);
                "
              >
                REASSIGNED
              </div>

            </div>
          `
        : ''
    }

      <div class="dm-personnel-card-head">

        <div class="dm-personnel-portrait">
          ${portrait}
        </div>


        <div>

          <div class="dm-page-kicker">
            PERSONNEL RECORD
          </div>

          <h2 class="dm-personnel-name">

            ${dmPersonnelEscape(
              npc.name_cast ||
              'Unnamed Personnel'
            )}

          </h2>

          ${
            npc.name_unbound
              ? `
                  <div class="dm-personnel-muted">

                    Unbound:
                    ${dmPersonnelEscape(
                      npc.name_unbound
                    )}

                  </div>
                `
              : ''
          }

        </div>

      </div>


      <div class="dm-personnel-meta">

        ${
          npc.title
            ? `
                <span class="dm-personnel-chip">
                  ${dmPersonnelEscape(npc.title)}
                </span>
              `
            : ''
        }

        ${
          npc.company_association
            ? `
                <span class="dm-personnel-chip">
                  ${dmPersonnelEscape(
                    npc.company_association
                  )}
                </span>
              `
            : ''
        }

        ${
          npc.magic_domain
            ? `
                <span class="dm-personnel-chip">
                  ${dmPersonnelEscape(
                    npc.magic_domain
                  )}
                </span>
              `
            : ''
        }

        ${
          npc.neighborhood
            ? `
                <span class="dm-personnel-chip">
                  ${dmPersonnelEscape(
                    npc.neighborhood
                  )}
                </span>
              `
            : ''
        }

      </div>


      ${
        skills.length
          ? `
              <div>

                <strong>
                  Skill Training:
                </strong>

                ${skills
                  .map(
                    dmPersonnelEscape
                  )
                  .join(', ')
                }

              </div>
            `
          : ''
      }


      <div class="dm-personnel-campaigns">

        ${campaignCard(
          'Hero Campaign',
          heroState
        )}

        ${campaignCard(
          'Villain Campaign',
          villainState
        )}

      </div>


<div
  style="
    display:flex;
    gap:8px;
    flex-wrap:wrap;
  "
>

  <button
    class="dm-personnel-secondary"
    type="button"
    data-open-intelligence="${npc.id}"
  >
    View Intelligence
  </button>


  <button
    class="dm-personnel-secondary"
    type="button"
    data-dm-personnel-action="edit"
    data-npc-id="${npc.id}"
  >
    Edit Personnel
  </button>

</div>

    </article>

  `;

}


/* =====================================================
   MAIN RENDER
   ===================================================== */

function renderDmPersonnel(){

  const mount =
    dmPersonnelById(
      'dmPersonnelMount'
    );


  if(!mount){
    return;
  }


  mount.innerHTML = `

    <div class="dm-personnel-toolbar">

      <div>

        <div class="dm-page-kicker">
          PERSONNEL DATABASE
        </div>

        <div class="dm-personnel-muted">

          ${dmPersonnelNpcs.length}
          personnel
          ${
            dmPersonnelNpcs.length === 1
              ? 'record'
              : 'records'
          }

        </div>

      </div>


      <button
        class="dm-personnel-primary"
        type="button"
        data-dm-personnel-action="add"
      >
        + Add Personnel
      </button>

    </div>


    ${
      dmPersonnelNpcs.length
        ? `
            <div class="dm-personnel-grid">

              ${dmPersonnelNpcs
                .map(
                  renderDmPersonnelCard
                )
                .join('')
              }

            </div>
          `
        : `
            <div
              class="dm-console-panel"
              style="padding:20px;"
            >

              <strong>
                No Personnel Records
              </strong>

              <p>
                Add the first Personnel record
                to begin the archive.
              </p>

            </div>
          `
    }

  `;

}


/* =====================================================
   SKILL CHECKBOXES
   ===================================================== */

function dmPersonnelSkillMarkup(
  selectedSkills
){

  return DM_PERSONNEL_SKILLS
    .map(
      skill => `

        <label class="dm-personnel-skill">

          <input
            type="checkbox"
            name="dmPersonnelSkill"
            value="${dmPersonnelEscape(skill)}"
            ${
              selectedSkills.includes(skill)
                ? 'checked'
                : ''
            }
          >

          <span>
            ${dmPersonnelEscape(skill)}
          </span>

        </label>

      `
    )
    .join('');

}


/* =====================================================
   RELATIONSHIP CONTROL
   ===================================================== */

function dmPersonnelRelationshipControl(
  campaign,
  score
){

  const value =
    dmPersonnelClampRelationship(
      score
    );


  return `

    <div class="dm-personnel-relationship">

      <strong>
        Relationship
      </strong>


      <div class="dm-personnel-relationship-row">

        <input
          id="dmNpc${campaign}Relationship"
          type="range"
          min="0"
          max="100"
          step="1"
          value="${value}"
        >

        <input
          id="dmNpc${campaign}RelationshipNumber"
          type="number"
          min="0"
          max="100"
          step="1"
          value="${value}"
        >

      </div>


      <div
        id="dmNpc${campaign}RelationshipOutput"
        class="dm-personnel-relationship-output"
      >
        ${value}
        ·
        ${dmPersonnelRelationshipLabel(value)}
      </div>


      <div class="dm-personnel-help">

        0–10 HOSTILE ·
        11–20 AGGRESSIVE ·
        21–30 UNFRIENDLY ·
        31–40 DISLIKED ·
        41–50 NEUTRAL ·
        51–60 LIKED ·
        61–70 FRIENDLY ·
        71–89 TRUSTWORTHY ·
        90–100 LOYAL

      </div>

    </div>

  `;

}


/* =====================================================
   MODAL
   ===================================================== */

function closeDmPersonnelModal(){

  dmPersonnelById(
    'dmPersonnelModalBackdrop'
  )?.remove();


  dmPersonnelEditingId =
    null;

}


function openDmPersonnelModal(
  npcId = null
){

  closeDmPersonnelModal();


  dmPersonnelEditingId =
    npcId;


  const npc =
    npcId
      ? dmPersonnelNpcs.find(
          row =>
            row.id === npcId
        )
      : null;


  if(
    npcId &&
    !npc
  ){

    alert(
      'That Personnel record could not be found.'
    );

    return;

  }


  const heroState =
    npc
      ? dmPersonnelCampaignState(
          npc.id,
          'hero'
        )
      : null;


  const villainState =
    npc
      ? dmPersonnelCampaignState(
          npc.id,
          'villain'
        )
      : null;


  const selectedSkills =
    Array.isArray(
      npc?.skill_training
    )
      ? npc.skill_training.filter(Boolean)
      : [];


  const heroScore =
    heroState?.relationship_score ??
    50;


  const villainScore =
    villainState?.relationship_score ??
    50;


  const backdrop =
    document.createElement('div');


  backdrop.id =
    'dmPersonnelModalBackdrop';


  backdrop.className =
    'dm-personnel-modal-backdrop';


  backdrop.innerHTML = `

    <div
      class="dm-personnel-modal"
      role="dialog"
      aria-modal="true"
    >

      <div class="dm-personnel-modal-header">

        <div>

          <div class="dm-page-kicker">
            PERSONNEL ADMINISTRATION
          </div>

          <h2>
            ${
              npc
                ? 'Edit Personnel'
                : 'Add Personnel'
            }
          </h2>

        </div>


        <button
          class="dm-personnel-close"
          type="button"
          data-dm-personnel-action="close"
        >
          ×
        </button>

      </div>


      <!-- IDENTITY -->

      <section class="dm-personnel-section">

        <h3>
          Identity
        </h3>


        <div class="dm-personnel-form-grid">

          <div class="dm-personnel-field">

            <label for="dmNpcNameCast">
              Cast Name *
            </label>

            <input
              id="dmNpcNameCast"
              type="text"
              value="${dmPersonnelEscape(
                npc?.name_cast || ''
              )}"
            >

          </div>


          <div class="dm-personnel-field">

            <label for="dmNpcNameUnbound">
              Unbound Name
            </label>

            <input
              id="dmNpcNameUnbound"
              type="text"
              value="${dmPersonnelEscape(
                npc?.name_unbound || ''
              )}"
            >

          </div>


          <div class="dm-personnel-field">

            <label for="dmNpcCastImage">
              Cast Image URL
            </label>

            <input
              id="dmNpcCastImage"
              type="url"
              value="${dmPersonnelEscape(
                npc?.cast_image_url || ''
              )}"
            >

          </div>


          <div class="dm-personnel-field">

            <label for="dmNpcUnboundImage">
              Unbound Image URL
            </label>

            <input
              id="dmNpcUnboundImage"
              type="url"
              value="${dmPersonnelEscape(
                npc?.unbound_image_url || ''
              )}"
            >

          </div>

        </div>

      </section>


      <!-- CLASSIFICATION -->

      <section class="dm-personnel-section">

        <h3>
          Classification
        </h3>


        <div class="dm-personnel-form-grid">

          <div class="dm-personnel-field">

            <label for="dmNpcTitle">
              Title
            </label>

            <input
              id="dmNpcTitle"
              type="text"
              value="${dmPersonnelEscape(
                npc?.title || ''
              )}"
            >

          </div>


          <div class="dm-personnel-field">

            <label for="dmNpcCompany">
              Company Association
            </label>

            <select id="dmNpcCompany">

              ${dmPersonnelOptions(
                DM_PERSONNEL_COMPANIES,
                npc?.company_association,
                'Choose company...'
              )}

            </select>

          </div>


          <div class="dm-personnel-field">

            <label for="dmNpcMagicDomain">
              Magic Domain
            </label>

            <select id="dmNpcMagicDomain">

              ${dmPersonnelOptions(
                DM_PERSONNEL_MAGIC_DOMAINS,
                npc?.magic_domain,
                'Choose Magic Domain...'
              )}

            </select>

          </div>


          <div class="dm-personnel-field">

            <label for="dmNpcNeighborhood">
              Neighborhood
            </label>

            <select id="dmNpcNeighborhood">

              ${dmPersonnelOptions(
                DM_PERSONNEL_NEIGHBORHOODS,
                npc?.neighborhood,
                'Choose neighborhood...'
              )}

            </select>

          </div>

        </div>

      </section>

<!-- PERSONNEL STATUS -->

<section class="dm-personnel-section">

  <h3>
    Personnel Status
  </h3>

  <label
    style="
      display:flex;
      align-items:center;
      gap:10px;
      padding:12px;
      border:1px solid rgba(255,255,255,.16);
      border-radius:8px;
      cursor:pointer;
    "
  >

    <input
      id="dmNpcReassigned"
      type="checkbox"
      ${npc?.is_reassigned ? 'checked' : ''}
    >

    <span>
      <strong>REASSIGNED</strong><br>
      <span class="dm-personnel-help">
        Marks this Personnel record as deceased while
        preserving the record, notes, relationships,
        and campaign history.
      </span>
    </span>

  </label>

</section>

      <!-- D&D SKILL TRAINING -->

      <section class="dm-personnel-section">

        <h3>
          D&D Skill Training
        </h3>

        <div class="dm-personnel-help">
          Select the skills this person is trained in.
          These are managed only by the DM.
        </div>


        <div
          class="dm-personnel-skills"
          style="margin-top:12px;"
        >

          ${dmPersonnelSkillMarkup(
            selectedSkills
          )}

        </div>

      </section>


      <!-- CAMPAIGN KNOWLEDGE -->

      <section class="dm-personnel-section">

        <h3>
          Campaign Knowledge
        </h3>

        <div class="dm-personnel-help">
          Hero and Villain maintain completely
          separate knowledge, details, and
          relationships with this person.
        </div>


        <div
          class="dm-personnel-campaign-editor"
          style="margin-top:14px;"
        >


          <!-- HERO -->

          <div class="dm-personnel-campaign-panel">

            <label class="dm-personnel-toggle">

            <input
  id="dmNpcHeroKnown"
  type="checkbox"
  ${heroState?.is_visible ? 'checked' : ''}
>

              Hero Campaign Knows This Person

            </label>


            ${dmPersonnelRelationshipControl(
              'Hero',
              heroScore
            )}


            <div
              class="dm-personnel-field"
              style="margin-top:14px;"
            >

              <label>
                Hero Details
              </label>

              <div
                id="dmNpcHeroDetails"
                class="dm-personnel-details-editor"
                contenteditable="true"
              >${dmPersonnelCleanHtml(
                heroState?.details || ''
              )}</div>

            </div>

          </div>


          <!-- VILLAIN -->

          <div class="dm-personnel-campaign-panel">

            <label class="dm-personnel-toggle">

             <input
  id="dmNpcVillainKnown"
  type="checkbox"
  ${villainState?.is_visible ? 'checked' : ''}
>

              Villain Campaign Knows This Person

            </label>


            ${dmPersonnelRelationshipControl(
              'Villain',
              villainScore
            )}


            <div
              class="dm-personnel-field"
              style="margin-top:14px;"
            >

              <label>
                Villain Details
              </label>

              <div
                id="dmNpcVillainDetails"
                class="dm-personnel-details-editor"
                contenteditable="true"
              >${dmPersonnelCleanHtml(
                villainState?.details || ''
              )}</div>

            </div>

          </div>

        </div>

      </section>


      <div class="dm-personnel-modal-actions">

        ${
          npc
            ? `
                <button
                  class="dm-personnel-danger"
                  type="button"
                  data-dm-personnel-action="delete"
                >
                  Delete Personnel
                </button>
              `
            : ''
        }


        <button
          class="dm-personnel-secondary"
          type="button"
          data-dm-personnel-action="close"
        >
          Cancel
        </button>


        <button
          class="dm-personnel-primary"
          type="button"
          data-dm-personnel-action="save"
        >
          Save Personnel
        </button>

      </div>

    </div>

  `;


  document.body.appendChild(
    backdrop
  );


  updateDmPersonnelCampaignEditors();

  updateDmRelationshipPreview(
    'Hero'
  );

  updateDmRelationshipPreview(
    'Villain'
  );

}


/* =====================================================
   ENABLE / DISABLE CAMPAIGN SECTIONS
   ===================================================== */

function updateDmPersonnelCampaignEditors(){

  [
    'Hero',
    'Villain'
  ].forEach(
    campaign => {

      const known =
        dmPersonnelById(
          `dmNpc${campaign}Known`
        );


      const enabled =
        Boolean(
          known?.checked
        );


      [
        dmPersonnelById(
          `dmNpc${campaign}Relationship`
        ),

        dmPersonnelById(
          `dmNpc${campaign}RelationshipNumber`
        )
      ]
      .forEach(
        control => {

          if(control){

            control.disabled =
              !enabled;

          }

        }
      );


      const details =
        dmPersonnelById(
          `dmNpc${campaign}Details`
        );


      if(details){

        details.contentEditable =
          enabled
            ? 'true'
            : 'false';


        details.style.opacity =
          enabled
            ? '1'
            : '.4';

      }

    }
  );

}


/* =====================================================
   COLLECT SKILLS
   ===================================================== */

function collectDmPersonnelSkills(){

  return [
    ...document.querySelectorAll(
      'input[name="dmPersonnelSkill"]:checked'
    )
  ]
  .map(
    input =>
      input.value
  );

}


/* =====================================================
   SAVE CAMPAIGN STATE
   ===================================================== */

async function saveDmPersonnelCampaignState(
  npcId,
  campaign,
  known,
  relationshipScore,
  details
){

  const client =
    dmPersonnelClient();


  const existing =
    dmPersonnelCampaignState(
      npcId,
      campaign
    );


  const score =
    dmPersonnelClampRelationship(
      relationshipScore
    );


  const body = {

    is_visible:
      known,

    relationship_score:
      score,

    relationship_tag:
      dmPersonnelRelationshipLabel(
        score
      ),

    details:
      dmPersonnelCleanHtml(
        details
      )

  };


  if(existing){

    const {
      error
    } =
      await client
        .from('npc_campaign_state')
        .update(body)
        .eq(
          'id',
          existing.id
        );


    if(error){
      throw error;
    }


    return;

  }


  const {
    error
  } =
    await client
      .from('npc_campaign_state')
      .insert({

        npc_id:
          npcId,

        campaign,

        ...body

      });


  if(error){
    throw error;
  }

}


/* =====================================================
   SAVE PERSONNEL
   ===================================================== */

async function saveDmPersonnel(){

  const client =
    dmPersonnelClient();


  if(!client){

    alert(
      'Supabase is unavailable.'
    );

    return;

  }


  const castName =
    dmPersonnelById(
      'dmNpcNameCast'
    )?.value.trim() ||
    '';


  if(!castName){

    alert(
      'Cast Name is required.'
    );

    return;

  }


  const npcBody = {

    name_cast:
      castName,

    name_unbound:
      dmPersonnelById(
        'dmNpcNameUnbound'
      )?.value.trim() ||
      null,

    cast_image_url:
      dmPersonnelById(
        'dmNpcCastImage'
      )?.value.trim() ||
      null,

    unbound_image_url:
      dmPersonnelById(
        'dmNpcUnboundImage'
      )?.value.trim() ||
      null,

    company_association:
      dmPersonnelById(
        'dmNpcCompany'
      )?.value ||
      null,

    title:
      dmPersonnelById(
        'dmNpcTitle'
      )?.value.trim() ||
      null,

    magic_domain:
      dmPersonnelById(
        'dmNpcMagicDomain'
      )?.value ||
      null,

    neighborhood:
      dmPersonnelById(
        'dmNpcNeighborhood'
      )?.value ||
      null,

skill_training:
  collectDmPersonnelSkills(),

is_reassigned:
  Boolean(
    dmPersonnelById(
      'dmNpcReassigned'
    )?.checked
  )

};


  try{

    let npcId =
      dmPersonnelEditingId;


    if(npcId){

      const {
        error
      } =
        await client
          .from('npcs')
          .update(
            npcBody
          )
          .eq(
            'id',
            npcId
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
          .from('npcs')
          .insert(
            npcBody
          )
          .select('id')
          .single();


      if(error){
        throw error;
      }


      npcId =
        data?.id;


      if(!npcId){

        throw new Error(
          'Supabase did not return the new Personnel ID.'
        );

      }

    }


    await saveDmPersonnelCampaignState(

      npcId,

      'hero',

      Boolean(
        dmPersonnelById(
          'dmNpcHeroKnown'
        )?.checked
      ),

      dmPersonnelById(
        'dmNpcHeroRelationship'
      )?.value,

      dmPersonnelById(
        'dmNpcHeroDetails'
      )?.innerHTML ||
      ''

    );


    await saveDmPersonnelCampaignState(

      npcId,

      'villain',

      Boolean(
        dmPersonnelById(
          'dmNpcVillainKnown'
        )?.checked
      ),

      dmPersonnelById(
        'dmNpcVillainRelationship'
      )?.value,

      dmPersonnelById(
        'dmNpcVillainDetails'
      )?.innerHTML ||
      ''

    );


    closeDmPersonnelModal();


    await loadDmPersonnel();

  }
  catch(error){

    console.error(
      'DM Personnel save failed:',
      error
    );


    alert(
      `Personnel could not be saved.\n\n${
        error?.message ||
        String(error)
      }`
    );

  }

}


/* =====================================================
   DELETE PERSONNEL
   ===================================================== */

async function deleteDmPersonnel(){

  const npc =
    dmPersonnelNpcs.find(
      row =>
        row.id ===
        dmPersonnelEditingId
    );


  if(!npc){
    return;
  }


  const confirmed =
    confirm(
      `Delete "${npc.name_cast}" permanently?\n\n` +
      `This removes the Personnel record from both campaigns.`
    );


  if(!confirmed){
    return;
  }


  const client =
    dmPersonnelClient();


  try{

    const {
      error:
        stateError
    } =
      await client
        .from('npc_campaign_state')
        .delete()
        .eq(
          'npc_id',
          npc.id
        );


    if(stateError){
      throw stateError;
    }


    const {
      error:
        npcError
    } =
      await client
        .from('npcs')
        .delete()
        .eq(
          'id',
          npc.id
        );


    if(npcError){
      throw npcError;
    }


    closeDmPersonnelModal();


    await loadDmPersonnel();

  }
  catch(error){

    console.error(
      'DM Personnel deletion failed:',
      error
    );


    alert(
      `Personnel could not be deleted.\n\n${
        error?.message ||
        String(error)
      }`
    );

  }

}


/* =====================================================
   EVENTS
   ===================================================== */

function handleDmPersonnelClick(event){

  const button =
    event.target.closest(
      '[data-dm-personnel-action]'
    );


  if(!button){
    return;
  }


  const action =
    button.dataset
      .dmPersonnelAction;


  if(action === 'add'){

    openDmPersonnelModal();

    return;

  }


  if(action === 'edit'){

    openDmPersonnelModal(
      button.dataset.npcId
    );

    return;

  }


  if(action === 'close'){

    closeDmPersonnelModal();

    return;

  }


  if(action === 'save'){

    saveDmPersonnel();

    return;

  }


  if(action === 'delete'){

    deleteDmPersonnel();

  }

}


function handleDmPersonnelChange(event){

  if(
    event.target.matches(
      '#dmNpcHeroKnown, #dmNpcVillainKnown'
    )
  ){

    updateDmPersonnelCampaignEditors();

  }

}


function handleDmPersonnelInput(event){

  const target =
    event.target;


  if(
    target.id ===
    'dmNpcHeroRelationship'
  ){

    updateDmRelationshipPreview(
      'Hero'
    );

    return;

  }


  if(
    target.id ===
    'dmNpcVillainRelationship'
  ){

    updateDmRelationshipPreview(
      'Villain'
    );

    return;

  }


  if(
    target.id ===
    'dmNpcHeroRelationshipNumber'
  ){

    const slider =
      dmPersonnelById(
        'dmNpcHeroRelationship'
      );


    if(slider){

      slider.value =
        dmPersonnelClampRelationship(
          target.value
        );

    }


    updateDmRelationshipPreview(
      'Hero'
    );

    return;

  }


  if(
    target.id ===
    'dmNpcVillainRelationshipNumber'
  ){

    const slider =
      dmPersonnelById(
        'dmNpcVillainRelationship'
      );


    if(slider){

      slider.value =
        dmPersonnelClampRelationship(
          target.value
        );

    }


    updateDmRelationshipPreview(
      'Villain'
    );

  }

}


/* =====================================================
   LOAD
   ===================================================== */

async function loadDmPersonnel(){

  const mount =
    dmPersonnelById(
      'dmPersonnelMount'
    );


  if(!mount){
    return;
  }


  mount.innerHTML = `

    <div class="dm-module-loading">
      Accessing Personnel Archive...
    </div>

  `;


  try{

    await Promise.all([
      loadDmPersonnelNpcs(),
      loadDmPersonnelCampaignStates()
    ]);


    renderDmPersonnel();

  }
  catch(error){

    console.error(
      'DM Personnel failed to load:',
      error
    );


    mount.innerHTML = `

      <div
        class="dm-console-panel"
        style="padding:20px;"
      >

        <strong>
          Personnel Archive Unavailable
        </strong>

        <p>
          ${dmPersonnelEscape(
            error?.message ||
            'Unknown Supabase error.'
          )}
        </p>

      </div>

    `;

  }

}


/* =====================================================
   INITIALIZE
   ===================================================== */

document.addEventListener(
  'DOMContentLoaded',
  () => {

    installDmPersonnelStyles();


    document.addEventListener(
      'click',
      handleDmPersonnelClick
    );


    document.addEventListener(
      'change',
      handleDmPersonnelChange
    );


    document.addEventListener(
      'input',
      handleDmPersonnelInput
    );


    loadDmPersonnel();

  }
);


/* =====================================================
   EPCOT DND
   RESERVE PERSONNEL EXTENSION

   Uses the EXISTING Personnel modal.
   Reserve records are stored separately until promoted.

   This deliberately does not duplicate the Personnel
   Add/Edit form markup.
   ===================================================== */

(function(){

  /* =====================================================
     ORIGINAL PERSONNEL FUNCTIONS
     ===================================================== */

  const originalOpenDmPersonnelModal =
    openDmPersonnelModal;


  const originalSaveDmPersonnel =
    saveDmPersonnel;


  const originalDeleteDmPersonnel =
    deleteDmPersonnel;


  const originalCloseDmPersonnelModal =
    closeDmPersonnelModal;


  /* =====================================================
     RESERVE STATE
     ===================================================== */

  let dmReserveMode =
    false;


  let dmReserveEditingId =
    null;


  let dmReserveCurrentRecord =
    null;


  /* =====================================================
     HELPERS
     ===================================================== */

  function dmReserveClient(){

    return window.epcotAuth?.client ||
      null;

  }


  function dmReserveEvent(){

    window.dispatchEvent(
      new CustomEvent(
        'epcot:reserve-personnel-changed'
      )
    );

  }


  function dmReserveScore(
    value
  ){

    return dmPersonnelClampRelationship(
      value
    );

  }


  /* =====================================================
     LOAD ONE RESERVE RECORD
     ===================================================== */

  async function dmReserveLoadById(
    reserveId
  ){

    const client =
      dmReserveClient();


    if(!client){

      throw new Error(
        'Supabase is unavailable.'
      );

    }


    const {
      data,
      error
    } =
      await client
        .from(
          'reserve_npcs'
        )
        .select('*')
        .eq(
          'id',
          reserveId
        )
        .single();


    if(error){
      throw error;
    }


    return data;

  }


  /* =====================================================
     TRANSFORM RESERVE INTO PERSONNEL-MODAL SHAPE
     ===================================================== */

  function dmReserveAsNpc(
    reserve
  ){

    return {

      id:
        reserve.id,

      name_cast:
        reserve.name_cast,

      name_unbound:
        reserve.name_unbound,

      cast_image_url:
        reserve.cast_image_url,

      unbound_image_url:
        reserve.unbound_image_url,

      company_association:
        reserve.company_association,

      title:
        reserve.title,

      magic_domain:
        reserve.magic_domain,

      neighborhood:
        reserve.neighborhood,

      skill_training:
        Array.isArray(
          reserve.skill_training
        )
          ? reserve.skill_training
          : [],

      is_reassigned:
        Boolean(
          reserve.is_reassigned
        )

    };

  }


  function dmReserveCampaignStates(
    reserve
  ){

    return [

      {

        id:
          `reserve-hero-${reserve.id}`,

        npc_id:
          reserve.id,

        campaign:
          'hero',

        is_visible:
          Boolean(
            reserve.hero_is_visible
          ),

        relationship_score:
          dmReserveScore(
            reserve.hero_relationship_score
          ),

        relationship_tag:
          dmPersonnelRelationshipLabel(
            dmReserveScore(
              reserve.hero_relationship_score
            )
          ),

        details:
          reserve.hero_details ||
          ''

      },


      {

        id:
          `reserve-villain-${reserve.id}`,

        npc_id:
          reserve.id,

        campaign:
          'villain',

        is_visible:
          Boolean(
            reserve.villain_is_visible
          ),

        relationship_score:
          dmReserveScore(
            reserve.villain_relationship_score
          ),

        relationship_tag:
          dmPersonnelRelationshipLabel(
            dmReserveScore(
              reserve.villain_relationship_score
            )
          ),

        details:
          reserve.villain_details ||
          ''

      }

    ];

  }


  /* =====================================================
     OPEN NEW RESERVE PERSONNEL

     Opens the existing Personnel modal unchanged.
     ===================================================== */

  async function openDmReservePersonnelModal(
    reserveId = null
  ){

    try{

      dmReserveEditingId =
        reserveId;


      dmReserveCurrentRecord =
        reserveId
          ? await dmReserveLoadById(
              reserveId
            )
          : null;


      /*
        NEW RESERVE
        Uses the standard Add Personnel modal.
      */

      if(
        !dmReserveCurrentRecord
      ){

        originalOpenDmPersonnelModal(
          null
        );


        dmReserveMode =
          true;


        dmReserveEditingId =
          null;


        return;

      }


      /*
        EDIT RESERVE

        Temporarily expose the reserve NPC to the
        Personnel modal's existing lookup system.
        This lets us reuse the exact same interface.
      */

      const temporaryNpc =
        dmReserveAsNpc(
          dmReserveCurrentRecord
        );


      const temporaryStates =
        dmReserveCampaignStates(
          dmReserveCurrentRecord
        );


      dmPersonnelNpcs.push(
        temporaryNpc
      );


      temporaryStates.forEach(
        state =>
          dmPersonnelCampaignStates.push(
            state
          )
      );


      originalOpenDmPersonnelModal(
        temporaryNpc.id
      );


      /*
        The modal has already copied the values into
        its controls, so remove our temporary rows.
      */

      dmPersonnelNpcs =
        dmPersonnelNpcs.filter(
          npc =>
            npc !== temporaryNpc
        );


      dmPersonnelCampaignStates =
        dmPersonnelCampaignStates.filter(
          state =>
            !temporaryStates.includes(
              state
            )
        );


      dmReserveMode =
        true;


      dmReserveEditingId =
        reserveId;

    }
    catch(error){

      console.error(
        'Reserve Personnel could not open:',
        error
      );


      alert(
        `Reserve Personnel could not be opened.\n\n${
          error?.message ||
          error
        }`
      );

    }

  }


  /* =====================================================
     COLLECT CURRENT PERSONNEL FORM
     ===================================================== */

  function collectDmReserveBody(){

    const castName =
      dmPersonnelById(
        'dmNpcNameCast'
      )?.value.trim() ||
      '';


    if(!castName){

      throw new Error(
        'Cast Name is required.'
      );

    }


    return {

      name_cast:
        castName,

      name_unbound:
        dmPersonnelById(
          'dmNpcNameUnbound'
        )?.value.trim() ||
        null,

      cast_image_url:
        dmPersonnelById(
          'dmNpcCastImage'
        )?.value.trim() ||
        null,

      unbound_image_url:
        dmPersonnelById(
          'dmNpcUnboundImage'
        )?.value.trim() ||
        null,

      company_association:
        dmPersonnelById(
          'dmNpcCompany'
        )?.value ||
        null,

      title:
        dmPersonnelById(
          'dmNpcTitle'
        )?.value.trim() ||
        null,

      magic_domain:
        dmPersonnelById(
          'dmNpcMagicDomain'
        )?.value ||
        null,

      neighborhood:
        dmPersonnelById(
          'dmNpcNeighborhood'
        )?.value ||
        null,

      skill_training:
        collectDmPersonnelSkills(),

      is_reassigned:
        Boolean(
          dmPersonnelById(
            'dmNpcReassigned'
          )?.checked
        ),


      hero_is_visible:
        Boolean(
          dmPersonnelById(
            'dmNpcHeroKnown'
          )?.checked
        ),

      hero_relationship_score:
        dmReserveScore(
          dmPersonnelById(
            'dmNpcHeroRelationship'
          )?.value
        ),

      hero_details:
        dmPersonnelCleanHtml(
          dmPersonnelById(
            'dmNpcHeroDetails'
          )?.innerHTML ||
          ''
        ),


      villain_is_visible:
        Boolean(
          dmPersonnelById(
            'dmNpcVillainKnown'
          )?.checked
        ),

      villain_relationship_score:
        dmReserveScore(
          dmPersonnelById(
            'dmNpcVillainRelationship'
          )?.value
        ),

      villain_details:
        dmPersonnelCleanHtml(
          dmPersonnelById(
            'dmNpcVillainDetails'
          )?.innerHTML ||
          ''
        ),

      updated_at:
        new Date()
          .toISOString()

    };

  }


  /* =====================================================
     SAVE RESERVE
     ===================================================== */

  async function saveDmReservePersonnel(){

    const client =
      dmReserveClient();


    if(!client){

      alert(
        'Supabase is unavailable.'
      );

      return;

    }


    try{

      const body =
        collectDmReserveBody();


      if(
        dmReserveEditingId
      ){

        const {
          error
        } =
          await client
            .from(
              'reserve_npcs'
            )
            .update(
              body
            )
            .eq(
              'id',
              dmReserveEditingId
            );


        if(error){
          throw error;
        }

      }
      else{

        const {
          error
        } =
          await client
            .from(
              'reserve_npcs'
            )
            .insert({

              ...body,

              status:
                'available'

            });


        if(error){
          throw error;
        }

      }


      originalCloseDmPersonnelModal();


      dmReserveMode =
        false;


      dmReserveEditingId =
        null;


      dmReserveCurrentRecord =
        null;


      dmReserveEvent();

    }
    catch(error){

      console.error(
        'Reserve Personnel save failed:',
        error
      );


      alert(
        `Reserve Personnel could not be saved.\n\n${
          error?.message ||
          error
        }`
      );

    }

  }


  /* =====================================================
     DELETE RESERVE
     ===================================================== */

  async function deleteDmReservePersonnel(){

    if(
      !dmReserveEditingId
    ){
      return;
    }


    const name =
      dmPersonnelById(
        'dmNpcNameCast'
      )?.value.trim() ||
      'this Reserve NPC';


    if(
      !confirm(
        `Delete ${name} from Reserve Personnel?\n\nThis does not affect the main Personnel database.`
      )
    ){
      return;
    }


    const client =
      dmReserveClient();


    if(!client){

      alert(
        'Supabase is unavailable.'
      );

      return;

    }


    try{

      const {
        error
      } =
        await client
          .from(
            'reserve_npcs'
          )
          .delete()
          .eq(
            'id',
            dmReserveEditingId
          );


      if(error){
        throw error;
      }


      originalCloseDmPersonnelModal();


      dmReserveMode =
        false;


      dmReserveEditingId =
        null;


      dmReserveCurrentRecord =
        null;


      dmReserveEvent();

    }
    catch(error){

      console.error(
        'Reserve Personnel delete failed:',
        error
      );


      alert(
        `Reserve Personnel could not be deleted.\n\n${
          error?.message ||
          error
        }`
      );

    }

  }


  /* =====================================================
     OVERRIDE PERSONNEL SAVE / DELETE / CLOSE

     Normal Personnel continues using the
     original functions.

     Reserve mode redirects the same buttons
     to the reserve table.
     ===================================================== */

  saveDmPersonnel =
    async function(){

      if(
        dmReserveMode
      ){

        await saveDmReservePersonnel();

        return;

      }


      await originalSaveDmPersonnel();

    };


  deleteDmPersonnel =
    async function(){

      if(
        dmReserveMode
      ){

        await deleteDmReservePersonnel();

        return;

      }


      await originalDeleteDmPersonnel();

    };


  closeDmPersonnelModal =
    function(){

      originalCloseDmPersonnelModal();


      dmReserveMode =
        false;


      dmReserveEditingId =
        null;


      dmReserveCurrentRecord =
        null;

    };


  /* =====================================================
     RESERVE LIST API
     ===================================================== */

  async function listDmReservePersonnel(
    status = 'available'
  ){

    const client =
      dmReserveClient();


    if(!client){

      throw new Error(
        'Supabase is unavailable.'
      );

    }


    let query =
      client
        .from(
          'reserve_npcs'
        )
        .select('*')
        .order(
          'name_cast',
          {
            ascending:true
          }
        );


    if(
      status ===
      'available'
      ||
      status ===
      'promoted'
    ){

      query =
        query.eq(
          'status',
          status
        );

    }


    const {
      data,
      error
    } =
      await query;


    if(error){
      throw error;
    }


    return Array.isArray(
      data
    )
      ? data
      : [];

  }


  /* =====================================================
     PROMOTE TO PERSONNEL
     ===================================================== */

  async function promoteDmReservePersonnel(
    reserveId
  ){

    const client =
      dmReserveClient();


    if(!client){

      throw new Error(
        'Supabase is unavailable.'
      );

    }


    const reserve =
      await dmReserveLoadById(
        reserveId
      );


    if(
      reserve.status ===
      'promoted'
    ){

      throw new Error(
        'This Reserve NPC has already been promoted.'
      );

    }


    const npcBody = {

      name_cast:
        reserve.name_cast,

      name_unbound:
        reserve.name_unbound,

      cast_image_url:
        reserve.cast_image_url,

      unbound_image_url:
        reserve.unbound_image_url,

      company_association:
        reserve.company_association,

      title:
        reserve.title,

      magic_domain:
        reserve.magic_domain,

      neighborhood:
        reserve.neighborhood,

      skill_training:
        Array.isArray(
          reserve.skill_training
        )
          ? reserve.skill_training
          : [],

      is_reassigned:
        Boolean(
          reserve.is_reassigned
        )

    };


    const {
      data:npc,
      error:npcError
    } =
      await client
        .from(
          'npcs'
        )
        .insert(
          npcBody
        )
        .select(
          'id'
        )
        .single();


    if(npcError){
      throw npcError;
    }


    if(
      !npc?.id
    ){

      throw new Error(
        'The Personnel record was created without an ID.'
      );

    }


    const campaignRows = [

      {

        npc_id:
          npc.id,

        campaign:
          'hero',

        is_visible:
          Boolean(
            reserve.hero_is_visible
          ),

        relationship_score:
          dmReserveScore(
            reserve.hero_relationship_score
          ),

        relationship_tag:
          dmPersonnelRelationshipLabel(
            dmReserveScore(
              reserve.hero_relationship_score
            )
          ),

        details:
          dmPersonnelCleanHtml(
            reserve.hero_details ||
            ''
          )

      },


      {

        npc_id:
          npc.id,

        campaign:
          'villain',

        is_visible:
          Boolean(
            reserve.villain_is_visible
          ),

        relationship_score:
          dmReserveScore(
            reserve.villain_relationship_score
          ),

        relationship_tag:
          dmPersonnelRelationshipLabel(
            dmReserveScore(
              reserve.villain_relationship_score
            )
          ),

        details:
          dmPersonnelCleanHtml(
            reserve.villain_details ||
            ''
          )

      }

    ];


    const {
      error:campaignError
    } =
      await client
        .from(
          'npc_campaign_state'
        )
        .insert(
          campaignRows
        );


    if(campaignError){

      /*
        Avoid leaving a half-promoted NPC behind.
      */

      await client
        .from(
          'npcs'
        )
        .delete()
        .eq(
          'id',
          npc.id
        );


      throw campaignError;

    }


 const {
  error:reserveError
} =
  await client
    .from(
      'reserve_npcs'
    )
    .delete()
    .eq(
      'id',
      reserveId
    );


if(reserveError){
  throw reserveError;
}


    /*
      Refresh the actual Personnel page data.
    */

    if(
      typeof loadDmPersonnel ===
      'function'
    ){

      await loadDmPersonnel();

    }


    dmReserveEvent();


    return npc.id;

  }


  /* =====================================================
     DELETE FROM LIST
     ===================================================== */

  async function removeDmReservePersonnel(
    reserveId
  ){

    const client =
      dmReserveClient();


    if(!client){

      throw new Error(
        'Supabase is unavailable.'
      );

    }


    const {
      error
    } =
      await client
        .from(
          'reserve_npcs'
        )
        .delete()
        .eq(
          'id',
          reserveId
        );


    if(error){
      throw error;
    }


    dmReserveEvent();

  }


  /* =====================================================
     PUBLIC API
     ===================================================== */

  window.epcotReservePersonnel = {

    openCreate(){

      return openDmReservePersonnelModal(
        null
      );

    },


    openEdit(
      reserveId
    ){

      return openDmReservePersonnelModal(
        reserveId
      );

    },


    list(
      status = 'available'
    ){

      return listDmReservePersonnel(
        status
      );

    },


    promote(
      reserveId
    ){

      return promoteDmReservePersonnel(
        reserveId
      );

    },


    remove(
      reserveId
    ){

      return removeDmReservePersonnel(
        reserveId
      );

    }

  };

})();
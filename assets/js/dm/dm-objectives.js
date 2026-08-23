/* =====================================================
   EPCOT DND
   DM OBJECTIVES ADMINISTRATION

   - Hero / Villain campaign separation
   - Create DM Assignments
   - Edit any campaign objective without changing origin
   - Add / edit / remove sub-objectives
   - Complete / reopen objectives and sub-objectives
   - Archive / restore
   - Permanently delete objectives
   - Realtime refresh for objective changes
   ===================================================== */

const DM_OBJECTIVES = {
  campaign: 'hero',
  showArchived: false,
  objectives: [],
  subitems: [],
  editingId: null,
  draftSubitems: [],
  channels: []
};


/* =====================================================
   BASIC HELPERS
   ===================================================== */

function dmObjectivesById(id){

  return document.getElementById(id);

}


function dmObjectivesClient(){

  return window.epcotAuth?.client || null;

}


function dmObjectivesEscape(value){

  return String(value ?? '')
    .replaceAll('&','&amp;')
    .replaceAll('<','&lt;')
    .replaceAll('>','&gt;')
    .replaceAll('"','&quot;')
    .replaceAll("'","&#039;");

}


function dmObjectivesNow(){

  return new Date().toISOString();

}


function dmObjectivesFormatDate(value){

  if(!value){
    return '';
  }


  const date =
    new Date(value);


  if(
    Number.isNaN(
      date.getTime()
    )
  ){
    return '';
  }


  return date.toLocaleDateString(
    undefined,
    {
      month:'short',
      day:'numeric',
      year:'numeric'
    }
  );

}


function dmObjectiveById(id){

  return DM_OBJECTIVES.objectives.find(
    item =>
      item.id === id
  ) || null;

}


function dmSubitemsForObjective(objectiveId){

  return DM_OBJECTIVES.subitems
    .filter(
      item =>
        item.objective_id === objectiveId
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

function installDmObjectivesStyles(){

  if(
    dmObjectivesById(
      'dmObjectivesAdminStyles'
    )
  ){
    return;
  }


  const style =
    document.createElement('style');


  style.id =
    'dmObjectivesAdminStyles';


  style.textContent = `

    .dm-obj-toolbar{
      display:flex;
      justify-content:space-between;
      gap:14px;
      align-items:center;
      flex-wrap:wrap;
      margin-bottom:16px;
    }

    .dm-obj-switches{
      display:flex;
      gap:8px;
      flex-wrap:wrap;
    }

    .dm-obj-btn{
      border-radius:8px;
      padding:9px 14px;
      font:inherit;
      font-weight:750;
      cursor:pointer;
      border:1px solid rgba(255,255,255,.18);
      background:rgba(255,255,255,.07);
      color:inherit;
    }

    .dm-obj-btn.is-active,
    .dm-obj-btn.primary{
      background:#f4c96b;
      color:#142436;
      border-color:transparent;
    }

    .dm-obj-btn.danger{
      background:#7f2d37;
      color:white;
      border-color:transparent;
    }

    .dm-obj-grid{
      display:grid;
      gap:14px;
    }

    .dm-obj-card{
      padding:18px;
    }

    .dm-obj-card.is-complete{
      opacity:.72;
    }

    .dm-obj-card-head{
      display:flex;
      justify-content:space-between;
      gap:16px;
      align-items:flex-start;
    }

    .dm-obj-title{
      margin:3px 0 6px;
      font-size:1.3rem;
    }

    .dm-obj-origin{
      display:inline-flex;
      padding:4px 8px;
      border-radius:999px;
      border:1px solid rgba(255,255,255,.16);
      font-size:.76rem;
      font-weight:800;
      letter-spacing:.04em;
    }

    .dm-obj-origin.dm{
      background:rgba(244,201,107,.12);
      color:#f4c96b;
    }

    .dm-obj-description{
      margin:12px 0;
      opacity:.82;
      white-space:pre-wrap;
    }

    .dm-obj-subitems{
      display:grid;
      gap:7px;
      margin:12px 0;
    }

    .dm-obj-subitem{
      display:flex;
      align-items:center;
      gap:9px;
      padding:9px 10px;
      border-radius:7px;
      background:rgba(255,255,255,.035);
      border:1px solid rgba(255,255,255,.09);
    }

    .dm-obj-subitem.is-complete span{
      text-decoration:line-through;
      opacity:.6;
    }

    .dm-obj-card-actions{
      display:flex;
      gap:8px;
      flex-wrap:wrap;
      margin-top:14px;
    }

    .dm-obj-empty{
      padding:22px;
    }

    .dm-obj-modal-backdrop{
      position:fixed;
      inset:0;
      z-index:10000;
      background:rgba(2,8,14,.82);
      backdrop-filter:blur(5px);
      display:grid;
      place-items:center;
      padding:24px;
    }

    .dm-obj-modal{
      width:min(760px,100%);
      max-height:calc(100vh - 48px);
      overflow:auto;
      border-radius:14px;
      border:1px solid rgba(255,255,255,.2);
      padding:24px;
      background:#102433;
      box-shadow:
        0 24px 80px rgba(0,0,0,.45);
    }

    .dm-obj-modal-head{
      display:flex;
      justify-content:space-between;
      gap:14px;
      align-items:flex-start;
      margin-bottom:18px;
    }

    .dm-obj-close{
      border:0;
      background:transparent;
      color:inherit;
      font-size:1.7rem;
      cursor:pointer;
    }

    .dm-obj-field{
      display:flex;
      flex-direction:column;
      gap:6px;
      margin-bottom:14px;
    }

    .dm-obj-field label{
      font-weight:750;
    }

    .dm-obj-field input,
    .dm-obj-field textarea{
      box-sizing:border-box;
      width:100%;
      border-radius:7px;
      border:1px solid rgba(255,255,255,.18);
      background:rgba(0,0,0,.18);
      color:inherit;
      padding:10px 11px;
      font:inherit;
    }

    .dm-obj-field textarea{
      min-height:110px;
      resize:vertical;
    }

    .dm-obj-draft-list{
      display:grid;
      gap:8px;
      margin-top:8px;
    }

    .dm-obj-draft{
      display:grid;
      grid-template-columns:1fr auto;
      gap:8px;
      align-items:center;
    }

    .dm-obj-draft input{
      box-sizing:border-box;
      width:100%;
      border-radius:7px;
      border:1px solid rgba(255,255,255,.18);
      background:rgba(0,0,0,.18);
      color:inherit;
      padding:9px 10px;
      font:inherit;
    }

    .dm-obj-modal-actions{
      display:flex;
      justify-content:flex-end;
      gap:9px;
      flex-wrap:wrap;
      margin-top:20px;
    }

    .dm-obj-count{
      opacity:.65;
      font-size:.9rem;
    }

  `;


  document.head.appendChild(style);

}


/* =====================================================
   LOAD DATA
   ===================================================== */

async function loadDmObjectivesData(){

  const client =
    dmObjectivesClient();


  const mount =
    dmObjectivesById(
      'dmObjectivesMount'
    );


  if(
    !client ||
    !mount
  ){
    return;
  }


  mount.innerHTML = `
    <div class="dm-module-loading">
      Accessing Directive Archive...
    </div>
  `;


  try{

    const {
      data: objectives,
      error: objectiveError
    } =
      await client
        .from('objectives')
        .select('*')
        .eq(
          'campaign',
          DM_OBJECTIVES.campaign
        )
        .order(
          'created_at',
          {
            ascending:false
          }
        );


    if(objectiveError){
      throw objectiveError;
    }


    DM_OBJECTIVES.objectives =
      objectives || [];


    const ids =
      DM_OBJECTIVES.objectives.map(
        item =>
          item.id
      );


    if(ids.length){

      const {
        data: subitems,
        error: subitemError
      } =
        await client
          .from('objective_subitems')
          .select('*')
          .in(
            'objective_id',
            ids
          )
          .order(
            'sort_order',
            {
              ascending:true
            }
          );


      if(subitemError){
        throw subitemError;
      }


      DM_OBJECTIVES.subitems =
        subitems || [];

    }
    else{

      DM_OBJECTIVES.subitems = [];

    }


    renderDmObjectives();

  }
  catch(error){

    console.error(
      'DM Objectives failed to load:',
      error
    );


    mount.innerHTML = `

      <div
        class="
          dm-console-panel
          dm-obj-empty
        "
      >

        <strong>
          Directive Archive Unavailable
        </strong>

        <p>
          ${dmObjectivesEscape(
            error?.message ||
            String(error)
          )}
        </p>

      </div>

    `;

  }

}


/* =====================================================
   MAIN RENDER
   ===================================================== */

function renderDmObjectives(){

  const mount =
    dmObjectivesById(
      'dmObjectivesMount'
    );


  if(!mount){
    return;
  }


  const visible =
    DM_OBJECTIVES.objectives.filter(
      item =>
        Boolean(
          item.archived
        ) ===
        DM_OBJECTIVES.showArchived
    );


  mount.innerHTML = `

    <div class="dm-obj-toolbar">

      <div class="dm-obj-switches">

        <button
          class="
            dm-obj-btn
            ${
              DM_OBJECTIVES.campaign === 'hero'
                ? 'is-active'
                : ''
            }
          "
          data-dm-obj-action="campaign"
          data-campaign="hero"
          type="button"
        >
          Hero
        </button>


        <button
          class="
            dm-obj-btn
            ${
              DM_OBJECTIVES.campaign === 'villain'
                ? 'is-active'
                : ''
            }
          "
          data-dm-obj-action="campaign"
          data-campaign="villain"
          type="button"
        >
          Villain
        </button>

      </div>


      <div class="dm-obj-switches">

        <button
          class="
            dm-obj-btn
            ${
              !DM_OBJECTIVES.showArchived
                ? 'is-active'
                : ''
            }
          "
          data-dm-obj-action="view-active"
          type="button"
        >
          Active
        </button>


        <button
          class="
            dm-obj-btn
            ${
              DM_OBJECTIVES.showArchived
                ? 'is-active'
                : ''
            }
          "
          data-dm-obj-action="view-archived"
          type="button"
        >
          Archived
        </button>


        <button
          class="
            dm-obj-btn
            primary
          "
          data-dm-obj-action="add"
          type="button"
        >
          + Add DM Assignment
        </button>

      </div>

    </div>


    <div class="dm-obj-count">

      ${visible.length}

      ${
        DM_OBJECTIVES.showArchived
          ? 'archived'
          : 'active'
      }

      ${
        visible.length === 1
          ? 'objective'
          : 'objectives'
      }

      in the

      ${
        DM_OBJECTIVES.campaign === 'hero'
          ? 'Hero'
          : 'Villain'
      }

      campaign

    </div>


    <div
      class="dm-obj-grid"
      style="margin-top:14px;"
    >

      ${
        visible.length

          ? visible
              .map(
                renderDmObjectiveCard
              )
              .join('')

          : `
              <div
                class="
                  dm-console-panel
                  dm-obj-empty
                "
              >

                <strong>
                  No ${
                    DM_OBJECTIVES.showArchived
                      ? 'Archived'
                      : 'Active'
                  } Objectives
                </strong>

                <p>
                  This campaign has no objectives
                  in this view.
                </p>

              </div>
            `
      }

    </div>

  `;

}


/* =====================================================
   OBJECTIVE CARD
   ===================================================== */

function renderDmObjectiveCard(
  objective
){

  const subitems =
    dmSubitemsForObjective(
      objective.id
    );


  const originIsDm =
    objective.created_by_role ===
    'dm';


  return `

    <article
      class="
        dm-console-panel
        dm-obj-card
        ${
          objective.completed
            ? 'is-complete'
            : ''
        }
      "
    >

      <div class="dm-obj-card-head">

        <div>

          <div class="dm-page-kicker">

            ${
              objective.archived
                ? 'ARCHIVED DIRECTIVE'
                : 'ACTIVE DIRECTIVE'
            }

          </div>


          <h2 class="dm-obj-title">

            ${dmObjectivesEscape(
              objective.name
            )}

          </h2>


          <span
            class="
              dm-obj-origin
              ${originIsDm ? 'dm' : ''}
            "
          >

            ${
              originIsDm
                ? 'DM ASSIGNMENT'
                : 'PERSONAL OBJECTIVE'
            }

          </span>

        </div>


        <button
          class="dm-obj-btn"
          data-dm-obj-action="toggle-objective"
          data-objective-id="${objective.id}"
          type="button"
        >

          ${
            objective.completed
              ? 'Reopen'
              : 'Complete'
          }

        </button>

      </div>


      ${
        objective.description
          ? `
              <div class="dm-obj-description">
                ${dmObjectivesEscape(
                  objective.description
                )}
              </div>
            `
          : ''
      }


      ${
        subitems.length
          ? `
              <div class="dm-obj-subitems">

                ${subitems
                  .map(
                    item => `

                      <div
                        class="
                          dm-obj-subitem
                          ${
                            item.completed
                              ? 'is-complete'
                              : ''
                          }
                        "
                      >

                        <button
                          class="dm-obj-btn"
                          style="padding:4px 8px;"
                          data-dm-obj-action="toggle-subitem"
                          data-subitem-id="${item.id}"
                          type="button"
                        >

                          ${
                            item.completed
                              ? '✓'
                              : '□'
                          }

                        </button>

                        <span>
                          ${dmObjectivesEscape(
                            item.name
                          )}
                        </span>

                      </div>

                    `
                  )
                  .join('')
                }

              </div>
            `
          : ''
      }


      <div class="dm-obj-card-actions">

        <button
          class="dm-obj-btn"
          data-dm-obj-action="edit"
          data-objective-id="${objective.id}"
          type="button"
        >
          Edit
        </button>


        <button
          class="dm-obj-btn"
          data-dm-obj-action="archive"
          data-objective-id="${objective.id}"
          type="button"
        >

          ${
            objective.archived
              ? 'Restore'
              : 'Archive'
          }

        </button>


        <button
          class="
            dm-obj-btn
            danger
          "
          data-dm-obj-action="delete"
          data-objective-id="${objective.id}"
          type="button"
        >
          Permanently Delete
        </button>

      </div>


      ${
        objective.archived_at
          ? `
              <div
                class="dm-obj-count"
                style="margin-top:10px;"
              >
                Archived
                ${dmObjectivesFormatDate(
                  objective.archived_at
                )}
              </div>
            `
          : ''
      }

    </article>

  `;

}


/* =====================================================
   MODAL
   ===================================================== */

function closeDmObjectiveModal(){

  dmObjectivesById(
    'dmObjectiveModalBackdrop'
  )?.remove();


  DM_OBJECTIVES.editingId =
    null;


  DM_OBJECTIVES.draftSubitems =
    [];

}


function openDmObjectiveModal(
  objectiveId = null
){

  closeDmObjectiveModal();


  const objective =
    objectiveId
      ? dmObjectiveById(
          objectiveId
        )
      : null;


  if(
    objectiveId &&
    !objective
  ){

    alert(
      'That objective could not be found.'
    );

    return;

  }


  DM_OBJECTIVES.editingId =
    objectiveId;


  DM_OBJECTIVES.draftSubitems =
    objective
      ? dmSubitemsForObjective(
          objective.id
        ).map(
          item => ({
            ...item
          })
        )
      : [];


  const backdrop =
    document.createElement('div');


  backdrop.id =
    'dmObjectiveModalBackdrop';


  backdrop.className =
    'dm-obj-modal-backdrop';


  backdrop.innerHTML = `

    <div
      class="dm-obj-modal"
      role="dialog"
      aria-modal="true"
    >

      <div class="dm-obj-modal-head">

        <div>

          <div class="dm-page-kicker">

            ${DM_OBJECTIVES.campaign.toUpperCase()}
            // DIRECTIVE EDITOR

          </div>


          <h2 style="margin:.25rem 0;">

            ${
              objective
                ? 'Edit Objective'
                : 'New DM Assignment'
            }

          </h2>


          ${
            objective
              ? `
                  <div class="dm-obj-count">

                    Origin remains

                    ${
                      objective.created_by_role === 'dm'
                        ? 'DM Assignment'
                        : 'Personal Objective'
                    }.

                  </div>
                `
              : ''
          }

        </div>


        <button
          class="dm-obj-close"
          data-dm-obj-action="close-modal"
          type="button"
        >
          ×
        </button>

      </div>


      <div class="dm-obj-field">

        <label for="dmObjectiveName">
          Objective Name *
        </label>

        <input
          id="dmObjectiveName"
          type="text"
          value="${dmObjectivesEscape(
            objective?.name || ''
          )}"
        >

      </div>


      <div class="dm-obj-field">

        <label for="dmObjectiveDescription">
          Description
        </label>

        <textarea
          id="dmObjectiveDescription"
        >${dmObjectivesEscape(
          objective?.description || ''
        )}</textarea>

      </div>


      <section
        class="dm-console-panel"
        style="padding:14px;"
      >

        <div
          style="
            display:flex;
            justify-content:space-between;
            gap:12px;
            align-items:center;
          "
        >

          <strong>
            Sub-Objectives
          </strong>


          <button
            class="dm-obj-btn"
            data-dm-obj-action="add-draft-subitem"
            type="button"
          >
            + Add Sub-Objective
          </button>

        </div>


        <div
          id="dmObjectiveDraftList"
          class="dm-obj-draft-list"
        ></div>

      </section>


      <div class="dm-obj-modal-actions">

        <button
          class="dm-obj-btn"
          data-dm-obj-action="close-modal"
          type="button"
        >
          Cancel
        </button>


        <button
          class="
            dm-obj-btn
            primary
          "
          data-dm-obj-action="save"
          type="button"
        >
          Save Objective
        </button>

      </div>

    </div>

  `;


  document.body.appendChild(
    backdrop
  );


  renderDmObjectiveDraftSubitems();

}


/* =====================================================
   DRAFT SUB-OBJECTIVES
   ===================================================== */

function renderDmObjectiveDraftSubitems(){

  const mount =
    dmObjectivesById(
      'dmObjectiveDraftList'
    );


  if(!mount){
    return;
  }


  mount.innerHTML =
    DM_OBJECTIVES.draftSubitems.length

      ? DM_OBJECTIVES.draftSubitems
          .map(
            (item,index) => `

              <div class="dm-obj-draft">

                <input
                  type="text"
                  value="${dmObjectivesEscape(
                    item.name || ''
                  )}"
                  data-dm-obj-draft-index="${index}"
                  aria-label="Sub-objective ${index + 1}"
                >


                <button
                  class="
                    dm-obj-btn
                    danger
                  "
                  data-dm-obj-action="remove-draft-subitem"
                  data-draft-index="${index}"
                  type="button"
                >
                  Remove
                </button>

              </div>

            `
          )
          .join('')

      : `
          <div class="dm-obj-count">
            No sub-objectives yet.
          </div>
        `;

}


function syncDmObjectiveDraftNames(){

  document
    .querySelectorAll(
      '[data-dm-obj-draft-index]'
    )
    .forEach(
      input => {

        const index =
          Number(
            input.dataset
              .dmObjDraftIndex
          );


        if(
          Number.isInteger(index) &&
          DM_OBJECTIVES
            .draftSubitems[index]
        ){

          DM_OBJECTIVES
            .draftSubitems[index]
            .name =
              input.value;

        }

      }
    );

}


/* =====================================================
   SAVE OBJECTIVE
   ===================================================== */

async function saveDmObjective(){

  const client =
    dmObjectivesClient();


  const name =
    dmObjectivesById(
      'dmObjectiveName'
    )?.value.trim() ||
    '';


  const description =
    dmObjectivesById(
      'dmObjectiveDescription'
    )?.value.trim() ||
    '';


  if(!client){
    return;
  }


  if(!name){

    alert(
      'Give the objective a name before saving.'
    );

    return;

  }


  syncDmObjectiveDraftNames();


  try{

    let objectiveId =
      DM_OBJECTIVES.editingId;


    /*
      EDIT EXISTING

      Important:
      We do NOT change created_by_role.
      A Personal Objective stays Personal.
      A DM Assignment stays DM.
    */

    if(objectiveId){

      const {
        error
      } =
        await client
          .from('objectives')
          .update({

            name,

            description:
              description ||
              null,

            updated_at:
              dmObjectivesNow()

          })
          .eq(
            'id',
            objectiveId
          );


      if(error){
        throw error;
      }

    }


    /*
      CREATE NEW

      Anything created here is explicitly
      a DM Assignment.
    */

    else{

      const {
        data,
        error
      } =
        await client
          .from('objectives')
          .insert({

            campaign:
              DM_OBJECTIVES.campaign,

            name,

            description:
              description ||
              null,

            created_by_character_id:
              null,

            created_by_role:
              'dm',

            completed:
              false,

            archived:
              false

          })
          .select('id')
          .single();


      if(error){
        throw error;
      }


      objectiveId =
        data?.id;


      if(!objectiveId){

        throw new Error(
          'Supabase did not return the new objective ID.'
        );

      }

    }


    await saveDmObjectiveSubitems(
      objectiveId
    );


    closeDmObjectiveModal();


    await loadDmObjectivesData();

  }
  catch(error){

    console.error(
      'DM Objective save failed:',
      error
    );


    alert(
      `Objective could not be saved.\n\n${
        error?.message ||
        String(error)
      }`
    );

  }

}


/* =====================================================
   SAVE SUB-OBJECTIVES
   ===================================================== */

async function saveDmObjectiveSubitems(
  objectiveId
){

  const client =
    dmObjectivesClient();


  const existing =
    dmSubitemsForObjective(
      objectiveId
    );


  const existingIds =
    new Set(
      existing.map(
        item =>
          item.id
      )
    );


  const keptIds =
    new Set();


  const drafts =
    DM_OBJECTIVES.draftSubitems
      .map(
        (item,index) => ({

          ...item,

          name:
            String(
              item.name || ''
            ).trim(),

          sort_order:
            index

        })
      )
      .filter(
        item =>
          item.name
      );


  for(
    const draft of
    drafts
  ){

    if(
      draft.id &&
      existingIds.has(
        draft.id
      )
    ){

      keptIds.add(
        draft.id
      );


      const {
        error
      } =
        await client
          .from('objective_subitems')
          .update({

            name:
              draft.name,

            sort_order:
              draft.sort_order

          })
          .eq(
            'id',
            draft.id
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
          .from('objective_subitems')
          .insert({

            objective_id:
              objectiveId,

            name:
              draft.name,

            completed:
              false,

            sort_order:
              draft.sort_order

          });


      if(error){
        throw error;
      }

    }

  }


  for(
    const item of
    existing
  ){

    if(
      keptIds.has(
        item.id
      )
    ){
      continue;
    }


    /*
      If a player had this sub-objective
      starred, remove that favorite first.
    */

    const {
      error:
        favoriteError
    } =
      await client
        .from('objective_favorites')
        .delete()
        .eq(
          'subobjective_id',
          item.id
        );


    if(favoriteError){
      throw favoriteError;
    }


    const {
      error:
        subitemError
    } =
      await client
        .from('objective_subitems')
        .delete()
        .eq(
          'id',
          item.id
        );


    if(subitemError){
      throw subitemError;
    }

  }

}


/* =====================================================
   COMPLETE / REOPEN OBJECTIVE
   ===================================================== */

async function toggleDmObjective(
  objectiveId
){

  const client =
    dmObjectivesClient();


  const objective =
    dmObjectiveById(
      objectiveId
    );


  if(
    !client ||
    !objective
  ){
    return;
  }


  const {
    error
  } =
    await client
      .from('objectives')
      .update({

        completed:
          !objective.completed,

        updated_at:
          dmObjectivesNow()

      })
      .eq(
        'id',
        objectiveId
      );


  if(error){

    alert(
      `Objective could not be updated.\n\n${error.message}`
    );

    return;

  }


  await loadDmObjectivesData();

}


/* =====================================================
   COMPLETE / REOPEN SUB-OBJECTIVE
   ===================================================== */

async function toggleDmSubitem(
  subitemId
){

  const client =
    dmObjectivesClient();


  const item =
    DM_OBJECTIVES.subitems.find(
      row =>
        row.id === subitemId
    );


  if(
    !client ||
    !item
  ){
    return;
  }


  const {
    error
  } =
    await client
      .from('objective_subitems')
      .update({

        completed:
          !item.completed

      })
      .eq(
        'id',
        subitemId
      );


  if(error){

    alert(
      `Sub-objective could not be updated.\n\n${error.message}`
    );

    return;

  }


  await loadDmObjectivesData();

}


/* =====================================================
   ARCHIVE / RESTORE
   ===================================================== */

async function archiveDmObjective(
  objectiveId
){

  const client =
    dmObjectivesClient();


  const objective =
    dmObjectiveById(
      objectiveId
    );


  if(
    !client ||
    !objective
  ){
    return;
  }


  const becomingArchived =
    !objective.archived;


  const {
    error
  } =
    await client
      .from('objectives')
      .update({

        archived:
          becomingArchived,

        archived_at:
          becomingArchived
            ? dmObjectivesNow()
            : null,

        updated_at:
          dmObjectivesNow()

      })
      .eq(
        'id',
        objectiveId
      );


  if(error){

    alert(
      `Objective could not be ${
        becomingArchived
          ? 'archived'
          : 'restored'
      }.\n\n${error.message}`
    );

    return;

  }


  await loadDmObjectivesData();

}


/* =====================================================
   PERMANENT DELETE

   DM ONLY UI.

   Deletes in this order:
   1. Objective favorites
   2. Sub-objective favorites
   3. Sub-objectives
   4. Objective

   This avoids relying on FK cascade behavior.
   ===================================================== */

async function permanentlyDeleteDmObjective(
  objectiveId
){

  const client =
    dmObjectivesClient();


  const objective =
    dmObjectiveById(
      objectiveId
    );


  if(
    !client ||
    !objective
  ){
    return;
  }


  const confirmed =
    confirm(

      `Permanently delete "${objective.name}"?\n\n` +

      `This deletes the objective, all of its ` +
      `sub-objectives, and every player's favorites ` +
      `tied to it. This cannot be undone.`

    );


  if(!confirmed){
    return;
  }


  try{

    const subitemIds =
      dmSubitemsForObjective(
        objectiveId
      )
      .map(
        item =>
          item.id
      );


    /*
      Remove favorites attached directly
      to the objective.
    */

    const {
      error:
        objectiveFavoriteError
    } =
      await client
        .from('objective_favorites')
        .delete()
        .eq(
          'objective_id',
          objectiveId
        );


    if(objectiveFavoriteError){
      throw objectiveFavoriteError;
    }


    /*
      Remove favorites attached to
      sub-objectives.
    */

    if(subitemIds.length){

      const {
        error:
          subFavoriteError
      } =
        await client
          .from('objective_favorites')
          .delete()
          .in(
            'subobjective_id',
            subitemIds
          );


      if(subFavoriteError){
        throw subFavoriteError;
      }


      /*
        Remove all sub-objectives.
      */

      const {
        error:
          subitemError
      } =
        await client
          .from('objective_subitems')
          .delete()
          .eq(
            'objective_id',
            objectiveId
          );


      if(subitemError){
        throw subitemError;
      }

    }


    /*
      Finally remove the objective itself.
    */

    const {
      error:
        objectiveError
    } =
      await client
        .from('objectives')
        .delete()
        .eq(
          'id',
          objectiveId
        );


    if(objectiveError){
      throw objectiveError;
    }


    await loadDmObjectivesData();

  }
  catch(error){

    console.error(
      'Permanent Objective deletion failed:',
      error
    );


    alert(
      `Objective could not be permanently deleted.\n\n${
        error?.message ||
        String(error)
      }`
    );

  }

}


/* =====================================================
   EVENTS
   ===================================================== */

function handleDmObjectivesClick(
  event
){

  const button =
    event.target.closest(
      '[data-dm-obj-action]'
    );


  if(!button){
    return;
  }


  const action =
    button.dataset
      .dmObjAction;


  if(action === 'campaign'){

    DM_OBJECTIVES.campaign =
      button.dataset.campaign ===
      'villain'
        ? 'villain'
        : 'hero';


    DM_OBJECTIVES.showArchived =
      false;


    loadDmObjectivesData();

    return;

  }


  if(action === 'view-active'){

    DM_OBJECTIVES.showArchived =
      false;


    renderDmObjectives();

    return;

  }


  if(action === 'view-archived'){

    DM_OBJECTIVES.showArchived =
      true;


    renderDmObjectives();

    return;

  }


  if(action === 'add'){

    openDmObjectiveModal();

    return;

  }


  if(action === 'edit'){

    openDmObjectiveModal(
      button.dataset.objectiveId
    );

    return;

  }


  if(action === 'close-modal'){

    closeDmObjectiveModal();

    return;

  }


  if(action === 'add-draft-subitem'){

    syncDmObjectiveDraftNames();


    DM_OBJECTIVES
      .draftSubitems
      .push({

        id:
          null,

        name:
          '',

        completed:
          false

      });


    renderDmObjectiveDraftSubitems();

    return;

  }


  if(action === 'remove-draft-subitem'){

    syncDmObjectiveDraftNames();


    const index =
      Number(
        button.dataset
          .draftIndex
      );


    if(
      Number.isInteger(index)
    ){

      DM_OBJECTIVES
        .draftSubitems
        .splice(
          index,
          1
        );


      renderDmObjectiveDraftSubitems();

    }


    return;

  }


  if(action === 'save'){

    saveDmObjective();

    return;

  }


  if(action === 'toggle-objective'){

    toggleDmObjective(
      button.dataset.objectiveId
    );

    return;

  }


  if(action === 'toggle-subitem'){

    toggleDmSubitem(
      button.dataset.subitemId
    );

    return;

  }


  if(action === 'archive'){

    archiveDmObjective(
      button.dataset.objectiveId
    );

    return;

  }


  if(action === 'delete'){

    permanentlyDeleteDmObjective(
      button.dataset.objectiveId
    );

  }

}


/* =====================================================
   REALTIME
   ===================================================== */

function connectDmObjectivesRealtime(){

  const client =
    dmObjectivesClient();


  if(
    !client ||
    !client.channel
  ){
    return;
  }


  DM_OBJECTIVES.channels.forEach(
    channel => {

      client.removeChannel?.(
        channel
      );

    }
  );


  DM_OBJECTIVES.channels =
    [];


  const objectiveChannel =
    client
      .channel(
        'dm-objectives-live'
      )
      .on(
        'postgres_changes',
        {
          event:'*',
          schema:'public',
          table:'objectives'
        },
        () =>
          loadDmObjectivesData()
      )
      .on(
        'postgres_changes',
        {
          event:'*',
          schema:'public',
          table:'objective_subitems'
        },
        () =>
          loadDmObjectivesData()
      )
      .subscribe();


  DM_OBJECTIVES.channels.push(
    objectiveChannel
  );

}


/* =====================================================
   INITIALIZE
   ===================================================== */

async function initializeDmObjectives(){

  if(
    !dmObjectivesById(
      'dmObjectivesMount'
    )
  ){
    return;
  }


  installDmObjectivesStyles();


  document.addEventListener(
    'click',
    handleDmObjectivesClick
  );


  await loadDmObjectivesData();


  connectDmObjectivesRealtime();

}


document.addEventListener(
  'DOMContentLoaded',
  initializeDmObjectives
);
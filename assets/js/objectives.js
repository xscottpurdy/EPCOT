/* =====================================================
   EPCOT DND
   SHARED OBJECTIVES ENGINE

   Shared by:
   - Hero Cast
   - Hero Unbound
   - Villain Cast
   - Villain Unbound

   CORE RULE:
   Campaign controls objective visibility.
   Reality changes presentation only.

   FEATURES:
   - Campaign-shared objectives
   - Character-specific favorites
   - Add / edit objectives
   - Add / edit / remove sub-objectives
   - Complete objectives and sub-objectives
   - Star up to 3 objective/sub-objective favorites
   - Archive / restore objectives
   - Archived objective review
   ===================================================== */


/* =====================================================
   RULES
   ===================================================== */

const OBJECTIVE_FAVORITE_LIMIT = 3;


/* =====================================================
   STATE
   ===================================================== */

let objectivesCharacter = null;

let objectivesList = [];

let objectiveSubitems = [];

let objectiveFavorites = [];

let objectiveEditingId = null;

let objectiveDraftSubitems = [];

let objectivesShowingArchived = false;

let objectivesInitialized = false;

let objectivesRealtimeChannel = null;


/* =====================================================
   BASIC HELPERS
   ===================================================== */

function objectiveById(id){

  return document.getElementById(id);

}


function getObjectivesCampaign(){

  const campaign =
    (
      document.body.dataset.campaign ||
      ''
    ).toLowerCase();


  return campaign === 'villain'
    ? 'villain'
    : 'hero';

}


function objectiveEscapeHtml(value){

  return String(
    value ?? ''
  )
  .replaceAll('&','&amp;')
  .replaceAll('<','&lt;')
  .replaceAll('>','&gt;')
  .replaceAll('"','&quot;')
  .replaceAll("'","&#039;");

}


function showObjectiveError(
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


function objectiveNow(){

  return new Date().toISOString();

}


function objectiveFormatDate(value){

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


/* =====================================================
   DATA HELPERS
   ===================================================== */

function getSubitemsForObjective(
  objectiveId
){

  return objectiveSubitems
    .filter(
      item =>
        item.objective_id ===
        objectiveId
    )
    .sort(
      (a,b) =>
        (a.sort_order ?? 0) -
        (b.sort_order ?? 0)
    );

}


function getObjectiveById(
  objectiveId
){

  return objectivesList.find(
    objective =>
      objective.id ===
      objectiveId
  );

}


function getSubitemById(
  subitemId
){

  return objectiveSubitems.find(
    subitem =>
      subitem.id ===
      subitemId
  );

}


function getFavoriteForObjective(
  objectiveId
){

  return objectiveFavorites.find(
    favorite =>
      favorite.objective_id ===
      objectiveId
  );

}


function getFavoriteForSubitem(
  subitemId
){

  return objectiveFavorites.find(
    favorite =>
      favorite.subobjective_id ===
      subitemId
  );

}


function isObjectiveFavorite(
  objectiveId
){

  return Boolean(
    getFavoriteForObjective(
      objectiveId
    )
  );

}


function isSubitemFavorite(
  subitemId
){

  return Boolean(
    getFavoriteForSubitem(
      subitemId
    )
  );

}


function getFavoriteCount(){

  return objectiveFavorites.length;

}


/* =====================================================
   AUTHENTICATED CHARACTER

   The old Objectives engine searched for a character
   by body[data-character-name].

   The shared player shell now already knows exactly
   which authenticated character belongs here.
   ===================================================== */

async function loadObjectivesCharacter(){

  /*
    Best source:
    player-shell.js
  */

  const shellCharacter =
    window.epcotPlayer?.getCharacter?.();


  if(
    shellCharacter?.id
  ){

    objectivesCharacter =
      shellCharacter;

    return;

  }


  /*
    Second source:
    player-shell places the assigned character ID
    on the body after authentication.
  */

  const characterId =
    document.body.dataset.characterId;


  if(!characterId){

    throw new Error(
      'The authenticated character has not been assigned to Objectives yet.'
    );

  }


  const characters =
    await supabaseGet(
      `characters?select=*&id=eq.${encodeURIComponent(characterId)}&limit=1`
    );


  if(!characters.length){

    throw new Error(
      'The assigned character could not be found for Objectives.'
    );

  }


  objectivesCharacter =
    characters[0];

}


/* =====================================================
   LOAD OBJECTIVE DATA
   ===================================================== */

async function loadObjectivesData(){

  if(!objectivesCharacter){
    return;
  }


  const campaign =
    getObjectivesCampaign();


  /*
    OBJECTIVES ARE CAMPAIGN-SHARED.

    Hero Cast + Hero Unbound:
      campaign = hero

    Villain Cast + Villain Unbound:
      campaign = villain
  */

  objectivesList =
    await supabaseGet(
      `objectives?select=*&campaign=eq.${campaign}&order=created_at.desc`
    );


  /*
    Load sub-objectives belonging only to the
    campaign-visible Objective records.
  */

  if(objectivesList.length){

    const objectiveIds =
      objectivesList
        .map(
          objective =>
            objective.id
        )
        .join(',');


    objectiveSubitems =
      await supabaseGet(
        `objective_subitems?select=*&objective_id=in.(${objectiveIds})&order=sort_order.asc`
      );

  }
  else{

    objectiveSubitems = [];

  }


  /*
    FAVORITES ARE CHARACTER-SPECIFIC.

    Two Heroes can see the same Hero objective list
    while starring different objectives for Home.
  */

  objectiveFavorites =
    await supabaseGet(
      `objective_favorites?select=*&character_id=eq.${objectivesCharacter.id}&order=created_at.asc`
    );


  renderObjectives();

  renderObjectiveFavoriteCount();

}


/* =====================================================
   FAVORITE COUNT
   ===================================================== */

function renderObjectiveFavoriteCount(){

  const element =
    objectiveById(
      'objectiveFavoriteCount'
    );


  if(!element){
    return;
  }


  element.textContent =
    `${getFavoriteCount()} / ${OBJECTIVE_FAVORITE_LIMIT} starred`;

}


/* =====================================================
   RENDER OBJECTIVES
   ===================================================== */

function renderObjectives(){

  const grid =
    objectiveById(
      'objectivesGrid'
    );


  if(!grid){
    return;
  }


  const visibleObjectives =
    objectivesList.filter(
      objective =>
        Boolean(
          objective.archived
        ) ===
        objectivesShowingArchived
    );


  if(!visibleObjectives.length){

    grid.innerHTML = `

      <div class="objectives-empty">

        ${
          objectivesShowingArchived
            ? 'No archived objectives yet.'
            : 'No active objectives yet. Add your first assignment.'
        }

      </div>

    `;


    return;

  }


  grid.innerHTML =
    visibleObjectives
      .map(
        renderObjectiveCard
      )
      .join('');

}


/* =====================================================
   OBJECTIVE CARD
   ===================================================== */

function renderObjectiveCard(
  objective
){

  const subitems =
    getSubitemsForObjective(
      objective.id
    );


  const starred =
    isObjectiveFavorite(
      objective.id
    );


  const completedClass =
    objective.completed
      ? ' is-complete'
      : '';


  const archivedClass =
    objective.archived
      ? ' is-archived'
      : '';


  return `

    <article
      class="objective-card${completedClass}${archivedClass}"
      data-objective-id="${objective.id}"
    >


      <div class="objective-card-head">


        <button
          class="objective-star${starred ? ' is-starred' : ''}"
          type="button"
          data-objective-action="favorite"
          data-objective-id="${objective.id}"
          aria-label="${
            starred
              ? 'Remove from Home favorites'
              : 'Add to Home favorites'
          }"
          title="${
            starred
              ? 'Remove favorite'
              : 'Add favorite'
          }"
        >
          ${starred ? '★' : '☆'}
        </button>



        <div class="objective-card-title-wrap">


          <h2>
            ${objectiveEscapeHtml(
              objective.name
            )}
          </h2>


          ${
            objective.created_by_role ===
            'dm'

              ? `
                  <span class="objective-source-badge">
                    DM Assignment
                  </span>
                `

              : `
                  <span class="objective-source-badge">
                    Personal Objective
                  </span>
                `
          }


        </div>



        <button
          class="objective-complete-toggle${objective.completed ? ' is-complete' : ''}"
          type="button"
          data-objective-action="toggle-complete"
          data-objective-id="${objective.id}"
          aria-label="${
            objective.completed
              ? 'Mark objective incomplete'
              : 'Mark objective complete'
          }"
          title="${
            objective.completed
              ? 'Mark incomplete'
              : 'Mark complete'
          }"
        >
          ${objective.completed ? '✓' : '○'}
        </button>


      </div>



      ${
        objective.description

          ? `

              <p class="objective-description">

                ${objectiveEscapeHtml(
                  objective.description
                )}

              </p>

            `

          : ''
      }



      ${
        subitems.length

          ? `

              <div class="objective-subitems">

                ${
                  subitems
                    .map(
                      renderObjectiveSubitem
                    )
                    .join('')
                }

              </div>

            `

          : `

              <div class="objective-no-subitems">
                No sub-objectives.
              </div>

            `
      }



      <div class="objective-card-actions">


        ${
          objective.archived

            ? `

                <span class="objective-archive-date">

                  Archived ${
                    objectiveFormatDate(
                      objective.archived_at
                    )
                  }

                </span>


                <button
                  type="button"
                  data-objective-action="restore"
                  data-objective-id="${objective.id}"
                >
                  Restore
                </button>

              `

            : `

                <button
                  type="button"
                  data-objective-action="edit"
                  data-objective-id="${objective.id}"
                >
                  Edit
                </button>


                <button
                  type="button"
                  data-objective-action="archive"
                  data-objective-id="${objective.id}"
                >
                  Archive
                </button>

              `
        }


      </div>


    </article>

  `;

}


/* =====================================================
   SUB-OBJECTIVE
   ===================================================== */

function renderObjectiveSubitem(
  subitem
){

  const starred =
    isSubitemFavorite(
      subitem.id
    );


  return `

    <div
      class="objective-subitem${subitem.completed ? ' is-complete' : ''}"
      data-subitem-id="${subitem.id}"
    >


      <button
        class="objective-subitem-check${subitem.completed ? ' is-complete' : ''}"
        type="button"
        data-objective-action="toggle-subitem"
        data-subitem-id="${subitem.id}"
        aria-label="${
          subitem.completed
            ? 'Mark sub-objective incomplete'
            : 'Mark sub-objective complete'
        }"
      >
        ${subitem.completed ? '✓' : '□'}
      </button>



      <span class="objective-subitem-name">

        ${objectiveEscapeHtml(
          subitem.name
        )}

      </span>



      <button
        class="objective-subitem-star${starred ? ' is-starred' : ''}"
        type="button"
        data-objective-action="favorite-subitem"
        data-subitem-id="${subitem.id}"
        aria-label="${
          starred
            ? 'Remove sub-objective favorite'
            : 'Favorite sub-objective'
        }"
        title="${
          starred
            ? 'Remove favorite'
            : 'Add favorite'
        }"
      >
        ${starred ? '★' : '☆'}
      </button>


    </div>

  `;

}


/* =====================================================
   ACTIVE / ARCHIVED VIEW
   ===================================================== */

function setObjectivesArchiveView(
  showArchived
){

  objectivesShowingArchived =
    Boolean(
      showArchived
    );


  const activeButton =
    objectiveById(
      'showActiveObjectivesButton'
    );


  const archivedButton =
    objectiveById(
      'showArchivedObjectivesButton'
    );


  if(activeButton){

    activeButton.classList.toggle(
      'active',
      !objectivesShowingArchived
    );

  }


  if(archivedButton){

    archivedButton.classList.toggle(
      'active',
      objectivesShowingArchived
    );

  }


  const addButton =
    objectiveById(
      'addObjectiveButton'
    );


  if(addButton){

    addButton.hidden =
      objectivesShowingArchived;

  }


  renderObjectives();

}


/* =====================================================
   FAVORITE OBJECTIVE
   ===================================================== */

async function toggleObjectiveFavorite(
  objectiveId
){

  if(!objectivesCharacter){
    return;
  }


  const existing =
    getFavoriteForObjective(
      objectiveId
    );


  try{

    if(existing){

      await supabaseDelete(
        `objective_favorites?id=eq.${existing.id}`
      );


      objectiveFavorites =
        objectiveFavorites.filter(
          favorite =>
            favorite.id !==
            existing.id
        );

    }
    else{

      if(
        getFavoriteCount() >=
        OBJECTIVE_FAVORITE_LIMIT
      ){

        alert(
          `You can star up to ${OBJECTIVE_FAVORITE_LIMIT} objectives or sub-objectives at a time.`
        );


        return;

      }


      const inserted =
        await supabasePost(
          'objective_favorites',
          {

            character_id:
              objectivesCharacter.id,

            objective_id:
              objectiveId,

            subobjective_id:
              null

          }
        );


      if(inserted[0]){

        objectiveFavorites.push(
          inserted[0]
        );

      }

    }


    renderObjectives();

    renderObjectiveFavoriteCount();

  }
  catch(error){

    showObjectiveError(
      'Favorite could not be updated.',
      error
    );

  }

}


/* =====================================================
   FAVORITE SUB-OBJECTIVE
   ===================================================== */

async function toggleSubitemFavorite(
  subitemId
){

  if(!objectivesCharacter){
    return;
  }


  const existing =
    getFavoriteForSubitem(
      subitemId
    );


  try{

    if(existing){

      await supabaseDelete(
        `objective_favorites?id=eq.${existing.id}`
      );


      objectiveFavorites =
        objectiveFavorites.filter(
          favorite =>
            favorite.id !==
            existing.id
        );

    }
    else{

      if(
        getFavoriteCount() >=
        OBJECTIVE_FAVORITE_LIMIT
      ){

        alert(
          `You can star up to ${OBJECTIVE_FAVORITE_LIMIT} objectives or sub-objectives at a time.`
        );


        return;

      }


      const inserted =
        await supabasePost(
          'objective_favorites',
          {

            character_id:
              objectivesCharacter.id,

            objective_id:
              null,

            subobjective_id:
              subitemId

          }
        );


      if(inserted[0]){

        objectiveFavorites.push(
          inserted[0]
        );

      }

    }


    renderObjectives();

    renderObjectiveFavoriteCount();

  }
  catch(error){

    showObjectiveError(
      'Favorite could not be updated.',
      error
    );

  }

}


/* =====================================================
   COMPLETE OBJECTIVE
   ===================================================== */

async function toggleObjectiveComplete(
  objectiveId
){

  const objective =
    getObjectiveById(
      objectiveId
    );


  if(!objective){
    return;
  }


  const next =
    !Boolean(
      objective.completed
    );


  try{

    const updated =
      await supabasePatch(
        `objectives?id=eq.${objectiveId}`,
        {

          completed:
            next,

          updated_at:
            objectiveNow()

        }
      );


    objective.completed =
      updated[0]?.completed ??
      next;


    renderObjectives();

  }
  catch(error){

    showObjectiveError(
      'Objective completion could not be updated.',
      error
    );

  }

}


/* =====================================================
   COMPLETE SUB-OBJECTIVE
   ===================================================== */

async function toggleSubitemComplete(
  subitemId
){

  const subitem =
    getSubitemById(
      subitemId
    );


  if(!subitem){
    return;
  }


  const next =
    !Boolean(
      subitem.completed
    );


  try{

    const updated =
      await supabasePatch(
        `objective_subitems?id=eq.${subitemId}`,
        {

          completed:
            next

        }
      );


    subitem.completed =
      updated[0]?.completed ??
      next;


    renderObjectives();

  }
  catch(error){

    showObjectiveError(
      'Sub-objective completion could not be updated.',
      error
    );

  }

}


/* =====================================================
   REMOVE FAVORITES WHEN ARCHIVING
   ===================================================== */

async function removeFavoritesForObjective(
  objectiveId
){

  const subitemIds =
    getSubitemsForObjective(
      objectiveId
    )
    .map(
      item =>
        item.id
    );


  const favoritesToRemove =
    objectiveFavorites.filter(
      favorite =>

        favorite.objective_id ===
          objectiveId

        ||

        subitemIds.includes(
          favorite.subobjective_id
        )

    );


  for(
    const favorite of
    favoritesToRemove
  ){

    await supabaseDelete(
      `objective_favorites?id=eq.${favorite.id}`
    );

  }


  const removedIds =
    new Set(
      favoritesToRemove.map(
        favorite =>
          favorite.id
      )
    );


  objectiveFavorites =
    objectiveFavorites.filter(
      favorite =>
        !removedIds.has(
          favorite.id
        )
    );

}


/* =====================================================
   ARCHIVE OBJECTIVE
   ===================================================== */

async function archiveObjective(
  objectiveId
){

  const objective =
    getObjectiveById(
      objectiveId
    );


  if(!objective){
    return;
  }


  const confirmed =
    confirm(
      `Archive “${objective.name}”? You can restore it later from Archived Objectives.`
    );


  if(!confirmed){
    return;
  }


  try{

    await removeFavoritesForObjective(
      objectiveId
    );


    const archivedAt =
      objectiveNow();


    const updated =
      await supabasePatch(
        `objectives?id=eq.${objectiveId}`,
        {

          archived:
            true,

          archived_at:
            archivedAt,

          updated_at:
            archivedAt

        }
      );


    objective.archived =
      updated[0]?.archived ??
      true;


    objective.archived_at =
      updated[0]?.archived_at ??
      archivedAt;


    renderObjectives();

    renderObjectiveFavoriteCount();

  }
  catch(error){

    showObjectiveError(
      'Objective could not be archived.',
      error
    );

  }

}


/* =====================================================
   RESTORE OBJECTIVE
   ===================================================== */

async function restoreObjective(
  objectiveId
){

  const objective =
    getObjectiveById(
      objectiveId
    );


  if(!objective){
    return;
  }


  try{

    const updated =
      await supabasePatch(
        `objectives?id=eq.${objectiveId}`,
        {

          archived:
            false,

          archived_at:
            null,

          updated_at:
            objectiveNow()

        }
      );


    objective.archived =
      updated[0]?.archived ??
      false;


    objective.archived_at =
      updated[0]?.archived_at ??
      null;


    renderObjectives();

  }
  catch(error){

    showObjectiveError(
      'Objective could not be restored.',
      error
    );

  }

}


/* =====================================================
   OPEN OBJECTIVE EDITOR
   ===================================================== */

function openObjectiveModal(
  objectiveId = null
){

  objectiveEditingId =
    objectiveId;


  const objective =
    objectiveId

      ? getObjectiveById(
          objectiveId
        )

      : null;


  objectiveDraftSubitems =
    objective

      ? getSubitemsForObjective(
          objective.id
        )
        .map(
          item => ({

            id:
              item.id,

            name:
              item.name,

            completed:
              Boolean(
                item.completed
              ),

            sort_order:
              item.sort_order ?? 0,

            existing:
              true

          })
        )

      : [];


  const title =
    objectiveById(
      'objectiveModalTitle'
    );


  if(title){

    title.textContent =
      objective
        ? 'Edit Objective'
        : 'Add Objective';

  }


  const nameInput =
    objectiveById(
      'objectiveNameInput'
    );


  if(nameInput){

    nameInput.value =
      objective?.name ||
      '';

  }


  const descriptionInput =
    objectiveById(
      'objectiveDescriptionInput'
    );


  if(descriptionInput){

    descriptionInput.value =
      objective?.description ||
      '';

  }


  renderObjectiveDraftSubitems();


  const modal =
    objectiveById(
      'objectiveModal'
    );


  if(modal){

    modal.classList.add(
      'open'
    );


    modal.setAttribute(
      'aria-hidden',
      'false'
    );

  }


  setTimeout(
    () =>
      nameInput?.focus(),
    0
  );

}


/* =====================================================
   CLOSE OBJECTIVE EDITOR
   ===================================================== */

function closeObjectiveModal(){

  const modal =
    objectiveById(
      'objectiveModal'
    );


  if(modal){

    modal.classList.remove(
      'open'
    );


    modal.setAttribute(
      'aria-hidden',
      'true'
    );

  }


  objectiveEditingId =
    null;


  objectiveDraftSubitems =
    [];

}


/* =====================================================
   ADD DRAFT SUB-OBJECTIVE
   ===================================================== */

function addObjectiveDraftSubitem(){

  syncObjectiveDraftNames();


  objectiveDraftSubitems.push(
    {

      id:
        null,

      name:
        '',

      completed:
        false,

      sort_order:
        objectiveDraftSubitems.length,

      existing:
        false

    }
  );


  renderObjectiveDraftSubitems();


  const inputs =
    document.querySelectorAll(
      '#objectiveSubitemEditor [data-draft-name]'
    );


  const newestInput =
    inputs[
      inputs.length - 1
    ];


  newestInput?.focus();

}


/* =====================================================
   RENDER DRAFT SUB-OBJECTIVES
   ===================================================== */

function renderObjectiveDraftSubitems(){

  const container =
    objectiveById(
      'objectiveSubitemEditor'
    );


  if(!container){
    return;
  }


  if(!objectiveDraftSubitems.length){

    container.innerHTML = `

      <div class="objective-draft-empty">
        No sub-objectives yet.
      </div>

    `;


    return;

  }


  container.innerHTML =
    objectiveDraftSubitems
      .map(
        (item,index) => `

          <div
            class="objective-draft-row"
            data-draft-index="${index}"
          >


            <input
              type="text"
              value="${objectiveEscapeHtml(item.name)}"
              placeholder="Sub-objective..."
              data-draft-name
              data-draft-index="${index}"
            >


            <button
              type="button"
              data-draft-action="remove"
              data-draft-index="${index}"
              aria-label="Remove sub-objective"
            >
              Remove
            </button>


          </div>

        `
      )
      .join('');

}


/* =====================================================
   PRESERVE DRAFT TEXT
   ===================================================== */

function syncObjectiveDraftNames(){

  document
    .querySelectorAll(
      '#objectiveSubitemEditor [data-draft-name]'
    )
    .forEach(
      input => {

        const index =
          Number(
            input.dataset.draftIndex
          );


        if(
          Number.isInteger(index) &&
          objectiveDraftSubitems[index]
        ){

          objectiveDraftSubitems[index].name =
            input.value;

        }

      }
    );

}


/* =====================================================
   REMOVE DRAFT SUB-OBJECTIVE
   ===================================================== */

function removeObjectiveDraftSubitem(
  index
){

  syncObjectiveDraftNames();


  objectiveDraftSubitems.splice(
    index,
    1
  );


  objectiveDraftSubitems.forEach(
    (item,itemIndex) => {

      item.sort_order =
        itemIndex;

    }
  );


  renderObjectiveDraftSubitems();

}


/* =====================================================
   SAVE OBJECTIVE
   ===================================================== */

async function saveObjective(){

  if(!objectivesCharacter){
    return;
  }


  syncObjectiveDraftNames();


  const name =
    objectiveById(
      'objectiveNameInput'
    )?.value.trim() ||
    '';


  const description =
    objectiveById(
      'objectiveDescriptionInput'
    )?.value.trim() ||
    '';


  if(!name){

    alert(
      'Give the objective a name before saving.'
    );


    return;

  }


  const saveButton =
    objectiveById(
      'saveObjectiveButton'
    );


  if(saveButton){

    saveButton.disabled =
      true;


    saveButton.textContent =
      'Saving...';

  }


  try{

    let objectiveId =
      objectiveEditingId;


    /* ===============================================
       EDIT EXISTING
       =============================================== */

    if(objectiveId){

      const updated =
        await supabasePatch(
          `objectives?id=eq.${objectiveId}`,
          {

            name,

            description:
              description ||
              null,

            updated_at:
              objectiveNow()

          }
        );


      const objective =
        getObjectiveById(
          objectiveId
        );


      if(objective){

        Object.assign(
          objective,
          updated[0] ||
          {

            name,

            description:
              description ||
              null

          }
        );

      }

    }


    /* ===============================================
       CREATE NEW
       =============================================== */

    else{

      const inserted =
        await supabasePost(
          'objectives',
          {

            campaign:
              getObjectivesCampaign(),

            name,

            description:
              description ||
              null,

            created_by_character_id:
              objectivesCharacter.id,

            created_by_role:
              'player',

            completed:
              false,

            archived:
              false

          }
        );


      if(!inserted[0]){

        throw new Error(
          'Supabase did not return the new objective.'
        );

      }


      objectiveId =
        inserted[0].id;


      objectivesList.unshift(
        inserted[0]
      );

    }


    await saveObjectiveSubitems(
      objectiveId
    );


    closeObjectiveModal();


    await loadObjectivesData();

  }
  catch(error){

    showObjectiveError(
      'Objective could not be saved.',
      error
    );

  }
  finally{

    if(saveButton){

      saveButton.disabled =
        false;


      saveButton.textContent =
        'Save Objective';

    }

  }

}


/* =====================================================
   SAVE SUB-OBJECTIVES
   ===================================================== */

async function saveObjectiveSubitems(
  objectiveId
){

  const existing =
    getSubitemsForObjective(
      objectiveId
    );


  const existingById =
    new Map(
      existing.map(
        item => [
          item.id,
          item
        ]
      )
    );


  const keptExistingIds =
    new Set();


  const cleanedDrafts =
    objectiveDraftSubitems
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
    cleanedDrafts
  ){

    if(
      draft.id &&
      existingById.has(
        draft.id
      )
    ){

      keptExistingIds.add(
        draft.id
      );


      await supabasePatch(
        `objective_subitems?id=eq.${draft.id}`,
        {

          name:
            draft.name,

          sort_order:
            draft.sort_order

        }
      );

    }
    else{

      await supabasePost(
        'objective_subitems',
        {

          objective_id:
            objectiveId,

          name:
            draft.name,

          completed:
            false,

          sort_order:
            draft.sort_order

        }
      );

    }

  }


  const removed =
    existing.filter(
      item =>
        !keptExistingIds.has(
          item.id
        )
    );


  for(
    const item of removed
  ){

    const favorite =
      getFavoriteForSubitem(
        item.id
      );


    if(favorite){

      await supabaseDelete(
        `objective_favorites?id=eq.${favorite.id}`
      );

    }


    await supabaseDelete(
      `objective_subitems?id=eq.${item.id}`
    );

  }

}


/* =====================================================
   OBJECTIVE CARD EVENTS
   ===================================================== */

function connectObjectiveCardEvents(){

  const grid =
    objectiveById(
      'objectivesGrid'
    );


  if(!grid){
    return;
  }


  grid.addEventListener(
    'click',
    event => {


      const button =
        event.target.closest(
          '[data-objective-action]'
        );


      if(!button){
        return;
      }


      const action =
        button.dataset.objectiveAction;


      const objectiveId =
        button.dataset.objectiveId;


      const subitemId =
        button.dataset.subitemId;


      if(
        action === 'favorite' &&
        objectiveId
      ){

        toggleObjectiveFavorite(
          objectiveId
        );

      }


      if(
        action === 'favorite-subitem' &&
        subitemId
      ){

        toggleSubitemFavorite(
          subitemId
        );

      }


      if(
        action === 'toggle-complete' &&
        objectiveId
      ){

        toggleObjectiveComplete(
          objectiveId
        );

      }


      if(
        action === 'toggle-subitem' &&
        subitemId
      ){

        toggleSubitemComplete(
          subitemId
        );

      }


      if(
        action === 'edit' &&
        objectiveId
      ){

        openObjectiveModal(
          objectiveId
        );

      }


      if(
        action === 'archive' &&
        objectiveId
      ){

        archiveObjective(
          objectiveId
        );

      }


      if(
        action === 'restore' &&
        objectiveId
      ){

        restoreObjective(
          objectiveId
        );

      }

    }

  );

}


/* =====================================================
   MODAL EVENTS
   ===================================================== */

function connectObjectiveModalEvents(){

  const addButton =
    objectiveById(
      'addObjectiveButton'
    );


  addButton?.addEventListener(
    'click',
    () =>
      openObjectiveModal()
  );


  const cancelButton =
    objectiveById(
      'cancelObjectiveButton'
    );


  cancelButton?.addEventListener(
    'click',
    closeObjectiveModal
  );


  const saveButton =
    objectiveById(
      'saveObjectiveButton'
    );


  saveButton?.addEventListener(
    'click',
    saveObjective
  );


  const addSubitemButton =
    objectiveById(
      'addObjectiveSubitemButton'
    );


  addSubitemButton?.addEventListener(
    'click',
    addObjectiveDraftSubitem
  );


  const editor =
    objectiveById(
      'objectiveSubitemEditor'
    );


  editor?.addEventListener(
    'click',
    event => {


      const button =
        event.target.closest(
          '[data-draft-action="remove"]'
        );


      if(!button){
        return;
      }


      const index =
        Number(
          button.dataset.draftIndex
        );


      if(
        Number.isInteger(
          index
        )
      ){

        removeObjectiveDraftSubitem(
          index
        );

      }

    }
  );


  const modal =
    objectiveById(
      'objectiveModal'
    );


  modal?.addEventListener(
    'click',
    event => {

      if(
        event.target === modal
      ){

        closeObjectiveModal();

      }

    }
  );

}


/* =====================================================
   ACTIVE / ARCHIVE BUTTON EVENTS
   ===================================================== */

function connectObjectiveViewEvents(){

  const activeButton =
    objectiveById(
      'showActiveObjectivesButton'
    );


  activeButton?.addEventListener(
    'click',
    () =>
      setObjectivesArchiveView(
        false
      )
  );


  const archivedButton =
    objectiveById(
      'showArchivedObjectivesButton'
    );


  archivedButton?.addEventListener(
    'click',
    () =>
      setObjectivesArchiveView(
        true
      )
  );

}


/* =====================================================
   INITIALIZE ENGINE
   ===================================================== */

async function initializeObjectives(){

  /*
    Prevent duplicate initialization if:
    - DOMContentLoaded fires
    - then epcot:player-ready also fires.
  */

  if(objectivesInitialized){
    return;
  }


  if(
    !objectiveById(
      'objectivesView'
    )
  ){

    return;
  }


  /*
    Wait until the authenticated player shell has
    resolved the active character.
  */

  const shellCharacter =
    window.epcotPlayer?.getCharacter?.();


  const bodyCharacterId =
    document.body.dataset.characterId;


  if(
    !shellCharacter?.id &&
    !bodyCharacterId
  ){

    return;

  }


  objectivesInitialized =
    true;


  connectObjectiveCardEvents();

  connectObjectiveModalEvents();

  connectObjectiveViewEvents();


  try{

await loadObjectivesCharacter();

await loadObjectivesData();

subscribeToObjectivesRealtime();

  }
  catch(error){

    objectivesInitialized =
      false;


    showObjectiveError(
      'Objectives could not be loaded.',
      error
    );


    const grid =
      objectiveById(
        'objectivesGrid'
      );


    if(grid){

      grid.innerHTML = `

        <div class="objectives-empty objectives-error">

          Objectives could not be loaded.

        </div>

      `;

    }

  }

}

/* =====================================================
   REALTIME OBJECTIVE UPDATES

   Keeps all players in the same campaign synchronized
   when objectives or sub-objectives change.
   ===================================================== */

function subscribeToObjectivesRealtime(){

  const client =
    window.epcotAuth?.client;


  if(
    !client ||
    !objectivesCharacter
  ){
    return;
  }


  if(objectivesRealtimeChannel){

    client.removeChannel(
      objectivesRealtimeChannel
    );

  }


  const campaign =
    getObjectivesCampaign();


  objectivesRealtimeChannel =
    client

      .channel(
        `objectives-live-${campaign}-${objectivesCharacter.id}`
      )

      .on(

        'postgres_changes',

        {
          event:'*',
          schema:'public',
          table:'objectives',
          filter:`campaign=eq.${campaign}`
        },

        async payload => {

          console.log(
            'Live objective update received:',
            payload
          );


          try{

            await loadObjectivesData();

          }
          catch(error){

            console.error(
              'Live objective refresh failed:',
              error
            );

          }

        }

      )

      .on(

        'postgres_changes',

        {
          event:'*',
          schema:'public',
          table:'objective_subitems'
        },

        async payload => {

          console.log(
            'Live sub-objective update received:',
            payload
          );


          try{

            await loadObjectivesData();

          }
          catch(error){

            console.error(
              'Live sub-objective refresh failed:',
              error
            );

          }

        }

      )

      .subscribe(
        (
          status,
          error
        ) => {

          console.log(
            'Objectives realtime status:',
            status
          );


          if(error){

            console.error(
              'Objectives realtime error:',
              error
            );

          }

        }
      );

}

/* =====================================================
   PLAYER READY

   This is now the preferred initialization path.
   ===================================================== */

document.addEventListener(
  'epcot:player-ready',
  initializeObjectives
);


/* =====================================================
   STARTUP FALLBACK

   Useful if player-shell finished before this
   file registered its player-ready listener.
   ===================================================== */

if(
  document.readyState ===
  'loading'
){

  document.addEventListener(
    'DOMContentLoaded',
    () => {

      window.setTimeout(
        initializeObjectives,
        0
      );

    }
  );

}
else{

  window.setTimeout(
    initializeObjectives,
    0
  );

}
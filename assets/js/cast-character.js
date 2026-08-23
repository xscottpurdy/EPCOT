/* =====================================================
   EPCOT DND
   SHARED CAST CHARACTER ENGINE

   Shared by:
   - Hero Cast World
   - Villain Cast World

   Handles:
   - Character loading
   - Core stats
   - Exhaustion penalties
   - Heroic Inspiration
   - Skill dice
   - Prepared Actions
   - Eureka
   - Ability Catalog
   - Ability editing/removal
   - Inventory editing/removal
   - Mandatory Realignment
   - Critical Incident state
   ===================================================== */


/* =====================================================
   CAST RULES
   ===================================================== */

const DICE_LADDER =
  [4,6,8,10,12,20];

const MAX_ALIGNMENT =
  10;

const CRITICAL_EXHAUSTION =
  6;

const EXHAUSTION_PENALTY_PER_POINT =
  2;


const SKILL_CONFIG = [

  {
    key:'dreamlight',
    name:'Dreamlight',
    description:'Influence / Charisma',
    color:'#e86d33'
  },

  {
    key:'heartline',
    name:'Heartline',
    description:'Endurance / Constitution',
    color:'#df6a52'
  },

  {
    key:'mindwave',
    name:'Mindwave',
    description:'Analysis / Intelligence',
    color:'#2e86a6'
  },

  {
    key:'bravura',
    name:'Bravura',
    description:'Performance / Strength',
    color:'#efb83f'
  },

  {
    key:'craftspark',
    name:'Craftspark',
    description:'Innovation / Wisdom',
    color:'#27a6a2'
  },

  {
    key:'starpath',
    name:'Starpath',
    description:'Agility / Dexterity',
    color:'#5b75a8'
  }

];


/* =====================================================
   CURRENT STATE
   ===================================================== */

let currentCharacter = null;

let abilityCatalog = [];

let currentAbilityLinks = [];

let currentInventory = [];

let abilityBeingEdited = null;

let inventoryItemBeingEdited = null;


/* =====================================================
   BASIC HELPERS
   ===================================================== */

function byId(id){

  return document.getElementById(id);

}


function numberValue(
  value,
  fallback = 0
){

  const number =
    Number(value);

  return Number.isFinite(number)
    ? number
    : fallback;

}


function getCharacterName(){

  return (
    document.body.dataset.characterName ||
    sessionStorage.getItem(
      'epcot-active-character-name'
    ) ||
    'Unnamed Character'
  );

}


function showError(
  title,
  error
){

  console.error(
    title,
    error
  );

  const message =
    error?.message ||
    String(error);

  alert(
    `${title}\n\n${message}`
  );

}


/* =====================================================
   EXHAUSTION
   ===================================================== */

function getExhaustion(){

  return Math.max(
    0,
    numberValue(
      currentCharacter?.exhaustion,
      0
    )
  );

}


function getExhaustionPenalty(){

  return (
    getExhaustion() *
    EXHAUSTION_PENALTY_PER_POINT
  );

}


function renderExhaustion(value){

  const count =
    Math.max(
      0,
      numberValue(
        value,
        0
      )
    );

  return count === 0
    ? '♡'
    : '♥'.repeat(count);

}


/* =====================================================
   CHARACTER HEADER
   ===================================================== */

function renderCharacterHeader(){

  if(!currentCharacter){
    return;
  }


  const companyProfile =
    currentCharacter.company_profile ||
    null;


  const displayName =
    companyProfile?.display_name ||
    getCharacterName();


  const portraitUrl =
    companyProfile?.image_url ||
    '';


  /*
    HOME NAME

    This already existed in the Character engine.
    For now, it will also use the Company File display
    name so identity stays consistent.
  */

  const dashboardName =
    byId('characterName');

  if(dashboardName){

    dashboardName.textContent =
      displayName;

  }


  /*
    LEVEL
  */

  const dashboardLevel =
    byId('characterLevel');

  if(dashboardLevel){

    dashboardLevel.textContent =
      currentCharacter.level ?? 1;

  }


  /*
    PERFORMANCE RECORD NAME
  */

  const sheetName =
    byId('sheetCharacterName');

  if(sheetName){

    sheetName.textContent =
      displayName;

  }


  /*
    LEVEL
  */

  const sheetLevel =
    byId('sheetLevel');

  if(sheetLevel){

    sheetLevel.textContent =
      currentCharacter.level ?? 1;

  }


  /*
    ALIGNMENT
  */

  const sheetAlignment =
    byId('sheetAlignment');

  if(sheetAlignment){

    sheetAlignment.textContent =
      currentCharacter.alignment ?? 0;

  }


  /*
    EXHAUSTION
  */

  const sheetExhaustion =
    byId('sheetExhaustion');

  if(sheetExhaustion){

    sheetExhaustion.textContent =
      renderExhaustion(
        currentCharacter.exhaustion
      );

  }


  /*
    INSPIRATION
  */

  const inspiration =
    byId('sheetInspiration');

  if(inspiration){

    inspiration.textContent =
      currentCharacter.heroic_inspiration
        ? 'Available'
        : 'None';

  }


  const inspirationButton =
    byId('inspirationButton');

  if(inspirationButton){

    inspirationButton.textContent =
      currentCharacter.heroic_inspiration
        ? 'Use Inspiration'
        : 'Add Inspiration';

  }


  /*
    PORTRAIT

    Company File image is now the preferred source.
    characters.portrait_url remains a fallback.
  */

  const portrait =
    byId('sheetPortrait');

  if(portrait){

    if(portraitUrl){

      portrait.innerHTML = `
        <img
          src="${portraitUrl}"
          alt="${displayName}"
        >
      `;

    }
    else{

      portrait.innerHTML = `
        <div class="portrait-placeholder"></div>
      `;

    }

  }


  renderCharacterStatus();

}


/* =====================================================
   STATUS FLAGS
   ===================================================== */

function renderCharacterStatus(){

  if(!currentCharacter){
    return;
  }


  const alignment =
    numberValue(
      currentCharacter.alignment,
      0
    );


  const exhaustion =
    getExhaustion();


  const realignmentFlag =
    byId('realignmentFlag');

  if(realignmentFlag){

    realignmentFlag.hidden =
      alignment < MAX_ALIGNMENT;

  }


  const criticalFlag =
    byId('criticalIncidentFlag');

  if(criticalFlag){

    criticalFlag.hidden =
      exhaustion < CRITICAL_EXHAUSTION;

  }


  const exhaustionPenalty =
    byId('exhaustionPenalty');

  if(exhaustionPenalty){

    if(exhaustion === 0){

      exhaustionPenalty.textContent =
        'No Exhaustion penalty.';

    }
    else{

      exhaustionPenalty.textContent =
        `Exhaustion ${exhaustion}: −${getExhaustionPenalty()} to all CAST skill-check results.`;

    }

  }

}


/* =====================================================
   UPDATE CHARACTER FIELD
   ===================================================== */

async function updateCharacterField(
  field,
  value
){

  if(!currentCharacter){
    return;
  }


  const updated =
    await supabasePatch(
      `characters?id=eq.${currentCharacter.id}`,
      {
        [field]:value
      }
    );


  currentCharacter[field] =
    updated[0]?.[field] ??
    value;


  renderCharacterHeader();

  renderSkills();

}


/* =====================================================
   LEVEL
   ===================================================== */

async function changeLevel(direction){

  if(!currentCharacter){
    return;
  }


  const current =
    numberValue(
      currentCharacter.level,
      1
    );


  const next =
    Math.max(
      1,
      current + direction
    );


  if(next === current){
    return;
  }


  try{

    await updateCharacterField(
      'level',
      next
    );

  }
  catch(error){

    showError(
      'Level could not be updated.',
      error
    );

  }

}


/* =====================================================
   ALIGNMENT
   ===================================================== */

async function changeAlignment(direction){

  if(!currentCharacter){
    return;
  }


  const current =
    numberValue(
      currentCharacter.alignment,
      0
    );


  const next =
    Math.max(
      0,
      current + direction
    );


  try{

    await updateCharacterField(
      'alignment',
      next
    );


    if(next >= MAX_ALIGNMENT){

      openRealignmentWorkflow();

    }

  }
  catch(error){

    showError(
      'Alignment Units could not be updated.',
      error
    );

  }

}


/* =====================================================
   REALIGNMENT
   ===================================================== */

function openRealignmentWorkflow(){

  const modal =
    byId('realignmentModal');

  if(!modal){
    return;
  }


  modal.classList.add(
    'open'
  );

  modal.setAttribute(
    'aria-hidden',
    'false'
  );

}


function closeRealignmentWorkflow(){

  const modal =
    byId('realignmentModal');

  if(!modal){
    return;
  }


  modal.classList.remove(
    'open'
  );

  modal.setAttribute(
    'aria-hidden',
    'true'
  );

}


async function completeRealignment(){

  if(!currentCharacter){
    return;
  }


  try{

    await updateCharacterField(
      'alignment',
      0
    );

    closeRealignmentWorkflow();

  }
  catch(error){

    showError(
      'Realignment could not be completed.',
      error
    );

  }

}


/* =====================================================
   EXHAUSTION
   ===================================================== */

async function changeExhaustion(direction){

  if(!currentCharacter){
    return;
  }


  const current =
    getExhaustion();


  const next =
    Math.max(
      0,
      current + direction
    );


  try{

    await updateCharacterField(
      'exhaustion',
      next
    );

  }
  catch(error){

    showError(
      'Exhaustion could not be updated.',
      error
    );

  }

}


/* =====================================================
   HEROIC INSPIRATION
   ===================================================== */

async function toggleHeroicInspiration(){

  if(!currentCharacter){
    return;
  }


  const next =
    !Boolean(
      currentCharacter.heroic_inspiration
    );


  try{

    await updateCharacterField(
      'heroic_inspiration',
      next
    );

  }
  catch(error){

    showError(
      'Heroic Inspiration could not be updated.',
      error
    );

  }

}


/* =====================================================
   SKILLS
   ===================================================== */

function renderSkills(){

  const grid =
    byId('skillsGrid');

  if(
    !grid ||
    !currentCharacter
  ){
    return;
  }


  const penalty =
    getExhaustionPenalty();


  grid.innerHTML =

    SKILL_CONFIG.map(
      skill => {

        const field =
          `${skill.key}_die`;


        const die =
          numberValue(
            currentCharacter[field],
            4
          );


        const index =
          DICE_LADDER.indexOf(
            die
          );


        return `

          <article
            class="skill-card"
            style="--skill-color:${skill.color}"
          >

            <div class="skill-name">
              ${skill.name}
            </div>


            <div class="skill-description">
              ${skill.description}
            </div>


            <button
              class="skill-roll"
              type="button"
              data-action="roll"
              data-skill="${skill.key}"
              aria-label="Roll ${skill.name}"
            >
              d${die}
            </button>


            ${
              penalty > 0
                ? `
                    <div class="skill-penalty">
                      −${penalty} Exhaustion
                    </div>
                  `
                : ''
            }


            <div class="skill-controls">


              <button
                class="skill-step"
                type="button"
                data-action="decrease"
                data-skill="${skill.key}"
                ${index > 0 ? '' : 'disabled'}
                aria-label="Decrease ${skill.name}"
              >
                −
              </button>


              <button
                class="prepared-action"
                type="button"
                data-action="prepared"
                data-skill="${skill.key}"
                title="Use half the current skill die without rolling"
              >
                Prepared ½
              </button>


              <button
                class="skill-step"
                type="button"
                data-action="increase"
                data-skill="${skill.key}"
                ${
                  index >= 0 &&
                  index < DICE_LADDER.length - 1
                    ? ''
                    : 'disabled'
                }
                aria-label="Increase ${skill.name}"
              >
                +
              </button>


            </div>


            <div
              class="skill-saving"
              id="${skill.key}Saving"
            ></div>

          </article>

        `;

      }

    ).join('');

}


/* =====================================================
   CHANGE SKILL DIE
   ===================================================== */

async function changeSkillDie(
  skillKey,
  direction
){

  if(!currentCharacter){
    return;
  }


  const field =
    `${skillKey}_die`;


  const currentDie =
    numberValue(
      currentCharacter[field],
      4
    );


  const currentIndex =
    DICE_LADDER.indexOf(
      currentDie
    );


  if(currentIndex === -1){
    return;
  }


  const nextIndex =
    currentIndex + direction;


  if(
    nextIndex < 0 ||
    nextIndex >= DICE_LADDER.length
  ){
    return;
  }


  const nextDie =
    DICE_LADDER[nextIndex];


  const saving =
    byId(
      `${skillKey}Saving`
    );


  if(saving){

    saving.textContent =
      'Saving...';

  }


  try{

    const updated =
      await supabasePatch(
        `characters?id=eq.${currentCharacter.id}`,
        {
          [field]:nextDie
        }
      );


    currentCharacter[field] =
      updated[0]?.[field] ??
      nextDie;


    renderSkills();

  }
  catch(error){

    showError(
      'The skill could not be updated.',
      error
    );

  }

}


/* =====================================================
   SKILL RESULT CALCULATIONS
   ===================================================== */

function isEureka(
  result,
  die
){

  return result === die;

}


function calculateFinalResult(
  baseResult
){

  return Math.max(
    0,
    baseResult -
    getExhaustionPenalty()
  );

}


/* =====================================================
   NORMAL SKILL ROLL
   ===================================================== */

function rollSkill(skillKey){

  if(!currentCharacter){
    return;
  }


  const skill =
    SKILL_CONFIG.find(
      item =>
        item.key === skillKey
    );


  if(!skill){
    return;
  }


  const die =
    numberValue(
      currentCharacter[
        `${skillKey}_die`
      ],
      4
    );


  const rolled =
    Math.floor(
      Math.random() * die
    ) + 1;


  const finalResult =
    calculateFinalResult(
      rolled
    );


  const eureka =
    isEureka(
      rolled,
      die
    );


  let followUpRoll =
    null;


  if(eureka){

    followUpRoll =
      Math.floor(
        Math.random() * die
      ) + 1;

  }


  showRollResult({
    skill,
    die,
    rolled,
    finalResult,
    prepared:false,
    eureka,
    followUpRoll
  });

}


/* =====================================================
   PREPARED ACTION
   ===================================================== */

function preparedAction(
  skillKey
){

  if(!currentCharacter){
    return;
  }


  const skill =
    SKILL_CONFIG.find(
      item =>
        item.key === skillKey
    );


  if(!skill){
    return;
  }


  const die =
    numberValue(
      currentCharacter[
        `${skillKey}_die`
      ],
      4
    );


  const preparedValue =
    die / 2;


  const finalResult =
    calculateFinalResult(
      preparedValue
    );


  showRollResult({
    skill,
    die,
    rolled:preparedValue,
    finalResult,
    prepared:true,
    eureka:false,
    followUpRoll:null
  });

}


/* =====================================================
   ROLL RESULT WINDOW
   ===================================================== */

function showRollResult(data){

  const skillName =
    byId('rollSkill');

  if(skillName){

    skillName.textContent =
      data.skill.name;

  }


  const result =
    byId('rollResult');

  if(result){

    result.textContent =
      data.finalResult;

  }


  const die =
    byId('rollDie');

  if(die){

    die.textContent =
      data.prepared
        ? `Prepared d${data.die}`
        : `d${data.die}`;

  }


  const copy =
    byId('rollCopy');

  if(copy){

    if(data.prepared){

      copy.textContent =
        `Prepared value ${data.rolled}. Exhaustion penalty −${getExhaustionPenalty()}. Final result ${data.finalResult}.`;

    }
    else{

      copy.textContent =
        `Rolled ${data.rolled}. Exhaustion penalty −${getExhaustionPenalty()}. Final result ${data.finalResult}.`;

    }

  }


  const eurekaBanner =
    byId('eurekaBanner');

  if(eurekaBanner){

    eurekaBanner.hidden =
      !data.eureka;

  }


  const followUp =
    byId('eurekaFollowUp');

  if(followUp){

    if(data.eureka){

      followUp.hidden =
        false;

      followUp.textContent =
        `Eureka follow-up roll: ${data.followUpRoll}`;

    }
    else{

      followUp.hidden =
        true;

      followUp.textContent =
        '';

    }

  }


  openModal(
    'rollModal'
  );

}


function closeRollModal(){

  closeModal(
    'rollModal'
  );

}


/* =====================================================
   MODAL HELPERS
   ===================================================== */

function openModal(id){

  const modal =
    byId(id);

  if(!modal){
    return;
  }


  modal.classList.add(
    'open'
  );

  modal.setAttribute(
    'aria-hidden',
    'false'
  );

}


function closeModal(id){

  const modal =
    byId(id);

  if(!modal){
    return;
  }


  modal.classList.remove(
    'open'
  );

  modal.setAttribute(
    'aria-hidden',
    'true'
  );

}


/* =====================================================
   ABILITY HELPERS
   ===================================================== */

function getAbilityForLink(
  link
){

  return abilityCatalog.find(
    ability =>
      ability.id ===
      link.ability_id
  );

}


function getSelectedAbilityIds(){

  return new Set(
    currentAbilityLinks.map(
      link =>
        link.ability_id
    )
  );

}


/* =====================================================
   RENDER SELECTED ABILITIES
   ===================================================== */

function renderAbilities(){

  const grid =
    byId(
      'characterAbilitiesGrid'
    );

  if(!grid){
    return;
  }


  if(!currentAbilityLinks.length){

    grid.innerHTML = `
      <div class="character-empty">
        No abilities selected yet.
      </div>
    `;

    return;

  }


  grid.innerHTML =

    currentAbilityLinks.map(
      link => {

        const ability =
          getAbilityForLink(
            link
          );


        if(!ability){
          return '';
        }


        return `

          <article
            class="character-ability-card"
            data-link-id="${link.id}"
          >


            <div class="ability-card-heading">

              <strong>
                ${ability.name}
              </strong>

              <span class="character-ability-category">
                ${ability.category}
              </span>

            </div>


            <p>
              ${ability.description}
            </p>


            ${
              link.chosen_skill
                ? `
                    <div class="ability-detail">
                      Chosen Skill:
                      <strong>
                        ${link.chosen_skill}
                      </strong>
                    </div>
                  `
                : ''
            }


            ${
              link.level_selected
                ? `
                    <div class="ability-detail">
                      Selected at Level
                      <strong>
                        ${link.level_selected}
                      </strong>
                    </div>
                  `
                : ''
            }


            <div class="ability-actions">

              <button
                type="button"
                data-ability-action="edit"
                data-link-id="${link.id}"
              >
                Edit
              </button>


              <button
                type="button"
                data-ability-action="remove"
                data-link-id="${link.id}"
              >
                Remove
              </button>

            </div>


          </article>

        `;

      }

    ).join('');

}


/* =====================================================
   ABILITY CATALOG
   ===================================================== */

function renderAbilityCatalog(
  searchText = ''
){

  const catalog =
    byId(
      'abilityCatalogList'
    );

  if(!catalog){
    return;
  }


  const selectedIds =
    getSelectedAbilityIds();


  const search =
    searchText
      .trim()
      .toLowerCase();


  const filtered =
    abilityCatalog.filter(
      ability => {

        const searchable =
          `
            ${ability.name}
            ${ability.category}
            ${ability.description}
          `
          .toLowerCase();


        return (
          !search ||
          searchable.includes(
            search
          )
        );

      }
    );


  if(!filtered.length){

    catalog.innerHTML = `
      <div class="character-empty">
        No abilities match your search.
      </div>
    `;

    return;

  }


  catalog.innerHTML =

    filtered.map(
      ability => {

        const selected =
          selectedIds.has(
            ability.id
          );


        return `

          <article class="ability-catalog-card">


            <div class="ability-card-heading">

              <strong>
                ${ability.name}
              </strong>

              <span class="character-ability-category">
                ${ability.category}
              </span>

            </div>


            <p>
              ${ability.description}
            </p>


            <button
              type="button"
              data-catalog-add="${ability.id}"
              ${selected ? 'disabled' : ''}
            >

              ${
                selected
                  ? 'Already Added'
                  : 'Add Ability'
              }

            </button>


          </article>

        `;

      }

    ).join('');

}


/* =====================================================
   OPEN ABILITY CATALOG
   ===================================================== */

function openAbilityCatalog(){

  const search =
    byId(
      'abilitySearchInput'
    );


  if(search){

    search.value =
      '';

  }


  renderAbilityCatalog();

  openModal(
    'abilityCatalogModal'
  );

}


/* =====================================================
   ADD ABILITY
   ===================================================== */

async function addAbility(
  abilityId
){

  if(!currentCharacter){
    return;
  }


  const existing =
    currentAbilityLinks.find(
      link =>
        link.ability_id ===
        abilityId
    );


  if(existing){
    return;
  }


  try{

    const inserted =
      await supabasePost(
        'character_abilities',
        {
          character_id:
            currentCharacter.id,

          ability_id:
            abilityId,

          chosen_skill:
            null,

          level_selected:
            currentCharacter.level ?? null
        }
      );


    if(!inserted[0]){

      throw new Error(
        'Supabase did not return the new ability selection.'
      );

    }


    currentAbilityLinks.push(
      inserted[0]
    );


    renderAbilities();

    renderAbilityCatalog(
      byId('abilitySearchInput')?.value ||
      ''
    );

  }
  catch(error){

    showError(
      'Ability could not be added.',
      error
    );

  }

}


/* =====================================================
   OPEN ABILITY EDITOR
   ===================================================== */

function openAbilityEditor(
  linkId
){

  const link =
    currentAbilityLinks.find(
      item =>
        item.id === linkId
    );


  if(!link){
    return;
  }


  const ability =
    getAbilityForLink(
      link
    );


  if(!ability){
    return;
  }


  abilityBeingEdited =
    link;


  const title =
    byId(
      'abilityEditName'
    );

  if(title){

    title.textContent =
      ability.name;

  }


  const description =
    byId(
      'abilityEditDescription'
    );

  if(description){

    description.textContent =
      ability.description;

  }


  const skill =
    byId(
      'abilityEditSkill'
    );

  if(skill){

    skill.value =
      link.chosen_skill ||
      '';

  }


  const level =
    byId(
      'abilityEditLevel'
    );

  if(level){

    level.value =
      link.level_selected ||
      currentCharacter?.level ||
      '';

  }


  openModal(
    'abilityEditModal'
  );

}


/* =====================================================
   SAVE ABILITY EDIT
   ===================================================== */

async function saveAbilityEdit(){

  if(!abilityBeingEdited){
    return;
  }


  const skill =
    byId(
      'abilityEditSkill'
    )?.value.trim() ||
    null;


  const levelInput =
    byId(
      'abilityEditLevel'
    )?.value;


  const level =
    levelInput
      ? numberValue(
          levelInput,
          null
        )
      : null;


  try{

    const updated =
      await supabasePatch(
        `character_abilities?id=eq.${abilityBeingEdited.id}`,
        {
          chosen_skill:
            skill,

          level_selected:
            level
        }
      );


    abilityBeingEdited.chosen_skill =
      updated[0]?.chosen_skill ??
      skill;


    abilityBeingEdited.level_selected =
      updated[0]?.level_selected ??
      level;


    renderAbilities();

    closeModal(
      'abilityEditModal'
    );


    abilityBeingEdited =
      null;

  }
  catch(error){

    showError(
      'Ability could not be updated.',
      error
    );

  }

}


/* =====================================================
   REMOVE ABILITY
   ===================================================== */

async function removeAbility(
  linkId
){

  const link =
    currentAbilityLinks.find(
      item =>
        item.id === linkId
    );


  if(!link){
    return;
  }


  const ability =
    getAbilityForLink(
      link
    );


  const confirmed =
    confirm(
      `Remove ${ability?.name || 'this ability'}?`
    );


  if(!confirmed){
    return;
  }


  try{

    await supabaseDelete(
      `character_abilities?id=eq.${linkId}`
    );


    currentAbilityLinks =
      currentAbilityLinks.filter(
        item =>
          item.id !== linkId
      );


    renderAbilities();

    renderAbilityCatalog(
      byId('abilitySearchInput')?.value ||
      ''
    );

  }
  catch(error){

    showError(
      'Ability could not be removed.',
      error
    );

  }

}


/* =====================================================
   INVENTORY DISPLAY
   ===================================================== */

function renderInventory(){

  const grid =
    byId(
      'characterInventoryGrid'
    );

  if(!grid){
    return;
  }


  if(!currentInventory.length){

    grid.innerHTML = `
      <div class="character-empty">
        Inventory is empty.
      </div>
    `;

    return;

  }


  grid.innerHTML =

    currentInventory.map(
      item => `

        <article
          class="character-inventory-card"
          data-item-id="${item.id}"
        >


          <div class="inventory-card-heading">

            <strong>
              ${item.name}
            </strong>

            <span class="inventory-quantity">
              ×${numberValue(
                item.quantity,
                1
              )}
            </span>

          </div>


          <p>
            ${item.description || ''}
          </p>


          <div class="inventory-actions">

            <button
              type="button"
              data-inventory-action="edit"
              data-item-id="${item.id}"
            >
              Edit
            </button>


            <button
              type="button"
              data-inventory-action="remove"
              data-item-id="${item.id}"
            >
              Remove
            </button>

          </div>


        </article>

      `

    ).join('');

}


/* =====================================================
   OPEN NEW INVENTORY ITEM
   ===================================================== */

function openNewInventoryItem(){

  inventoryItemBeingEdited =
    null;


  const title =
    byId(
      'inventoryModalTitle'
    );

  if(title){

    title.textContent =
      'Add Inventory Item';

  }


  const name =
    byId(
      'inventoryItemName'
    );

  if(name){

    name.value =
      '';

  }


  const description =
    byId(
      'inventoryItemDescription'
    );

  if(description){

    description.value =
      '';

  }


  const quantity =
    byId(
      'inventoryItemQuantity'
    );

  if(quantity){

    quantity.value =
      '1';

  }


  openModal(
    'inventoryModal'
  );

}


/* =====================================================
   OPEN INVENTORY EDITOR
   ===================================================== */

function openInventoryEditor(
  itemId
){

  const item =
    currentInventory.find(
      entry =>
        entry.id === itemId
    );


  if(!item){
    return;
  }


  inventoryItemBeingEdited =
    item;


  const title =
    byId(
      'inventoryModalTitle'
    );

  if(title){

    title.textContent =
      'Edit Inventory Item';

  }


  const name =
    byId(
      'inventoryItemName'
    );

  if(name){

    name.value =
      item.name ||
      '';

  }


  const description =
    byId(
      'inventoryItemDescription'
    );

  if(description){

    description.value =
      item.description ||
      '';

  }


  const quantity =
    byId(
      'inventoryItemQuantity'
    );

  if(quantity){

    quantity.value =
      numberValue(
        item.quantity,
        1
      );

  }


  openModal(
    'inventoryModal'
  );

}


/* =====================================================
   SAVE INVENTORY ITEM
   ===================================================== */

async function saveInventoryItem(){

  if(!currentCharacter){
    return;
  }


  const name =
    byId(
      'inventoryItemName'
    )?.value.trim();


  const description =
    byId(
      'inventoryItemDescription'
    )?.value.trim() ||
    '';


  const quantity =
    Math.max(
      1,
      numberValue(
        byId(
          'inventoryItemQuantity'
        )?.value,
        1
      )
    );


  if(!name){

    alert(
      'Please enter an item name.'
    );

    return;

  }


  try{

    if(inventoryItemBeingEdited){

      const updated =
        await supabasePatch(
          `inventory?id=eq.${inventoryItemBeingEdited.id}`,
          {
            name,
            description,
            quantity
          }
        );


      Object.assign(
        inventoryItemBeingEdited,
        updated[0] || {
          name,
          description,
          quantity
        }
      );

    }
    else{

      const inserted =
        await supabasePost(
          'inventory',
          {
            character_id:
              currentCharacter.id,

            name,
            description,
            quantity
          }
        );


      if(!inserted[0]){

        throw new Error(
          'Supabase did not return the new inventory item.'
        );

      }


      currentInventory.push(
        inserted[0]
      );

    }


    renderInventory();

    closeModal(
      'inventoryModal'
    );


    inventoryItemBeingEdited =
      null;

  }
  catch(error){

    showError(
      inventoryItemBeingEdited
        ? 'Inventory item could not be updated.'
        : 'Inventory item could not be added.',
      error
    );

  }

}


/* =====================================================
   REMOVE INVENTORY ITEM
   ===================================================== */

async function removeInventoryItem(
  itemId
){

  const item =
    currentInventory.find(
      entry =>
        entry.id === itemId
    );


  if(!item){
    return;
  }


  const confirmed =
    confirm(
      `Remove ${item.name}?`
    );


  if(!confirmed){
    return;
  }


  try{

    await supabaseDelete(
      `inventory?id=eq.${itemId}`
    );


    currentInventory =
      currentInventory.filter(
        entry =>
          entry.id !== itemId
      );


    renderInventory();

  }
  catch(error){

    showError(
      'Inventory item could not be removed.',
      error
    );

  }

}


/* =====================================================
   LOAD CHARACTER DATA
   ===================================================== */

async function loadCastCharacter(){

  try{

    const characterId =
      document.body.dataset.characterId ||
      sessionStorage.getItem(
        'epcot-active-character-id'
      );


    if(!characterId){

      throw new Error(
        'No active character ID was found.'
      );

    }


    /*
      Load permanent mechanical character record
      by ID, never by character name.
    */

    const characters =
      await supabaseGet(
        `characters?select=*&id=eq.${encodeURIComponent(characterId)}&limit=1`
      );


    if(!characters.length){

      throw new Error(
        'The active character was not returned by Supabase.'
      );

    }


    currentCharacter =
      characters[0];


    /*
      Load Cast identity from Company File.
    */

    const companyProfiles =
      await supabaseGet(
        `company_files?select=*&character_id=eq.${currentCharacter.id}&limit=1`
      );


    currentCharacter.company_profile =
      companyProfiles[0] ||
      null;


    /*
      CHARACTER ABILITIES
    */

    currentAbilityLinks =
      await supabaseGet(
        `character_abilities?select=id,ability_id,chosen_skill,level_selected&character_id=eq.${currentCharacter.id}`
      );


    /*
      ABILITY CATALOG
    */

    abilityCatalog =
      await supabaseGet(
        'abilities?select=id,name,category,description&is_active=eq.true&order=name.asc'
      );


    /*
      INVENTORY
    */

    currentInventory =
      await supabaseGet(
        `inventory?select=id,name,description,quantity&character_id=eq.${currentCharacter.id}&order=name.asc`
      );


    /*
      RENDER PAGE
    */

    renderCharacterHeader();

    renderSkills();

    renderAbilities();

    renderAbilityCatalog();

    renderInventory();


    /*
      REALIGNMENT CHECK
    */

    if(
      numberValue(
        currentCharacter.alignment,
        0
      ) >= MAX_ALIGNMENT
    ){

      openRealignmentWorkflow();

    }

  }
  catch(error){

    console.error(
      'Character load failed:',
      error
    );


    const name =
      byId(
        'sheetCharacterName'
      );


    if(name){

      name.textContent =
        'Character unavailable';

    }


    showError(
      'Character data could not be loaded.',
      error
    );

  }

}

/* =====================================================
   CORE STAT BUTTONS
   ===================================================== */

function connectCoreStatControls(){

  document
    .querySelectorAll(
      '[data-stat-action]'
    )
    .forEach(
      button => {

        button.addEventListener(
          'click',
          () => {

            const stat =
              button.dataset.stat;


            const direction =
              button.dataset.statAction ===
              'increase'
                ? 1
                : -1;


            if(stat === 'level'){

              changeLevel(
                direction
              );

            }


            if(stat === 'alignment'){

              changeAlignment(
                direction
              );

            }


            if(stat === 'exhaustion'){

              changeExhaustion(
                direction
              );

            }

          }

        );

      }

    );

}


/* =====================================================
   SKILL BUTTON EVENTS
   ===================================================== */

function connectSkillButtons(){

  const grid =
    byId(
      'skillsGrid'
    );


  if(!grid){
    return;
  }


  grid.addEventListener(
    'click',
    event => {

      const button =
        event.target.closest(
          'button[data-action]'
        );


      if(!button){
        return;
      }


      const action =
        button.dataset.action;


      const skill =
        button.dataset.skill;


      if(action === 'roll'){

        rollSkill(
          skill
        );

      }


      if(action === 'prepared'){

        preparedAction(
          skill
        );

      }


      if(action === 'increase'){

        changeSkillDie(
          skill,
          1
        );

      }


      if(action === 'decrease'){

        changeSkillDie(
          skill,
          -1
        );

      }

    }

  );

}


/* =====================================================
   ABILITY EVENTS
   ===================================================== */

function connectAbilityControls(){

  const openButton =
    byId(
      'openAbilityCatalogButton'
    );


  if(openButton){

    openButton.addEventListener(
      'click',
      openAbilityCatalog
    );

  }


  const closeCatalog =
    byId(
      'closeAbilityCatalogButton'
    );


  if(closeCatalog){

    closeCatalog.addEventListener(
      'click',
      () =>
        closeModal(
          'abilityCatalogModal'
        )
    );

  }


  const search =
    byId(
      'abilitySearchInput'
    );


  if(search){

    search.addEventListener(
      'input',
      () => {

        renderAbilityCatalog(
          search.value
        );

      }
    );

  }


  const catalog =
    byId(
      'abilityCatalogList'
    );


  if(catalog){

    catalog.addEventListener(
      'click',
      event => {

        const button =
          event.target.closest(
            '[data-catalog-add]'
          );


        if(!button){
          return;
        }


        addAbility(
          button.dataset.catalogAdd
        );

      }

    );

  }


  const selectedGrid =
    byId(
      'characterAbilitiesGrid'
    );


  if(selectedGrid){

    selectedGrid.addEventListener(
      'click',
      event => {

        const button =
          event.target.closest(
            '[data-ability-action]'
          );


        if(!button){
          return;
        }


        const action =
          button.dataset.abilityAction;


        const linkId =
          button.dataset.linkId;


        if(action === 'edit'){

          openAbilityEditor(
            linkId
          );

        }


        if(action === 'remove'){

          removeAbility(
            linkId
          );

        }

      }

    );

  }


  const saveEdit =
    byId(
      'saveAbilityEditButton'
    );


  if(saveEdit){

    saveEdit.addEventListener(
      'click',
      saveAbilityEdit
    );

  }


  const cancelEdit =
    byId(
      'cancelAbilityEditButton'
    );


  if(cancelEdit){

    cancelEdit.addEventListener(
      'click',
      () => {

        abilityBeingEdited =
          null;

        closeModal(
          'abilityEditModal'
        );

      }

    );

  }

}


/* =====================================================
   INVENTORY EVENTS
   ===================================================== */

function connectInventoryControls(){

  const addButton =
    byId(
      'addInventoryButton'
    );


  if(addButton){

    addButton.addEventListener(
      'click',
      openNewInventoryItem
    );

  }


  const grid =
    byId(
      'characterInventoryGrid'
    );


  if(grid){

    grid.addEventListener(
      'click',
      event => {

        const button =
          event.target.closest(
            '[data-inventory-action]'
          );


        if(!button){
          return;
        }


        const action =
          button.dataset.inventoryAction;


        const itemId =
          button.dataset.itemId;


        if(action === 'edit'){

          openInventoryEditor(
            itemId
          );

        }


        if(action === 'remove'){

          removeInventoryItem(
            itemId
          );

        }

      }

    );

  }


  const save =
    byId(
      'saveInventoryButton'
    );


  if(save){

    save.addEventListener(
      'click',
      saveInventoryItem
    );

  }


  const cancel =
    byId(
      'cancelInventoryButton'
    );


  if(cancel){

    cancel.addEventListener(
      'click',
      () => {

        inventoryItemBeingEdited =
          null;

        closeModal(
          'inventoryModal'
        );

      }

    );

  }

}


/* =====================================================
   INSPIRATION EVENT
   ===================================================== */

function connectInspirationControl(){

  const button =
    byId(
      'inspirationButton'
    );


  if(button){

    button.addEventListener(
      'click',
      toggleHeroicInspiration
    );

  }

}


/* =====================================================
   ROLL MODAL EVENTS
   ===================================================== */

function connectRollModal(){

  const close =
    byId(
      'rollClose'
    );


  if(close){

    close.addEventListener(
      'click',
      closeRollModal
    );

  }


  const modal =
    byId(
      'rollModal'
    );


  if(modal){

    modal.addEventListener(
      'click',
      event => {

        if(
          event.target === modal
        ){

          closeRollModal();

        }

      }

    );

  }

}


/* =====================================================
   REALIGNMENT EVENT
   ===================================================== */

function connectRealignmentControls(){

  const complete =
    byId(
      'completeRealignmentButton'
    );


  if(complete){

    complete.addEventListener(
      'click',
      completeRealignment
    );

  }

}


/* =====================================================
   GENERIC MODAL BACKDROP CLOSING
   ===================================================== */

function connectModalBackdrops(){

  [
    'abilityCatalogModal',
    'abilityEditModal',
    'inventoryModal'
  ]
  .forEach(
    id => {

      const modal =
        byId(id);


      if(!modal){
        return;
      }


      modal.addEventListener(
        'click',
        event => {

          if(
            event.target === modal
          ){

            closeModal(
              id
            );

          }

        }

      );

    }

  );

}

/* =====================================================
   REALTIME PERFORMANCE RECORD

   Keeps the active Cast Performance Record synchronized
   when the DM changes:
   - Core character stats
   - NSBI skill dice
   - Heroic Inspiration
   - Ability assignments
   - Master ability definitions
   - Inventory
   ===================================================== */

let castCharacterRealtimeClient =
  null;

let castCharacterRealtimeChannel =
  null;

let castCharacterRealtimeTimer =
  null;


function connectCastCharacterRealtime(){

  if(
    !currentCharacter ||
    !window.supabase ||
    !window.supabase.createClient
  ){

    return;

  }


  /*
    Use the same anonymous/public Supabase path
    already used by cast-character.js.
  */

  if(!castCharacterRealtimeClient){

    castCharacterRealtimeClient =
      window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
      );

  }


  if(castCharacterRealtimeChannel){

    castCharacterRealtimeClient
      .removeChannel(
        castCharacterRealtimeChannel
      );

  }


  const characterId =
    currentCharacter.id;


  function refreshCastCharacterLive(){

    clearTimeout(
      castCharacterRealtimeTimer
    );


    castCharacterRealtimeTimer =
      setTimeout(
        async () => {

          try{

            await loadCastCharacter();

          }
          catch(error){

            console.error(
              'Live Performance Record refresh failed:',
              error
            );

          }

        },
        150
      );

  }


  castCharacterRealtimeChannel =
    castCharacterRealtimeClient

      .channel(
        `cast-character-live-${characterId}`
      )

      .on(
        'postgres_changes',
        {
          event:'UPDATE',
          schema:'public',
          table:'characters',
          filter:`id=eq.${characterId}`
        },
        refreshCastCharacterLive
      )

      .on(
        'postgres_changes',
        {
          event:'*',
          schema:'public',
          table:'character_abilities',
          filter:`character_id=eq.${characterId}`
        },
        refreshCastCharacterLive
      )

      .on(
        'postgres_changes',
        {
          event:'*',
          schema:'public',
          table:'inventory',
          filter:`character_id=eq.${characterId}`
        },
        refreshCastCharacterLive
      )

      /*
        Ability definitions are global.

        If the DM edits Smile Protocol, for example,
        any player currently displaying it should
        immediately receive the new definition.
      */

      .on(
        'postgres_changes',
        {
          event:'*',
          schema:'public',
          table:'abilities'
        },
        refreshCastCharacterLive
      )

      .subscribe(
        (
          status,
          error
        ) => {

          console.log(
            'Cast Performance realtime status:',
            status
          );


          if(error){

            console.error(
              'Cast Performance realtime error:',
              error
            );

          }

        }
      );

}

/* =====================================================
   INITIALIZE
   ===================================================== */

function initializeCastCharacter(){

  connectCoreStatControls();

  connectSkillButtons();

  connectAbilityControls();

  connectInventoryControls();

  connectInspirationControl();

  connectRollModal();

  connectRealignmentControls();

  connectModalBackdrops();

loadCastCharacter()
  .then(
    connectCastCharacterRealtime
  );

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
    initializeCastCharacter
  );

}
else{

  initializeCastCharacter();

}

/* =====================================================
   DOWNTIME TICKET TRACKER
   CAST PERFORMANCE RECORD

   Stored on:
   characters.downtime_tickets

   Hero Cast and Hero Unbound share the same character,
   so they automatically share Tickets.

   Villain Cast and Villain Unbound do the same.
   ===================================================== */

(function(){

  /* =====================================================
     INSERT TRACKER
     ===================================================== */

  function ensureCastTicketTracker(){

    if(
      document.getElementById(
        'sheetDowntimeTickets'
      )
    ){
      return;
    }


    const characterMeta =
      document.querySelector(
        '#characterView .character-meta'
      );


    if(!characterMeta){
      return;
    }


    const ticketStat =
      document.createElement(
        'span'
      );


    ticketStat.className =
      'character-stat';


    ticketStat.innerHTML = `

      <span class="character-stat-label">
        Tickets
      </span>


      <div class="character-stat-controls">

        <button
          type="button"
          data-ticket-action="decrease"
          aria-label="Spend one Downtime Ticket"
        >
          −
        </button>


        <strong
          id="sheetDowntimeTickets"
        >
          0
        </strong>


        <button
          type="button"
          data-ticket-action="increase"
          aria-label="Add one Downtime Ticket"
        >
          +
        </button>

      </div>

    `;


    characterMeta.appendChild(
      ticketStat
    );


    ticketStat
      .querySelectorAll(
        '[data-ticket-action]'
      )
      .forEach(
        button => {

          button.addEventListener(
            'click',
            async ()=>{

              if(!currentCharacter){
                return;
              }


              const direction =
                button.dataset.ticketAction ===
                'increase'
                  ? 1
                  : -1;


              const current =
                Math.max(
                  0,
                  Number(
                    currentCharacter
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


              button.disabled =
                true;


              try{

                await updateCharacterField(
                  'downtime_tickets',
                  next
                );


                renderCastTickets();

              }
              catch(error){

                showError(
                  'Downtime Tickets could not be updated.',
                  error
                );

              }
              finally{

                button.disabled =
                  false;

              }

            }
          );

        }
      );


    renderCastTickets();

  }


  /* =====================================================
     RENDER
     ===================================================== */

  function renderCastTickets(){

    const value =
      document.getElementById(
        'sheetDowntimeTickets'
      );


    if(
      !value ||
      !currentCharacter
    ){
      return;
    }


    value.textContent =
      String(
        Math.max(
          0,
          Number(
            currentCharacter
              .downtime_tickets ??
            0
          )
        )
      );

  }


  /* =====================================================
     HOOK INTO EXISTING CHARACTER RENDER
     ===================================================== */

  const originalRenderCharacterHeader =
    renderCharacterHeader;


  renderCharacterHeader =
    function(){

      originalRenderCharacterHeader();


      ensureCastTicketTracker();


      renderCastTickets();

    };


  /*
    Also attempt once immediately in case the
    Performance Record markup is already available.
  */

  ensureCastTicketTracker();

})();
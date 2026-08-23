/* =====================================================
   EPCOT DND
   COMPANY FILE ENGINE

   CAST IDENTITY:
   - display_name
   - image_url

   UNBOUND IDENTITY:
   - unbound_display_name
   - unbound_image_url

   BASIC PROFILE:
   - Title
   - Company
   - Magic Domain
   - Neighborhood
   - Cohort
   - Explorer Member Code
   - Languages
   - Physical information

   PERSONAL FILE:
   - Details
   - Secrets
   - Backstory
   - Bond
   - Flaws
   - Ideals
   - Appearance
   - Personality Traits
   ===================================================== */


/* =====================================================
   OPTIONS
   ===================================================== */

const COMPANY_FILE_COMPANIES = [
  'Progress Dynamics',
  'VistaCorp',
  'Monsanto',
  'Fordham Mobility',
  'WestHouse Systems',
  'Disney Enterprises',
  'Unaffiliated'
];


const COMPANY_FILE_DOMAINS = [
  'Bravura',
  'Starpath',
  'Craftspark',
  'Mindwave',
  'Heartline',
  'Dreamlight'
];


const COMPANY_FILE_NEIGHBORHOODS = [
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


const COMPANY_FILE_NEIGHBORHOOD_CODES = {
  'Anderson Ward': '1101',
  'Blair Quarter': '1102',
  'Davis Vista': '1103',
  'Ryman Fields': '1104',
  'Atencio Reach': '1105',
  'Toombs Gardens': '1106',
  'Gurr District': '1107',
  'Joerger Commons': '1108',
  'Chao Terrace': '1109',
  'Coats Line': '1110',
  'Gracey Foundry': '1111',
  'Broggie Yard': '1112',
  'Irvine Passage': '1113',
  'McKim Portal': '1114',
  'Chapman Gate': '1115',
  'Baxter Forge': '1116',
  'Crump Works': '1117',
  'Burns Gardens': '1118'
};


const COMPANY_FILE_LANGUAGES = [
  'Florarentian',
  'Durish',
  'Imaginese',
  'Hearthling',
  'Founderscript',
  'Luminial',
  'Contractum',
  'Verdigenous'
];


const COMPANY_FILE_PRIVATE_FIELDS = [
  'details',
  'secrets',
  'backstory',
  'bond',
  'flaws',
  'ideals',
  'appearance',
  'personality_traits'
];


/* =====================================================
   STATE
   ===================================================== */

let companyFileCharacter = null;

let companyFileProfile = null;

let companyFilePrivate = null;


/* =====================================================
   BASIC HELPERS
   ===================================================== */

function companyById(id){

  return document.getElementById(id);

}


function companyEscapeHtml(value){

  return String(
    value ?? ''
  )
  .replaceAll('&','&amp;')
  .replaceAll('<','&lt;')
  .replaceAll('>','&gt;')
  .replaceAll('"','&quot;')
  .replaceAll("'","&#039;");

}


function showCompanyFileError(
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
   LOAD COMPANY FILE CSS AUTOMATICALLY

   CAST:
   Uses the standard Company File stylesheet.

   UNBOUND:
   Uses hero-unbound-company-file.css, which is already
   linked directly in Hero Unbound World.html.

   This prevents the old Cast stylesheet from loading
   afterward and overriding the Unbound visual system.
   ===================================================== */

function ensureCompanyFileStyles(){

  const reality =
    (
      document.body.dataset.reality ||
      'cast'
    ).toLowerCase();


  /* ===============================================
     UNBOUND

     The Unbound page already loads:
     hero-unbound-company-file.css

     Do NOT inject the Cast Company File CSS.
     =============================================== */

  if(
    reality === 'unbound'
  ){

    return;

  }


  /* ===============================================
     CAST

     Avoid loading the stylesheet twice.
     =============================================== */

  if(
    document.querySelector(
      'link[data-company-file-css]'
    )
  ){

    return;

  }


  const link =
    document.createElement(
      'link'
    );


  link.rel =
    'stylesheet';


  link.href =
    'assets/css/company-file.css';


  link.dataset.companyFileCss =
    'true';


  document.head.appendChild(
    link
  );

}

/* =====================================================
   SAFE RICH TEXT
   ===================================================== */

function sanitizeCompanyText(html){

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
   SELECT OPTIONS
   ===================================================== */

function companyOptions(
  values,
  selected,
  placeholder
){

  return `
    <option value="">
      ${placeholder}
    </option>

    ${
      values.map(
        value => `
          <option
            value="${companyEscapeHtml(value)}"
            ${
              value === selected
                ? 'selected'
                : ''
            }
          >
            ${companyEscapeHtml(value)}
          </option>
        `
      ).join('')
    }
  `;

}


/* =====================================================
   LOAD CHARACTER
   ===================================================== */

async function loadCompanyFileCharacter(){

  const shellCharacter =
    window.epcotPlayer?.getCharacter?.();


  if(
    shellCharacter?.id
  ){

    const rows =
      await supabaseGet(
        `characters?select=*&id=eq.${encodeURIComponent(shellCharacter.id)}&limit=1`
      );


    if(!rows.length){

      throw new Error(
        'The authenticated character could not be found.'
      );

    }


    companyFileCharacter =
      rows[0];


    return;

  }


  const characterId =
    document.body.dataset.characterId;


  if(characterId){

    const rows =
      await supabaseGet(
        `characters?select=*&id=eq.${encodeURIComponent(characterId)}&limit=1`
      );


    if(rows.length){

      companyFileCharacter =
        rows[0];


      return;

    }

  }


  const storedCharacterId =
    sessionStorage.getItem(
      'epcot-active-character-id'
    );


  if(!storedCharacterId){

    throw new Error(
      'No active character ID could be found.'
    );

  }


  const rows =
    await supabaseGet(
      `characters?select=*&id=eq.${encodeURIComponent(storedCharacterId)}&limit=1`
    );


  if(!rows.length){

    throw new Error(
      'The active character could not be found.'
    );

  }


  companyFileCharacter =
    rows[0];

}


/* =====================================================
   LOAD FILE DATA
   ===================================================== */

async function loadCompanyFileData(){

  const profileRows =
    await supabaseGet(
      `company_files?select=*&character_id=eq.${companyFileCharacter.id}&limit=1`
    );


  companyFileProfile =
    profileRows[0] ||
    null;


  const privateRows =
    await supabaseGet(
      `company_file_private?select=*&character_id=eq.${companyFileCharacter.id}&limit=1`
    );


  companyFilePrivate =
    privateRows[0] ||
    null;


  if(companyFileProfile){

    await ensureExplorerMemberCode();

  }


  renderCompanyFile();

}


/* =====================================================
   PROFILE VALUE
   ===================================================== */

function companyProfileValue(
  field,
  fallback = ''
){

  const value =
    companyFileProfile?.[field];


  if(
    value === null ||
    value === undefined ||
    value === ''
  ){

    return fallback;

  }


  return value;

}


/* =====================================================
   IDENTITY HELPERS
   ===================================================== */

function getCompanyCastName(){

  return companyProfileValue(
    'display_name',
    'Unnamed Character'
  );

}


function getCompanyCastImage(){

  return companyProfileValue(
    'image_url',
    ''
  );

}


function getCompanyUnboundName(){

  return companyProfileValue(
    'unbound_display_name',
    getCompanyCastName()
  );

}


function getCompanyUnboundImage(){

  return companyProfileValue(
    'unbound_image_url',
    getCompanyCastImage()
  );

}


/*
  Shared helpers for Journal / Home / future modules.
*/

window.getCompanyCastIdentity =
  function(){

    return {
      name:
        getCompanyCastName(),

      image:
        getCompanyCastImage()
    };

  };


window.getCompanyUnboundIdentity =
  function(){

    return {
      name:
        getCompanyUnboundName(),

      image:
        getCompanyUnboundImage()
    };

  };


/* =====================================================
   EXPLORER ID
   ===================================================== */

function createExplorerMemberCode(){

  return String(
    Math.floor(
      10000 + Math.random() * 90000
    )
  );

}


function getExplorerNameCode(
  displayName
){

  const letters =
    String(
      displayName || ''
    )
    .replace(
      /[^a-zA-Z]/g,
      ''
    )
    .toUpperCase();


  return (
    letters.slice(0,3) ||
    'EXP'
  )
  .padEnd(
    3,
    'X'
  );

}


function getCompanyExplorerId(
  profile = companyFileProfile,
  character = companyFileCharacter
){

  if(!character){
    return '';
  }


  const displayName =
    profile?.display_name ||
    profile?.unbound_display_name ||
    '';


  const neighborhood =
    profile?.neighborhood ||
    '';


  const neighborhoodCode =
    COMPANY_FILE_NEIGHBORHOOD_CODES[
      neighborhood
    ] ||
    '0000';


  const memberCode =
    profile?.explorer_member_code ||
    '';


  if(!memberCode){
    return '';
  }


  return [
    getExplorerNameCode(
      displayName
    ),
    neighborhoodCode,
    memberCode
  ].join('-');

}


window.getCompanyExplorerId =
  getCompanyExplorerId;


async function ensureExplorerMemberCode(){

  if(
    !companyFileProfile ||
    companyFileProfile.explorer_member_code
  ){
    return;
  }


  const explorerMemberCode =
    createExplorerMemberCode();


  const updated =
    await supabasePatch(
      `company_files?id=eq.${companyFileProfile.id}`,
      {
        explorer_member_code:
          explorerMemberCode,

        updated_at:
          new Date().toISOString()
      }
    );


  companyFileProfile =
    updated[0] ||
    {
      ...companyFileProfile,

      explorer_member_code:
        explorerMemberCode
    };

}


/* =====================================================
   LANGUAGES
   ===================================================== */

function getCompanyLanguages(){

  const languages =
    companyFileProfile?.languages;


  if(!Array.isArray(languages)){

    return [];

  }


  return languages.filter(
    language =>
      COMPANY_FILE_LANGUAGES.includes(
        language
      )
  );

}


function getSelectedCompanyLanguages(){

  return Array.from(
    document.querySelectorAll(
      '[data-company-language]:checked'
    )
  )
  .map(
    checkbox =>
      checkbox.value
  )
  .filter(
    language =>
      COMPANY_FILE_LANGUAGES.includes(
        language
      )
  );

}


function setCompanyLanguageSelections(){

  const selected =
    new Set(
      getCompanyLanguages()
    );


  document
    .querySelectorAll(
      '[data-company-language]'
    )
    .forEach(
      checkbox => {

        checkbox.checked =
          selected.has(
            checkbox.value
          );

      }
    );

}


function renderCompanyLanguages(){

  const element =
    companyById(
      'companyFileLanguages'
    );


  if(!element){
    return;
  }


  const languages =
    getCompanyLanguages();


  const displayLanguages = [
    'Common Voice',
    ...languages
  ];


  element.textContent =
    displayLanguages.join(
      ' • '
    );

}


/* =====================================================
   RENDER BASIC PROFILE
   ===================================================== */

function renderCompanyFile(){

  if(!companyFileCharacter){
    return;
  }


  const displayName =
    getCompanyCastName();


  const name =
    companyById(
      'companyFileName'
    );


  if(name){

    name.textContent =
      displayName;

  }


  const title =
    companyById(
      'companyFileTitle'
    );


  if(title){

    title.textContent =
      companyProfileValue(
        'title',
        'No title listed'
      );

  }


  const image =
    companyById(
      'companyFileImage'
    );


  if(image){

    const imageUrl =
      getCompanyCastImage();


    image.innerHTML =
      imageUrl
        ? `
            <img
              src="${companyEscapeHtml(imageUrl)}"
              alt="${companyEscapeHtml(displayName)}"
            >
          `
        : `
            <div class="company-file-image-placeholder">
              ${companyEscapeHtml(
                displayName
                  .charAt(0)
                  .toUpperCase()
              )}
            </div>
          `;

  }


  /*
    Optional Unbound identity preview.
    Safe on pages that do not contain these IDs.
  */

  const unboundName =
    companyById(
      'companyFileUnboundName'
    );


  if(unboundName){

    unboundName.textContent =
      getCompanyUnboundName();

  }


  const unboundImage =
    companyById(
      'companyFileUnboundImage'
    );


  if(unboundImage){

    const imageUrl =
      getCompanyUnboundImage();


    const nameValue =
      getCompanyUnboundName();


    unboundImage.innerHTML =
      imageUrl
        ? `
            <img
              src="${companyEscapeHtml(imageUrl)}"
              alt="${companyEscapeHtml(nameValue)}"
            >
          `
        : `
            <div class="company-file-image-placeholder">
              ${companyEscapeHtml(
                nameValue
                  .charAt(0)
                  .toUpperCase() ||
                '?'
              )}
            </div>
          `;

  }


  renderCompanyText(
    'companyFileCompany',
    companyProfileValue(
      'company_association',
      'Not listed'
    )
  );


  renderCompanyText(
    'companyFileDomain',
    companyProfileValue(
      'magic_domain',
      'Not listed'
    )
  );


  renderCompanyText(
    'companyFileNeighborhood',
    companyProfileValue(
      'neighborhood',
      'Not listed'
    )
  );


  renderCompanyText(
    'companyFileCohort',
    companyProfileValue(
      'cohort',
      'Not listed'
    )
  );


  renderCompanyText(
    'companyFileAge',
    companyProfileValue(
      'age',
      '—'
    )
  );


  renderCompanyText(
    'companyFileHeight',
    companyProfileValue(
      'height',
      '—'
    )
  );


  renderCompanyText(
    'companyFileWeight',
    companyProfileValue(
      'weight',
      '—'
    )
  );


  renderCompanyText(
    'companyFileEyes',
    companyProfileValue(
      'eye_color',
      '—'
    )
  );


  renderCompanyText(
    'companyFileGender',
    companyProfileValue(
      'gender',
      '—'
    )
  );


  renderCompanyText(
    'companyFileHair',
    companyProfileValue(
      'hair_color',
      '—'
    )
  );


  renderCompanyText(
    'companyFileSkin',
    companyProfileValue(
      'skin_color',
      '—'
    )
  );


  renderCompanyLanguages();


  COMPANY_FILE_PRIVATE_FIELDS
    .forEach(
      field => {

        const editor =
          companyById(
            `companyPrivate_${field}`
          );


        if(editor){

          editor.innerHTML =
            sanitizeCompanyText(
              companyFilePrivate?.[field] ||
              ''
            );

        }

      }
    );

}


/* =====================================================
   TEXT HELPER
   ===================================================== */

function renderCompanyText(
  id,
  value
){

  const element =
    companyById(id);


  if(element){

    element.textContent =
      value;

  }

}


/* =====================================================
   OPEN PROFILE EDITOR
   ===================================================== */

function openCompanyProfileEditor(){

  if(!companyFileCharacter){
    return;
  }


  companyById(
    'companyEditName'
  ).value =
    getCompanyCastName();


  companyById(
    'companyEditImage'
  ).value =
    companyProfileValue(
      'image_url',
      ''
    );


  const unboundName =
    companyById(
      'companyEditUnboundName'
    );


  if(unboundName){

    unboundName.value =
      companyProfileValue(
        'unbound_display_name',
        ''
      );

  }


  const unboundImage =
    companyById(
      'companyEditUnboundImage'
    );


  if(unboundImage){

    unboundImage.value =
      companyProfileValue(
        'unbound_image_url',
        ''
      );

  }


  companyById(
    'companyEditTitle'
  ).value =
    companyProfileValue(
      'title',
      ''
    );


  const cohortInput =
    companyById(
      'companyEditCohort'
    );


  if(cohortInput){

    cohortInput.value =
      companyProfileValue(
        'cohort',
        ''
      );

  }


  companyById(
    'companyEditCompany'
  ).innerHTML =
    companyOptions(
      COMPANY_FILE_COMPANIES,
      companyProfileValue(
        'company_association',
        ''
      ),
      'Choose company...'
    );


  companyById(
    'companyEditDomain'
  ).innerHTML =
    companyOptions(
      COMPANY_FILE_DOMAINS,
      companyProfileValue(
        'magic_domain',
        ''
      ),
      'Choose Magic Domain...'
    );


  companyById(
    'companyEditNeighborhood'
  ).innerHTML =
    companyOptions(
      COMPANY_FILE_NEIGHBORHOODS,
      companyProfileValue(
        'neighborhood',
        ''
      ),
      'Choose neighborhood...'
    );


  companyById(
    'companyEditAge'
  ).value =
    companyProfileValue(
      'age',
      ''
    );


  companyById(
    'companyEditWeight'
  ).value =
    companyProfileValue(
      'weight',
      ''
    );


  companyById(
    'companyEditHeight'
  ).value =
    companyProfileValue(
      'height',
      ''
    );


  companyById(
    'companyEditEyes'
  ).value =
    companyProfileValue(
      'eye_color',
      ''
    );


  companyById(
    'companyEditGender'
  ).value =
    companyProfileValue(
      'gender',
      ''
    );


  companyById(
    'companyEditHair'
  ).value =
    companyProfileValue(
      'hair_color',
      ''
    );


  companyById(
    'companyEditSkin'
  ).value =
    companyProfileValue(
      'skin_color',
      ''
    );


  setCompanyLanguageSelections();


  openCompanyModal(
    'companyProfileModal'
  );

}


/* =====================================================
   SAVE BASIC PROFILE
   ===================================================== */

async function saveCompanyProfile(){

  if(!companyFileCharacter){
    return;
  }


  const body = {

    character_id:
      companyFileCharacter.id,

    image_url:
      companyById(
        'companyEditImage'
      )?.value.trim() ||
      null,

    display_name:
      companyById(
        'companyEditName'
      )?.value.trim() ||
      companyFileCharacter.name,

    unbound_display_name:
      companyById(
        'companyEditUnboundName'
      )?.value.trim() ||
      null,

    unbound_image_url:
      companyById(
        'companyEditUnboundImage'
      )?.value.trim() ||
      null,

    title:
      companyById(
        'companyEditTitle'
      )?.value.trim() ||
      null,

    cohort:
      companyById(
        'companyEditCohort'
      )?.value.trim() ||
      null,

    explorer_member_code:
      companyFileProfile?.explorer_member_code ||
      createExplorerMemberCode(),

    company_association:
      companyById(
        'companyEditCompany'
      )?.value ||
      null,

    magic_domain:
      companyById(
        'companyEditDomain'
      )?.value ||
      null,

    neighborhood:
      companyById(
        'companyEditNeighborhood'
      )?.value ||
      null,

    languages:
      getSelectedCompanyLanguages(),

    age:
      companyById(
        'companyEditAge'
      )?.value
        ? Number(
            companyById(
              'companyEditAge'
            ).value
          )
        : null,

    weight:
      companyById(
        'companyEditWeight'
      )?.value.trim() ||
      null,

    height:
      companyById(
        'companyEditHeight'
      )?.value.trim() ||
      null,

    eye_color:
      companyById(
        'companyEditEyes'
      )?.value.trim() ||
      null,

    gender:
      companyById(
        'companyEditGender'
      )?.value.trim() ||
      null,

    hair_color:
      companyById(
        'companyEditHair'
      )?.value.trim() ||
      null,

    skin_color:
      companyById(
        'companyEditSkin'
      )?.value.trim() ||
      null,

    updated_at:
      new Date().toISOString()

  };


  try{

    if(companyFileProfile){

      const updated =
        await supabasePatch(
          `company_files?id=eq.${companyFileProfile.id}`,
          body
        );


      companyFileProfile =
        updated[0] ||
        {
          ...companyFileProfile,
          ...body
        };

    }
    else{

      const inserted =
        await supabasePost(
          'company_files',
          body
        );


      if(!inserted[0]){

        throw new Error(
          'Supabase did not return the Company File.'
        );

      }


      companyFileProfile =
        inserted[0];

    }


    closeCompanyModal(
      'companyProfileModal'
    );


    renderCompanyFile();

  }
  catch(error){

    showCompanyFileError(
      'Company File could not be saved.',
      error
    );

  }

}


/* =====================================================
   SAVE PERSONAL FILE
   ===================================================== */

async function saveCompanyPrivateFile(){

  if(!companyFileCharacter){
    return;
  }


  const body = {

    character_id:
      companyFileCharacter.id,

    updated_at:
      new Date().toISOString()

  };


  COMPANY_FILE_PRIVATE_FIELDS
    .forEach(
      field => {

        body[field] =
          sanitizeCompanyText(
            companyById(
              `companyPrivate_${field}`
            )?.innerHTML ||
            ''
          );

      }
    );


  const button =
    companyById(
      'saveCompanyPrivateButton'
    );


  if(button){

    button.disabled =
      true;

    button.textContent =
      'Saving...';

  }


  try{

    if(companyFilePrivate){

      const updated =
        await supabasePatch(
          `company_file_private?id=eq.${companyFilePrivate.id}`,
          body
        );


      companyFilePrivate =
        updated[0] ||
        {
          ...companyFilePrivate,
          ...body
        };

    }
    else{

      const inserted =
        await supabasePost(
          'company_file_private',
          body
        );


      if(!inserted[0]){

        throw new Error(
          'Supabase did not return the Personal File.'
        );

      }


      companyFilePrivate =
        inserted[0];

    }


    renderCompanyFile();


    if(button){

      button.textContent =
        'Saved';


      setTimeout(
        () => {

          button.textContent =
            'Save Personal File';

        },
        1200
      );

    }

  }
  catch(error){

    showCompanyFileError(
      'Personal File could not be saved.',
      error
    );


    if(button){

      button.textContent =
        'Save Personal File';

    }

  }
  finally{

    if(button){

      button.disabled =
        false;

    }

  }

}


/* =====================================================
   FORMATTING TOOLBAR
   ===================================================== */

function connectCompanyFormatting(){

  document
    .querySelectorAll(
      '[data-company-command]'
    )
    .forEach(
      button => {

        button.addEventListener(
          'click',
          () => {

            const target =
              button.dataset.editorTarget;


            const editor =
              companyById(
                target
              );


            if(!editor){
              return;
            }


            editor.focus();


            document.execCommand(
              button.dataset.companyCommand,
              false,
              null
            );

          }
        );

      }
    );

}


/* =====================================================
   MODALS
   ===================================================== */

function openCompanyModal(id){

  const modal =
    companyById(id);


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


function closeCompanyModal(id){

  const modal =
    companyById(id);


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
   EVENTS
   ===================================================== */

function connectCompanyFileEvents(){

  const edit =
    companyById(
      'editCompanyProfileButton'
    );


  if(edit){

    edit.addEventListener(
      'click',
      openCompanyProfileEditor
    );

  }


  const save =
    companyById(
      'saveCompanyProfileButton'
    );


  if(save){

    save.addEventListener(
      'click',
      saveCompanyProfile
    );

  }


  const cancel =
    companyById(
      'cancelCompanyProfileButton'
    );


  if(cancel){

    cancel.addEventListener(
      'click',
      () => {

        closeCompanyModal(
          'companyProfileModal'
        );

      }
    );

  }


  const savePrivate =
    companyById(
      'saveCompanyPrivateButton'
    );


  if(savePrivate){

    savePrivate.addEventListener(
      'click',
      saveCompanyPrivateFile
    );

  }


  const modal =
    companyById(
      'companyProfileModal'
    );


  if(modal){

    modal.addEventListener(
      'click',
      event => {

        if(
          event.target === modal
        ){

          closeCompanyModal(
            'companyProfileModal'
          );

        }

      }
    );

  }


  connectCompanyFormatting();

}


/* =====================================================
   INITIALIZE
   ===================================================== */

async function initializeCompanyFile(){

  if(
    !companyById(
      'companyFileView'
    )
  ){

    return;

  }


  ensureCompanyFileStyles();


  connectCompanyFileEvents();


  try{

    await loadCompanyFileCharacter();

    await loadCompanyFileData();

  }
  catch(error){

    showCompanyFileError(
      'Company File could not be loaded.',
      error
    );

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
    initializeCompanyFile
  );

}
else{

  initializeCompanyFile();

}
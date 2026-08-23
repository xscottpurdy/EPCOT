/* =====================================================
   EPCOT DND
   SHARED JOURNAL ENGINE

   Shared by all player worlds.

   Features:
   - Campaign-specific journal
   - Cast / Unbound identity snapshot
   - Newest posts first
   - Search
   - Infinite older-post loading
   - Supabase Realtime
   - Edit/Delete for your own posts
   ===================================================== */


/* =====================================================
   SETTINGS / STATE
   ===================================================== */

const JOURNAL_PAGE_SIZE = 25;
const JOURNAL_MAX_LENGTH = 2000;

let journalCurrentAuthor = null;
let journalPosts = [];
let journalOffset = 0;
let journalHasMore = true;
let journalLoading = false;
let journalSearchTerm = '';
let journalRealtimeChannel = null;
let journalSearchTimer = null;
let journalRealtimeRefreshTimer = null;
let journalInitialized = false;
let journalEventsConnected = false;


/* =====================================================
   HELPERS
   ===================================================== */

function journalById(id){
  return document.getElementById(id);
}


function getJournalCampaign(){
  return String(
    document.body.dataset.campaign || 'hero'
  ).toLowerCase() === 'villain'
    ? 'villain'
    : 'hero';
}


function getJournalReality(){
  return String(
    document.body.dataset.reality || 'cast'
  ).toLowerCase() === 'unbound'
    ? 'unbound'
    : 'cast';
}


function getJournalCharacterId(){
  return (
    window.epcotPlayer?.getCharacter?.()?.id ||
    document.body.dataset.characterId ||
    sessionStorage.getItem('epcot-active-character-id') ||
    ''
  );
}


function journalEscapeHtml(value){
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}


function showJournalError(title, error){
  console.error(title, error);

  alert(
    `${title}\n\n${error?.message || String(error)}`
  );
}


function journalPostBelongsToCurrentCharacter(post){
  const characterId =
    getJournalCharacterId();

  return Boolean(
    characterId &&
    post?.author_character_id === characterId
  );
}


/* =====================================================
   AUTHOR
   ===================================================== */

async function loadJournalAuthor(){

  const characterId =
    getJournalCharacterId();


  if(!characterId){

    throw new Error(
      'No active character ID could be found for the Journal.'
    );

  }


  const characters =
    await supabaseGet(
      `characters?select=*&id=eq.${encodeURIComponent(characterId)}&limit=1`
    );


  if(!characters.length){

    throw new Error(
      'The active character could not be found for the Journal.'
    );

  }


  journalCurrentAuthor =
    characters[0];


  const profiles =
    await supabaseGet(
      `company_files?select=*&character_id=eq.${encodeURIComponent(characterId)}&limit=1`
    );


  journalCurrentAuthor.company_profile =
    profiles[0] || null;


  renderJournalComposerIdentity();

}


function getJournalAuthorName(){

  if(!journalCurrentAuthor){
    return '';
  }


  const profile =
    journalCurrentAuthor.company_profile;


  if(
    getJournalReality() ===
    'unbound'
  ){

    return (
      profile?.unbound_display_name ||
      profile?.display_name ||
      'Unnamed Character'
    );

  }


  return (
    profile?.display_name ||
    profile?.unbound_display_name ||
    'Unnamed Character'
  );

}


function getJournalAuthorImage(){

  if(!journalCurrentAuthor){
    return '';
  }


  const profile =
    journalCurrentAuthor.company_profile;


  if(
    getJournalReality() ===
    'unbound'
  ){

    return (
      profile?.unbound_image_url ||
      profile?.image_url ||
      ''
    );

  }


  return (
    profile?.image_url ||
    profile?.unbound_image_url ||
    ''
  );

}


function renderJournalComposerIdentity(){

  const displayName =
    getJournalAuthorName();


  const image =
    getJournalAuthorImage();


  const name =
    journalById(
      'journalComposerName'
    );


  const portrait =
    journalById(
      'journalComposerPortrait'
    );


  if(name){

    name.textContent =
      displayName;

  }


  if(portrait){

    portrait.innerHTML =
      image
        ? `
            <img
              src="${journalEscapeHtml(image)}"
              alt="${journalEscapeHtml(displayName)}"
            >
          `
        : `
            <div class="journal-avatar-placeholder">

              ${journalEscapeHtml(
                displayName
                  .charAt(0)
                  .toUpperCase() || '?'
              )}

            </div>
          `;

  }

}


/* =====================================================
   DISPLAY HELPERS
   ===================================================== */

function formatJournalTimestamp(timestamp){

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
      year:'numeric',
      hour:'numeric',
      minute:'2-digit'
    }
  );

}


function getJournalPostAvatar(post){

  if(post.author_image_url){

    return `
      <img
        src="${journalEscapeHtml(post.author_image_url)}"
        alt="${journalEscapeHtml(post.author_name)}"
      >
    `;

  }


  return `
    <div class="journal-avatar-placeholder">

      ${journalEscapeHtml(
        post.author_name
          ?.charAt(0)
          ?.toUpperCase() ||
        '?'
      )}

    </div>
  `;

}


/* =====================================================
   ACTION STYLES
   ===================================================== */

function installJournalActionStyles(){

  if(
    document.getElementById(
      'journalActionStyles'
    )
  ){
    return;
  }


  const style =
    document.createElement(
      'style'
    );


  style.id =
    'journalActionStyles';


  style.textContent = `

    /* ===================================================
       POST ACTION BUTTONS
       =================================================== */

    .journal-post-actions{
      display:flex;
      align-items:center;
      gap:6px;
      margin-left:auto;
      flex:0 0 auto;
    }


    .journal-post-action{
      appearance:none;

      width:auto !important;
      min-width:0 !important;
      min-height:34px !important;
      height:34px !important;

      padding:0 11px !important;

      display:inline-flex !important;
      align-items:center;
      justify-content:center;

      flex:0 0 auto !important;

      border:
        1px solid
        rgba(120,140,155,.38);

      border-radius:8px;

      background:
        rgba(255,255,255,.88);

      color:#173a56;

      font:inherit;
      font-size:11px;
      font-weight:900;
      line-height:1;

      letter-spacing:.04em;
      text-transform:uppercase;

      cursor:pointer;
    }


    .journal-post-action:hover:not(:disabled){
      transform:
        translateY(-1px);
    }


    .journal-post-action.delete{
      border-color:
        rgba(180,70,70,.38);

      color:#a43636;
    }


    .journal-post-action:disabled{
      opacity:.5;
      cursor:not-allowed;
      transform:none;
    }


    body[data-reality="unbound"]
    .journal-post-action{
      background:#111923;

      border-color:
        rgba(224,179,79,.28);

      color:#eee4d0;
    }


    body[data-reality="unbound"]
    .journal-post-action.delete{
      border-color:
        rgba(214,78,94,.48);

      color:#ff7382;
    }


    /* ===================================================
       EDIT DIALOG
       =================================================== */

    .journal-edit-dialog{

      box-sizing:border-box;

      width:
        min(
          620px,
          calc(100vw - 36px)
        );

      max-height:
        calc(100vh - 60px);

      margin:auto;

      padding:0;

      overflow:hidden;

      border:
        1px solid
        rgba(23,58,86,.25);

      border-radius:14px;

      background:#fffef8;

      color:#173a56;

      box-shadow:
        0 24px 70px
        rgba(0,0,0,.32);

    }


    .journal-edit-dialog::backdrop{

      background:
        rgba(4,13,21,.68);

      backdrop-filter:
        blur(3px);

    }


    .journal-edit-dialog-inner{

      padding:
        18px;

    }


    .journal-edit-dialog-header{

      display:flex;

      align-items:flex-start;
      justify-content:space-between;

      gap:20px;

      margin-bottom:14px;

    }


    .journal-edit-dialog-title{

      margin:0;

      color:inherit;

      font-size:17px;
      font-weight:900;

    }


    .journal-edit-dialog-subtitle{

      margin-top:3px;

      opacity:.65;

      font-size:11px;
      line-height:1.4;

    }


    .journal-edit-textarea{

      box-sizing:border-box;

      display:block;

      width:100% !important;

      min-height:120px !important;
      height:120px !important;

      max-height:300px !important;

      padding:
        11px
        12px;

      resize:vertical;

      border:
        1px solid
        #9dafb9;

      border-radius:9px;

      background:white;

      color:#152f43;

      font:inherit;

      font-size:15px;

      line-height:1.5;

    }


    .journal-edit-textarea:focus{

      outline:
        3px solid
        rgba(39,166,162,.18);

      border-color:#27a6a2;

    }


    .journal-edit-footer{

      display:flex;

      align-items:center;
      justify-content:space-between;

      gap:14px;

      margin-top:12px;

    }


    .journal-edit-count{

      color:#667783;

      font-size:11px;

      white-space:nowrap;

    }


    .journal-edit-buttons{

      display:flex;

      align-items:center;

      gap:7px;

      margin-left:auto;

    }


    .journal-edit-dialog
    .journal-post-action{

      min-width:76px !important;

    }


    /* ===================================================
       UNBOUND EDIT DIALOG
       =================================================== */

    body[data-reality="unbound"]
    .journal-edit-dialog{

      border:
        1px solid
        rgba(224,179,79,.28);

      border-radius:0;

      background:

        radial-gradient(
          circle at 85% 10%,
          rgba(199,90,145,.08),
          transparent 32%
        ),

        linear-gradient(
          145deg,
          #09131d,
          #141425 65%,
          #081713
        );

      color:#eee4d0;

      box-shadow:
        0 24px 80px
        rgba(0,0,0,.65);

    }


    body[data-reality="unbound"]
    .journal-edit-dialog-title{

      color:#c75a91;

    }


    body[data-reality="unbound"]
    .journal-edit-dialog-subtitle{

      color:#9d978e;

      opacity:1;

    }


    body[data-reality="unbound"]
    .journal-edit-textarea{

      border:
        1px solid
        rgba(224,179,79,.28);

      background:#060d14;

      color:#eee4d0;

    }


    body[data-reality="unbound"]
    .journal-edit-textarea:focus{

      border-color:#2fc5bf;

      outline:
        2px solid
        rgba(47,197,191,.12);

    }


    body[data-reality="unbound"]
    .journal-edit-count{

      color:#9d978e;

    }


    @media(max-width:600px){

      .journal-edit-footer{

        align-items:flex-end;
        flex-direction:column;

      }


      .journal-edit-buttons{

        width:100%;
        margin-left:0;

      }


      .journal-edit-buttons
      .journal-post-action{

        flex:1 1 0 !important;

      }

    }

  `;


  document.head.appendChild(
    style
  );

}

/* =====================================================
   RENDER POSTS
   ===================================================== */

function renderJournalPosts(){

  const feed =
    journalById(
      'journalFeed'
    );


  if(!feed){
    return;
  }


  if(!journalPosts.length){

    feed.innerHTML = `
      <div class="journal-empty">

        <strong>
          No journal entries yet.
        </strong>

        <p>
          Start the conversation above.
        </p>

      </div>
    `;

    return;

  }


  feed.innerHTML =
    journalPosts

      .map(
        post => {


          const canEdit =
            journalPostBelongsToCurrentCharacter(
              post
            );


          return `

            <article
              class="journal-post"
              data-journal-id="${journalEscapeHtml(post.id)}"
            >

              <div class="journal-post-avatar">

                ${getJournalPostAvatar(post)}

              </div>


              <div class="journal-post-content">

                <div class="journal-post-heading">

                  <div>

                    <div class="journal-post-author">

                      ${journalEscapeHtml(
                        post.author_name
                      )}

                    </div>


                    <div class="journal-post-meta">

                      ${journalEscapeHtml(
                        formatJournalTimestamp(
                          post.created_at
                        )
                      )}

                      <span>
                        •
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

                  </div>


                  ${
                    canEdit
                      ? `

                          <div class="journal-post-actions">

                            <button
                              type="button"
                              class="journal-post-action"
                              data-journal-action="edit"
                              data-journal-id="${journalEscapeHtml(post.id)}"
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              class="journal-post-action delete"
                              data-journal-action="delete"
                              data-journal-id="${journalEscapeHtml(post.id)}"
                            >
                              Delete
                            </button>

                          </div>

                        `
                      : ''
                  }

                </div>


                <div
                  class="journal-post-text"
                  data-journal-post-text="${journalEscapeHtml(post.id)}"
                >

                  ${journalEscapeHtml(
                    post.content
                  )}

                </div>

              </div>

            </article>

          `;

        }
      )
      .join('');

}


/* =====================================================
   QUERY
   ===================================================== */

function buildJournalQuery(){

  const campaign =
    getJournalCampaign();


  let path =
    `journal_posts?select=id,campaign,reality_posted,author_character_id,author_name,author_image_url,content,created_at&campaign=eq.${campaign}`;


  if(journalSearchTerm){

    const safeSearch =
      encodeURIComponent(
        journalSearchTerm
          .replace(/[(),]/g, ' ')
          .trim()
      );


    path +=
      `&or=(author_name.ilike.*${safeSearch}*,content.ilike.*${safeSearch}*)`;

  }


  path +=
    `&order=created_at.desc&limit=${JOURNAL_PAGE_SIZE}&offset=${journalOffset}`;


  return path;

}


/* =====================================================
   LOAD POSTS
   ===================================================== */

async function loadJournalPosts(
  reset = false
){

  if(journalLoading){
    return;
  }


  if(
    !journalHasMore &&
    !reset
  ){
    return;
  }


  journalLoading =
    true;


  const loading =
    journalById(
      'journalLoading'
    );


  if(loading){

    loading.hidden =
      false;

  }


  try{

    if(reset){

      journalOffset =
        0;

      journalHasMore =
        true;

    }


    const rows =
      await supabaseGet(
        buildJournalQuery()
      );


    if(reset){

      journalPosts =
        rows;

    }
    else{

      const existingIds =
        new Set(
          journalPosts.map(
            post =>
              post.id
          )
        );


      journalPosts.push(
        ...rows.filter(
          post =>
            !existingIds.has(
              post.id
            )
        )
      );

    }


    journalOffset =
      journalPosts.length;


    journalHasMore =
      rows.length ===
      JOURNAL_PAGE_SIZE;


    renderJournalPosts();


    const end =
      journalById(
        'journalEndMessage'
      );


    if(end){

      end.hidden =
        journalHasMore ||
        journalPosts.length === 0;

    }

  }
  catch(error){

    showJournalError(
      'Journal posts could not be loaded.',
      error
    );

  }
  finally{

    journalLoading =
      false;


    if(loading){

      loading.hidden =
        true;

    }

  }

}


/* =====================================================
   CREATE POST
   ===================================================== */

async function createJournalPost(){

  if(!journalCurrentAuthor){

    alert(
      'Your character is still loading.'
    );

    return;

  }


  const input =
    journalById(
      'journalComposerInput'
    );


  const content =
    input?.value.trim() ||
    '';


  if(!content){
    return;
  }


  if(
    content.length >
    JOURNAL_MAX_LENGTH
  ){

    alert(
      `Journal posts can be up to ${JOURNAL_MAX_LENGTH} characters.`
    );

    return;

  }


  const button =
    journalById(
      'journalPostButton'
    );


  if(button){

    button.disabled =
      true;

    button.textContent =
      'Posting...';

  }


  try{

    await supabasePost(
      'journal_posts',
      {
        campaign:
          getJournalCampaign(),

        reality_posted:
          getJournalReality(),

        author_character_id:
          journalCurrentAuthor.id,

        author_name:
          getJournalAuthorName(),

        author_image_url:
          getJournalAuthorImage() ||
          null,

        content
      }
    );


    if(input){

      input.value =
        '';

    }


    updateJournalCharacterCount();


    await loadJournalPosts(
      true
    );

  }
  catch(error){

    showJournalError(
      'Journal post could not be created.',
      error
    );

  }
  finally{

    if(button){

      button.disabled =
        false;

      button.textContent =
        'Post';

    }

  }

}


/* =====================================================
   EDIT POST
   ===================================================== */

function beginJournalPostEdit(postId){

  const post =
    journalPosts.find(
      item =>
        item.id === postId
    );


  if(
    !post ||
    !journalPostBelongsToCurrentCharacter(
      post
    )
  ){
    return;
  }


  /*
    Remove any stale editor first.
  */

  document
    .querySelector(
      '.journal-edit-dialog'
    )
    ?.remove();


  const dialog =
    document.createElement(
      'dialog'
    );


  dialog.className =
    'journal-edit-dialog';


  dialog.innerHTML = `

    <div class="journal-edit-dialog-inner">


      <div class="journal-edit-dialog-header">

        <div>

          <h2 class="journal-edit-dialog-title">
            Edit Journal Entry
          </h2>


          <div class="journal-edit-dialog-subtitle">

            ${journalEscapeHtml(
              formatJournalTimestamp(
                post.created_at
              )
            )}

            ·

            ${
              post.reality_posted ===
              'unbound'
                ? 'Unbound'
                : 'Cast'
            }

          </div>

        </div>

      </div>


      <textarea
        class="journal-edit-textarea"
        maxlength="${JOURNAL_MAX_LENGTH}"
        data-journal-edit-input="${journalEscapeHtml(postId)}"
      >${journalEscapeHtml(post.content)}</textarea>


      <div class="journal-edit-footer">


        <span
          class="journal-edit-count"
          data-journal-edit-count="${journalEscapeHtml(postId)}"
        >

          ${
            String(
              post.content || ''
            ).length
          }
          /
          ${JOURNAL_MAX_LENGTH}

        </span>


        <div class="journal-edit-buttons">


          <button
            type="button"
            class="journal-post-action"
            data-journal-action="cancel-edit"
            data-journal-id="${journalEscapeHtml(postId)}"
          >
            Cancel
          </button>


          <button
            type="button"
            class="journal-post-action"
            data-journal-action="save-edit"
            data-journal-id="${journalEscapeHtml(postId)}"
          >
            Save
          </button>


        </div>


      </div>


    </div>

  `;


  document.body.appendChild(
    dialog
  );


  const editInput =
    dialog.querySelector(
      '[data-journal-edit-input]'
    );


  const count =
    dialog.querySelector(
      '[data-journal-edit-count]'
    );


  const cancelButton =
    dialog.querySelector(
      '[data-journal-action="cancel-edit"]'
    );


  const saveButton =
    dialog.querySelector(
      '[data-journal-action="save-edit"]'
    );


  editInput.addEventListener(
    'input',
    () => {

      count.textContent =
        `${editInput.value.length} / ${JOURNAL_MAX_LENGTH}`;

    }
  );


  cancelButton.addEventListener(
    'click',
    () => {

      dialog.close();

    }
  );


  saveButton.addEventListener(
    'click',
    () => {

      saveJournalPostEdit(
        postId
      );

    }
  );


  dialog.addEventListener(
    'close',
    () => {

      dialog.remove();

    }
  );


  dialog.addEventListener(
    'click',
    event => {

      if(
        event.target === dialog
      ){

        dialog.close();

      }

    }
  );


  dialog.showModal();


  editInput.focus();


  editInput.setSelectionRange(
    editInput.value.length,
    editInput.value.length
  );

}

/* =====================================================
   SAVE EDITED POST
   ===================================================== */

async function saveJournalPostEdit(
  postId
){

  const post =
    journalPosts.find(
      item =>
        item.id === postId
    );


  if(
    !post ||
    !journalPostBelongsToCurrentCharacter(
      post
    )
  ){
    return;
  }


  const dialog =
    document.querySelector(
      '.journal-edit-dialog'
    );


  if(!dialog){
    return;
  }


  const input =
    dialog.querySelector(
      `[data-journal-edit-input="${CSS.escape(postId)}"]`
    );


  const content =
    input?.value.trim() ||
    '';


  if(!content){

    alert(
      'A journal post cannot be empty.'
    );

    return;
  }


  if(
    content.length >
    JOURNAL_MAX_LENGTH
  ){

    alert(
      `Journal posts can be up to ${JOURNAL_MAX_LENGTH} characters.`
    );

    return;
  }


  const saveButton =
    dialog.querySelector(
      `[data-journal-action="save-edit"][data-journal-id="${CSS.escape(postId)}"]`
    );


  if(saveButton){

    saveButton.disabled =
      true;

    saveButton.textContent =
      'Saving...';

  }


  try{

    await supabasePatch(
      `journal_posts?id=eq.${encodeURIComponent(postId)}&author_character_id=eq.${encodeURIComponent(getJournalCharacterId())}`,
      {
        content
      }
    );


    /*
      Close the modal after the database update succeeds.
    */

    dialog.close();


    /*
      Reload immediately so the edited entry appears
      without needing a browser refresh.
    */

    await loadJournalPosts(
      true
    );

  }
  catch(error){

    if(saveButton){

      saveButton.disabled =
        false;

      saveButton.textContent =
        'Save';

    }


    showJournalError(
      'Journal post could not be updated.',
      error
    );

  }

}

/* =====================================================
   DELETE POST
   ===================================================== */

async function deleteJournalPost(
  postId
){

  const post =
    journalPosts.find(
      item =>
        item.id === postId
    );


  if(
    !post ||
    !journalPostBelongsToCurrentCharacter(
      post
    )
  ){
    return;
  }


  const confirmed =
    window.confirm(
      'Delete this journal post? This cannot be undone.'
    );


  if(!confirmed){
    return;
  }


  const button =
    document.querySelector(
      `[data-journal-action="delete"][data-journal-id="${CSS.escape(postId)}"]`
    );


  if(button){

    button.disabled =
      true;

    button.textContent =
      'Deleting...';

  }


  try{

    await supabaseDelete(
      `journal_posts?id=eq.${encodeURIComponent(postId)}&author_character_id=eq.${encodeURIComponent(getJournalCharacterId())}`
    );


    await loadJournalPosts(
      true
    );

  }
  catch(error){

    showJournalError(
      'Journal post could not be deleted.',
      error
    );

  }

}


/* =====================================================
   POST ACTION EVENTS
   ===================================================== */

function connectJournalPostActions(){

  const feed =
    journalById(
      'journalFeed'
    );


  if(
    !feed ||
    feed.dataset.journalActionsConnected
  ){
    return;
  }


  feed.dataset.journalActionsConnected =
    'true';


  feed.addEventListener(
    'click',
    event => {

      const button =
        event.target.closest(
          '[data-journal-action]'
        );


      if(!button){
        return;
      }


      const action =
        button.dataset.journalAction;


      const postId =
        button.dataset.journalId;


      if(!postId){
        return;
      }


      if(
        action ===
        'edit'
      ){

        beginJournalPostEdit(
          postId
        );

      }
      else if(
        action ===
        'cancel-edit'
      ){

        renderJournalPosts();

      }
      else if(
        action ===
        'save-edit'
      ){

        saveJournalPostEdit(
          postId
        );

      }
      else if(
        action ===
        'delete'
      ){

        deleteJournalPost(
          postId
        );

      }

    }
  );

}


/* =====================================================
   CHARACTER COUNT
   ===================================================== */

function updateJournalCharacterCount(){

  const input =
    journalById(
      'journalComposerInput'
    );


  const count =
    journalById(
      'journalCharacterCount'
    );


  if(
    !input ||
    !count
  ){
    return;
  }


  count.textContent =
    `${input.value.length} / ${JOURNAL_MAX_LENGTH}`;

}


/* =====================================================
   COMPOSER EVENTS
   ===================================================== */

function connectJournalComposer(){

  const input =
    journalById(
      'journalComposerInput'
    );


  const button =
    journalById(
      'journalPostButton'
    );


  if(
    input &&
    !input.dataset.journalConnected
  ){

    input.dataset.journalConnected =
      'true';


    input.maxLength =
      JOURNAL_MAX_LENGTH;


    input.addEventListener(
      'input',
      updateJournalCharacterCount
    );


    input.addEventListener(
      'keydown',
      event => {

        if(
          event.key ===
          'Enter'
          &&
          (
            event.ctrlKey ||
            event.metaKey
          )
        ){

          event.preventDefault();

          createJournalPost();

        }

      }
    );

  }


  if(
    button &&
    !button.dataset.journalConnected
  ){

    button.dataset.journalConnected =
      'true';


    button.addEventListener(
      'click',
      createJournalPost
    );

  }

}


/* =====================================================
   SEARCH
   ===================================================== */

function connectJournalSearch(){

  const search =
    journalById(
      'journalSearchInput'
    );


  if(
    !search ||
    search.dataset.journalConnected
  ){
    return;
  }


  search.dataset.journalConnected =
    'true';


  search.addEventListener(
    'input',
    () => {

      clearTimeout(
        journalSearchTimer
      );


      journalSearchTimer =
        setTimeout(
          () => {

            journalSearchTerm =
              search.value.trim();


            loadJournalPosts(
              true
            );

          },
          300
        );

    }
  );

}


/* =====================================================
   INFINITE SCROLL
   ===================================================== */

function connectJournalInfiniteScroll(){

  const sentinel =
    journalById(
      'journalScrollSentinel'
    );


  if(
    !sentinel ||
    sentinel.dataset.journalConnected
  ){
    return;
  }


  sentinel.dataset.journalConnected =
    'true';


  const observer =
    new IntersectionObserver(
      entries => {

        if(
          entries[0]?.isIntersecting &&
          journalHasMore &&
          !journalLoading
        ){

          loadJournalPosts(
            false
          );

        }

      },
      {
        rootMargin:
          '300px 0px'
      }
    );


  observer.observe(
    sentinel
  );

}


/* =====================================================
   REALTIME
   ===================================================== */

function disconnectJournalRealtime(){

  if(
    journalRealtimeChannel &&
    window.epcotAuth?.client
  ){

    window.epcotAuth.client
      .removeChannel(
        journalRealtimeChannel
      );

  }


  journalRealtimeChannel =
    null;

}


function connectJournalRealtime(){

  const client =
    window.epcotAuth?.client;


  if(!client){

    console.warn(
      'Journal Realtime client is unavailable.'
    );

    return;

  }


  disconnectJournalRealtime();


  const campaign =
    getJournalCampaign();


  journalRealtimeChannel =
    client

      .channel(
        `journal-${campaign}-${Math.random().toString(36).slice(2)}`
      )

      .on(
        'postgres_changes',

        {
          event:'*',
          schema:'public',
          table:'journal_posts',
          filter:
            `campaign=eq.${campaign}`
        },

        () => {

          clearTimeout(
            journalRealtimeRefreshTimer
          );


          journalRealtimeRefreshTimer =
            setTimeout(
              () => {

                loadJournalPosts(
                  true
                );

              },
              125
            );

        }
      )

      .subscribe();

}


/* =====================================================
   PLAYER READY
   ===================================================== */

function connectJournalBaseEvents(){

  if(journalEventsConnected){
    return;
  }


  journalEventsConnected =
    true;


  document.addEventListener(
    'epcot:player-ready',
    () => {

      initializeJournal(
        true
      );

    }
  );


  window.addEventListener(
    'beforeunload',
    disconnectJournalRealtime
  );

}


/* =====================================================
   INITIALIZE
   ===================================================== */

async function initializeJournal(
  force = false
){

  if(
    !journalById(
      'journalFeed'
    )
  ){
    return;
  }


  connectJournalBaseEvents();

  installJournalActionStyles();

  connectJournalPostActions();

  connectJournalComposer();

  connectJournalSearch();

  connectJournalInfiniteScroll();

  updateJournalCharacterCount();


  if(
    journalInitialized &&
    !force
  ){
    return;
  }


  if(
    !getJournalCharacterId()
  ){

    /*
      player-shell.js will dispatch
      epcot:player-ready once it has
      assigned the active character.
    */

    return;

  }


  try{

    journalInitialized =
      true;


    await loadJournalAuthor();


    await loadJournalPosts(
      true
    );


    connectJournalRealtime();

  }
  catch(error){

    journalInitialized =
      false;


    showJournalError(
      'Journal could not be initialized.',
      error
    );

  }

}


/* =====================================================
   PUBLIC API
   ===================================================== */

window.epcotJournal = {

  refresh(){

    return loadJournalPosts(
      true
    );

  }

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
    () => {

      initializeJournal();

    }
  );

}
else{

  initializeJournal();

}
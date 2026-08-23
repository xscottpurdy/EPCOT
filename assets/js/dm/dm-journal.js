/* =====================================================
   EPCOT DND
   DM JOURNAL ARCHIVE

   Read-only DM view of all player Journal posts.

   Features:
   - All / Hero / Villain campaign filters
   - Search author + content
   - Cast / Unbound identity snapshots
   - Newest posts first
   - Realtime updates
   - No editing
   - No deletion
   ===================================================== */


/* =====================================================
   SETTINGS
   ===================================================== */

const DM_JOURNAL_PAGE_SIZE =
  50;


/* =====================================================
   STATE
   ===================================================== */

const DM_JOURNAL = {

  campaign:
    'all',

  search:
    '',

  posts:
    [],

  offset:
    0,

  hasMore:
    true,

  loading:
    false,

  realtimeChannel:
    null,

  searchTimer:
    null,

  realtimeTimer:
    null

};


/* =====================================================
   HELPERS
   ===================================================== */

function dmJournalById(id){

  return document.getElementById(id);

}


function dmJournalClient(){

  return window.epcotAuth?.client || null;

}


function dmJournalEscape(value){

  return String(value ?? '')
    .replaceAll('&','&amp;')
    .replaceAll('<','&lt;')
    .replaceAll('>','&gt;')
    .replaceAll('"','&quot;')
    .replaceAll("'","&#039;");

}


function dmJournalFormatDate(value){

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


  return date.toLocaleString(
    undefined,
    {
      month:
        'short',

      day:
        'numeric',

      year:
        'numeric',

      hour:
        'numeric',

      minute:
        '2-digit'
    }
  );

}


function dmJournalCampaignLabel(
  campaign
){

  return campaign === 'villain'
    ? 'Villain'
    : 'Hero';

}


function dmJournalRealityLabel(
  reality
){

  return reality === 'unbound'
    ? 'Unbound'
    : 'Cast';

}


/* =====================================================
   STYLES
   ===================================================== */

function installDmJournalStyles(){

  if(
    dmJournalById(
      'dmJournalAdminStyles'
    )
  ){
    return;
  }


  const style =
    document.createElement('style');


  style.id =
    'dmJournalAdminStyles';


  style.textContent = `

    .dm-journal-toolbar{
      display:flex;
      justify-content:space-between;
      align-items:center;
      gap:14px;
      flex-wrap:wrap;
      margin-bottom:18px;
    }

    .dm-journal-filters{
      display:flex;
      gap:8px;
      flex-wrap:wrap;
    }

    .dm-journal-filter{
      border-radius:8px;
      padding:9px 14px;
      border:1px solid rgba(255,255,255,.18);
      background:rgba(255,255,255,.06);
      color:inherit;
      font:inherit;
      font-weight:750;
      cursor:pointer;
    }

    .dm-journal-filter.is-active{
      background:#f4c96b;
      color:#142436;
      border-color:transparent;
    }

    .dm-journal-search{
      min-width:min(340px,100%);
      flex:1;
      max-width:460px;
    }

    .dm-journal-search input{
      width:100%;
      box-sizing:border-box;
      border-radius:8px;
      border:1px solid rgba(255,255,255,.18);
      background:rgba(0,0,0,.18);
      color:inherit;
      padding:10px 12px;
      font:inherit;
    }

    .dm-journal-status{
      margin-bottom:14px;
      opacity:.65;
      font-size:.88rem;
    }

    .dm-journal-feed{
      display:grid;
      gap:14px;
    }

    .dm-journal-post{
      padding:17px;
    }

    .dm-journal-post-head{
      display:flex;
      gap:12px;
      align-items:flex-start;
    }

    .dm-journal-avatar{
      width:54px;
      height:54px;
      flex:0 0 54px;
      border-radius:50%;
      overflow:hidden;
      display:grid;
      place-items:center;
      border:1px solid rgba(255,255,255,.18);
      background:rgba(255,255,255,.05);
      font-weight:800;
    }

    .dm-journal-avatar img{
      width:100%;
      height:100%;
      object-fit:cover;
    }

    .dm-journal-author{
      font-weight:850;
      font-size:1.04rem;
    }

    .dm-journal-meta{
      display:flex;
      gap:7px;
      flex-wrap:wrap;
      margin-top:5px;
      align-items:center;
    }

    .dm-journal-badge{
      display:inline-flex;
      align-items:center;
      border-radius:999px;
      padding:3px 8px;
      border:1px solid rgba(255,255,255,.14);
      font-size:.74rem;
      font-weight:800;
      letter-spacing:.03em;
    }

    .dm-journal-badge.hero{
      color:#f4c96b;
    }

    .dm-journal-badge.villain{
      color:#ef9a9a;
    }

    .dm-journal-time{
      opacity:.55;
      font-size:.8rem;
    }

    .dm-journal-content{
      margin-top:13px;
      line-height:1.6;
      white-space:pre-wrap;
      overflow-wrap:anywhere;
    }

    .dm-journal-empty{
      padding:24px;
    }

    .dm-journal-load-more{
      display:flex;
      justify-content:center;
      margin-top:16px;
    }

    .dm-journal-load-more button{
      border-radius:8px;
      padding:10px 18px;
      border:1px solid rgba(255,255,255,.18);
      background:rgba(255,255,255,.07);
      color:inherit;
      font:inherit;
      font-weight:750;
      cursor:pointer;
    }

  `;


  document.head.appendChild(style);

}


/* =====================================================
   BUILD QUERY
   ===================================================== */

function buildDmJournalQuery(){

  let query =
    DM_JOURNAL.campaign === 'all'

      ? '*'

      : DM_JOURNAL.campaign;


  return query;

}


/* =====================================================
   LOAD POSTS
   ===================================================== */

async function loadDmJournalPosts(
  reset = false
){

  const client =
    dmJournalClient();


  if(
    !client ||
    DM_JOURNAL.loading
  ){
    return;
  }


  if(
    !reset &&
    !DM_JOURNAL.hasMore
  ){
    return;
  }


  DM_JOURNAL.loading =
    true;


  if(reset){

    DM_JOURNAL.offset =
      0;


    DM_JOURNAL.posts =
      [];


    DM_JOURNAL.hasMore =
      true;

  }


  try{

    let query =
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
        .range(
          DM_JOURNAL.offset,
          DM_JOURNAL.offset +
          DM_JOURNAL_PAGE_SIZE -
          1
        );


    if(
      DM_JOURNAL.campaign !==
      'all'
    ){

      query =
        query.eq(
          'campaign',
          DM_JOURNAL.campaign
        );

    }


    const search =
      DM_JOURNAL.search.trim();


    if(search){

      /*
        Supabase PostgREST OR search.

        Strip punctuation that can interfere
        with the filter syntax.
      */

      const safeSearch =
        search
          .replace(/[(),]/g,' ')
          .trim();


      if(safeSearch){

        query =
          query.or(
            `author_name.ilike.*${safeSearch}*,content.ilike.*${safeSearch}*`
          );

      }

    }


    const {
      data,
      error
    } =
      await query;


    if(error){
      throw error;
    }


    const incoming =
      data || [];


    if(reset){

      DM_JOURNAL.posts =
        incoming;

    }
    else{

      DM_JOURNAL.posts.push(
        ...incoming
      );

    }


    DM_JOURNAL.offset +=
      incoming.length;


    DM_JOURNAL.hasMore =
      incoming.length ===
      DM_JOURNAL_PAGE_SIZE;


    renderDmJournal();

  }
  catch(error){

    console.error(
      'DM Journal load failed:',
      error
    );


    const mount =
      dmJournalById(
        'dmJournalMount'
      );


    if(mount){

      mount.innerHTML = `

        <div
          class="
            dm-console-panel
            dm-journal-empty
          "
        >

          <strong>
            Journal Archive Unavailable
          </strong>

          <p>
            ${dmJournalEscape(
              error?.message ||
              String(error)
            )}
          </p>

        </div>

      `;

    }

  }
  finally{

    DM_JOURNAL.loading =
      false;

  }

}


/* =====================================================
   RENDER
   ===================================================== */

function renderDmJournal(){

  const mount =
    dmJournalById(
      'dmJournalMount'
    );


  if(!mount){
    return;
  }


  mount.innerHTML = `

    <div class="dm-journal-toolbar">


      <div class="dm-journal-filters">

        ${renderDmJournalFilter(
          'all',
          'All'
        )}

        ${renderDmJournalFilter(
          'hero',
          'Hero'
        )}

        ${renderDmJournalFilter(
          'villain',
          'Villain'
        )}

      </div>


      <div class="dm-journal-search">

        <input
          id="dmJournalSearchInput"
          type="search"
          placeholder="Search journal entries or authors..."
          value="${dmJournalEscape(
            DM_JOURNAL.search
          )}"
          autocomplete="off"
        >

      </div>

    </div>


    <div class="dm-journal-status">

      ${
        DM_JOURNAL.campaign === 'all'
          ? 'All campaigns'
          : `${dmJournalCampaignLabel(
              DM_JOURNAL.campaign
            )} campaign`
      }

      //

      ${DM_JOURNAL.posts.length}

      ${
        DM_JOURNAL.posts.length === 1
          ? 'entry loaded'
          : 'entries loaded'
      }

    </div>


    ${
      DM_JOURNAL.posts.length

        ? `
            <div class="dm-journal-feed">

              ${DM_JOURNAL.posts
                .map(
                  renderDmJournalPost
                )
                .join('')
              }

            </div>
          `

        : `
            <div
              class="
                dm-console-panel
                dm-journal-empty
              "
            >

              <strong>
                No Journal Entries Found
              </strong>

              <p>
                No entries match the current
                campaign filter and search.
              </p>

            </div>
          `
    }


    ${
      DM_JOURNAL.hasMore
        ? `
            <div class="dm-journal-load-more">

              <button
                type="button"
                data-dm-journal-action="load-more"
              >
                Load Older Entries
              </button>

            </div>
          `
        : ''
    }

  `;

}


/* =====================================================
   FILTER BUTTON
   ===================================================== */

function renderDmJournalFilter(
  value,
  label
){

  return `

    <button
      class="
        dm-journal-filter
        ${
          DM_JOURNAL.campaign === value
            ? 'is-active'
            : ''
        }
      "
      type="button"
      data-dm-journal-action="campaign"
      data-campaign="${value}"
    >
      ${label}
    </button>

  `;

}


/* =====================================================
   POST
   ===================================================== */

function renderDmJournalPost(
  post
){

  const author =
    post.author_name ||
    'Unknown Explorer';


  const initial =
    author
      .trim()
      .charAt(0)
      .toUpperCase() ||
    '?';


  const avatar =
    post.author_image_url
      ? `
          <img
            src="${dmJournalEscape(
              post.author_image_url
            )}"
            alt="${dmJournalEscape(
              author
            )}"
          >
        `
      : dmJournalEscape(initial);


  return `

    <article
      class="
        dm-console-panel
        dm-journal-post
      "
    >

      <div class="dm-journal-post-head">


        <div class="dm-journal-avatar">

          ${avatar}

        </div>


        <div>


          <div class="dm-journal-author">

            ${dmJournalEscape(
              author
            )}

          </div>


          <div class="dm-journal-meta">


            <span
              class="
                dm-journal-badge
                ${post.campaign === 'villain'
                  ? 'villain'
                  : 'hero'
                }
              "
            >

              ${dmJournalCampaignLabel(
                post.campaign
              )}

            </span>


            <span class="dm-journal-badge">

              ${dmJournalRealityLabel(
                post.reality_posted
              )}

            </span>


            <span class="dm-journal-time">

              ${dmJournalFormatDate(
                post.created_at
              )}

            </span>


          </div>

        </div>

      </div>


      <div class="dm-journal-content">

        ${dmJournalEscape(
          post.content ||
          ''
        )}

      </div>

    </article>

  `;

}


/* =====================================================
   CLICK EVENTS
   ===================================================== */

function handleDmJournalClick(
  event
){

  const button =
    event.target.closest(
      '[data-dm-journal-action]'
    );


  if(!button){
    return;
  }


  const action =
    button.dataset
      .dmJournalAction;


  if(
    action ===
    'campaign'
  ){

    const campaign =
      button.dataset.campaign;


    DM_JOURNAL.campaign =
      (
        campaign === 'hero' ||
        campaign === 'villain'
      )
        ? campaign
        : 'all';


    loadDmJournalPosts(
      true
    );


    return;

  }


  if(
    action ===
    'load-more'
  ){

    loadDmJournalPosts(
      false
    );

  }

}


/* =====================================================
   SEARCH
   ===================================================== */

function handleDmJournalInput(
  event
){

  if(
    event.target.id !==
    'dmJournalSearchInput'
  ){
    return;
  }


  clearTimeout(
    DM_JOURNAL.searchTimer
  );


  const value =
    event.target.value;


  DM_JOURNAL.searchTimer =
    setTimeout(
      () => {

        DM_JOURNAL.search =
          value.trim();


        loadDmJournalPosts(
          true
        );

      },
      250
    );

}


/* =====================================================
   REALTIME
   ===================================================== */

function connectDmJournalRealtime(){

  const client =
    dmJournalClient();


  if(
    !client ||
    !client.channel
  ){
    return;
  }


  if(
    DM_JOURNAL.realtimeChannel
  ){

    client.removeChannel(
      DM_JOURNAL.realtimeChannel
    );

  }


  DM_JOURNAL.realtimeChannel =
    client

      .channel(
        'dm-journal-live'
      )

      .on(
        'postgres_changes',
        {
          event:'*',
          schema:'public',
          table:'journal_posts'
        },
        () => {

          clearTimeout(
            DM_JOURNAL.realtimeTimer
          );


          DM_JOURNAL.realtimeTimer =
            setTimeout(
              () => {

                loadDmJournalPosts(
                  true
                );

              },
              150
            );

        }
      )

      .subscribe(
        (
          status,
          error
        ) => {

          console.log(
            'DM Journal realtime status:',
            status
          );


          if(error){

            console.error(
              'DM Journal realtime error:',
              error
            );

          }

        }
      );

}


/* =====================================================
   INITIALIZE
   ===================================================== */

async function initializeDmJournal(){

  if(
    !dmJournalById(
      'dmJournalMount'
    )
  ){
    return;
  }


  installDmJournalStyles();


  document.addEventListener(
    'click',
    handleDmJournalClick
  );


  document.addEventListener(
    'input',
    handleDmJournalInput
  );


  await loadDmJournalPosts(
    true
  );


  connectDmJournalRealtime();

}


document.addEventListener(
  'DOMContentLoaded',
  initializeDmJournal
);
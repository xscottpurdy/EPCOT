/* =====================================================
   EPCOT DND
   DM ADVENTURE MAP BOARDS

   Multi-Module Edition

   - One map can appear in many modules
   - One module can contain many maps
   - Existing pins remain attached to one map
   - Click-to-place pins
   - Drag pins
   - Rich formatted pin notes
   - Module link manager
   - Autosave
   ===================================================== */


/* =====================================================
   CONSTANTS
   ===================================================== */

const EPCOT_MAP_AUTOSAVE_DELAY = 700;


const EPCOT_MAP_PIN_TYPES = [

  {
    value:'room',
    label:'Room'
  },

  {
    value:'encounter',
    label:'Encounter'
  },

  {
    value:'npc',
    label:'NPC'
  },

  {
    value:'treasure',
    label:'Treasure'
  },

  {
    value:'secret',
    label:'Secret'
  },

  {
    value:'trap',
    label:'Trap'
  },

  {
    value:'read_aloud',
    label:'Read Aloud'
  },

  {
    value:'note',
    label:'Note'
  }

];


/* =====================================================
   HELPERS
   ===================================================== */

function adventureMapDb(){

  return (
    window.epcotAuth?.client ||
    null
  );

}


function adventureMapEscape(
  value
){

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


function adventureMapClamp(
  value,
  min,
  max
){

  return Math.min(
    Math.max(
      value,
      min
    ),
    max
  );

}


function adventureMapFormatTime(
  value
){

  if(!value){
    return '';
  }


  const date =
    new Date(
      value
    );


  if(
    Number.isNaN(
      date.getTime()
    )
  ){

    return '';

  }


  return date
    .toLocaleTimeString(
      [],
      {
        hour:'numeric',
        minute:'2-digit'
      }
    );

}


function adventureMapSanitizeHtml(
  html
){

  const template =
    document.createElement(
      'template'
    );


  template.innerHTML =
    String(
      html ||
      ''
    );


  template.content
    .querySelectorAll(
      `
        script,
        iframe,
        object,
        embed,
        form,
        input,
        button,
        textarea,
        select,
        style,
        link,
        meta
      `
    )
    .forEach(
      node =>
        node.remove()
    );


  template.content
    .querySelectorAll('*')
    .forEach(
      node => {

        Array.from(
          node.attributes
        )
          .forEach(
            attribute => {

              const name =
                attribute.name
                  .toLowerCase();


              const value =
                attribute.value
                  .trim()
                  .toLowerCase();


              if(
                name.startsWith(
                  'on'
                )
              ){

                node.removeAttribute(
                  attribute.name
                );

              }


              if(
                (
                  name === 'href' ||
                  name === 'src'
                ) &&
                value.startsWith(
                  'javascript:'
                )
              ){

                node.removeAttribute(
                  attribute.name
                );

              }

            }
          );

      }
    );


  return template.innerHTML;

}


function adventureMapPinTypeLabel(
  value
){

  return (
    EPCOT_MAP_PIN_TYPES
      .find(
        type =>
          type.value ===
          value
      )
      ?.label ||
    'Room'
  );

}


/* =====================================================
   MAP NOTE TOOLBAR
   ===================================================== */

function adventureMapBuildToolbar(
  editor
){

  const toolbar =
    document.createElement(
      'div'
    );


  toolbar.className =
    'dm-adventure-toolbar';


  const makeButton = (
    text,
    title,
    command,
    value = null
  ) => {

    const button =
      document.createElement(
        'button'
      );


    button.type =
      'button';


    button.className =
      'dm-adventure-tool';


    button.innerHTML =
      text;


    button.title =
      title;


    button.addEventListener(
      'mousedown',
      event =>
        event.preventDefault()
    );


    button.addEventListener(
      'click',
      () => {

        editor.focus();


        document.execCommand(
          command,
          false,
          value
        );


        editor.dispatchEvent(
          new Event(
            'input',
            {
              bubbles:true
            }
          )
        );

      }
    );


    return button;

  };


  toolbar.append(

    makeButton(
      '<strong>B</strong>',
      'Bold',
      'bold'
    ),

    makeButton(
      '<em>I</em>',
      'Italic',
      'italic'
    ),

    makeButton(
      '<u>U</u>',
      'Underline',
      'underline'
    ),

    makeButton(
      'H2',
      'Heading',
      'formatBlock',
      'H2'
    ),

    makeButton(
      '• List',
      'Bulleted List',
      'insertUnorderedList'
    ),

    makeButton(
      '1. List',
      'Numbered List',
      'insertOrderedList'
    ),

    makeButton(
      '❝',
      'Quote',
      'formatBlock',
      'BLOCKQUOTE'
    ),

    makeButton(
      '↶',
      'Undo',
      'undo'
    ),

    makeButton(
      '↷',
      'Redo',
      'redo'
    )

  );


  return toolbar;

}


/* =====================================================
   MAP BOARD MANAGER
   ===================================================== */

class EpcotAdventureMapBoard{


  constructor(){

    this.overlay =
      null;


    this.campaign =
      null;


    this.moduleId =
      null;


    this.maps =
      [];


    this.pins =
      [];


    this.links =
      [];


    this.allChapters =
      [];


    this.allModules =
      [];


    this.activeMapId =
      null;


    this.activePinId =
      null;


    this.draggingPinId =
      null;


    this.pinNoteEditor =
      null;


    this.saveTimers = {

      map:null,

      pin:null,

      note:null

    };


    document.addEventListener(
      'keydown',
      event => {

        if(
          event.key !==
            'Escape' ||
          !this.overlay ||
          this.overlay.hidden
        ){

          return;

        }


        const miniDialog =
          this.overlay
            .querySelector(
              '[data-map-link-dialog]'
            );


        if(miniDialog){

          this.closeMiniDialog();

          return;

        }


        if(this.activePinId){

          this.closePinDrawer();

          return;

        }


        this.close();

      }
    );

  }


  /* ===================================================
     ACTIVE DATA
     =================================================== */

  get activeMap(){

    return (
      this.maps.find(
        map =>
          map.id ===
          this.activeMapId
      ) ||
      null
    );

  }


  get activePin(){

    return (
      this.pins.find(
        pin =>
          pin.id ===
          this.activePinId
      ) ||
      null
    );

  }


  get activePins(){

    return this.pins
      .filter(
        pin =>
          pin.map_id ===
          this.activeMapId
      )
      .sort(
        (a,b) =>
          (
            Number(
              a.sort_order
            ) || 0
          ) -
          (
            Number(
              b.sort_order
            ) || 0
          )
      );

  }


  get campaignChapters(){

    return this.allChapters
      .filter(
        chapter =>
          chapter.campaign ===
          this.campaign
      )
      .sort(
        (a,b) =>
          (
            Number(
              a.sort_order
            ) || 0
          ) -
          (
            Number(
              b.sort_order
            ) || 0
          )
      );

  }


  get campaignModules(){

    return this.allModules
      .filter(
        module =>
          module.campaign ===
          this.campaign
      );

  }


  /* ===================================================
     LINKS
     =================================================== */

  getLinkedModuleIds(
    mapId
  ){

    return this.links
      .filter(
        link =>
          link.map_id ===
          mapId
      )
      .map(
        link =>
          link.module_id
      );

  }


  getLinkCount(
    mapId
  ){

    return this
      .getLinkedModuleIds(
        mapId
      )
      .length;

  }


  /* ===================================================
     OPEN
     =================================================== */

  async open(
    campaign,
    moduleId
  ){

    if(
      !campaign ||
      !moduleId
    ){

      return;

    }


this.campaign =
  campaign === 'villain' ||
  campaign === 'combined'

    ? campaign

    : 'hero';


    this.moduleId =
      moduleId;


    this.activePinId =
      null;


    this.ensureOverlay();


    this.overlay.hidden =
      false;


    document.body
      .classList
      .add(
        'dm-map-board-open'
      );


    this.renderLoading();


    try{

      await this.load();

      this.render();

    }
    catch(error){

      console.error(
        'Map Board failed to load:',
        error
      );


      this.renderError(
        error
      );

    }

  }


  /* ===================================================
     CLOSE
     =================================================== */

  close(){

    if(!this.overlay){
      return;
    }


    this.overlay.hidden =
      true;


    this.activePinId =
      null;


    this.draggingPinId =
      null;


    document.body
      .classList
      .remove(
        'dm-map-board-open'
      );

  }


  /* ===================================================
     OVERLAY
     =================================================== */

  ensureOverlay(){

    if(this.overlay){
      return;
    }


    const shell =
      document.createElement(
        'div'
      );


    shell.className =
      'dm-map-board-shell';


    shell.hidden =
      true;


    shell.innerHTML = `

      <div
        class="dm-map-board-backdrop"
        data-map-board-close
      ></div>


      <section
        class="dm-map-board-dialog"
        role="dialog"
        aria-modal="true"
        aria-label="Adventure Map Board"
      >

        <div
          data-map-board-content
        ></div>

      </section>

    `;


    document.body.append(
      shell
    );


    shell
      .querySelector(
        '[data-map-board-close]'
      )
      ?.addEventListener(
        'click',
        () =>
          this.close()
      );


    this.overlay =
      shell;

  }


  /* ===================================================
     LOAD ALL RELEVANT DATA
     =================================================== */

  async load(){

    const db =
      adventureMapDb();


    if(!db){

      throw new Error(
        'Supabase client unavailable.'
      );

    }


    /*
      First get every map linked to
      the currently selected module.
    */

    const {
      data:currentLinks,
      error:currentLinksError
    } =
      await db

        .from(
          'adventure_map_modules'
        )

        .select('*')

        .eq(
          'module_id',
          this.moduleId
        );


    if(currentLinksError){

      throw currentLinksError;

    }


    const mapIds =
      [
        ...new Set(
          (
            currentLinks ||
            []
          )
            .map(
              link =>
                link.map_id
            )
        )
      ];


    /*
      Load campaign structure so the
      link manager can show every chapter
      and module.
    */

    const [
      chaptersResult,
      modulesResult
    ] =
      await Promise.all([

        db
          .from(
            'adventure_chapters'
          )
          .select('*')
          .eq(
            'campaign',
            this.campaign
          )
          .order(
            'sort_order',
            {
              ascending:true
            }
          ),

        db
          .from(
            'adventure_modules'
          )
          .select('*')
          .eq(
            'campaign',
            this.campaign
          )
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


    this.allChapters =
      chaptersResult.data ||
      [];


    this.allModules =
      modulesResult.data ||
      [];


    /*
      If no maps are linked to this
      module, the board can stop here.
    */

    if(
      mapIds.length ===
      0
    ){

      this.maps =
        [];


      this.pins =
        [];


      this.links =
        [];


      this.activeMapId =
        null;


      return;

    }


    const {
      data:maps,
      error:mapsError
    } =
      await db

        .from(
          'adventure_maps'
        )

        .select('*')

        .eq(
          'campaign',
          this.campaign
        )

        .in(
          'id',
          mapIds
        )

        .order(
          'sort_order',
          {
            ascending:true
          }
        );


    if(mapsError){

      throw mapsError;

    }


    this.maps =
      maps ||
      [];


    const loadedMapIds =
      this.maps.map(
        map =>
          map.id
      );


    if(
      loadedMapIds.length ===
      0
    ){

      this.pins =
        [];


      this.links =
        [];


      this.activeMapId =
        null;


      return;

    }


    /*
      Load every module link for these
      maps, not merely the current module.
      This is what powers Linked Modules.
    */

    const [
      allLinksResult,
      pinsResult
    ] =
      await Promise.all([

        db
          .from(
            'adventure_map_modules'
          )
          .select('*')
          .in(
            'map_id',
            loadedMapIds
          ),

        db
          .from(
            'adventure_map_pins'
          )
          .select('*')
          .in(
            'map_id',
            loadedMapIds
          )
          .order(
            'sort_order',
            {
              ascending:true
            }
          )

      ]);


    if(allLinksResult.error){

      throw allLinksResult.error;

    }


    if(pinsResult.error){

      throw pinsResult.error;

    }


    this.links =
      allLinksResult.data ||
      [];


    this.pins =
      pinsResult.data ||
      [];


    if(
      !this.maps.some(
        map =>
          map.id ===
          this.activeMapId
      )
    ){

      this.activeMapId =
        this.maps[0]?.id ||
        null;

    }

  }


  /* ===================================================
     LOADING
     =================================================== */

  renderLoading(){

    const content =
      this.overlay
        ?.querySelector(
          '[data-map-board-content]'
        );


    if(!content){
      return;
    }


    content.innerHTML = `

      <div
        class="dm-map-board-loading"
      >

        <div
          class="dm-map-board-loading-pulse"
        ></div>

        Loading Map Board...

      </div>

    `;

  }


  /* ===================================================
     ERROR
     =================================================== */

  renderError(
    error
  ){

    const content =
      this.overlay
        ?.querySelector(
          '[data-map-board-content]'
        );


    if(!content){
      return;
    }


    content.innerHTML = `

      <div
        class="dm-map-board-error"
      >

        <strong>
          Map Board could not load.
        </strong>

        <span>
          ${adventureMapEscape(
            error?.message ||
            String(error)
          )}
        </span>

        <button
          type="button"
          data-map-board-retry
        >
          Retry
        </button>

        <button
          type="button"
          data-map-board-error-close
        >
          Close
        </button>

      </div>

    `;


    content
      .querySelector(
        '[data-map-board-retry]'
      )
      ?.addEventListener(
        'click',
        () =>
          this.open(
            this.campaign,
            this.moduleId
          )
      );


    content
      .querySelector(
        '[data-map-board-error-close]'
      )
      ?.addEventListener(
        'click',
        () =>
          this.close()
      );

  }


  /* ===================================================
     MAIN RENDER
     =================================================== */

  render(){

    const content =
      this.overlay
        ?.querySelector(
          '[data-map-board-content]'
        );


    if(!content){
      return;
    }


    const activeMap =
      this.activeMap;


    content.innerHTML = `

      <header
        class="dm-map-board-header"
      >

        <div
          class="dm-map-board-header-copy"
        >

          <div
            class="dm-map-board-eyebrow"
          >
            ADVENTURE CARTOGRAPHY //
            ${
              this.campaign ===
                'villain'
                ? 'VILLAIN'
                : 'HERO'
            }
          </div>

          <h2>
            Map Board
          </h2>

        </div>


        <div
          class="dm-map-board-header-actions"
        >

          <button
            type="button"
            class="dm-map-board-primary"
            data-create-map
          >
            + Add Map
          </button>

          <button
            type="button"
            class="dm-map-board-close"
            data-close-map-board
            aria-label="Close Map Board"
          >
            ×
          </button>

        </div>

      </header>


      ${
        this.maps.length

          ? `

            <div
              class="dm-map-board-tabs"
            >

              ${
                this.maps
                  .map(
                    map => `

                      <button
                        type="button"
                        class="
                          dm-map-board-tab
                          ${
                            map.id ===
                            this.activeMapId
                              ? 'active'
                              : ''
                          }
                        "
                        data-map-tab="${map.id}"
                      >

                        ${adventureMapEscape(
                          map.title ||
                          'Untitled Map'
                        )}

                      </button>

                    `
                  )
                  .join('')
              }

              <button
                type="button"
                class="dm-map-board-tab-add"
                data-create-map
                title="Add another map"
              >
                +
              </button>

            </div>

          `

          : ''
      }


      <div
        class="dm-map-board-body"
      >

        ${
          activeMap

            ? this.buildActiveMapMarkup(
                activeMap
              )

            : this.buildEmptyMarkup()
        }

      </div>


      <aside
        class="
          dm-map-pin-drawer
          ${
            this.activePinId
              ? 'open'
              : ''
          }
        "
        data-pin-drawer
      ></aside>

    `;


    this.connectMainEvents();


    if(this.activePinId){

      this.renderPinDrawer();

    }

  }


  /* ===================================================
     EMPTY
     =================================================== */

  buildEmptyMarkup(){

    return `

      <div
        class="dm-map-board-empty"
      >

        <div
          class="dm-map-board-empty-symbol"
        >
          ⌖
        </div>

        <h3>
          No Maps Linked Here
        </h3>

        <p>
          Create a new map and choose
          every adventure module where
          it should be available.
        </p>

        <button
          type="button"
          class="dm-map-board-primary"
          data-create-map
        >
          + Add Map
        </button>

      </div>

    `;

  }


  /* ===================================================
     ACTIVE MAP
     =================================================== */

  buildActiveMapMarkup(
    map
  ){

    const linkCount =
      this.getLinkCount(
        map.id
      );


    return `

      <aside
        class="dm-map-board-settings"
      >

        <div
          class="dm-map-board-field"
        >

          <label>
            Map Name
          </label>

          <input
            type="text"
            data-map-title
            value="${adventureMapEscape(
              map.title ||
              ''
            )}"
          >

        </div>


        <div
          class="dm-map-board-field"
        >

          <label>
            Image URL
          </label>

          <textarea
            data-map-image-url
            rows="3"
            placeholder="Paste map image URL..."
          >${adventureMapEscape(
            map.image_url ||
            ''
          )}</textarea>

        </div>


        <div
          class="dm-map-board-save-status"
          data-map-save-status
        >

          Saved

          ${
            map.updated_at
              ? adventureMapEscape(
                  adventureMapFormatTime(
                    map.updated_at
                  )
                )
              : ''
          }

        </div>


        <button
          type="button"
          class="dm-map-linked-modules-button"
          data-edit-map-links
        >

          <span>
            Linked Modules
          </span>

          <strong>
            ${linkCount}
          </strong>

        </button>


        <div
          class="dm-map-board-help"
        >

          <strong>
            Place Notes
          </strong>

          <p>
            Click anywhere on the map
            to create a pin.
          </p>

          <p>
            Drag existing pins to move
            them.
          </p>

          <p>
            Click a pin to edit its
            label, type, title, and notes.
          </p>

        </div>


        <div
          class="dm-map-board-pin-index"
        >

          <div
            class="dm-map-board-index-title"
          >
            Map Notes
          </div>

          ${
            this.activePins.length

              ? this.activePins
                  .map(
                    pin => `

                      <button
                        type="button"
                        class="dm-map-board-index-row"
                        data-open-pin="${pin.id}"
                      >

                        <span
                          class="
                            dm-map-pin-mini
                            type-${pin.pin_type}
                          "
                        >
                          ${adventureMapEscape(
                            pin.label ||
                            '?'
                          )}
                        </span>

                        <span>

                          <small>
                            ${adventureMapEscape(
                              adventureMapPinTypeLabel(
                                pin.pin_type
                              )
                            )}
                          </small>

                          <strong>
                            ${adventureMapEscape(
                              pin.title ||
                              'Untitled Location'
                            )}
                          </strong>

                        </span>

                      </button>

                    `
                  )
                  .join('')

              : `

                  <div
                    class="dm-map-board-index-empty"
                  >
                    No pins yet.
                  </div>

                `
          }

        </div>


        <button
          type="button"
          class="dm-map-board-delete-map"
          data-delete-map
        >
          Delete Map
        </button>

      </aside>


      <main
        class="dm-map-board-stage-shell"
      >

        ${
          map.image_url

            ? `

              <div
                class="dm-map-board-stage-wrap"
              >

                <div
                  class="dm-map-board-stage"
                  data-map-stage
                >

                  <img
                    src="${adventureMapEscape(
                      map.image_url
                    )}"
                    alt="${adventureMapEscape(
                      map.title ||
                      'Adventure Map'
                    )}"
                    draggable="false"
                    data-map-image
                  >

                  <div
                    class="dm-map-board-pin-layer"
                    data-map-pin-layer
                  >

                    ${
                      this.activePins
                        .map(
                          pin =>
                            this.buildPinMarkup(
                              pin
                            )
                        )
                        .join('')
                    }

                  </div>

                </div>

              </div>


              <div
                class="dm-map-board-stage-caption"
              >
                Click map to add a note.
                Drag pins to reposition.
              </div>

            `

            : `

              <div
                class="dm-map-board-no-image"
              >

                <div>
                  ◇
                </div>

                <strong>
                  Map image not set
                </strong>

                <span>
                  Paste an image URL in
                  the field on the left.
                </span>

              </div>

            `
        }

      </main>

    `;

  }


  /* ===================================================
     PIN MARKUP
     =================================================== */

  buildPinMarkup(
    pin
  ){

    return `

      <button
        type="button"
        class="
          dm-map-pin
          type-${pin.pin_type}
          ${
            pin.id ===
            this.activePinId
              ? 'active'
              : ''
          }
        "
        data-map-pin="${pin.id}"
        style="
          left:${Number(
            pin.x_percent
          )}%;

          top:${Number(
            pin.y_percent
          )}%;
        "
        title="${adventureMapEscape(
          pin.title ||
          'Map Note'
        )}"
      >

        <span>
          ${adventureMapEscape(
            pin.label ||
            '?'
          )}
        </span>

      </button>

    `;

  }


  /* ===================================================
     MAIN EVENTS
     =================================================== */

  connectMainEvents(){

    const content =
      this.overlay
        ?.querySelector(
          '[data-map-board-content]'
        );


    if(!content){
      return;
    }


    content
      .querySelectorAll(
        '[data-create-map]'
      )
      .forEach(
        button => {

          button.addEventListener(
            'click',
            () =>
              this.openCreateMapDialog()
          );

        }
      );


    content
      .querySelector(
        '[data-close-map-board]'
      )
      ?.addEventListener(
        'click',
        () =>
          this.close()
      );


    content
      .querySelectorAll(
        '[data-map-tab]'
      )
      .forEach(
        button => {

          button.addEventListener(
            'click',
            () => {

              this.activeMapId =
                button.dataset.mapTab;


              this.activePinId =
                null;


              this.render();

            }
          );

        }
      );


    const titleInput =
      content.querySelector(
        '[data-map-title]'
      );


    const urlInput =
      content.querySelector(
        '[data-map-image-url]'
      );


    if(titleInput){

      titleInput.addEventListener(
        'input',
        () => {

          const map =
            this.activeMap;


          if(!map){
            return;
          }


          map.title =
            titleInput.value;


          this.setMapStatus(
            'Unsaved Changes'
          );


          this.scheduleMapSave(
            false
          );

        }
      );

    }


    if(urlInput){

      urlInput.addEventListener(
        'input',
        () => {

          const map =
            this.activeMap;


          if(!map){
            return;
          }


          map.image_url =
            urlInput.value
              .trim();


          this.setMapStatus(
            'Unsaved Changes'
          );


          this.scheduleMapSave(
            true
          );

        }
      );

    }


    content
      .querySelector(
        '[data-edit-map-links]'
      )
      ?.addEventListener(
        'click',
        () =>
          this.openLinkManager()
      );


    content
      .querySelector(
        '[data-delete-map]'
      )
      ?.addEventListener(
        'click',
        () =>
          this.deleteActiveMap()
      );


    content
      .querySelectorAll(
        '[data-open-pin]'
      )
      .forEach(
        button => {

          button.addEventListener(
            'click',
            () => {

              this.activePinId =
                button.dataset
                  .openPin;


              this.renderPinDrawer();

              this.refreshPinSelection();

            }
          );

        }
      );


    this.connectMapStage();

  }


  /* ===================================================
     MODULE CHECKLIST MARKUP
     =================================================== */

  buildModuleChecklist(
    selectedIds
  ){

    const selected =
      new Set(
        selectedIds
      );


    return this.campaignChapters
      .map(
        chapter => {

          const modules =
            this.campaignModules
              .filter(
                module =>
                  module.chapter_id ===
                  chapter.id
              )
              .sort(
                (a,b) =>
                  (
                    Number(
                      a.sort_order
                    ) || 0
                  ) -
                  (
                    Number(
                      b.sort_order
                    ) || 0
                  )
              );


          if(
            modules.length ===
            0
          ){

            return '';

          }


          const allChecked =
            modules.every(
              module =>
                selected.has(
                  module.id
                )
            );


          return `

            <section
              class="dm-map-link-chapter"
            >

              <label
                class="dm-map-link-chapter-head"
              >

                <input
                  type="checkbox"
                  data-map-chapter-toggle="${chapter.id}"
                  ${
                    allChecked
                      ? 'checked'
                      : ''
                  }
                >

                <span>

                  <small>
                    ${adventureMapEscape(
                      chapter.chapter_label ||
                      'Chapter'
                    )}
                  </small>

                  <strong>
                    ${adventureMapEscape(
                      chapter.title ||
                      'Untitled Chapter'
                    )}
                  </strong>

                </span>

              </label>


              <div
                class="dm-map-link-module-list"
              >

                ${
                  modules
                    .map(
                      module => `

                        <label
                          class="dm-map-link-module"
                        >

                          <input
                            type="checkbox"
                            data-map-module-link="${module.id}"
                            data-map-module-chapter="${chapter.id}"
                            ${
                              selected.has(
                                module.id
                              )
                                ? 'checked'
                                : ''
                            }
                          >

                          <span>

                            <small>
                              ${adventureMapEscape(
                                module.module_label ||
                                'Module'
                              )}
                            </small>

                            <strong>
                              ${adventureMapEscape(
                                module.title ||
                                'Untitled Module'
                              )}
                            </strong>

                          </span>

                        </label>

                      `
                    )
                    .join('')
                }

              </div>

            </section>

          `;

        }
      )
      .join('');

  }


  /* ===================================================
     MINI DIALOG
     =================================================== */

  openMiniDialog(
    markup
  ){

    this.closeMiniDialog();


    const dialog =
      document.createElement(
        'div'
      );


    dialog.className =
      'dm-map-link-dialog-shell';


    dialog.dataset
      .mapLinkDialog =
        'true';


    dialog.innerHTML = `

      <div
        class="dm-map-link-dialog-backdrop"
        data-close-mini-dialog
      ></div>

      <section
        class="dm-map-link-dialog"
      >
        ${markup}
      </section>

    `;


    this.overlay.append(
      dialog
    );


    dialog
      .querySelector(
        '[data-close-mini-dialog]'
      )
      ?.addEventListener(
        'click',
        () =>
          this.closeMiniDialog()
      );


    dialog
      .querySelectorAll(
        '[data-map-chapter-toggle]'
      )
      .forEach(
        chapterToggle => {

          chapterToggle
            .addEventListener(
              'change',
              () => {

                const chapterId =
                  chapterToggle.dataset
                    .mapChapterToggle;


                dialog
                  .querySelectorAll(
                    `[data-map-module-chapter="${chapterId}"]`
                  )
                  .forEach(
                    input => {

                      input.checked =
                        chapterToggle.checked;

                    }
                  );

              }
            );

        }
      );


    return dialog;

  }


  closeMiniDialog(){

    this.overlay
      ?.querySelector(
        '[data-map-link-dialog]'
      )
      ?.remove();

  }


  /* ===================================================
     CREATE MAP DIALOG
     =================================================== */

  openCreateMapDialog(){

    const dialog =
      this.openMiniDialog(`

        <header
          class="dm-map-link-dialog-header"
        >

          <div>

            <div
              class="dm-map-board-eyebrow"
            >
              NEW CARTOGRAPHIC RESOURCE
            </div>

            <h3>
              Add Map
            </h3>

          </div>


          <button
            type="button"
            data-close-create-map
          >
            ×
          </button>

        </header>


        <div
          class="dm-map-link-dialog-body"
        >

          <label
            class="dm-map-create-name"
          >

            <span>
              Map Name
            </span>

            <input
              type="text"
              value="Untitled Map"
              data-new-map-name
            >

          </label>


          <div
            class="dm-map-link-heading"
          >

            <div>

              <strong>
                Available in Modules
              </strong>

              <span>
                Select every module that
                should be able to open
                this map.
              </span>

            </div>


            <div
              class="dm-map-link-bulk"
            >

              <button
                type="button"
                data-link-select-all
              >
                Select All
              </button>

              <button
                type="button"
                data-link-clear
              >
                Clear
              </button>

            </div>

          </div>


          <div
            class="dm-map-link-checklist"
          >

            ${this.buildModuleChecklist([
              this.moduleId
            ])}

          </div>

        </div>


        <footer
          class="dm-map-link-dialog-footer"
        >

          <button
            type="button"
            class="dm-map-link-cancel"
            data-close-create-map
          >
            Cancel
          </button>

          <button
            type="button"
            class="dm-map-link-save"
            data-confirm-create-map
          >
            Create Map
          </button>

        </footer>

      `);


    dialog
      .querySelectorAll(
        '[data-close-create-map]'
      )
      .forEach(
        button => {

          button.addEventListener(
            'click',
            () =>
              this.closeMiniDialog()
          );

        }
      );


    this.connectBulkLinkButtons(
      dialog
    );


    dialog
      .querySelector(
        '[data-confirm-create-map]'
      )
      ?.addEventListener(
        'click',
        () =>
          this.createMapFromDialog(
            dialog
          )
      );


    window.setTimeout(
      () =>
        dialog
          .querySelector(
            '[data-new-map-name]'
          )
          ?.select(),
      20
    );

  }


  /* ===================================================
     CREATE MAP
     =================================================== */

  async createMapFromDialog(
    dialog
  ){

    const db =
      adventureMapDb();


    if(!db){
      return;
    }


    const moduleIds =
      this.getCheckedModuleIds(
        dialog
      );


    if(
      moduleIds.length ===
      0
    ){

      window.alert(
        'Select at least one module for this map.'
      );


      return;

    }


    const name =
      dialog
        .querySelector(
          '[data-new-map-name]'
        )
        ?.value
        .trim() ||
      'Untitled Map';


    const nextOrder =
      this.maps.length

        ? (
            Math.max(
              ...this.maps.map(
                map =>
                  Number(
                    map.sort_order ||
                    0
                  )
              )
            ) +
            100
          )

        : 100;


    const {
      data:map,
      error:mapError
    } =
      await db

        .from(
          'adventure_maps'
        )

        .insert({

          campaign:
            this.campaign,

          module_id:
            null,

          title:
            name,

          image_url:
            '',

          sort_order:
            nextOrder

        })

        .select('*')

        .single();


    if(mapError){

      window.alert(
        `Could not create map: ${mapError.message}`
      );


      return;

    }


    const rows =
      moduleIds.map(
        moduleId => ({

          map_id:
            map.id,

          module_id:
            moduleId

        })
      );


    const {
      data:newLinks,
      error:linkError
    } =
      await db

        .from(
          'adventure_map_modules'
        )

        .insert(
          rows
        )

        .select('*');


    if(linkError){

      await db
        .from(
          'adventure_maps'
        )
        .delete()
        .eq(
          'id',
          map.id
        );


      window.alert(
        `Could not link map to modules: ${linkError.message}`
      );


      return;

    }


    /*
      Only show the new map immediately
      if it is linked to the module we
      are currently viewing.
    */

    if(
      moduleIds.includes(
        this.moduleId
      )
    ){

      this.maps.push(
        map
      );


      this.links.push(
        ...(
          newLinks ||
          []
        )
      );


      this.activeMapId =
        map.id;

    }


    this.closeMiniDialog();

    await this.load();

    this.activeMapId =
      map.id;

    this.render();

  }


  /* ===================================================
     LINK MANAGER
     =================================================== */

  openLinkManager(){

    const map =
      this.activeMap;


    if(!map){
      return;
    }


    const existing =
      this.getLinkedModuleIds(
        map.id
      );


    const dialog =
      this.openMiniDialog(`

        <header
          class="dm-map-link-dialog-header"
        >

          <div>

            <div
              class="dm-map-board-eyebrow"
            >
              MAP AVAILABILITY
            </div>

            <h3>
              ${adventureMapEscape(
                map.title
              )}
            </h3>

          </div>


          <button
            type="button"
            data-close-link-manager
          >
            ×
          </button>

        </header>


        <div
          class="dm-map-link-dialog-body"
        >

          <div
            class="dm-map-link-heading"
          >

            <div>

              <strong>
                Linked Modules
              </strong>

              <span>
                This is one map. These
                selections only control
                where it can be opened.
              </span>

            </div>


            <div
              class="dm-map-link-bulk"
            >

              <button
                type="button"
                data-link-select-all
              >
                Select All
              </button>

              <button
                type="button"
                data-link-clear
              >
                Clear
              </button>

            </div>

          </div>


          <div
            class="dm-map-link-checklist"
          >

            ${this.buildModuleChecklist(
              existing
            )}

          </div>

        </div>


        <footer
          class="dm-map-link-dialog-footer"
        >

          <button
            type="button"
            class="dm-map-link-cancel"
            data-close-link-manager
          >
            Cancel
          </button>

          <button
            type="button"
            class="dm-map-link-save"
            data-save-map-links
          >
            Save Links
          </button>

        </footer>

      `);


    dialog
      .querySelectorAll(
        '[data-close-link-manager]'
      )
      .forEach(
        button => {

          button.addEventListener(
            'click',
            () =>
              this.closeMiniDialog()
          );

        }
      );


    this.connectBulkLinkButtons(
      dialog
    );


    dialog
      .querySelector(
        '[data-save-map-links]'
      )
      ?.addEventListener(
        'click',
        () =>
          this.saveMapLinks(
            dialog
          )
      );

  }


  connectBulkLinkButtons(
    dialog
  ){

    dialog
      .querySelector(
        '[data-link-select-all]'
      )
      ?.addEventListener(
        'click',
        () => {

          dialog
            .querySelectorAll(
              '[data-map-module-link]'
            )
            .forEach(
              input => {

                input.checked =
                  true;

              }
            );


          dialog
            .querySelectorAll(
              '[data-map-chapter-toggle]'
            )
            .forEach(
              input => {

                input.checked =
                  true;

              }
            );

        }
      );


    dialog
      .querySelector(
        '[data-link-clear]'
      )
      ?.addEventListener(
        'click',
        () => {

          dialog
            .querySelectorAll(
              `
                [data-map-module-link],
                [data-map-chapter-toggle]
              `
            )
            .forEach(
              input => {

                input.checked =
                  false;

              }
            );

        }
      );

  }


  getCheckedModuleIds(
    dialog
  ){

    return Array.from(
      dialog.querySelectorAll(
        '[data-map-module-link]:checked'
      )
    )
      .map(
        input =>
          input.dataset
            .mapModuleLink
      );

  }


  async saveMapLinks(
    dialog
  ){

    const map =
      this.activeMap;


    const db =
      adventureMapDb();


    if(
      !map ||
      !db
    ){

      return;

    }


    const moduleIds =
      this.getCheckedModuleIds(
        dialog
      );


    if(
      moduleIds.length ===
      0
    ){

      window.alert(
        'A map must remain linked to at least one module.'
      );


      return;

    }


    const saveButton =
      dialog.querySelector(
        '[data-save-map-links]'
      );


    if(saveButton){

      saveButton.disabled =
        true;


      saveButton.textContent =
        'Saving...';

    }


    const {
      error:deleteError
    } =
      await db

        .from(
          'adventure_map_modules'
        )

        .delete()

        .eq(
          'map_id',
          map.id
        );


    if(deleteError){

      window.alert(
        `Could not update map links: ${deleteError.message}`
      );


      if(saveButton){

        saveButton.disabled =
          false;


        saveButton.textContent =
          'Save Links';

      }


      return;

    }


    const rows =
      moduleIds.map(
        moduleId => ({

          map_id:
            map.id,

          module_id:
            moduleId

        })
      );


    const {
      error:insertError
    } =
      await db

        .from(
          'adventure_map_modules'
        )

        .insert(
          rows
        );


    if(insertError){

      window.alert(
        `Could not save new map links: ${insertError.message}`
      );


      await this.load();

      this.closeMiniDialog();

      this.render();

      return;

    }


    const stillVisible =
      moduleIds.includes(
        this.moduleId
      );


    this.closeMiniDialog();


    await this.load();


    /*
      If the map was unlinked from the
      module currently being viewed,
      it disappears from this Map Board.
    */

    if(
      stillVisible &&
      this.maps.some(
        item =>
          item.id ===
          map.id
      )
    ){

      this.activeMapId =
        map.id;

    }
    else{

      this.activeMapId =
        this.maps[0]?.id ||
        null;

    }


    this.render();

  }


  /* ===================================================
     MAP STAGE
     =================================================== */

  connectMapStage(){

    const stage =
      this.overlay
        ?.querySelector(
          '[data-map-stage]'
        );


    const image =
      this.overlay
        ?.querySelector(
          '[data-map-image]'
        );


    if(
      !stage ||
      !image
    ){

      return;

    }


    stage.addEventListener(
      'click',
      async event => {

        if(
          event.target.closest(
            '[data-map-pin]'
          )
        ){

          return;

        }


        const point =
          this.getStagePercentPosition(
            image,
            event.clientX,
            event.clientY
          );


        if(!point){
          return;
        }


        await this.createPin(
          point.x,
          point.y
        );

      }
    );


    stage
      .querySelectorAll(
        '[data-map-pin]'
      )
      .forEach(
        pinElement => {

          const pinId =
            pinElement.dataset
              .mapPin;


          let moved =
            false;


          let startX =
            0;


          let startY =
            0;


          pinElement.addEventListener(
            'pointerdown',
            event => {

              event.preventDefault();

              event.stopPropagation();


              this.draggingPinId =
                pinId;


              moved =
                false;


              startX =
                event.clientX;


              startY =
                event.clientY;


              pinElement
                .setPointerCapture(
                  event.pointerId
                );


              pinElement
                .classList
                .add(
                  'dragging'
                );

            }
          );


          pinElement.addEventListener(
            'pointermove',
            event => {

              if(
                this.draggingPinId !==
                pinId
              ){

                return;

              }


              event.preventDefault();

              event.stopPropagation();


              if(
                Math.abs(
                  event.clientX -
                  startX
                ) > 3 ||
                Math.abs(
                  event.clientY -
                  startY
                ) > 3
              ){

                moved =
                  true;

              }


              const point =
                this.getStagePercentPosition(
                  image,
                  event.clientX,
                  event.clientY
                );


              if(!point){
                return;
              }


              pinElement.style.left =
                `${point.x}%`;


              pinElement.style.top =
                `${point.y}%`;


              const pin =
                this.pins.find(
                  item =>
                    item.id ===
                    pinId
                );


              if(pin){

                pin.x_percent =
                  point.x;


                pin.y_percent =
                  point.y;

              }

            }
          );


          pinElement.addEventListener(
            'pointerup',
            async event => {

              if(
                this.draggingPinId !==
                pinId
              ){

                return;

              }


              event.preventDefault();

              event.stopPropagation();


              this.draggingPinId =
                null;


              pinElement
                .classList
                .remove(
                  'dragging'
                );


              try{

                pinElement
                  .releasePointerCapture(
                    event.pointerId
                  );

              }
              catch(error){
                /* no-op */
              }


              const pin =
                this.pins.find(
                  item =>
                    item.id ===
                    pinId
                );


              if(
                moved &&
                pin
              ){

                await this.savePinPosition(
                  pin
                );

              }
              else{

                this.activePinId =
                  pinId;


                this.renderPinDrawer();

                this.refreshPinSelection();

              }

            }
          );


          pinElement.addEventListener(
            'pointercancel',
            () => {

              this.draggingPinId =
                null;


              pinElement
                .classList
                .remove(
                  'dragging'
                );

            }
          );

        }
      );

  }


  getStagePercentPosition(
    image,
    clientX,
    clientY
  ){

    const rect =
      image.getBoundingClientRect();


    if(
      rect.width <= 0 ||
      rect.height <= 0
    ){

      return null;

    }


    const x =
      adventureMapClamp(

        (
          (
            clientX -
            rect.left
          ) /
          rect.width
        ) *
        100,

        0,

        100

      );


    const y =
      adventureMapClamp(

        (
          (
            clientY -
            rect.top
          ) /
          rect.height
        ) *
        100,

        0,

        100

      );


    return {

      x:
        Number(
          x.toFixed(3)
        ),

      y:
        Number(
          y.toFixed(3)
        )

    };

  }


  /* ===================================================
     SAVE MAP
     =================================================== */

  scheduleMapSave(
    rerenderImage = false
  ){

    window.clearTimeout(
      this.saveTimers.map
    );


    this.saveTimers.map =
      window.setTimeout(
        async () => {

          await this.saveActiveMap();


          if(rerenderImage){

            this.render();

          }

        },
        EPCOT_MAP_AUTOSAVE_DELAY
      );

  }


  async saveActiveMap(){

    const map =
      this.activeMap;


    const db =
      adventureMapDb();


    if(
      !map ||
      !db
    ){

      return;

    }


    this.setMapStatus(
      'Saving...'
    );


    const {
      data,
      error
    } =
      await db

        .from(
          'adventure_maps'
        )

        .update({

          title:
            String(
              map.title ||
              ''
            )
              .trim() ||
            'Untitled Map',

          image_url:
            String(
              map.image_url ||
              ''
            )
              .trim(),

          updated_at:
            new Date()
              .toISOString()

        })

        .eq(
          'id',
          map.id
        )

        .eq(
          'campaign',
          this.campaign
        )

        .select('*')

        .single();


    if(error){

      console.error(
        'Map save failed:',
        error
      );


      this.setMapStatus(
        'Save Failed'
      );


      return;

    }


    Object.assign(
      map,
      data
    );


    this.setMapStatus(
      `Saved ${adventureMapFormatTime(
        data.updated_at
      )}`
    );

  }


  setMapStatus(
    text
  ){

    this.overlay
      ?.querySelectorAll(
        '[data-map-save-status]'
      )
      .forEach(
        element => {

          element.textContent =
            text;

        }
      );

  }


  /* ===================================================
     DELETE MAP
     =================================================== */

  async deleteActiveMap(){

    const map =
      this.activeMap;


    if(!map){
      return;
    }


    if(
      !window.confirm(
        `Delete “${map.title}” and all of its pins and notes?\n\nThis removes the single shared map from every linked module.\n\nThis cannot be undone.`
      )
    ){

      return;

    }


    const db =
      adventureMapDb();


    const {
      error
    } =
      await db

        .from(
          'adventure_maps'
        )

        .delete()

        .eq(
          'id',
          map.id
        );


    if(error){

      window.alert(
        `Could not delete map: ${error.message}`
      );


      return;

    }


    this.activeMapId =
      null;


    this.activePinId =
      null;


    await this.load();

    this.render();

  }


  /* ===================================================
     CREATE PIN
     =================================================== */

  async createPin(
    x,
    y
  ){

    const map =
      this.activeMap;


    const db =
      adventureMapDb();


    if(
      !map ||
      !db
    ){

      return;

    }


    const existingPins =
      this.activePins;


    const nextNumber =
      existingPins.length +
      1;


    const nextOrder =
      existingPins.length

        ? (
            Math.max(
              ...existingPins.map(
                pin =>
                  Number(
                    pin.sort_order ||
                    0
                  )
              )
            ) +
            100
          )

        : 100;


    const {
      data,
      error
    } =
      await db

        .from(
          'adventure_map_pins'
        )

        .insert({

          map_id:
            map.id,

          label:
            String(
              nextNumber
            ),

          title:
            `Location ${nextNumber}`,

          pin_type:
            'room',

          x_percent:
            x,

          y_percent:
            y,

          note_html:
            '',

          sort_order:
            nextOrder

        })

        .select('*')

        .single();


    if(error){

      window.alert(
        `Could not create map note: ${error.message}`
      );


      return;

    }


    this.pins.push(
      data
    );


    this.activePinId =
      data.id;


    this.render();

  }


  /* ===================================================
     PIN DRAWER
     =================================================== */

  renderPinDrawer(){

    const drawer =
      this.overlay
        ?.querySelector(
          '[data-pin-drawer]'
        );


    const pin =
      this.activePin;


    if(
      !drawer ||
      !pin
    ){

      return;

    }


    drawer.classList.add(
      'open'
    );


    drawer.innerHTML = `

      <header
        class="dm-map-pin-drawer-header"
      >

        <div>

          <div
            class="dm-map-board-eyebrow"
          >
            MAP NOTE
          </div>

          <h3>
            ${adventureMapEscape(
              pin.label ||
              '?'
            )}
            ·
            ${adventureMapEscape(
              pin.title ||
              'Untitled Location'
            )}
          </h3>

        </div>


        <button
          type="button"
          class="dm-map-pin-drawer-close"
          data-close-pin-drawer
        >
          ×
        </button>

      </header>


      <div
        class="dm-map-pin-drawer-scroll"
      >

        <div
          class="dm-map-pin-meta-grid"
        >

          <label>

            <span>
              Pin Label
            </span>

            <input
              type="text"
              maxlength="12"
              data-pin-label
              value="${adventureMapEscape(
                pin.label ||
                ''
              )}"
            >

          </label>


          <label>

            <span>
              Type
            </span>

            <select
              data-pin-type
            >

              ${
                EPCOT_MAP_PIN_TYPES
                  .map(
                    type => `

                      <option
                        value="${type.value}"
                        ${
                          pin.pin_type ===
                          type.value
                            ? 'selected'
                            : ''
                        }
                      >
                        ${type.label}
                      </option>

                    `
                  )
                  .join('')
              }

            </select>

          </label>

        </div>


        <label
          class="dm-map-pin-title-field"
        >

          <span>
            Location / Note Title
          </span>

          <input
            type="text"
            data-pin-title
            value="${adventureMapEscape(
              pin.title ||
              ''
            )}"
          >

        </label>


        <div
          class="dm-map-pin-position"
        >

          Position:

          ${Number(
            pin.x_percent
          ).toFixed(1)}%

          ×

          ${Number(
            pin.y_percent
          ).toFixed(1)}%

        </div>


        <div
          class="dm-map-pin-editor-label"
        >
          DM Notes
        </div>


        <div
          data-pin-toolbar
        ></div>


        <div
          class="dm-map-pin-editor"
          contenteditable="true"
          spellcheck="true"
          data-pin-note-editor
          data-placeholder="Add room details, encounter notes, read-aloud text, secrets, treasure..."
        >${adventureMapSanitizeHtml(
          pin.note_html ||
          ''
        )}</div>


        <div
          class="dm-map-pin-save-status"
          data-pin-save-status
        >
          Saved
        </div>


        <button
          type="button"
          class="dm-map-pin-delete"
          data-delete-pin
        >
          Delete Map Note
        </button>

      </div>

    `;


    const editor =
      drawer.querySelector(
        '[data-pin-note-editor]'
      );


    this.pinNoteEditor =
      editor;


    drawer
      .querySelector(
        '[data-pin-toolbar]'
      )
      ?.append(
        adventureMapBuildToolbar(
          editor
        )
      );


    drawer
      .querySelector(
        '[data-close-pin-drawer]'
      )
      ?.addEventListener(
        'click',
        () =>
          this.closePinDrawer()
      );


    const labelInput =
      drawer.querySelector(
        '[data-pin-label]'
      );


    const titleInput =
      drawer.querySelector(
        '[data-pin-title]'
      );


    const typeSelect =
      drawer.querySelector(
        '[data-pin-type]'
      );


    labelInput
      ?.addEventListener(
        'input',
        () => {

          pin.label =
            labelInput.value;


          this.setPinStatus(
            'Unsaved Changes'
          );


          this.schedulePinSave();

        }
      );


    titleInput
      ?.addEventListener(
        'input',
        () => {

          pin.title =
            titleInput.value;


          this.setPinStatus(
            'Unsaved Changes'
          );


          this.schedulePinSave();

        }
      );


    typeSelect
      ?.addEventListener(
        'change',
        () => {

          pin.pin_type =
            typeSelect.value;


          this.setPinStatus(
            'Unsaved Changes'
          );


          this.schedulePinSave();

        }
      );


    editor
      ?.addEventListener(
        'input',
        () => {

          pin.note_html =
            adventureMapSanitizeHtml(
              editor.innerHTML
            );


          this.setPinStatus(
            'Unsaved Changes'
          );


          this.schedulePinNoteSave();

        }
      );


    drawer
      .querySelector(
        '[data-delete-pin]'
      )
      ?.addEventListener(
        'click',
        () =>
          this.deleteActivePin()
      );

  }


  closePinDrawer(){

    this.activePinId =
      null;


    this.pinNoteEditor =
      null;


    const drawer =
      this.overlay
        ?.querySelector(
          '[data-pin-drawer]'
        );


    if(drawer){

      drawer.classList.remove(
        'open'
      );


      drawer.innerHTML =
        '';

    }


    this.refreshPinSelection();

  }


  refreshPinSelection(){

    const layer =
      this.overlay
        ?.querySelector(
          '[data-map-pin-layer]'
        );


    if(!layer){
      return;
    }


    layer.innerHTML =
      this.activePins
        .map(
          pin =>
            this.buildPinMarkup(
              pin
            )
        )
        .join('');


    this.connectMapStage();

  }


  /* ===================================================
     PIN SAVING
     =================================================== */

  schedulePinSave(){

    window.clearTimeout(
      this.saveTimers.pin
    );


    this.saveTimers.pin =
      window.setTimeout(
        () =>
          this.saveActivePin(),
        EPCOT_MAP_AUTOSAVE_DELAY
      );

  }


  async saveActivePin(){

    const pin =
      this.activePin;


    const db =
      adventureMapDb();


    if(
      !pin ||
      !db
    ){

      return;

    }


    this.setPinStatus(
      'Saving...'
    );


    const {
      data,
      error
    } =
      await db

        .from(
          'adventure_map_pins'
        )

        .update({

          label:
            String(
              pin.label ||
              ''
            )
              .trim() ||
            '?',

          title:
            String(
              pin.title ||
              ''
            )
              .trim() ||
            'Untitled Location',

          pin_type:
            pin.pin_type ||
            'room',

          updated_at:
            new Date()
              .toISOString()

        })

        .eq(
          'id',
          pin.id
        )

        .select('*')

        .single();


    if(error){

      console.error(
        'Map pin save failed:',
        error
      );


      this.setPinStatus(
        'Save Failed'
      );


      return;

    }


    Object.assign(
      pin,
      data
    );


    this.setPinStatus(
      `Saved ${adventureMapFormatTime(
        data.updated_at
      )}`
    );

  }


  schedulePinNoteSave(){

    window.clearTimeout(
      this.saveTimers.note
    );


    this.saveTimers.note =
      window.setTimeout(
        () =>
          this.savePinNote(),
        EPCOT_MAP_AUTOSAVE_DELAY
      );

  }


  async savePinNote(){

    const pin =
      this.activePin;


    const db =
      adventureMapDb();


    if(
      !pin ||
      !db
    ){

      return;

    }


    if(this.pinNoteEditor){

      pin.note_html =
        adventureMapSanitizeHtml(
          this.pinNoteEditor
            .innerHTML
        );

    }


    this.setPinStatus(
      'Saving...'
    );


    const {
      data,
      error
    } =
      await db

        .from(
          'adventure_map_pins'
        )

        .update({

          note_html:
            pin.note_html ||
            '',

          updated_at:
            new Date()
              .toISOString()

        })

        .eq(
          'id',
          pin.id
        )

        .select('*')

        .single();


    if(error){

      console.error(
        'Map note save failed:',
        error
      );


      this.setPinStatus(
        'Save Failed'
      );


      return;

    }


    Object.assign(
      pin,
      data
    );


    this.setPinStatus(
      `Saved ${adventureMapFormatTime(
        data.updated_at
      )}`
    );

  }


  setPinStatus(
    text
  ){

    this.overlay
      ?.querySelectorAll(
        '[data-pin-save-status]'
      )
      .forEach(
        element => {

          element.textContent =
            text;

        }
      );

  }


  async savePinPosition(
    pin
  ){

    const db =
      adventureMapDb();


    if(
      !db ||
      !pin
    ){

      return;

    }


    const {
      data,
      error
    } =
      await db

        .from(
          'adventure_map_pins'
        )

        .update({

          x_percent:
            Number(
              pin.x_percent
            ),

          y_percent:
            Number(
              pin.y_percent
            ),

          updated_at:
            new Date()
              .toISOString()

        })

        .eq(
          'id',
          pin.id
        )

        .select('*')

        .single();


    if(error){

      console.error(
        'Pin position save failed:',
        error
      );


      return;

    }


    Object.assign(
      pin,
      data
    );

  }


  async deleteActivePin(){

    const pin =
      this.activePin;


    if(!pin){
      return;
    }


    if(
      !window.confirm(
        `Delete map note “${pin.label} · ${pin.title}”?\n\nThis cannot be undone.`
      )
    ){

      return;

    }


    const db =
      adventureMapDb();


    const {
      error
    } =
      await db

        .from(
          'adventure_map_pins'
        )

        .delete()

        .eq(
          'id',
          pin.id
        );


    if(error){

      window.alert(
        `Could not delete map note: ${error.message}`
      );


      return;

    }


    this.pins =
      this.pins.filter(
        item =>
          item.id !==
          pin.id
      );


    this.activePinId =
      null;


    this.render();

  }

}


/* =====================================================
   GLOBAL INSTANCE
   ===================================================== */

const epcotAdventureMapBoard =
  new EpcotAdventureMapBoard();


window.epcotAdventureMapBoard =
  epcotAdventureMapBoard;


/* =====================================================
   ADVENTURE DESK INTEGRATION
   ===================================================== */

function adventureMapFindCampaign(
  element
){

  const desk =
    element.closest(
      '[data-adventure-desk]'
    );


  if(
    desk?.dataset
      .adventureDesk
  ){

    return (
      desk.dataset
        .adventureDesk ===
        'villain'
        ? 'villain'
        : 'hero'
    );

  }


  const popout =
    element.closest(
      '.dm-adventure-popout-shell'
    );


  if(
    popout?.dataset
      .campaign
  ){

    return (
      popout.dataset
        .campaign ===
        'villain'
        ? 'villain'
        : 'hero'
    );

  }


  return null;

}


function adventureMapDeskForCampaign(
  campaign
){

  if(
    campaign === 'villain'
  ){

    return window
      .epcotAdventureDesk
      ?.villain;

  }


  if(
    campaign === 'combined'
  ){

    return window
      .epcotAdventureDesk
      ?.combined;

  }


  return window
    .epcotAdventureDesk
    ?.hero;

}


function adventureMapOpenFromElement(
  element
){

  const campaign =
    adventureMapFindCampaign(
      element
    );


  if(!campaign){
    return;
  }


  const desk =
    adventureMapDeskForCampaign(
      campaign
    );


  const moduleId =
    desk?.selectedModuleId;


  if(!moduleId){

    window.alert(
      'Select a module before opening its Map Board.'
    );


    return;

  }


  epcotAdventureMapBoard.open(
    campaign,
    moduleId
  );

}


/* =====================================================
   MAP BUTTON INJECTION
   ===================================================== */

function adventureMapInjectWorkspaceButtons(){

  document
    .querySelectorAll(
      '.dm-adventure-session-controls'
    )
    .forEach(
      controls => {

        if(
          controls.querySelector(
            '[data-open-map-board]'
          )
        ){

          return;

        }


        const button =
          document.createElement(
            'button'
          );


        button.type =
          'button';


        button.className =
          `
            dm-adventure-secondary-button
            dm-adventure-map-button
          `;


        button.dataset
          .openMapBoard =
            'true';


        button.innerHTML =
          '⌖ Maps';


        button.title =
          'Open linked maps';


        button.addEventListener(
          'click',
          () =>
            adventureMapOpenFromElement(
              button
            )
        );


        const openModule =
          controls.querySelector(
            '[data-open-popout]'
          );


        if(openModule){

          openModule.before(
            button
          );

        }
        else{

          controls.append(
            button
          );

        }

      }
    );

}


function adventureMapInjectPopoutButtons(){

  document
    .querySelectorAll(
      '.dm-adventure-popout-actions'
    )
    .forEach(
      actions => {

        if(
          actions.querySelector(
            '[data-open-map-board]'
          )
        ){

          return;

        }


        const button =
          document.createElement(
            'button'
          );


        button.type =
          'button';


        button.className =
          `
            dm-adventure-star-button
            dm-adventure-map-button
          `;


        button.dataset
          .openMapBoard =
            'true';


        button.innerHTML =
          '⌖ Maps';


        button.title =
          'Open linked maps';


        button.addEventListener(
          'click',
          () =>
            adventureMapOpenFromElement(
              button
            )
        );


        const starButton =
          actions.querySelector(
            '[data-star-module]'
          );


        if(starButton){

          starButton.before(
            button
          );

        }
        else{

          actions.prepend(
            button
          );

        }

      }
    );

}


async function adventureMapGetModuleMapCount(
  moduleId
){

  if(!moduleId){
    return 0;
  }


  const db =
    adventureMapDb();


  if(!db){
    return 0;
  }


  const {
    count,
    error
  } =
    await db

      .from(
        'adventure_map_modules'
      )

      .select(
        'id',
        {
          count:'exact',
          head:true
        }
      )

      .eq(
        'module_id',
        moduleId
      );


  if(error){

    console.error(
      'Map count lookup failed:',
      error
    );


    return 0;

  }


  return count || 0;

}


async function adventureMapUpdateButtonCounts(){

  const buttons =
    Array.from(
      document.querySelectorAll(
        '[data-open-map-board]'
      )
    );


  for(
    const button
    of buttons
  ){

    const campaign =
      adventureMapFindCampaign(
        button
      );


    if(!campaign){
      continue;
    }


    const desk =
      adventureMapDeskForCampaign(
        campaign
      );


    const moduleId =
      desk?.selectedModuleId;


    if(!moduleId){

      button.innerHTML =
        '⌖ Maps';

      continue;

    }


    const count =
      await adventureMapGetModuleMapCount(
        moduleId
      );


    button.innerHTML =
      count > 0
        ? `⌖ Maps · ${count}`
        : '⌖ Maps';

  }

}


let adventureMapRefreshScheduled =
  false;


let adventureMapRefreshRunning =
  false;


const adventureMapObserverOptions = {

  childList:true,
  subtree:true

};


async function adventureMapRefreshButtons(){

  if(
    adventureMapRefreshRunning
  ){
    return;
  }


  adventureMapRefreshRunning =
    true;


  /*
    The refresh itself adds buttons and
    changes button text.

    Temporarily disconnecting the observer
    prevents those changes from triggering
    another refresh of this same function.
  */

  adventureMapObserver
    .disconnect();


  try{

    adventureMapInjectWorkspaceButtons();

    adventureMapInjectPopoutButtons();

    await adventureMapUpdateButtonCounts();

  }
  catch(error){

    console.error(
      'Adventure Map button refresh failed:',
      error
    );

  }
  finally{

    adventureMapRefreshRunning =
      false;


    if(document.body){

      adventureMapObserver.observe(
        document.body,
        adventureMapObserverOptions
      );

    }

  }

}


function adventureMapScheduleRefresh(){

  if(
    adventureMapRefreshScheduled
  ){
    return;
  }


  adventureMapRefreshScheduled =
    true;


  requestAnimationFrame(
    async () => {

      adventureMapRefreshScheduled =
        false;


      await adventureMapRefreshButtons();

    }
  );

}


const adventureMapObserver =
  new MutationObserver(
    mutations => {

      const meaningfulChange =
        mutations.some(
          mutation => {

            /*
              Ignore mutations occurring only
              inside one of our own map buttons.
            */

            if(
              mutation.target
                ?.closest?.(
                  '[data-open-map-board]'
                )
            ){
              return false;
            }


            return true;

          }
        );


      if(
        meaningfulChange
      ){

        adventureMapScheduleRefresh();

      }

    }
  );


function initializeAdventureMapBoards(){

  adventureMapScheduleRefresh();


  if(document.body){

    adventureMapObserver.observe(
      document.body,
      adventureMapObserverOptions
    );

  }

}


if(
  document.readyState ===
  'loading'
){

  document.addEventListener(
    'DOMContentLoaded',
    initializeAdventureMapBoards
  );

}
else{

  initializeAdventureMapBoards();

}
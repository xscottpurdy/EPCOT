/* =====================================================
   EPCOT DND
   DM ADVENTURE DESK

   Stage 1
   - Hero + Villain adventure books
   - Chapters + modules
   - Drag/drop organization
   - Rich text editing
   - Autosave
   - Current/starred module
   - Previous / next navigation
   - Large module pop-out
   ===================================================== */


/* =====================================================
   CONSTANTS
   ===================================================== */

const EPCOT_ADVENTURE_AUTOSAVE_DELAY = 850;


/* =====================================================
   HELPERS
   ===================================================== */

function adventureDb(){
  return window.epcotAuth?.client || null;
}


function adventureEscape(value){

  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

}


function adventureDebounce(fn, delay){

  let timer = null;

  return (...args) => {

    window.clearTimeout(timer);

    timer = window.setTimeout(
      () => fn(...args),
      delay
    );

  };

}


function adventureFormatTime(dateValue){

  if(!dateValue){
    return '';
  }

  const date = new Date(dateValue);

  if(Number.isNaN(date.getTime())){
    return '';
  }

  return date.toLocaleTimeString(
    [],
    {
      hour:'numeric',
      minute:'2-digit'
    }
  );

}


function adventureSanitizeHtml(html){

  const template =
    document.createElement(
      'template'
    );

  template.innerHTML =
    String(
      html || ''
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
      node => node.remove()
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


        if(
          node.tagName === 'A'
        ){

          node.setAttribute(
            'target',
            '_blank'
          );

          node.setAttribute(
            'rel',
            'noopener noreferrer'
          );

        }


        if(
          node.tagName === 'IMG'
        ){

          node.setAttribute(
            'loading',
            'lazy'
          );

        }

      }
    );


  return template.innerHTML;

}


function adventureConfirm(
  message
){

  return window.confirm(
    message
  );

}


/* =====================================================
   RICH TEXT TOOLBAR
   ===================================================== */

function adventureBuildToolbar(
  editor
){

  const toolbar =
    document.createElement(
      'div'
    );


  toolbar.className =
    'dm-adventure-toolbar';


  toolbar.setAttribute(
    'role',
    'toolbar'
  );


  toolbar.setAttribute(
    'aria-label',
    'Formatting tools'
  );


  const button = (
    label,
    title,
    command,
    value = null
  ) => {

    const element =
      document.createElement(
        'button'
      );


    element.type =
      'button';


    element.className =
      'dm-adventure-tool';


    element.innerHTML =
      label;


    element.title =
      title;


    element.addEventListener(
      'mousedown',
      event => {

        event.preventDefault();

      }
    );


    element.addEventListener(
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


    return element;

  };


  const divider = () => {

    const element =
      document.createElement(
        'span'
      );


    element.className =
      'dm-adventure-tool-divider';


    element.setAttribute(
      'aria-hidden',
      'true'
    );


    return element;

  };


  toolbar.append(

    button(
      '<strong>B</strong>',
      'Bold',
      'bold'
    ),

    button(
      '<em>I</em>',
      'Italic',
      'italic'
    ),

    button(
      '<u>U</u>',
      'Underline',
      'underline'
    ),

    button(
      '<s>S</s>',
      'Strikethrough',
      'strikeThrough'
    ),

    divider(),

    button(
      'H1',
      'Heading 1',
      'formatBlock',
      'H1'
    ),

    button(
      'H2',
      'Heading 2',
      'formatBlock',
      'H2'
    ),

    button(
      'H3',
      'Heading 3',
      'formatBlock',
      'H3'
    ),

    button(
      '¶',
      'Normal paragraph',
      'formatBlock',
      'P'
    ),

    divider(),

    button(
      '• List',
      'Bulleted list',
      'insertUnorderedList'
    ),

    button(
      '1. List',
      'Numbered list',
      'insertOrderedList'
    ),

    button(
      '❝',
      'Block quote',
      'formatBlock',
      'BLOCKQUOTE'
    ),

    divider(),

    button(
      '←',
      'Align left',
      'justifyLeft'
    ),

    button(
      '↔',
      'Align center',
      'justifyCenter'
    ),

    button(
      '→',
      'Align right',
      'justifyRight'
    ),

    divider(),

    button(
      '—',
      'Horizontal divider',
      'insertHorizontalRule'
    )

  );


  /* ===================================================
     LINK BUTTON
     =================================================== */

  const linkButton =
    document.createElement(
      'button'
    );


  linkButton.type =
    'button';


  linkButton.className =
    'dm-adventure-tool';


  linkButton.textContent =
    'Link';


  linkButton.title =
    'Insert link';


  linkButton.addEventListener(
    'mousedown',
    event =>
      event.preventDefault()
  );


  linkButton.addEventListener(
    'click',
    () => {

      const url =
        window.prompt(
          'Paste the link URL:'
        );


      if(!url){
        return;
      }


      editor.focus();


      document.execCommand(
        'createLink',
        false,
        url.trim()
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


  /* ===================================================
     IMAGE BUTTON
     =================================================== */

  const imageButton =
    document.createElement(
      'button'
    );


  imageButton.type =
    'button';


  imageButton.className =
    'dm-adventure-tool';


  imageButton.textContent =
    'Image';


  imageButton.title =
    'Insert image by URL';


  imageButton.addEventListener(
    'mousedown',
    event =>
      event.preventDefault()
  );


  imageButton.addEventListener(
    'click',
    () => {

      const url =
        window.prompt(
          'Paste the image URL:'
        );


      if(!url){
        return;
      }


      editor.focus();


      document.execCommand(
        'insertImage',
        false,
        url.trim()
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


  /* ===================================================
     TEXT COLOR
     =================================================== */

  const colorLabel =
    document.createElement(
      'label'
    );


  colorLabel.className =
    'dm-adventure-color-tool';


  colorLabel.title =
    'Text color';


  colorLabel.innerHTML =
    '<span>A</span>';


  const colorInput =
    document.createElement(
      'input'
    );


  colorInput.type =
    'color';


  colorInput.value =
    '#ded8c7';


  colorInput.setAttribute(
    'aria-label',
    'Text color'
  );


  colorInput.addEventListener(
    'input',
    () => {

      editor.focus();


      document.execCommand(
        'foreColor',
        false,
        colorInput.value
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


  colorLabel.append(
    colorInput
  );


  /* ===================================================
     HIGHLIGHT COLOR
     =================================================== */

  const highlightLabel =
    document.createElement(
      'label'
    );


  highlightLabel.className =
    `
      dm-adventure-color-tool
      dm-adventure-highlight-tool
    `;


  highlightLabel.title =
    'Highlight color';


  highlightLabel.innerHTML =
    '<span>▰</span>';


  const highlightInput =
    document.createElement(
      'input'
    );


  highlightInput.type =
    'color';


  highlightInput.value =
    '#d6a64b';


  highlightInput.setAttribute(
    'aria-label',
    'Highlight color'
  );


  highlightInput.addEventListener(
    'input',
    () => {

      editor.focus();


      const worked =
        document.execCommand(
          'hiliteColor',
          false,
          highlightInput.value
        );


      if(!worked){

        document.execCommand(
          'backColor',
          false,
          highlightInput.value
        );

      }


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


  highlightLabel.append(
    highlightInput
  );


  toolbar.append(

    divider(),

    linkButton,

    imageButton,

    colorLabel,

    highlightLabel,

    divider(),

    button(
      '↶',
      'Undo',
      'undo'
    ),

    button(
      '↷',
      'Redo',
      'redo'
    ),

    button(
      'Tx',
      'Clear formatting',
      'removeFormat'
    )

  );


  return toolbar;

}


/* =====================================================
   ADVENTURE DESK CLASS
   ===================================================== */

class EpcotAdventureDesk{


  constructor({
    campaign,
    mountId
  }){

    this.campaign =
      campaign;


    this.mountId =
      mountId;


    this.mount =
      null;


    this.chapters =
      [];


    this.modules =
      [];


    this.selectedModuleId =
      null;


    this.starredModuleId =
      null;


    this.mainEditor =
      null;


    this.popoutEditor =
      null;


    this.popout =
      null;


    this.saveRevision =
      0;


    this.isReady =
      false;


    this.draggedModuleId =
      null;


    this.draggedChapterId =
      null;


    this.autosaveContent =
      adventureDebounce(
        () =>
          this.saveActiveContent(),
        EPCOT_ADVENTURE_AUTOSAVE_DELAY
      );


    this.autosaveMetadata =
      adventureDebounce(
        () =>
          this.saveSelectedModuleMetadata(),
        EPCOT_ADVENTURE_AUTOSAVE_DELAY
      );

  }


get label(){

  if(
    this.campaign === 'villain'
  ){
    return 'Villain';
  }


  if(
    this.campaign === 'combined'
  ){
    return 'Either / Combined';
  }


  return 'Hero';

}


get code(){

  if(
    this.campaign === 'villain'
  ){
    return 'VILLAIN';
  }


  if(
    this.campaign === 'combined'
  ){
    return 'COMBINED';
  }


  return 'HERO';

}


  /* ===================================================
     INITIALIZE
     =================================================== */

  async init(){

    this.mount =
      document.getElementById(
        this.mountId
      );


    if(
      !this.mount ||
      this.isReady
    ){

      return;

    }


    this.isReady =
      true;


    this.renderLoading();


    try{

      await this.loadData();

      this.render();

    }
    catch(error){

      console.error(
        `${this.label} Adventure Desk failed to load:`,
        error
      );


      this.renderError(
        error
      );

    }

  }


  /* ===================================================
     LOAD STATE
     =================================================== */

  renderLoading(){

    this.mount.innerHTML = `

      <div class="dm-adventure-state">

        <div
          class="dm-adventure-state-pulse"
        ></div>

        Loading ${this.label}
        Adventure Book...

      </div>

    `;

  }


  renderError(
    error
  ){

    this.mount.innerHTML = `

      <div class="dm-adventure-error">

        <strong>
          Adventure Book Connection Failed
        </strong>

        <span>
          ${adventureEscape(
            error?.message ||
            'Unknown database error.'
          )}
        </span>

        <button
          type="button"
          data-adventure-retry
        >
          Retry
        </button>

      </div>

    `;


    this.mount
      .querySelector(
        '[data-adventure-retry]'
      )
      ?.addEventListener(
        'click',
        async () => {

          this.isReady =
            false;

          await this.init();

        }
      );

  }


  /* ===================================================
     DATABASE LOAD
     =================================================== */

  async loadData(){

    const db =
      adventureDb();


    if(!db){

      throw new Error(
        'Supabase client is unavailable.'
      );

    }


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
          )
          .order(
            'created_at',
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
          .order(
            'created_at',
            {
              ascending:true
            }
          )

      ]);


    if(
      chaptersResult.error
    ){

      throw chaptersResult.error;

    }


    if(
      modulesResult.error
    ){

      throw modulesResult.error;

    }


    this.chapters =
      chaptersResult.data ||
      [];


    this.modules =
      modulesResult.data ||
      [];


    this.starredModuleId =
      this.modules.find(
        module =>
          module.is_starred
      )?.id ||
      null;


    const selectedStillExists =
      this.modules.some(
        module =>
          module.id ===
          this.selectedModuleId
      );


    if(
      !selectedStillExists
    ){

      this.selectedModuleId =

        this.starredModuleId ||

        this.getOrderedModules()
          [0]?.id ||

        null;

    }

  }


  /* ===================================================
     ORDER HELPERS
     =================================================== */

  getOrderedChapters(){

    return [
      ...this.chapters
    ]
      .sort(
        (a, b) => {

          if(
            a.sort_order !==
            b.sort_order
          ){

            return (
              a.sort_order -
              b.sort_order
            );

          }


          return String(
            a.created_at
          )
            .localeCompare(
              String(
                b.created_at
              )
            );

        }
      );

  }


  getModulesForChapter(
    chapterId
  ){

    return this.modules
      .filter(
        module =>
          module.chapter_id ===
          chapterId
      )
      .sort(
        (a, b) => {

          if(
            a.sort_order !==
            b.sort_order
          ){

            return (
              a.sort_order -
              b.sort_order
            );

          }


          return String(
            a.created_at
          )
            .localeCompare(
              String(
                b.created_at
              )
            );

        }
      );

  }


  getOrderedModules(){

    const ordered =
      [];


    this.getOrderedChapters()
      .forEach(
        chapter => {

          ordered.push(
            ...this.getModulesForChapter(
              chapter.id
            )
          );

        }
      );


    return ordered;

  }


  getSelectedModule(){

    return (
      this.modules.find(
        module =>
          module.id ===
          this.selectedModuleId
      ) ||
      null
    );

  }


  getChapter(
    chapterId
  ){

    return (
      this.chapters.find(
        chapter =>
          chapter.id ===
          chapterId
      ) ||
      null
    );

  }


  getModulePosition(
    moduleId
  ){

    const ordered =
      this.getOrderedModules();


    const index =
      ordered.findIndex(
        module =>
          module.id ===
          moduleId
      );


    return {

      index,

      total:
        ordered.length,

      previous:
        index > 0
          ? ordered[index - 1]
          : null,

      next:
        (
          index >= 0 &&
          index <
            ordered.length - 1
        )
          ? ordered[index + 1]
          : null

    };

  }


  /* ===================================================
     MAIN RENDER
     =================================================== */

  render(){

    if(!this.mount){
      return;
    }


    this.mount.innerHTML = `

      <section
        class="dm-adventure-desk"
        data-adventure-desk="${this.campaign}"
      >

        <header
          class="dm-adventure-desk-header"
        >

          <div>

            <div
              class="dm-adventure-eyebrow"
            >
              ${this.code}
              CAMPAIGN //
              ADVENTURE AUTHORING SYSTEM
            </div>

            <h2>
              ${this.label}
              Adventure Book
            </h2>

            <p>
              Build chapters, organize
              modules, and keep a live
              session page ready for play.
            </p>

          </div>


          <div
            class="dm-adventure-header-actions"
          >

            <button
              type="button"
              class="dm-adventure-primary-button"
              data-adventure-add-chapter
            >
              + Add Chapter
            </button>

          </div>

        </header>


        <div
          class="dm-adventure-layout"
        >

          <aside
            class="dm-adventure-sidebar"
          >

            <div
              class="dm-adventure-sidebar-heading"
            >

              <span>
                Book Structure
              </span>

              <small>
                Drag to reorder
              </small>

            </div>


            <div
              class="dm-adventure-chapter-list"
              data-adventure-chapter-list
            ></div>

          </aside>


          <main
            class="dm-adventure-workspace"
            data-adventure-workspace
          ></main>

        </div>

      </section>

    `;


    this.mount
      .querySelector(
        '[data-adventure-add-chapter]'
      )
      ?.addEventListener(
        'click',
        () =>
          this.createChapter()
      );


    this.renderSidebar();

    this.renderWorkspace();

    this.ensurePopout();

  }


  /* ===================================================
     SIDEBAR
     =================================================== */

  renderSidebar(){

    const list =
      this.mount
        ?.querySelector(
          '[data-adventure-chapter-list]'
        );


    if(!list){
      return;
    }


    const chapters =
      this.getOrderedChapters();


    if(
      chapters.length === 0
    ){

      list.innerHTML = `

        <div
          class="dm-adventure-empty-sidebar"
        >

          <strong>
            No chapters yet.
          </strong>

          <span>
            Create the first chapter
            to begin the ${this.label}
            book.
          </span>

        </div>

      `;


      return;

    }


    list.innerHTML =
      '';


    chapters.forEach(
      chapter => {

        const chapterElement =
          document.createElement(
            'section'
          );


        chapterElement.className =
          'dm-adventure-chapter';


        chapterElement.draggable =
          true;


        chapterElement.dataset.chapterId =
          chapter.id;


        chapterElement.innerHTML = `

          <div
            class="dm-adventure-chapter-head"
          >

            <button
              type="button"
              class="dm-adventure-drag-handle"
              title="Drag chapter"
              aria-label="Drag chapter"
            >
              ⋮⋮
            </button>


            <div
              class="dm-adventure-chapter-copy"
            >

              <input
                class="dm-adventure-chapter-label"
                value="${adventureEscape(
                  chapter.chapter_label
                )}"
                aria-label="Chapter label"
              >

              <input
                class="dm-adventure-chapter-title"
                value="${adventureEscape(
                  chapter.title
                )}"
                aria-label="Chapter title"
              >

            </div>


            <div
              class="dm-adventure-chapter-actions"
            >

              <button
                type="button"
                class="dm-adventure-icon-button"
                data-add-module
                title="Add module"
                aria-label="Add module"
              >
                +
              </button>

              <button
                type="button"
                class="
                  dm-adventure-icon-button
                  dm-adventure-danger-button
                "
                data-delete-chapter
                title="Delete chapter"
                aria-label="Delete chapter"
              >
                ×
              </button>

            </div>

          </div>


          <div
            class="dm-adventure-module-list"
            data-module-list
            data-chapter-id="${chapter.id}"
          ></div>

        `;


        const moduleList =
          chapterElement
            .querySelector(
              '[data-module-list]'
            );


        const modules =
          this.getModulesForChapter(
            chapter.id
          );


        if(
          modules.length === 0
        ){

          moduleList.innerHTML = `

            <div
              class="dm-adventure-no-modules"
            >
              Drop a module here
              or press +
            </div>

          `;

        }
        else{

          modules.forEach(
            module => {

              const moduleButton =
                document.createElement(
                  'button'
                );


              moduleButton.type =
                'button';


              moduleButton.draggable =
                true;


              moduleButton.className =
                'dm-adventure-module-row';


              moduleButton.dataset.moduleId =
                module.id;


              moduleButton.classList.toggle(
                'active',
                module.id ===
                  this.selectedModuleId
              );


              moduleButton.classList.toggle(
                'starred',
                module.is_starred ===
                  true
              );


              moduleButton.innerHTML = `

                <span
                  class="dm-adventure-module-drag"
                  aria-hidden="true"
                >
                  ⋮
                </span>

                <span
                  class="dm-adventure-module-star"
                  aria-hidden="true"
                >
                  ${
                    module.is_starred
                      ? '★'
                      : '☆'
                  }
                </span>

                <span
                  class="dm-adventure-module-copy"
                >

                  <small>
                    ${adventureEscape(
                      module.module_label
                    )}
                  </small>

                  <strong>
                    ${adventureEscape(
                      module.title
                    )}
                  </strong>

                </span>

              `;


              moduleButton
                .addEventListener(
                  'click',
                  () => {

                    this.selectModule(
                      module.id
                    );

                  }
                );


              moduleButton
                .addEventListener(
                  'dragstart',
                  event => {

                    event.stopPropagation();


                    this.draggedModuleId =
                      module.id;


                    this.draggedChapterId =
                      null;


                    event.dataTransfer
                      .effectAllowed =
                        'move';


                    event.dataTransfer
                      .setData(
                        'text/epcot-module',
                        module.id
                      );


                    event.dataTransfer
                      .setData(
                        'text/plain',
                        `module:${module.id}`
                      );


                    moduleButton
                      .classList
                      .add(
                        'dragging'
                      );

                  }
                );


              moduleButton
                .addEventListener(
                  'dragend',
                  () => {

                    this.draggedModuleId =
                      null;


                    moduleButton
                      .classList
                      .remove(
                        'dragging'
                      );


                    this.clearDropIndicators();

                  }
                );


              moduleButton
                .addEventListener(
                  'dragover',
                  event => {

                    if(
                      !this.getDraggedModuleId(
                        event
                      )
                    ){

                      return;

                    }


                    event.preventDefault();

                    event.stopPropagation();


                    const rect =
                      moduleButton
                        .getBoundingClientRect();


                    const before =
                      event.clientY <
                      (
                        rect.top +
                        rect.height / 2
                      );


                    moduleButton
                      .classList
                      .toggle(
                        'drop-before',
                        before
                      );


                    moduleButton
                      .classList
                      .toggle(
                        'drop-after',
                        !before
                      );

                  }
                );


              moduleButton
                .addEventListener(
                  'dragleave',
                  () => {

                    moduleButton
                      .classList
                      .remove(
                        'drop-before',
                        'drop-after'
                      );

                  }
                );


              moduleButton
                .addEventListener(
                  'drop',
                  async event => {

                    event.preventDefault();

                    event.stopPropagation();


                    const draggedId =
                      this.getDraggedModuleId(
                        event
                      );


                    if(
                      !draggedId ||
                      draggedId ===
                        module.id
                    ){

                      this.clearDropIndicators();

                      return;

                    }


                    const rect =
                      moduleButton
                        .getBoundingClientRect();


                    const before =
                      event.clientY <
                      (
                        rect.top +
                        rect.height / 2
                      );


                    await this.moveModule(

                      draggedId,

                      chapter.id,

                      module.id,

                      before
                        ? 'before'
                        : 'after'

                    );

                  }
                );


              moduleList.append(
                moduleButton
              );

            }
          );

        }


        /* ===============================================
           MODULE DROP ZONE
           =============================================== */

        moduleList.addEventListener(
          'dragover',
          event => {

            if(
              !this.getDraggedModuleId(
                event
              )
            ){

              return;

            }


            event.preventDefault();

            event.stopPropagation();


            moduleList
              .classList
              .add(
                'drop-zone'
              );

          }
        );


        moduleList.addEventListener(
          'dragleave',
          event => {

            if(
              !moduleList.contains(
                event.relatedTarget
              )
            ){

              moduleList
                .classList
                .remove(
                  'drop-zone'
                );

            }

          }
        );


        moduleList.addEventListener(
          'drop',
          async event => {

            event.preventDefault();

            event.stopPropagation();


            moduleList
              .classList
              .remove(
                'drop-zone'
              );


            if(
              event.target.closest(
                '.dm-adventure-module-row'
              )
            ){

              return;

            }


            const draggedId =
              this.getDraggedModuleId(
                event
              );


            if(draggedId){

              await this.moveModule(
                draggedId,
                chapter.id,
                null,
                'end'
              );

            }

          }
        );


        /* ===============================================
           CHAPTER BUTTONS
           =============================================== */

        chapterElement
          .querySelector(
            '[data-add-module]'
          )
          ?.addEventListener(
            'click',
            () =>
              this.createModule(
                chapter.id
              )
          );


        chapterElement
          .querySelector(
            '[data-delete-chapter]'
          )
          ?.addEventListener(
            'click',
            () =>
              this.deleteChapter(
                chapter.id
              )
          );


        /* ===============================================
           CHAPTER EDITING
           =============================================== */

        const chapterLabelInput =
          chapterElement
            .querySelector(
              '.dm-adventure-chapter-label'
            );


        const chapterTitleInput =
          chapterElement
            .querySelector(
              '.dm-adventure-chapter-title'
            );


        const saveChapter =
          adventureDebounce(

            () =>
              this.updateChapter(
                chapter.id,
                {

                  chapter_label:
                    chapterLabelInput
                      .value
                      .trim() ||
                    'Chapter',

                  title:
                    chapterTitleInput
                      .value
                      .trim() ||
                    'Untitled Chapter'

                }
              ),

            EPCOT_ADVENTURE_AUTOSAVE_DELAY

          );


        chapterLabelInput
          .addEventListener(
            'input',
            saveChapter
          );


        chapterTitleInput
          .addEventListener(
            'input',
            saveChapter
          );


        [
          chapterLabelInput,
          chapterTitleInput
        ]
          .forEach(
            input => {

              input.addEventListener(
                'mousedown',
                event =>
                  event.stopPropagation()
              );


              input.addEventListener(
                'dragstart',
                event =>
                  event.stopPropagation()
              );

            }
          );


        /* ===============================================
           CHAPTER DRAGGING
           =============================================== */

        chapterElement
          .addEventListener(
            'dragstart',
            event => {

              if(
                event.target.closest(
                  '.dm-adventure-module-row'
                )
              ){

                return;

              }


              this.draggedChapterId =
                chapter.id;


              this.draggedModuleId =
                null;


              event.dataTransfer
                .effectAllowed =
                  'move';


              event.dataTransfer
                .setData(
                  'text/epcot-chapter',
                  chapter.id
                );


              event.dataTransfer
                .setData(
                  'text/plain',
                  `chapter:${chapter.id}`
                );


              chapterElement
                .classList
                .add(
                  'dragging'
                );

            }
          );


        chapterElement
          .addEventListener(
            'dragend',
            () => {

              this.draggedChapterId =
                null;


              chapterElement
                .classList
                .remove(
                  'dragging'
                );


              this.clearDropIndicators();

            }
          );


        chapterElement
          .addEventListener(
            'dragover',
            event => {

              const draggedChapterId =
                this.getDraggedChapterId(
                  event
                );


              if(
                !draggedChapterId ||
                draggedChapterId ===
                  chapter.id
              ){

                return;

              }


              event.preventDefault();


              const rect =
                chapterElement
                  .getBoundingClientRect();


              const before =
                event.clientY <
                (
                  rect.top +
                  rect.height / 2
                );


              chapterElement
                .classList
                .toggle(
                  'chapter-drop-before',
                  before
                );


              chapterElement
                .classList
                .toggle(
                  'chapter-drop-after',
                  !before
                );

            }
          );


        chapterElement
          .addEventListener(
            'dragleave',
            event => {

              if(
                !chapterElement.contains(
                  event.relatedTarget
                )
              ){

                chapterElement
                  .classList
                  .remove(
                    'chapter-drop-before',
                    'chapter-drop-after'
                  );

              }

            }
          );


        chapterElement
          .addEventListener(
            'drop',
            async event => {

              const draggedChapterId =
                this.getDraggedChapterId(
                  event
                );


              if(
                !draggedChapterId ||
                draggedChapterId ===
                  chapter.id
              ){

                return;

              }


              event.preventDefault();


              const rect =
                chapterElement
                  .getBoundingClientRect();


              const before =
                event.clientY <
                (
                  rect.top +
                  rect.height / 2
                );


              await this.moveChapter(

                draggedChapterId,

                chapter.id,

                before
                  ? 'before'
                  : 'after'

              );

            }
          );


        list.append(
          chapterElement
        );

      }
    );

  }


  /* ===================================================
     WORKSPACE
     =================================================== */

  renderWorkspace(){

    const workspace =
      this.mount
        ?.querySelector(
          '[data-adventure-workspace]'
        );


    if(!workspace){
      return;
    }


    const module =
      this.getSelectedModule();


    if(!module){

      workspace.innerHTML = `

        <div
          class="dm-adventure-workspace-empty"
        >

          <div
            class="dm-adventure-empty-mark"
          >
            ◇
          </div>

          <h3>
            No Module Selected
          </h3>

          <p>

            ${
              this.chapters.length === 0

                ? `
                  Create a chapter,
                  then add your first
                  module.
                `

                : `
                  Choose a module from
                  the book structure,
                  or add one with the
                  + button.
                `
            }

          </p>

        </div>

      `;


      this.mainEditor =
        null;


      return;

    }


    const chapter =
      this.getChapter(
        module.chapter_id
      );


    const position =
      this.getModulePosition(
        module.id
      );


    workspace.innerHTML = `

      <article
        class="dm-adventure-editor-card"
      >

        <header
          class="dm-adventure-editor-head"
        >

          <div
            class="dm-adventure-editor-context"
          >

            <span>
              ${adventureEscape(
                chapter?.chapter_label ||
                'Chapter'
              )}
            </span>

            <strong>
              ${adventureEscape(
                chapter?.title ||
                ''
              )}
            </strong>

          </div>


          <div
            class="dm-adventure-save-status"
            data-adventure-save-status
          >

            Saved

            ${
              module.updated_at
                ? adventureEscape(
                    adventureFormatTime(
                      module.updated_at
                    )
                  )
                : ''
            }

          </div>

        </header>


        <div
          class="dm-adventure-module-meta"
        >

          <label>

            <span>
              Module Label
            </span>

            <input
              data-module-label-input
              value="${adventureEscape(
                module.module_label
              )}"
            >

          </label>


          <label
            class="dm-adventure-module-title-field"
          >

            <span>
              Module Title
            </span>

            <input
              data-module-title-input
              value="${adventureEscape(
                module.title
              )}"
            >

          </label>

        </div>


        <div
          class="dm-adventure-session-controls"
        >

          <button
            type="button"
            class="
              dm-adventure-star-button
              ${
                module.is_starred
                  ? 'active'
                  : ''
              }
            "
            data-star-module
          >

            ${
              module.is_starred
                ? '★ Current Module'
                : '☆ Set as Current'
            }

          </button>


          <div
            class="dm-adventure-page-count"
          >

            ${position.index + 1}
            /
            ${position.total}

          </div>


          <button
            type="button"
            class="dm-adventure-secondary-button"
            data-open-popout
          >
            Open Module ↗
          </button>


          <button
            type="button"
            class="dm-adventure-danger-text-button"
            data-delete-module
          >
            Delete Module
          </button>

        </div>


        <div
          class="dm-adventure-toolbar-slot"
          data-toolbar-slot
        ></div>


        <div
          class="dm-adventure-editor"
          contenteditable="true"
          spellcheck="true"
          data-adventure-editor
          data-placeholder="Write the module here..."
        >${adventureSanitizeHtml(
          module.content_html
        )}</div>


        <footer
          class="dm-adventure-page-controls"
        >

          <button
            type="button"
            class="dm-adventure-page-button"
            data-prev-module
            ${
              position.previous
                ? ''
                : 'disabled'
            }
          >
            ← Previous
          </button>


          <select
            class="dm-adventure-module-jump"
            data-module-jump
            aria-label="Jump to module"
          >
            ${this.buildModuleOptions(
              module.id
            )}
          </select>


          <button
            type="button"
            class="dm-adventure-page-button"
            data-next-module
            ${
              position.next
                ? ''
                : 'disabled'
            }
          >
            Next →
          </button>

        </footer>

      </article>

    `;


    this.mainEditor =
      workspace
        .querySelector(
          '[data-adventure-editor]'
        );


    workspace
      .querySelector(
        '[data-toolbar-slot]'
      )
      ?.append(
        adventureBuildToolbar(
          this.mainEditor
        )
      );


    /* ===============================================
       MODULE METADATA
       =============================================== */

    const moduleLabelInput =
      workspace
        .querySelector(
          '[data-module-label-input]'
        );


    const moduleTitleInput =
      workspace
        .querySelector(
          '[data-module-title-input]'
        );


    moduleLabelInput
      .addEventListener(
        'input',
        () => {

          this.setLocalModuleValue(
            module.id,
            'module_label',
            moduleLabelInput.value
          );


          this.setSaveStatus(
            'Unsaved changes'
          );


          this.autosaveMetadata();

        }
      );


    moduleTitleInput
      .addEventListener(
        'input',
        () => {

          this.setLocalModuleValue(
            module.id,
            'title',
            moduleTitleInput.value
          );


          this.setSaveStatus(
            'Unsaved changes'
          );


          this.autosaveMetadata();

        }
      );


    /* ===============================================
       CONTENT AUTOSAVE
       =============================================== */

    this.mainEditor
      .addEventListener(
        'input',
        () => {

          this.syncEditorContent(
            this.mainEditor
          );


          this.setSaveStatus(
            'Unsaved changes'
          );


          this.autosaveContent();

        }
      );


    /* ===============================================
       CONTROLS
       =============================================== */

    workspace
      .querySelector(
        '[data-star-module]'
      )
      ?.addEventListener(
        'click',
        () =>
          this.toggleStar(
            module.id
          )
      );


    workspace
      .querySelector(
        '[data-open-popout]'
      )
      ?.addEventListener(
        'click',
        () =>
          this.openPopout(
            module.id
          )
      );


    workspace
      .querySelector(
        '[data-delete-module]'
      )
      ?.addEventListener(
        'click',
        () =>
          this.deleteModule(
            module.id
          )
      );


    workspace
      .querySelector(
        '[data-prev-module]'
      )
      ?.addEventListener(
        'click',
        () => {

          if(
            position.previous
          ){

            this.selectModule(
              position.previous.id
            );

          }

        }
      );


    workspace
      .querySelector(
        '[data-next-module]'
      )
      ?.addEventListener(
        'click',
        () => {

          if(
            position.next
          ){

            this.selectModule(
              position.next.id
            );

          }

        }
      );


    workspace
      .querySelector(
        '[data-module-jump]'
      )
      ?.addEventListener(
        'change',
        event => {

          if(
            event.target.value
          ){

            this.selectModule(
              event.target.value
            );

          }

        }
      );

  }


  /* ===================================================
     MODULE SELECT OPTIONS
     =================================================== */

  buildModuleOptions(
    selectedId
  ){

    return this
      .getOrderedChapters()
      .map(
        chapter => {

          const modules =
            this.getModulesForChapter(
              chapter.id
            );


          if(
            modules.length === 0
          ){

            return '';

          }


          return `

            <optgroup
              label="${adventureEscape(
                `${chapter.chapter_label}: ${chapter.title}`
              )}"
            >

              ${
                modules
                  .map(
                    module => `

                      <option
                        value="${module.id}"
                        ${
                          module.id === selectedId
                            ? 'selected'
                            : ''
                        }
                      >

                        ${
                          module.is_starred
                            ? '★ '
                            : ''
                        }

                        ${adventureEscape(
                          `${module.module_label}: ${module.title}`
                        )}

                      </option>

                    `
                  )
                  .join('')
              }

            </optgroup>

          `;

        }
      )
      .join('');

  }


  /* ===================================================
     POPOUT CREATION
     =================================================== */

  ensurePopout(){

    if(this.popout){
      return;
    }


    const popout =
      document.createElement(
        'div'
      );


    popout.className =
      'dm-adventure-popout-shell';


    popout.hidden =
      true;


    popout.dataset.campaign =
      this.campaign;


    popout.innerHTML = `

      <div
        class="dm-adventure-popout-backdrop"
        data-close-popout
      ></div>


      <section
        class="dm-adventure-popout"
        role="dialog"
        aria-modal="true"
        aria-label="${this.label} Adventure Module"
      >

        <div
          data-popout-content
        ></div>

      </section>

    `;


    document.body.append(
      popout
    );


    popout
      .querySelector(
        '[data-close-popout]'
      )
      ?.addEventListener(
        'click',
        () =>
          this.closePopout()
      );


    document.addEventListener(
      'keydown',
      event => {

        if(
          event.key ===
            'Escape' &&
          !popout.hidden
        ){

          this.closePopout();

        }

      }
    );


    this.popout =
      popout;

  }


  /* ===================================================
     OPEN POPOUT
     =================================================== */

  openPopout(
    moduleId
  ){

    this.selectModule(
      moduleId,
      {
        render:false
      }
    );


    this.ensurePopout();

    this.renderPopout();


    this.popout.hidden =
      false;


    document.body
      .classList
      .add(
        'dm-adventure-popout-open'
      );


    window.setTimeout(
      () =>
        this.popoutEditor
          ?.focus(),
      30
    );

  }


  /* ===================================================
     CLOSE POPOUT
     =================================================== */

  closePopout(){

    if(!this.popout){
      return;
    }


    this.syncEditorContent(
      this.popoutEditor
    );


    this.autosaveContent();


    this.popout.hidden =
      true;


    document.body
      .classList
      .remove(
        'dm-adventure-popout-open'
      );


    this.popoutEditor =
      null;


    this.renderSidebar();

    this.renderWorkspace();

  }


  /* ===================================================
     RENDER POPOUT
     =================================================== */

  renderPopout(){

    if(!this.popout){
      return;
    }


    const container =
      this.popout
        .querySelector(
          '[data-popout-content]'
        );


    const module =
      this.getSelectedModule();


    if(
      !container ||
      !module
    ){

      return;

    }


    const chapter =
      this.getChapter(
        module.chapter_id
      );


    const position =
      this.getModulePosition(
        module.id
      );


    container.innerHTML = `

  <header
    class="dm-adventure-popout-header"
  >

    <div
      class="dm-adventure-popout-title"
    >

      <div
        class="dm-adventure-eyebrow"
      >

        ${adventureEscape(
          chapter?.chapter_label ||
          'Chapter'
        )}

        //

        ${adventureEscape(
          chapter?.title ||
          ''
        )}

      </div>


      <h2>

        ${
          module.is_starred
            ? '★ '
            : ''
        }

        ${adventureEscape(
          module.module_label
        )}:

        ${adventureEscape(
          module.title
        )}

      </h2>

    </div>


    <div
      class="dm-adventure-popout-actions"
    >

      <select
        class="
          dm-adventure-module-jump
          dm-adventure-popout-jump
        "
        data-module-jump
        aria-label="Jump to module"
        title="Jump to module"
      >

        ${this.buildModuleOptions(
          module.id
        )}

      </select>


      <button
        type="button"
        class="
          dm-adventure-star-button
          ${
            module.is_starred
              ? 'active'
              : ''
          }
        "
        data-star-module
      >

        ${
          module.is_starred
            ? '★ Current'
            : '☆ Current'
        }

      </button>


      <span
        class="dm-adventure-save-status"
        data-adventure-save-status
      >

        Saved

        ${
          module.updated_at
            ? adventureEscape(
                adventureFormatTime(
                  module.updated_at
                )
              )
            : ''
        }

      </span>


      <button
        type="button"
        class="dm-adventure-close-button"
        data-close-button
        aria-label="Close module"
      >
        ×
      </button>

    </div>

  </header>


  <button
    type="button"
    class="
      dm-adventure-edge-nav
      dm-adventure-edge-nav-prev
    "
    data-prev-module
    ${
      position.previous
        ? ''
        : 'disabled'
    }
    aria-label="Previous module"
    title="Previous module"
  >
    ‹
  </button>


  <button
    type="button"
    class="
      dm-adventure-edge-nav
      dm-adventure-edge-nav-next
    "
    data-next-module
    ${
      position.next
        ? ''
        : 'disabled'
    }
    aria-label="Next module"
    title="Next module"
  >
    ›
  </button>


  <div
    class="
      dm-adventure-toolbar-slot
      dm-adventure-popout-toolbar
    "
    data-toolbar-slot
  ></div>


  <div
    class="
      dm-adventure-editor
      dm-adventure-editor-popout
    "
    contenteditable="true"
    spellcheck="true"
    data-adventure-editor
    data-placeholder="Write the module here..."
  >${adventureSanitizeHtml(
    module.content_html
  )}</div>

`;


    this.popoutEditor =
      container
        .querySelector(
          '[data-adventure-editor]'
        );


    container
      .querySelector(
        '[data-toolbar-slot]'
      )
      ?.append(
        adventureBuildToolbar(
          this.popoutEditor
        )
      );


    this.popoutEditor
      .addEventListener(
        'input',
        () => {

          this.syncEditorContent(
            this.popoutEditor
          );


          this.setSaveStatus(
            'Unsaved changes'
          );


          this.autosaveContent();

        }
      );


    container
      .querySelector(
        '[data-close-button]'
      )
      ?.addEventListener(
        'click',
        () =>
          this.closePopout()
      );


    container
      .querySelector(
        '[data-star-module]'
      )
      ?.addEventListener(
        'click',
        async () => {

          await this.toggleStar(
            module.id,
            {
              keepPopout:true
            }
          );

        }
      );


    container
      .querySelector(
        '[data-prev-module]'
      )
      ?.addEventListener(
        'click',
        async () => {

          if(
            position.previous
          ){

            await this.changePopoutModule(
              position.previous.id
            );

          }

        }
      );


    container
      .querySelector(
        '[data-next-module]'
      )
      ?.addEventListener(
        'click',
        async () => {

          if(
            position.next
          ){

            await this.changePopoutModule(
              position.next.id
            );

          }

        }
      );


    container
      .querySelector(
        '[data-module-jump]'
      )
      ?.addEventListener(
        'change',
        async event => {

          if(
            event.target.value
          ){

            await this.changePopoutModule(
              event.target.value
            );

          }

        }
      );

  }


  /* ===================================================
     CHANGE POPOUT PAGE
     =================================================== */

  async changePopoutModule(
    moduleId
  ){

    await this.saveActiveContent();


    this.selectModule(
      moduleId,
      {
        render:false
      }
    );


    this.renderPopout();

    this.renderSidebar();

    this.renderWorkspace();

  }


  /* ===================================================
     SELECT MODULE
     =================================================== */

  selectModule(
    moduleId,
    options = {}
  ){

    if(
      !this.modules.some(
        module =>
          module.id ===
          moduleId
      )
    ){

      return;

    }


    if(
      this.selectedModuleId &&
      this.selectedModuleId !==
        moduleId
    ){

      const previousModule =
        this.getSelectedModule();


      this.syncEditorContent(
        this.mainEditor
      );


      this.syncEditorContent(
        this.popoutEditor
      );


      if(previousModule){

        this.saveModuleContent(
          previousModule
        );


        this.saveModuleMetadata(
          previousModule
        );

      }

    }


    this.selectedModuleId =
      moduleId;


    if(
      options.render !==
        false
    ){

      this.renderSidebar();

      this.renderWorkspace();

    }

  }


  /* ===================================================
     LOCAL VALUES
     =================================================== */

  setLocalModuleValue(
    moduleId,
    field,
    value
  ){

    const module =
      this.modules.find(
        item =>
          item.id ===
          moduleId
      );


    if(module){

      module[field] =
        value;

    }

  }


  syncEditorContent(
    editor
  ){

    if(!editor){
      return;
    }


    const module =
      this.getSelectedModule();


    if(!module){
      return;
    }


    module.content_html =
      adventureSanitizeHtml(
        editor.innerHTML
      );

  }


  /* ===================================================
     SAVE STATUS
     =================================================== */

  setSaveStatus(
    message
  ){

    const targets = [

      this.mount,

      (
        this.popout &&
        !this.popout.hidden
      )
        ? this.popout
        : null

    ]
      .filter(Boolean);


    targets.forEach(
      root => {

        root
          .querySelectorAll(
            '[data-adventure-save-status]'
          )
          .forEach(
            element => {

              element.textContent =
                message;

            }
          );

      }
    );

  }


  /* ===================================================
     SAVE CONTENT
     =================================================== */

  async saveModuleContent(
    module
  ){

    if(!module){
      return;
    }


    const revision =
      ++this.saveRevision;


    this.setSaveStatus(
      'Saving...'
    );


    const db =
      adventureDb();


    const {
      data,
      error
    } =
      await db

        .from(
          'adventure_modules'
        )

        .update({

          content_html:
            module.content_html ||
            '',

          updated_at:
            new Date()
              .toISOString()

        })

        .eq(
          'id',
          module.id
        )

        .eq(
          'campaign',
          this.campaign
        )

        .select(
          `
            id,
            content_html,
            updated_at
          `
        )

        .single();


    if(error){

      console.error(
        'Adventure module content save failed:',
        error
      );


      this.setSaveStatus(
        'Save failed'
      );


      return;

    }


    module.content_html =
      data.content_html ||
      '';


    module.updated_at =
      data.updated_at;


    if(
      revision ===
      this.saveRevision
    ){

      this.setSaveStatus(
        `Saved ${adventureFormatTime(
          data.updated_at
        )}`
      );

    }

  }


  async saveActiveContent(){

    const module =
      this.getSelectedModule();


    if(!module){
      return;
    }


    this.syncEditorContent(
      this.mainEditor
    );


    this.syncEditorContent(
      this.popoutEditor
    );


    await this.saveModuleContent(
      module
    );

  }


  /* ===================================================
     SAVE MODULE METADATA
     =================================================== */

  async saveModuleMetadata(
    module
  ){

    if(!module){
      return;
    }


    const moduleLabel =
      String(
        module.module_label ||
        ''
      )
        .trim() ||
      'Module';


    const title =
      String(
        module.title ||
        ''
      )
        .trim() ||
      'Untitled Module';


    module.module_label =
      moduleLabel;


    module.title =
      title;


    const db =
      adventureDb();


    const {
      data,
      error
    } =
      await db

        .from(
          'adventure_modules'
        )

        .update({

          module_label:
            moduleLabel,

          title,

          updated_at:
            new Date()
              .toISOString()

        })

        .eq(
          'id',
          module.id
        )

        .eq(
          'campaign',
          this.campaign
        )

        .select(
          `
            id,
            module_label,
            title,
            updated_at
          `
        )

        .single();


    if(error){

      console.error(
        'Adventure module metadata save failed:',
        error
      );


      this.setSaveStatus(
        'Save failed'
      );


      return;

    }


    Object.assign(
      module,
      data
    );

  }


  async saveSelectedModuleMetadata(){

    const module =
      this.getSelectedModule();


    if(!module){
      return;
    }


    this.setSaveStatus(
      'Saving...'
    );


    await this.saveModuleMetadata(
      module
    );


    this.setSaveStatus(
      `Saved ${adventureFormatTime(
        module.updated_at
      )}`
    );


    this.renderSidebar();


    if(
      this.popout &&
      !this.popout.hidden
    ){

      this.renderPopout();

    }

  }


  /* ===================================================
     CREATE CHAPTER
     =================================================== */

  async createChapter(){

    const db =
      adventureDb();


    const chapters =
      this.getOrderedChapters();


    const sortOrder =
      chapters.length
        ? (
            chapters.length *
            100
          ) +
          100
        : 100;


    const {
      data,
      error
    } =
      await db

        .from(
          'adventure_chapters'
        )

        .insert({

          campaign:
            this.campaign,

          chapter_label:
            'Chapter',

          title:
            `Untitled Chapter ${
              chapters.length + 1
            }`,

          sort_order:
            sortOrder

        })

        .select('*')

        .single();


    if(error){

      window.alert(
        `Could not create chapter: ${error.message}`
      );


      return;

    }


    this.chapters.push(
      data
    );


    this.renderSidebar();

  }


  /* ===================================================
     UPDATE CHAPTER
     =================================================== */

  async updateChapter(
    chapterId,
    patch
  ){

    const chapter =
      this.getChapter(
        chapterId
      );


    if(!chapter){
      return;
    }


    Object.assign(
      chapter,
      patch
    );


    const db =
      adventureDb();


    const {
      data,
      error
    } =
      await db

        .from(
          'adventure_chapters'
        )

        .update({

          ...patch,

          updated_at:
            new Date()
              .toISOString()

        })

        .eq(
          'id',
          chapterId
        )

        .eq(
          'campaign',
          this.campaign
        )

        .select('*')

        .single();


    if(error){

      console.error(
        'Chapter save failed:',
        error
      );


      return;

    }


    Object.assign(
      chapter,
      data
    );


    const selected =
      this.getSelectedModule();


    if(
      selected?.chapter_id ===
      chapterId
    ){

      this.renderWorkspace();

    }


    if(
      this.popout &&
      !this.popout.hidden &&
      selected?.chapter_id ===
        chapterId
    ){

      this.renderPopout();

    }

  }


  /* ===================================================
     DELETE CHAPTER
     =================================================== */

  async deleteChapter(
    chapterId
  ){

    const chapter =
      this.getChapter(
        chapterId
      );


    if(!chapter){
      return;
    }


    const moduleCount =
      this.getModulesForChapter(
        chapterId
      )
        .length;


    const message =
      moduleCount

        ? `
          Delete “${chapter.title}”
          and its ${moduleCount}
          module${moduleCount === 1 ? '' : 's'}?

          This cannot be undone.
        `

        : `
          Delete “${chapter.title}”?

          This cannot be undone.
        `;


    if(
      !adventureConfirm(
        message
      )
    ){

      return;

    }


    const db =
      adventureDb();


    const {
      error
    } =
      await db

        .from(
          'adventure_chapters'
        )

        .delete()

        .eq(
          'id',
          chapterId
        )

        .eq(
          'campaign',
          this.campaign
        );


    if(error){

      window.alert(
        `Could not delete chapter: ${error.message}`
      );


      return;

    }


    const deletedModuleIds =
      new Set(

        this
          .getModulesForChapter(
            chapterId
          )
          .map(
            module =>
              module.id
          )

      );


    this.chapters =
      this.chapters.filter(
        item =>
          item.id !==
          chapterId
      );


    this.modules =
      this.modules.filter(
        item =>
          item.chapter_id !==
          chapterId
      );


    if(
      deletedModuleIds.has(
        this.selectedModuleId
      )
    ){

      this.selectedModuleId =
        this
          .getOrderedModules()
          [0]?.id ||
        null;

    }


    if(
      deletedModuleIds.has(
        this.starredModuleId
      )
    ){

      this.starredModuleId =
        null;

    }


    this.renderSidebar();

    this.renderWorkspace();

  }


  /* ===================================================
     CREATE MODULE
     =================================================== */

  async createModule(
    chapterId
  ){

    const chapter =
      this.getChapter(
        chapterId
      );


    if(!chapter){
      return;
    }


    const db =
      adventureDb();


    const modules =
      this.getModulesForChapter(
        chapterId
      );


    const sortOrder =
      modules.length
        ? (
            modules.length *
            100
          ) +
          100
        : 100;


    const {
      data,
      error
    } =
      await db

        .from(
          'adventure_modules'
        )

        .insert({

          campaign:
            this.campaign,

          chapter_id:
            chapterId,

          module_label:
            'Module',

          title:
            `Untitled Module ${
              modules.length + 1
            }`,

          content_html:
            '',

          sort_order:
            sortOrder,

          is_starred:
            false

        })

        .select('*')

        .single();


    if(error){

      window.alert(
        `Could not create module: ${error.message}`
      );


      return;

    }


    this.modules.push(
      data
    );


    this.selectedModuleId =
      data.id;


    this.renderSidebar();

    this.renderWorkspace();

  }


  /* ===================================================
     DELETE MODULE
     =================================================== */

  async deleteModule(
    moduleId
  ){

    const module =
      this.modules.find(
        item =>
          item.id ===
          moduleId
      );


    if(!module){
      return;
    }


    if(
      !adventureConfirm(
        `Delete “${module.title}”? This cannot be undone.`
      )
    ){

      return;

    }


    const db =
      adventureDb();


    const {
      error
    } =
      await db

        .from(
          'adventure_modules'
        )

        .delete()

        .eq(
          'id',
          moduleId
        )

        .eq(
          'campaign',
          this.campaign
        );


    if(error){

      window.alert(
        `Could not delete module: ${error.message}`
      );


      return;

    }


    const position =
      this.getModulePosition(
        moduleId
      );


    this.modules =
      this.modules.filter(
        item =>
          item.id !==
          moduleId
      );


    if(
      this.starredModuleId ===
      moduleId
    ){

      this.starredModuleId =
        null;

    }


    if(
      this.selectedModuleId ===
      moduleId
    ){

      this.selectedModuleId =

        position.next?.id ||

        position.previous?.id ||

        this
          .getOrderedModules()
          [0]?.id ||

        null;

    }


    if(
      this.popout &&
      !this.popout.hidden
    ){

      this.closePopout();

    }


    this.renderSidebar();

    this.renderWorkspace();

  }


  /* ===================================================
     CURRENT / STARRED MODULE
     =================================================== */

  async toggleStar(
    moduleId,
    options = {}
  ){

    const module =
      this.modules.find(
        item =>
          item.id ===
          moduleId
      );


    if(!module){
      return;
    }


    const db =
      adventureDb();


    if(
      module.is_starred
    ){

      const {
        error
      } =
        await db

          .from(
            'adventure_modules'
          )

          .update({

            is_starred:
              false,

            updated_at:
              new Date()
                .toISOString()

          })

          .eq(
            'id',
            module.id
          )

          .eq(
            'campaign',
            this.campaign
          );


      if(error){

        window.alert(
          `Could not clear current module: ${error.message}`
        );


        return;

      }


      module.is_starred =
        false;


      this.starredModuleId =
        null;

    }
    else{

      const {
        error:clearError
      } =
        await db

          .from(
            'adventure_modules'
          )

          .update({
            is_starred:false
          })

          .eq(
            'campaign',
            this.campaign
          )

          .eq(
            'is_starred',
            true
          );


      if(clearError){

        window.alert(
          `Could not update current module: ${clearError.message}`
        );


        return;

      }


      const {
        error:setError
      } =
        await db

          .from(
            'adventure_modules'
          )

          .update({

            is_starred:
              true,

            updated_at:
              new Date()
                .toISOString()

          })

          .eq(
            'id',
            module.id
          )

          .eq(
            'campaign',
            this.campaign
          );


      if(setError){

        window.alert(
          `Could not set current module: ${setError.message}`
        );


        await this.loadData();

        this.renderSidebar();

        this.renderWorkspace();


        return;

      }


      this.modules.forEach(
        item => {

          item.is_starred =
            item.id ===
            module.id;

        }
      );


      this.starredModuleId =
        module.id;

    }


    this.renderSidebar();

    this.renderWorkspace();


    if(
      options.keepPopout &&
      this.popout &&
      !this.popout.hidden
    ){

      this.renderPopout();

    }


    document.dispatchEvent(

      new CustomEvent(
        'epcot:adventure-current-changed',
        {

          detail:{

            campaign:
              this.campaign,

            moduleId:
              this.starredModuleId

          }

        }
      )

    );

  }


  /* ===================================================
     DRAG HELPERS
     =================================================== */

  getDraggedModuleId(
    event
  ){

    if(
      this.draggedModuleId
    ){

      return this.draggedModuleId;

    }


    const direct =
      event.dataTransfer
        ?.getData(
          'text/epcot-module'
        );


    if(direct){
      return direct;
    }


    const plain =
      event.dataTransfer
        ?.getData(
          'text/plain'
        ) ||
      '';


    return (
      plain.startsWith(
        'module:'
      )
        ? plain.slice(7)
        : null
    );

  }


  getDraggedChapterId(
    event
  ){

    if(
      this.draggedChapterId
    ){

      return this.draggedChapterId;

    }


    const direct =
      event.dataTransfer
        ?.getData(
          'text/epcot-chapter'
        );


    if(direct){
      return direct;
    }


    const plain =
      event.dataTransfer
        ?.getData(
          'text/plain'
        ) ||
      '';


    return (
      plain.startsWith(
        'chapter:'
      )
        ? plain.slice(8)
        : null
    );

  }


  clearDropIndicators(){

    this.mount
      ?.querySelectorAll(
        `
          .drop-before,
          .drop-after,
          .drop-zone,
          .chapter-drop-before,
          .chapter-drop-after
        `
      )
      .forEach(
        element => {

          element.classList.remove(

            'drop-before',

            'drop-after',

            'drop-zone',

            'chapter-drop-before',

            'chapter-drop-after'

          );

        }
      );

  }


  /* ===================================================
     MOVE CHAPTER
     =================================================== */

  async moveChapter(
    draggedId,
    targetId,
    position
  ){

    const ordered =
      this.getOrderedChapters();


    const dragged =
      ordered.find(
        item =>
          item.id ===
          draggedId
      );


    const target =
      ordered.find(
        item =>
          item.id ===
          targetId
      );


    if(
      !dragged ||
      !target
    ){

      return;

    }


    const withoutDragged =
      ordered.filter(
        item =>
          item.id !==
          draggedId
      );


    let targetIndex =
      withoutDragged
        .findIndex(
          item =>
            item.id ===
            targetId
        );


    if(
      position ===
      'after'
    ){

      targetIndex +=
        1;

    }


    withoutDragged.splice(
      targetIndex,
      0,
      dragged
    );


    await this.persistChapterOrder(
      withoutDragged
    );

  }


  async persistChapterOrder(
    ordered
  ){

    const db =
      adventureDb();


    const updates =
      ordered.map(
        (
          chapter,
          index
        ) => ({

          chapter,

          sort_order:
            (
              index + 1
            ) *
            100

        })
      );


    const results =
      await Promise.all(

        updates.map(
          item =>

            db
              .from(
                'adventure_chapters'
              )

              .update({
                sort_order:
                  item.sort_order
              })

              .eq(
                'id',
                item.chapter.id
              )

              .eq(
                'campaign',
                this.campaign
              )

        )

      );


    const failed =
      results.find(
        result =>
          result.error
      );


    if(failed){

      window.alert(
        `Could not reorder chapters: ${failed.error.message}`
      );


      await this.loadData();

    }
    else{

      updates.forEach(
        item => {

          item.chapter.sort_order =
            item.sort_order;

        }
      );

    }


    this.clearDropIndicators();

    this.renderSidebar();

  }


  /* ===================================================
     MOVE MODULE
     =================================================== */

  async moveModule(
    draggedId,
    chapterId,
    targetModuleId,
    position
  ){

    const dragged =
      this.modules.find(
        item =>
          item.id ===
          draggedId
      );


    const targetChapter =
      this.getChapter(
        chapterId
      );


    if(
      !dragged ||
      !targetChapter
    ){

      return;

    }


    const targetModules =
      this
        .getModulesForChapter(
          chapterId
        )
        .filter(
          item =>
            item.id !==
            draggedId
        );


    let insertIndex =
      targetModules.length;


    if(targetModuleId){

      insertIndex =
        targetModules
          .findIndex(
            item =>
              item.id ===
              targetModuleId
          );


      if(
        insertIndex < 0
      ){

        insertIndex =
          targetModules.length;

      }
      else if(
        position ===
        'after'
      ){

        insertIndex +=
          1;

      }

    }


    dragged.chapter_id =
      chapterId;


    targetModules.splice(
      insertIndex,
      0,
      dragged
    );


    await this.persistModuleOrder(
      chapterId,
      targetModules,
      draggedId
    );

  }


  async persistModuleOrder(
    chapterId,
    ordered,
    movedModuleId
  ){

    const db =
      adventureDb();


    const updates =
      ordered.map(
        (
          module,
          index
        ) => ({

          module,

          sort_order:
            (
              index + 1
            ) *
            100,

          chapter_id:
            chapterId

        })
      );


    const results =
      await Promise.all(

        updates.map(
          item =>

            db
              .from(
                'adventure_modules'
              )

              .update({

                chapter_id:
                  item.chapter_id,

                sort_order:
                  item.sort_order

              })

              .eq(
                'id',
                item.module.id
              )

              .eq(
                'campaign',
                this.campaign
              )

        )

      );


    const failed =
      results.find(
        result =>
          result.error
      );


    if(failed){

      window.alert(
        `Could not move module: ${failed.error.message}`
      );


      await this.loadData();

    }
    else{

      updates.forEach(
        item => {

          item.module.chapter_id =
            item.chapter_id;


          item.module.sort_order =
            item.sort_order;

        }
      );

    }


    this.clearDropIndicators();

    this.renderSidebar();

    this.renderWorkspace();


    if(
      this.popout &&
      !this.popout.hidden &&
      this.selectedModuleId ===
        movedModuleId
    ){

      this.renderPopout();

    }

  }

}


/* =====================================================
   INSTANCES
   ===================================================== */

const epcotHeroAdventureDesk =
  new EpcotAdventureDesk({

    campaign:
      'hero',

    mountId:
      'dmHeroAdventuresMount'

  });


const epcotVillainAdventureDesk =
  new EpcotAdventureDesk({

    campaign:
      'villain',

    mountId:
      'dmVillainAdventuresMount'

  });

  const epcotCombinedAdventureDesk =
  new EpcotAdventureDesk({

    campaign:
      'combined',

    mountId:
      'dmCombinedAdventuresMount'

  });


/* =====================================================
   MISSION TABS
   ===================================================== */

function initializeMissionTabs(){

  const tabs =
    Array.from(
      document.querySelectorAll(
        '[data-mission-campaign]'
      )
    );


  const panels =
    Array.from(
      document.querySelectorAll(
        '[data-mission-panel]'
      )
    );


  if(
    !tabs.length ||
    !panels.length
  ){
    return;
  }


  tabs.forEach(
    tab => {

      if(
        tab.dataset.missionTabReady ===
        'true'
      ){
        return;
      }


      tab.dataset.missionTabReady =
        'true';


      tab.addEventListener(
        'click',
        () => {

          const campaign =
            tab.dataset.missionCampaign;


          tabs.forEach(
            button => {

              button.classList.toggle(
                'is-active',
                button === tab
              );

            }
          );


          panels.forEach(
            panel => {

              panel.hidden =
                panel.dataset.missionPanel !==
                campaign;

            }
          );

        }
      );

    }
  );

}


/* =====================================================
   MISSION TABS
   ===================================================== */

function initializeMissionTabs(){

  const tabs =
    Array.from(
      document.querySelectorAll(
        '[data-mission-campaign]'
      )
    );


  const panels =
    Array.from(
      document.querySelectorAll(
        '[data-mission-panel]'
      )
    );


  if(
    !tabs.length ||
    !panels.length
  ){
    return;
  }


  tabs.forEach(
    tab => {

      if(
        tab.dataset.missionTabReady ===
        'true'
      ){
        return;
      }


      tab.dataset.missionTabReady =
        'true';


      tab.addEventListener(
        'click',
        () => {

          const campaign =
            tab.dataset.missionCampaign;


          tabs.forEach(
            button => {

              button.classList.toggle(
                'is-active',
                button === tab
              );

            }
          );


          panels.forEach(
            panel => {

              panel.hidden =
                panel.dataset.missionPanel !==
                campaign;

            }
          );

        }
      );

    }
  );

}


/* =====================================================
   INITIALIZATION
   ===================================================== */

let adventureDesksInitialized =
  false;


async function initializeAdventureDesks(){

  if(
    adventureDesksInitialized
  ){
    return;
  }


  adventureDesksInitialized =
    true;


  try{

    await Promise.all([

      epcotHeroAdventureDesk
        .init(),

      epcotVillainAdventureDesk
        .init(),

      epcotCombinedAdventureDesk
        .init()

    ]);


    initializeMissionTabs();

  }
  catch(error){

    adventureDesksInitialized =
      false;


    console.error(
      'Adventure desks failed to initialize:',
      error
    );

  }

}


document.addEventListener(
  'epcot:dm-ready',
  initializeAdventureDesks
);


if(
  document.readyState !==
    'loading' &&
  document.getElementById(
    'dmApp'
  ) &&
  !document.getElementById(
    'dmApp'
  ).hidden
){

  initializeAdventureDesks();

}

/* =====================================================
   PUBLIC API

   Stage 2 Home integration will use this.
   ===================================================== */

function adventureDeskForCampaign(
  campaign
){

  if(
    campaign === 'villain'
  ){
    return epcotVillainAdventureDesk;
  }


  if(
    campaign === 'combined'
  ){
    return epcotCombinedAdventureDesk;
  }


  return epcotHeroAdventureDesk;

}


window.epcotAdventureDesk = {

  hero:
    epcotHeroAdventureDesk,

  villain:
    epcotVillainAdventureDesk,

  combined:
    epcotCombinedAdventureDesk,


  async refresh(
    campaign
  ){

    const desk =
      adventureDeskForCampaign(
        campaign
      );


    await desk.loadData();

    desk.render();

  },


  getCurrent(
    campaign
  ){

    const desk =
      adventureDeskForCampaign(
        campaign
      );


    return (
      desk.modules.find(
        module =>
          module.is_starred
      ) ||
      null
    );

  }

};
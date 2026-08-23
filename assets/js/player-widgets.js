/* =====================================================
   EPCOT DND
   PLAYER WIDGET ACCESS + WORLD DOWNTIME

   Shared by all four player realities.
   ===================================================== */

(function(){

  const PLAYER_ELIGIBLE_IDS = [
    'downtime-training',
    'downtime-gathering',
    'downtime-crafting',
    'downtime-social',
    'downtime-potion-brewing',
    'product-solution-generator',
    'fallen-revived-consequences',
    'common-rules',
    'reserve-personnel'
  ];


  const WORLD_DOWNTIME_IDS = [
    'downtime-training',
    'downtime-gathering',
    'downtime-crafting',
    'downtime-social',
    'downtime-potion-brewing'
  ];


  const GROUP_TITLES = {

    downtime:
      'Downtime & Rewards',

    generators:
      'Generators & Inspiration',

    combat:
      'Campaign Consequences',

    reference:
      'Reference'

  };


  let access =
    new Map();

  let realtimeChannel =
    null;

  let launcher =
    null;

  let activeWidgetId =
    null;


  function client(){

    return (
      window.epcotAuth?.client ||
      null
    );

  }


  function widgetApi(){

    return (
      window.epcotDmWidgets ||
      null
    );

  }


  function eligibleWidgets(){

    const api =
      widgetApi();


    if(
      !api?.listWidgets
    ){
      return [];
    }


    return api
      .listWidgets()
      .filter(
        widget =>
          PLAYER_ELIGIBLE_IDS
            .includes(
              widget.id
            )
      );

  }


  function enabledWidgets(){

    return eligibleWidgets()
      .filter(
        widget =>
          access.get(
            widget.id
          ) === true
      );

  }


  function isEnabled(
    widgetId
  ){

    return (

      PLAYER_ELIGIBLE_IDS
        .includes(
          widgetId
        ) &&

      access.get(
        widgetId
      ) === true

    );

  }


  async function loadAccess(){

    const supabase =
      client();


    access =
      new Map();


    if(!supabase){

      renderEverything();

      return;

    }


    const {
      data,
      error
    } =
      await supabase
        .from(
          'widget_player_access'
        )
        .select(
          'widget_id,enabled'
        );


    if(error){

      console.error(
        'Player widget access failed to load:',
        error
      );


      renderEverything();

      return;

    }


    (data || [])
      .forEach(
        row => {

          access.set(
            row.widget_id,
            row.enabled === true
          );

        }
      );


    if(
      activeWidgetId &&
      !isEnabled(
        activeWidgetId
      )
    ){

      closeWidget();

    }


    renderEverything();

  }


  function ensureLauncher(){

    if(launcher){
      return launcher;
    }


    document.body
      .insertAdjacentHTML(
        'beforeend',
        `

          <div
            class="player-widget-launcher"
            data-player-widget-launcher
            hidden
          >

            <div
              class="player-widget-launcher-panel"
              role="dialog"
              aria-modal="true"
            >

              <div
                class="player-widget-launcher-topbar"
              >

                <div>

                  <small>
                    EXPLORER UTILITY
                  </small>

                  <strong
                    data-player-widget-launcher-title
                  >
                    Widget
                  </strong>

                </div>


                <button
                  type="button"
                  data-player-widget-launcher-close
                  aria-label="Close"
                >
                  ×
                </button>

              </div>


              <div
                class="player-widget-launcher-body"
                data-player-widget-launcher-body
              ></div>

            </div>

          </div>

        `
      );


    launcher =
      document.querySelector(
        '[data-player-widget-launcher]'
      );


    launcher.addEventListener(
      'click',
      event => {

        if(
          event.target ===
            launcher ||

          event.target.closest(
            '[data-player-widget-launcher-close]'
          )
        ){

          closeWidget();

        }

      }
    );


    document.addEventListener(
      'keydown',
      event => {

        if(
          event.key ===
          'Escape'
        ){

          closeWidget();

        }

      }
    );


    return launcher;

  }


  function closeWidget(){

    if(!launcher){
      return;
    }


    launcher.hidden =
      true;


    activeWidgetId =
      null;


    const body =
      launcher.querySelector(
        '[data-player-widget-launcher-body]'
      );


    if(body){

      body.innerHTML =
        '';

    }

  }


  function openWidget(
    widgetId
  ){

    if(
      !isEnabled(
        widgetId
      )
    ){
      return false;
    }


    const api =
      widgetApi();


    const widget =
      eligibleWidgets()
        .find(
          item =>
            item.id ===
            widgetId
        );


    if(
      !api?.mountWidget ||
      !widget
    ){
      return false;
    }


    const modal =
      ensureLauncher();


    const title =
      modal.querySelector(
        '[data-player-widget-launcher-title]'
      );


    const body =
      modal.querySelector(
        '[data-player-widget-launcher-body]'
      );


    if(title){

      title.textContent =
        widget.title;

    }


    if(body){

      api.mountWidget(
        widgetId,
        body
      );

    }


    activeWidgetId =
      widgetId;


    modal.hidden =
      false;


    return true;

  }


  function renderPlayerPage(){

    const grid =
      document.getElementById(
        'playerWidgetGrid'
      );


    if(!grid){
      return;
    }


    const widgets =
      enabledWidgets();


    if(
      !widgets.length
    ){

      grid.innerHTML = `

        <article
          class="player-widgets-empty"
        >

          <div
            class="player-widgets-empty-symbol"
          >
            ◇
          </div>

          <div
            class="player-widgets-kicker"
          >
            Explorer Utility System
          </div>

          <h2>
            No Utilities Authorized
          </h2>

          <p>
            The DM has not activated
            any player tools yet.
          </p>

        </article>

      `;


      return;

    }


    const groups =
      [
        ...new Set(
          widgets.map(
            widget =>
              widget.group
          )
        )
      ];


    grid.innerHTML =
      groups
        .map(
          groupId => {

            const groupWidgets =
              widgets.filter(
                widget =>
                  widget.group ===
                  groupId
              );


            return `

              <section
                class="player-widget-group"
              >

                <header
                  class="player-widget-group-header"
                >

                  <div>

                    <div
                      class="player-widgets-kicker"
                    >
                      AUTHORIZED UTILITIES
                    </div>

                    <h2>
                      ${
                        GROUP_TITLES[
                          groupId
                        ] ||
                        'Utilities'
                      }
                    </h2>

                  </div>


                  <span>

                    ${String(
                      groupWidgets.length
                    ).padStart(
                      2,
                      '0'
                    )}

                  </span>

                </header>


                <div
                  class="player-widget-group-grid"
                >

                  ${
                    groupWidgets
                      .map(
                        widget => `

                          <div
                            data-player-widget-host="${widget.id}"
                          ></div>

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


    const api =
      widgetApi();


    widgets.forEach(
      widget => {

        const host =
          grid.querySelector(
            `[data-player-widget-host="${CSS.escape(
              widget.id
            )}"]`
          );


        if(host){

          api?.mountWidget?.(
            widget.id,
            host
          );

        }

      }
    );

  }


function hydrateWorldDowntime(
  root = document
){

  root
    .querySelectorAll(
      '[data-world-downtime-host]'
    )
    .forEach(
      host => {

        const locationWidgetIds =
          String(
            host.dataset
              .worldWidgetIds ||
            ''
          )
            .split(',')
            .map(
              id =>
                id.trim()
            )
            .filter(Boolean);


        const widgets =
          enabledWidgets()
            .filter(
              widget =>

                WORLD_DOWNTIME_IDS
                  .includes(
                    widget.id
                  ) &&

                locationWidgetIds
                  .includes(
                    widget.id
                  )

            );


        if(
          !locationWidgetIds.length
        ){

          host.innerHTML = `

            <div
              class="world-downtime-locked"
            >
              No Downtime activities have
              been assigned to this location.
            </div>

          `;


          return;

        }


        if(
          !widgets.length
        ){

          host.innerHTML = `

            <div
              class="world-downtime-locked"
            >
              Downtime activities exist here,
              but none are currently authorized
              for player access.
            </div>

          `;


          return;

        }


        host.innerHTML = `

          <div
            class="world-downtime-widget-list"
          >

            ${
              widgets
                .map(
                  widget => `

                    <button
                      type="button"
                      class="world-downtime-widget-button"
                      data-world-widget-open="${widget.id}"
                    >

                      <strong>
                        ${widget.title}
                      </strong>

                      <span>
                        ${
                          widget.subtitle ||
                          'Open activity'
                        }
                      </span>

                    </button>

                  `
                )
                .join('')
            }

          </div>

        `;

      }
    );

}


  function renderEverything(){

    renderPlayerPage();

    hydrateWorldDowntime(
      document
    );

  }


  function connectClicks(){

    document.addEventListener(
      'click',
      event => {

        const button =
          event.target.closest(
            '[data-world-widget-open]'
          );


        if(!button){
          return;
        }


        openWidget(
          button.dataset
            .worldWidgetOpen
        );

      }
    );

  }


  function connectRealtime(){

    const supabase =
      client();


    if(
      !supabase?.channel ||
      realtimeChannel
    ){
      return;
    }


    realtimeChannel =
      supabase
        .channel(
          'player-widget-access-live'
        )
        .on(
          'postgres_changes',
          {
            event:'*',
            schema:'public',
            table:'widget_player_access'
          },
          ()=> loadAccess()
        )
        .subscribe();

  }


  async function init(){

    connectClicks();

    connectRealtime();

    await loadAccess();

  }


  window.epcotPlayerWidgets = {

    init,

    reload:
      loadAccess,

    isEnabled,

    openWidget,

    hydrateWorldDowntime

  };


  if(
    document.readyState ===
    'loading'
  ){

    document.addEventListener(
      'DOMContentLoaded',
      init,
      {
        once:true
      }
    );

  } else {

    init();

  }

})();
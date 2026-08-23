/* =====================================================
   EPCOT DND
   DM PLAYER WIDGET ACCESS
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

  let access = new Map();
  let realtimeChannel = null;


  function client(){
    return window.epcotAuth?.client || null;
  }


  function api(){
    return window.epcotDmWidgets || null;
  }


  function eligibleWidgets(){

    const widgetApi = api();

    if(!widgetApi?.listWidgets){
      return [];
    }

    return widgetApi
      .listWidgets()
      .filter(
        widget =>
          PLAYER_ELIGIBLE_IDS.includes(
            widget.id
          )
      );

  }


  async function loadAccess(){

    const supabase = client();

    if(!supabase){
      render();
      return;
    }


    const {data,error} =
      await supabase
        .from('widget_player_access')
        .select('widget_id,enabled');


    if(error){

      console.error(
        'DM widget access failed to load:',
        error
      );

      renderError(
        error.message
      );

      return;

    }


    access =
      new Map(
        (data || []).map(
          row => [
            row.widget_id,
            row.enabled === true
          ]
        )
      );


    render();

  }


  function renderError(message){

    const mount =
      document.getElementById(
        'dmWidgetAccessList'
      );


    if(!mount){
      return;
    }


    mount.innerHTML = `
      <div class="dm-widget-access-error">
        Player access controls could not load.<br>
        ${String(message || '')}
      </div>
    `;

  }


  function render(){

    const mount =
      document.getElementById(
        'dmWidgetAccessList'
      );


    if(!mount){
      return;
    }


    const widgets =
      eligibleWidgets();


    mount.innerHTML =
      widgets
        .map(
          widget => `

            <label class="dm-widget-access-item">

              <input
                type="checkbox"
                data-widget-access-id="${widget.id}"
                ${
                  access.get(widget.id) === true
                    ? 'checked'
                    : ''
                }
              >

              <span
                class="dm-widget-access-switch"
                aria-hidden="true"
              ></span>

              <span class="dm-widget-access-copy">

                <strong>
                  ${widget.title}
                </strong>

                <small>
                  ${widget.subtitle || ''}
                </small>

              </span>

            </label>

          `
        )
        .join('');

  }


  async function save(
    widgetId,
    enabled
  ){

    const supabase = client();

    if(!supabase){
      return;
    }


    access.set(
      widgetId,
      enabled
    );

    render();


    const {error} =
      await supabase
        .from('widget_player_access')
        .upsert(
          {
            widget_id:
              widgetId,

            enabled,

            updated_at:
              new Date()
                .toISOString()
          },
          {
            onConflict:
              'widget_id'
          }
        );


    if(error){

      console.error(
        'Widget access save failed:',
        error
      );


      access.set(
        widgetId,
        !enabled
      );


      render();


      alert(
        `Could not update player widget access.\n\n${error.message}`
      );

    }

  }


  function connectEvents(){

    const mount =
      document.getElementById(
        'dmWidgetAccessList'
      );


    if(!mount){
      return;
    }


    mount.addEventListener(
      'change',
      event => {

        const input =
          event.target.closest(
            '[data-widget-access-id]'
          );


        if(!input){
          return;
        }


        save(
          input.dataset.widgetAccessId,
          input.checked
        );

      }
    );

  }


  function connectRealtime(){

    const supabase = client();


    if(
      !supabase?.channel ||
      realtimeChannel
    ){
      return;
    }


    realtimeChannel =
      supabase
        .channel(
          'dm-widget-access-live'
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

    connectEvents();

    connectRealtime();

    await loadAccess();

  }


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
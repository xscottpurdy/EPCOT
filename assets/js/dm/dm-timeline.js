/* =====================================================
   EPCOT DND
   DM GLOBAL TIMELINE

   FOUNDATIONAL RULES

   Founder's Day
   = permanent Campaign Day 0 anchor.

   Present Date
   = movable current campaign date.

   Rose Clock
   = one global clock shared by Hero + Villain.

   Player knowledge may differ.
   Reality does not.

   Dates may remain unset until the DM is ready.
   ===================================================== */

(function(){

  /* =====================================================
     CONSTANTS
     ===================================================== */

  const ROSE_HOURS = [

    'Stable Illusion',
    'Cosmetic Truths',
    'Manufactured Nature',
    'Memory Drift',
    'Planar Bleed',
    'Script Failure',
    'Sponsor Interference',
    'Flicker Cascades',
    'Structural Truth',
    'The Rose Stirs',
    'Final Convergence',
    'Baptism Approaches',
    'Release'

  ];


  const EVENT_CATEGORIES = [

    'History',
    'Political',
    'Corporate',
    'Social',
    'Magic',
    'Flicker',
    'Rose Clock',
    'NPC',
    'Faction',
    'Campaign',
    'World'

  ];


  /* =====================================================
     STATE
     ===================================================== */

  let timelineEvents = [];

  let timelineLinks = [];

  let timelineNpcs = [];

  let timelineRoseNotes = [];

  let roseSchedule = [];

  let roseHistory = [];

  let currentRoseHour = 0;

  let foundersDay = null;

  let presentDate = null;

  let selectedRoseHour = 0;


const filters = {

  status:'all',

  category:'all',

  npc:'all',

  rose:'all',

  startDate:'',

  endDate:''

};


  /* =====================================================
     BASIC HELPERS
     ===================================================== */

  function db(){

    return window.epcotAuth?.client ||
      null;

  }


  function byId(
    id
  ){

    return document.getElementById(
      id
    );

  }


  function esc(
    value
  ){

    return String(
      value ??
      ''
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


  function clean(
    value
  ){

    return String(
      value ??
      ''
    ).trim();

  }


  /* =====================================================
     DATE HELPERS

     Date-only values use UTC so the browser does not
     shift EPCOT one day because of local timezone.
     ===================================================== */

  function parseDate(
    value
  ){

    if(!value){
      return null;
    }


    const parts =
      String(
        value
      )
        .split('-')
        .map(Number);


    if(
      parts.length !== 3
      ||
      parts.some(
        value =>
          !Number.isFinite(
            value
          )
      )
    ){
      return null;
    }


    return new Date(
      Date.UTC(
        parts[0],
        parts[1] - 1,
        parts[2]
      )
    );

  }


  function dateString(
    date
  ){

    if(
      !(date instanceof Date)
      ||
      Number.isNaN(
        date.getTime()
      )
    ){
      return null;
    }


    return [
      date.getUTCFullYear(),
      String(
        date.getUTCMonth() + 1
      ).padStart(
        2,
        '0'
      ),
      String(
        date.getUTCDate()
      ).padStart(
        2,
        '0'
      )
    ].join('-');

  }


  function addDays(
    value,
    amount
  ){

    const date =
      value instanceof Date
        ? new Date(
            value.getTime()
          )
        : parseDate(
            value
          );


    if(!date){
      return null;
    }


    date.setUTCDate(
      date.getUTCDate() +
      Number(
        amount ||
        0
      )
    );


    return date;

  }


  function daysBetween(
    from,
    to
  ){

    const a =
      from instanceof Date
        ? from
        : parseDate(
            from
          );


    const b =
      to instanceof Date
        ? to
        : parseDate(
            to
          );


    if(
      !a ||
      !b
    ){
      return null;
    }


    return Math.round(
      (
        b.getTime() -
        a.getTime()
      )
      /
      86400000
    );

  }


  function formatDate(
    value
  ){

    const date =
      value instanceof Date
        ? value
        : parseDate(
            value
          );


    if(!date){
      return 'Not Set';
    }


    return new Intl.DateTimeFormat(
      'en-US',
      {
        month:'short',
        day:'numeric',
        year:'numeric',
        timeZone:'UTC'
      }
    ).format(
      date
    );

  }


  function campaignDay(){

    if(
      !foundersDay ||
      !presentDate
    ){
      return null;
    }


    return daysBetween(
      foundersDay,
      presentDate
    );

  }


  /* =====================================================
     ROSE HELPERS
     ===================================================== */

  function roseName(
    hour
  ){

    return ROSE_HOURS[
      Number(
        hour
      )
    ]
    ||
    'Unknown';

  }


  function roseProjection(
    hour
  ){

    return roseSchedule
      .find(
        row =>
          Number(
            row.hour
          ) ===
          Number(
            hour
          )
      )
      ?.projected_date
      ||
      null;

  }


  /* =====================================================
     EVENT DATE RESOLUTION
     ===================================================== */

  function eventDate(
    event
  ){

    if(
      event.timing_type ===
      'exact'
    ){

      return parseDate(
        event.calendar_date
      );

    }


    if(
      event.timing_type ===
      'founder'
    ){

      if(!foundersDay){
        return null;
      }


      return addDays(
        foundersDay,
        Number(
          event.founder_offset_days ||
          0
        )
      );

    }


    if(
      event.timing_type ===
      'rose'
    ){

      const anchor =
        roseProjection(
          event.rose_hour
        );


      if(!anchor){
        return null;
      }


      return addDays(
        anchor,
        Number(
          event.rose_offset_days ||
          0
        )
      );

    }


    return null;

  }


  function eventCampaignDay(
    event
  ){

    if(!foundersDay){
      return null;
    }


    const resolved =
      eventDate(
        event
      );


    if(!resolved){
      return null;
    }


    return daysBetween(
      foundersDay,
      resolved
    );

  }


  /* =====================================================
     NPC HELPERS
     ===================================================== */

  function npcById(
    id
  ){

    return timelineNpcs
      .find(
        npc =>
          npc.id ===
          id
      )
      ||
      null;

  }


  function npcIdsForEvent(
    eventId
  ){

    return timelineLinks
      .filter(
        link =>
          link.event_id ===
          eventId
      )
      .map(
        link =>
          link.npc_id
      );

  }


  function npcsForEvent(
    eventId
  ){

    return npcIdsForEvent(
      eventId
    )
      .map(
        npcById
      )
      .filter(Boolean);

  }


  /* =====================================================
     DUE LOGIC

     A planned event becomes due when:
     - its calendar date reaches Present, OR
     - its Rose Hour has already been reached.

     The app DOES NOT automatically mark it occurred.
     ===================================================== */

  function isDue(
    event
  ){

    if(
      event.status !==
      'planned'
    ){
      return false;
    }


    const resolved =
      eventDate(
        event
      );


    if(
      resolved &&
      presentDate
    ){

      if(
        resolved.getTime() <=
        parseDate(
          presentDate
        ).getTime()
      ){
        return true;
      }

    }


    if(
      event.timing_type ===
      'rose'
      &&
      Number.isFinite(
        Number(
          event.rose_hour
        )
      )
      &&
      Number(
        event.rose_hour
      ) <=
      currentRoseHour
      &&
      Number(
        event.rose_offset_days ||
        0
      ) <= 0
    ){

      return true;

    }


    return false;

  }


  /* =====================================================
     LOAD
     ===================================================== */

  async function loadTimeline(){

    const client =
      db();


    if(!client){
      throw new Error(
        'Supabase client unavailable.'
      );
    }


    const [

      timeResult,
      clockResult,
      scheduleResult,
      historyResult,
      eventResult,
      linkResult,
      npcResult,
      roseNoteResult

    ] =
      await Promise.all([

        client
          .from(
            'dm_campaign_time_state'
          )
          .select('*')
          .eq(
            'id',
            1
          )
          .maybeSingle(),


        client
          .from(
            'rose_clock_state'
          )
          .select('*')
          .eq(
            'id',
            1
          )
          .maybeSingle(),


        client
          .from(
            'rose_clock_schedule'
          )
          .select('*')
          .order(
            'hour'
          ),


        client
          .from(
            'rose_clock_history'
          )
          .select('*')
          .order(
            'created_at',
            {
              ascending:false
            }
          )
          .limit(
            100
          ),


        client
          .from(
            'dm_timeline_events'
          )
          .select('*')
          .order(
            'created_at'
          ),


        client
          .from(
            'dm_timeline_event_npcs'
          )
          .select('*'),


        client
          .from(
            'npcs'
          )
          .select(
            `
              id,
              name_cast,
              name_unbound,
              title,
              company_association
            `
          )
          .order(
            'name_cast'
          ),


        client
          .from(
            'npc_rose_clock_notes'
          )
          .select('*')

      ]);


    [
      timeResult,
      clockResult,
      scheduleResult,
      historyResult,
      eventResult,
      linkResult,
      npcResult,
      roseNoteResult
    ]
      .forEach(
        result=>{

          if(
            result.error
          ){
            throw result.error;
          }

        }
      );


    foundersDay =
      timeResult.data
        ?.founders_day
      ||
      null;


    presentDate =
      timeResult.data
        ?.present_date
      ||
      null;


    currentRoseHour =
      Number(
        clockResult.data
          ?.current_hour ??
        0
      );


    selectedRoseHour =
      Math.max(
        0,
        Math.min(
          12,
          selectedRoseHour
        )
      );


    roseSchedule =
      scheduleResult.data ||
      [];


    roseHistory =
      historyResult.data ||
      [];


    timelineEvents =
      eventResult.data ||
      [];


    timelineLinks =
      linkResult.data ||
      [];


    timelineNpcs =
      npcResult.data ||
      [];


    timelineRoseNotes =
      roseNoteResult.data ||
      [];

  }


  /* =====================================================
     MODAL
     ===================================================== */

  function closeModal(){

    byId(
      'dmTimelineModal'
    )
      ?.remove();

  }


  function modal({
    kicker = 'TIMELINE',
    title,
    body = '',
    actions = ''
  }){

    closeModal();


    const overlay =
      document.createElement(
        'div'
      );


    overlay.id =
      'dmTimelineModal';


    overlay.className =
      'dm-timeline-modal-backdrop';


    overlay.innerHTML = `

      <div
        class="dm-timeline-modal"
        role="dialog"
        aria-modal="true"
      >

        <div class="dm-timeline-modal-head">

          <div>

            <div class="dm-page-kicker">
              ${esc(
                kicker
              )}
            </div>

            <h2>
              ${esc(
                title
              )}
            </h2>

          </div>


          <button
            class="dm-timeline-close"
            type="button"
            data-timeline-close
          >
            ×
          </button>

        </div>


        <div class="dm-timeline-modal-body">
          ${body}
        </div>


        ${
          actions
            ? `
                <div class="dm-timeline-modal-actions">
                  ${actions}
                </div>
              `
            : ''
        }

      </div>
    `;


    document.body.appendChild(
      overlay
    );


    overlay.addEventListener(
      'click',
      event=>{

        if(
          event.target === overlay
          ||
          event.target.closest(
            '[data-timeline-close]'
          )
        ){

          closeModal();

        }

      }
    );


    return overlay;

  }


  /* =====================================================
     TIME HEADER
     ===================================================== */

  function renderRoseClock(){

    const angle =
      currentRoseHour === 0
        ? 0
        : currentRoseHour *
          30;


    return `

      <section
        class="
          dm-console-panel
          dm-time-card
          dm-rose-clock-card
        "
      >

        <div
          class="
            dm-rose-clock
            ${
              currentRoseHour === 0
                ? 'hour-zero'
                : ''
            }
          "
          style="
            --rose-angle:
              ${angle}deg;
          "
        >

          ${
            Array.from(
              {
                length:12
              },
              (
                _,
                index
              )=>{

                const hour =
                  index + 1;


                return `

                  <button
                    class="
                      dm-rose-number

                      ${
                        hour <
                        currentRoseHour
                          ? 'passed'
                          : ''
                      }

                      ${
                        hour ===
                        currentRoseHour
                          ? 'current'
                          : ''
                      }
                    "
                    style="
                      --rose-index:
                        ${hour};
                    "
                    type="button"
                    data-select-rose-hour="${hour}"
                  >
                    ${hour}
                  </button>
                `;

              }
            )
              .join('')
          }


          <div class="dm-rose-hand"></div>


          <div class="dm-rose-clock-center">

            <strong>
              ${
                currentRoseHour === 0
                  ? '0'
                  : `Hour ${currentRoseHour}`
              }
            </strong>

            <span>
              ${esc(
                roseName(
                  currentRoseHour
                )
              )}
            </span>

          </div>

        </div>


        <div>

          <div class="dm-page-kicker">
            GLOBAL ROSE CLOCK
          </div>

          <div class="dm-time-value">
            Hour ${currentRoseHour}
          </div>

          <div class="dm-time-muted">
            ${esc(
              roseName(
                currentRoseHour
              )
            )}
          </div>


          <div class="dm-time-actions">

            <button
              class="dm-personnel-primary"
              type="button"
              data-advance-rose
            >
              Advance Clock
            </button>

            <button
              class="dm-personnel-secondary"
              type="button"
              data-edit-rose-schedule
            >
              Projected Dates
            </button>

          </div>

        </div>

      </section>
    `;

  }


  function renderTimeControls(){

    const day =
      campaignDay();


    return `

      <div class="dm-time-control-grid">

        <section
          class="
            dm-console-panel
            dm-time-card
          "
        >

          <div class="dm-page-kicker">
            CAMPAIGN EPOCH
          </div>

          <div class="dm-time-value">
            ${esc(
              formatDate(
                foundersDay
              )
            )}
          </div>

          <div class="dm-time-muted">
            Founder's Day · Campaign Day 0
          </div>


          <div class="dm-time-actions">

            <button
              class="dm-personnel-secondary"
              type="button"
              data-set-founders-day
            >
              ${
                foundersDay
                  ? 'Edit Founder’s Day'
                  : 'Set Founder’s Day'
              }
            </button>

          </div>

        </section>


        <section
          class="
            dm-console-panel
            dm-time-card
          "
        >

          <div class="dm-page-kicker">
            PRESENT
          </div>

          <div class="dm-time-value">
            ${esc(
              formatDate(
                presentDate
              )
            )}
          </div>

          <div class="dm-time-muted">

            ${
              day === null
                ? 'Current campaign date not established.'
                : `Campaign Day ${day}`
            }

          </div>


          <div class="dm-time-actions">

            <button
              class="dm-personnel-primary"
              type="button"
              data-set-present
            >
              ${
                presentDate
                  ? 'Advance / Adjust Present'
                  : 'Set Present Date'
              }
            </button>

          </div>

        </section>


        ${renderRoseClock()}

      </div>
    `;

  }


  /* =====================================================
     FILTERS
     ===================================================== */

  function filterOptions(){

    return `


      <section
        class="
          dm-console-panel
          dm-timeline-filter-panel
        "
      >

      <div class="dm-timeline-filter-toolbar">

  <div>

    <div class="dm-page-kicker">
      TIMELINE RANGE
    </div>

    <div class="dm-time-muted">
      Quickly focus the timeline without changing event dates.
    </div>

  </div>


  <div class="dm-timeline-range-actions">

    <button
      class="dm-personnel-secondary"
      type="button"
      data-timeline-range="present"
      ${presentDate ? '' : 'disabled'}
      title="${
        presentDate
          ? 'Show 30 days before Present through 90 days after Present.'
          : 'Set Present Date first.'
      }"
    >
      Around Present
    </button>


    <button
      class="dm-personnel-secondary"
      type="button"
      data-timeline-range="campaign"
      ${
        foundersDay && presentDate
          ? ''
          : 'disabled'
      }
      title="${
        foundersDay && presentDate
          ? 'Show Founder’s Day through Present.'
          : 'Set Founder’s Day and Present Date first.'
      }"
    >
      Campaign
    </button>


    <button
      class="dm-personnel-secondary"
      type="button"
      data-timeline-range="clear"
    >
      Clear Range
    </button>

  </div>

</div>

        <div class="dm-timeline-filters">

          <label class="dm-timeline-field">

            <span>
              Status
            </span>

            <select data-filter-status>

              <option value="all">
                All
              </option>

              ${
                [
                  'planned',
                  'occurred',
                  'disrupted',
                  'revised'
                ]
                  .map(
                    value=>`

                      <option
                        value="${value}"
                        ${
                          filters.status ===
                          value
                            ? 'selected'
                            : ''
                        }
                      >
                        ${
                          value[0]
                            .toUpperCase()
                          +
                          value.slice(1)
                        }
                      </option>
                    `
                  )
                  .join('')
              }

            </select>

          </label>


          <label class="dm-timeline-field">

            <span>
              Category
            </span>

            <select data-filter-category>

              <option value="all">
                All
              </option>

              ${EVENT_CATEGORIES
                .map(
                  value=>`

                    <option
                      value="${esc(
                        value
                      )}"
                      ${
                        filters.category ===
                        value
                          ? 'selected'
                          : ''
                      }
                    >
                      ${esc(
                        value
                      )}
                    </option>
                  `
                )
                .join('')
              }

            </select>

          </label>


          <label class="dm-timeline-field">

            <span>
              Personnel
            </span>

            <select data-filter-npc>

              <option value="all">
                All Personnel
              </option>

              ${timelineNpcs
                .map(
                  npc=>`

                    <option
                      value="${npc.id}"
                      ${
                        filters.npc ===
                        npc.id
                          ? 'selected'
                          : ''
                      }
                    >
                      ${esc(
                        npc.name_cast
                      )}
                    </option>
                  `
                )
                .join('')
              }

            </select>

          </label>


          <label class="dm-timeline-field">

            <span>
              Rose Hour
            </span>

            <select data-filter-rose>

              <option value="all">
                All Hours
              </option>

              ${ROSE_HOURS
                .map(
                  (
                    name,
                    hour
                  )=>`

                    <option
                      value="${hour}"
                      ${
                        String(
                          filters.rose
                        ) ===
                        String(
                          hour
                        )
                          ? 'selected'
                          : ''
                      }
                    >
                      ${hour}
                      ·
                      ${esc(
                        name
                      )}
                    </option>
                  `
                )
                .join('')
              }

            </select>

          </label>

<label class="dm-timeline-field">

  <span>
    Start Date
  </span>

  <input
    type="date"
    data-filter-start-date
    value="${esc(
      filters.startDate
    )}"
  >

</label>


<label class="dm-timeline-field">

  <span>
    End Date
  </span>

  <input
    type="date"
    data-filter-end-date
    value="${esc(
      filters.endDate
    )}"
  >

</label>

        </div>

      </section>
    `;

  }


  function filteredEvents(){

    return timelineEvents
      .filter(
        event=>{

          if(
            filters.status !==
            'all'
            &&
            event.status !==
            filters.status
          ){
            return false;
          }


          if(
            filters.category !==
            'all'
            &&
            !(
              Array.isArray(
                event.categories
              )
              &&
              event.categories.includes(
                filters.category
              )
            )
          ){
            return false;
          }


          if(
            filters.npc !==
            'all'
            &&
            !npcIdsForEvent(
              event.id
            ).includes(
              filters.npc
            )
          ){
            return false;
          }


          if(
            filters.rose !==
            'all'
            &&
            String(
              event.rose_hour
            ) !==
            String(
              filters.rose
            )
          ){
            return false;
          }

          const resolvedDate =
  eventDate(
    event
  );


if(
  filters.startDate
){

  const start =
    parseDate(
      filters.startDate
    );


  if(
    !resolvedDate
    ||
    resolvedDate <
    start
  ){
    return false;
  }

}


if(
  filters.endDate
){

  const end =
    parseDate(
      filters.endDate
    );


  if(
    !resolvedDate
    ||
    resolvedDate >
    end
  ){
    return false;
  }

}

          return true;

        }
      );

  }

  /* =====================================================
   TIMELINE RANGE PRESETS
   ===================================================== */

function setTimelineRange(
  preset
){

  /* ---------------------------------------------
     AROUND PRESENT
     Present - 30 days through Present + 90 days
     --------------------------------------------- */

  if(
    preset ===
    'present'
  ){

    if(!presentDate){

      alert(
        'Set the Present Date before using Around Present.'
      );

      return;

    }


    filters.startDate =
      dateString(
        addDays(
          presentDate,
          -30
        )
      )
      ||
      '';


    filters.endDate =
      dateString(
        addDays(
          presentDate,
          90
        )
      )
      ||
      '';


    render();

    return;

  }


  /* ---------------------------------------------
     CAMPAIGN
     Founder’s Day through Present only
     --------------------------------------------- */

  if(
    preset ===
    'campaign'
  ){

    if(
      !foundersDay ||
      !presentDate
    ){

      alert(
        'Set both Founder’s Day and Present Date before using the Campaign range.'
      );

      return;

    }


    filters.startDate =
      foundersDay;


    filters.endDate =
      presentDate;


    render();

    return;

  }


  /* ---------------------------------------------
     CLEAR RANGE
     Leave other filters untouched
     --------------------------------------------- */

  if(
    preset ===
    'clear'
  ){

    filters.startDate =
      '';


    filters.endDate =
      '';


    render();

  }

}

  /* =====================================================
     EVENT TOOLTIP
     ===================================================== */

  function eventTooltip(
    event
  ){

    const npcs =
      npcsForEvent(
        event.id
      );


    return `

      <strong>
        ${esc(
          event.title
        )}
      </strong>

      <div
        style="
          margin-top:5px;
          opacity:.7;
        "
      >
        ${esc(
          event.status
        )}

        ${
          Array.isArray(
            event.categories
          )
          &&
          event.categories.length
            ? ` · ${esc(
                event.categories.join(
                  ', '
                )
              )}`
            : ''
        }
      </div>


      ${
        event.description
          ? `
              <div style="margin-top:7px">
                ${esc(
                  event.description
                )}
              </div>
            `
          : ''
      }


      ${
        npcs.length
          ? `
              <div style="margin-top:7px">
                Personnel:
                ${esc(
                  npcs
                    .map(
                      npc =>
                        npc.name_cast
                    )
                    .join(
                      ', '
                    )
                )}
              </div>
            `
          : ''
      }
    `;

  }


  /* =====================================================
     VISUAL TIMELINE
     ===================================================== */

  function renderVisualTimeline(){

    const events =
      filteredEvents();


    const dated =
      events
        .map(
          event=>({

            event,

            date:
              eventDate(
                event
              )

          })
        )
        .filter(
          item =>
            item.date
        )
        .sort(
          (
            a,
            b
          ) =>
            a.date -
            b.date
        );


    const undated =
      events.filter(
        event =>
          !eventDate(
            event
          )
      );


    const anchorDates = [];


    dated.forEach(
      item =>
        anchorDates.push(
          item.date
        )
    );


    if(foundersDay){

      anchorDates.push(
        parseDate(
          foundersDay
        )
      );

    }


    if(presentDate){

      anchorDates.push(
        parseDate(
          presentDate
        )
      );

    }


    let stage =
      '';


    if(
      anchorDates.length
    ){

      let minimum =
        new Date(
          Math.min(
            ...anchorDates.map(
              date =>
                date.getTime()
            )
          )
        );


      let maximum =
        new Date(
          Math.max(
            ...anchorDates.map(
              date =>
                date.getTime()
            )
          )
        );


      minimum =
        addDays(
          minimum,
          -7
        );


      maximum =
        addDays(
          maximum,
          7
        );


      const span =
        Math.max(
          1,
          daysBetween(
            minimum,
            maximum
          )
        );


      const width =
        Math.max(
          1000,
          Math.min(
            7000,
            span *
            18
          )
        );


      function position(
        value
      ){

        const offset =
          daysBetween(
            minimum,
            value
          );


        return (
          offset /
          span
        ) *
        100;

      }


      stage = `

        <div class="dm-timeline-scroll">

          <div
            class="dm-timeline-stage"
            style="
              width:${width}px;
            "
          >

            <div class="dm-timeline-axis"></div>


            ${
              foundersDay
                ? `
                    <div
                      class="
                        dm-timeline-anchor
                        founder
                      "
                      style="
                        left:
                          ${position(
                            parseDate(
                              foundersDay
                            )
                          )}%;
                      "
                    >
                      <strong>
                        FOUNDER'S DAY
                      </strong>
                    </div>
                  `
                : ''
            }


            ${
              presentDate
                ? `
                    <div
                      class="
                        dm-timeline-anchor
                        present
                      "
                      style="
                        left:
                          ${position(
                            parseDate(
                              presentDate
                            )
                          )}%;
                      "
                    >
                      <strong>
                        PRESENT
                      </strong>
                    </div>
                  `
                : ''
            }


            ${dated
              .map(
                (
                  item,
                  index
                )=>{

                  const event =
                    item.event;


                  const upper =
                    index %
                    2 ===
                    0;


                  const lane =
                    index %
                    3;


                  const y =
                    upper
                      ? 126 -
                        (
                          lane *
                          35
                        )
                      : 228 +
                        (
                          lane *
                          35
                        );


                  const axisY =
                    178;


                  const stemTop =
                    Math.min(
                      y,
                      axisY
                    );


                  const stemHeight =
                    Math.abs(
                      y -
                      axisY
                    );


                  const due =
                    isDue(
                      event
                    );


                  return `

                    <div
                      style="
                        position:absolute;
                        left:
                          ${position(
                            item.date
                          )}%;
                        top:0;
                      "
                    >

                      <div
                        class="dm-timeline-stem"
                        style="
                          top:${stemTop}px;
                          height:${stemHeight}px;
                        "
                      ></div>


                      <button
                        class="
                          dm-timeline-node
                          ${esc(
                            event.status
                          )}
                          ${
                            due
                              ? 'is-due'
                              : ''
                          }
                        "
                        style="
                          top:${y}px;
                        "
                        type="button"
                        data-edit-timeline-event="${event.id}"
                      >

                        <span class="dm-timeline-tooltip">
                          ${eventTooltip(
                            event
                          )}
                        </span>

                      </button>


                      <div
                        class="dm-timeline-label"
                        style="
                          top:${
                            upper
                              ? y - 42
                              : y + 17
                          }px;
                        "
                      >

                        <strong>
                          ${esc(
                            event.title
                          )}
                        </strong>

                        <br>

                        ${esc(
                          formatDate(
                            item.date
                          )
                        )}

                      </div>

                    </div>

                  `;

                }
              )
              .join('')
            }

          </div>

        </div>
      `;

    }
    else{

      stage = `

        <div class="dm-timeline-empty">

          The timeline is ready,
          but no calendar dates have been established yet.

          You can still create undated events,
          Rose-bound events, and Personnel plans now.

        </div>
      `;

    }


    return `

      <section
        class="
          dm-console-panel
          dm-timeline-visual-panel
        "
      >

        <div class="dm-timeline-visual-head">

          <div>

            <div class="dm-page-kicker">
              SHARED WORLD TIMELINE
            </div>

            <h2>
              Reality, Past to Future
            </h2>

          </div>


          <button
            class="dm-personnel-primary"
            type="button"
            data-add-timeline-event
          >
            + Add Event
          </button>

        </div>


        ${stage}


        ${
          undated.length
            ? `
                <div class="dm-timeline-undated">

                  <div class="dm-page-kicker">
                    UNDATED / UNPROJECTED
                  </div>


                  <div class="dm-timeline-undated-grid">

                    ${undated
                      .map(
                        event=>`

                          <button
                            class="dm-timeline-undated-card"
                            type="button"
                            data-edit-timeline-event="${event.id}"
                          >

                            <strong>
                              ${esc(
                                event.title
                              )}
                            </strong>

                            <div class="dm-time-muted">

                              ${
                                event.timing_type ===
                                'rose'
                                  ? `Rose Hour ${
                                      event.rose_hour
                                    } · Projection not dated`
                                  : 'No calendar date'
                              }

                            </div>

                          </button>
                        `
                      )
                      .join('')
                    }

                  </div>

                </div>
              `
            : ''
        }

      </section>
    `;

  }


  /* =====================================================
     DUE EVENTS
     ===================================================== */

  function renderDueEvents(){

    const due =
      timelineEvents.filter(
        isDue
      );


    if(!due.length){

      return '';
    }


    return `

      <section class="dm-timeline-due-panel">

        <strong>
          EVENTS NEED RESOLUTION
        </strong>

        <span class="dm-timeline-due-count">
          ${due.length}
        </span>

        <div class="dm-time-muted">
          Present or the Rose Clock has caught
          planned events that have not yet been resolved.
        </div>


        <div
          class="dm-timeline-undated-grid"
          style="margin-top:10px"
        >

          ${due
            .map(
              event=>`

                <button
                  class="dm-timeline-undated-card"
                  type="button"
                  data-edit-timeline-event="${event.id}"
                >

                  <strong>
                    ${esc(
                      event.title
                    )}
                  </strong>

                  <div class="dm-time-muted">

                    ${
                      eventDate(
                        event
                      )
                        ? esc(
                            formatDate(
                              eventDate(
                                event
                              )
                            )
                          )
                        : `Rose Hour ${
                            event.rose_hour ??
                            '?'
                          }`
                    }

                  </div>

                </button>
              `
            )
            .join('')
          }

        </div>

      </section>
    `;

  }


  /* =====================================================
     ROSE DETAIL
     ===================================================== */

  function eventsForRoseHour(
    hour
  ){

    return timelineEvents
      .filter(
        event =>
          Number(
            event.rose_hour
          ) ===
          Number(
            hour
          )
      );

  }


  function roseNotesForHour(
    hour
  ){

    return timelineRoseNotes
      .filter(
        note =>
          Number(
            note.hour
          ) ===
          Number(
            hour
          )
      );

  }


  function renderRoseDetail(){

    const events =
      eventsForRoseHour(
        selectedRoseHour
      );


    const notes =
      roseNotesForHour(
        selectedRoseHour
      );


    return `

      <div class="dm-rose-detail-grid">

        <section
          class="
            dm-console-panel
            dm-rose-detail-panel
          "
        >

          <div class="dm-page-kicker">
            ROSE HOUR ${selectedRoseHour}
          </div>

          <h2>
            ${esc(
              roseName(
                selectedRoseHour
              )
            )}
          </h2>


          <div class="dm-time-muted">

            Projected Date:
            ${esc(
              formatDate(
                roseProjection(
                  selectedRoseHour
                )
              )
            )}

          </div>


          <div class="dm-rose-detail-list">

            ${
              events.length
                ? events
                    .map(
                      event=>`

                        <button
                          class="dm-rose-detail-item"
                          type="button"
                          data-edit-timeline-event="${event.id}"
                        >

                          <strong>
                            ${esc(
                              event.title
                            )}
                          </strong>

                          <div class="dm-time-muted">
                            Timeline Event ·
                            ${esc(
                              event.status
                            )}
                          </div>

                        </button>
                      `
                    )
                    .join('')
                : `
                    <div class="dm-timeline-empty">
                      No timeline events are tied
                      to this Rose Hour.
                    </div>
                  `
            }

          </div>

        </section>


        <section
          class="
            dm-console-panel
            dm-rose-detail-panel
          "
        >

          <div class="dm-page-kicker">
            PERSONNEL DEVELOPMENTS
          </div>


          <div class="dm-rose-detail-list">

            ${
              notes.length
                ? notes
                    .map(
                      note=>{

                        const npc =
                          npcById(
                            note.npc_id
                          );


                        return `

                          <button
                            class="dm-rose-detail-item"
                            type="button"
                            data-open-intelligence="${note.npc_id}"
                          >

                            <strong>
                              ${esc(
                                npc
                                  ?.name_cast
                                ||
                                'Personnel'
                              )}
                            </strong>

                            <div class="dm-time-muted">
                              ${esc(
                                note.notes
                              )}
                            </div>

                          </button>
                        `;

                      }
                    )
                    .join('')
                : `
                    <div class="dm-timeline-empty">
                      No Personnel-specific developments
                      are entered for this hour.
                    </div>
                  `
            }

          </div>

        </section>

      </div>
    `;

  }


  /* =====================================================
     MAIN RENDER
     ===================================================== */

  function render(){

    const mount =
      byId(
        'dmTimelineMount'
      );


    if(!mount){
      return;
    }


    mount.innerHTML = `

      ${renderTimeControls()}

      ${renderDueEvents()}

      ${filterOptions()}

      ${renderVisualTimeline()}

      ${renderRoseDetail()}

    `;

  }


  /* =====================================================
     TIME SETTINGS
     ===================================================== */

  function openFoundersDay(){

    const view =
      modal({

        kicker:
          'CAMPAIGN EPOCH',

        title:
          'Founder’s Day',

        body:`

          <label class="dm-timeline-field">

            <span>
              Founder’s Day
            </span>

            <input
              id="dmFoundersDayInput"
              type="date"
              value="${esc(
                foundersDay ||
                ''
              )}"
            >

          </label>


          <p>
            Founder’s Day is Campaign Day 0.
            Once you establish it,
            every campaign date can be measured
            against this anchor.
          </p>
        `,

        actions:`

          <button
            class="dm-personnel-secondary"
            type="button"
            data-timeline-close
          >
            Cancel
          </button>

          <button
            class="dm-personnel-primary"
            type="button"
            data-save-founders-day
          >
            Save Founder’s Day
          </button>
        `

      });


    view
      .querySelector(
        '[data-save-founders-day]'
      )
      .addEventListener(
        'click',
        async ()=>{

          const value =
            byId(
              'dmFoundersDayInput'
            ).value
            ||
            null;


          if(
            foundersDay
            &&
            value !==
            foundersDay
            &&
            !confirm(
              'Founder’s Day is the permanent Campaign Day 0 anchor. Changing it will recalculate every relative campaign date. Continue?'
            )
          ){
            return;
          }


          const {
            error
          } =
            await db()
              .from(
                'dm_campaign_time_state'
              )
              .upsert({

                id:1,

                founders_day:
                  value,

                present_date:
                  presentDate,

                updated_at:
                  new Date()
                    .toISOString()

              });


          if(error){

            alert(
              error.message
            );

            return;
          }


          closeModal();

          await refresh();

        }
      );

  }


  function openPresentDate(){

    const view =
      modal({

        kicker:
          'CAMPAIGN PRESENT',

        title:
          'Set Present Date',

        body:`

          <label class="dm-timeline-field">

            <span>
              Present Date
            </span>

            <input
              id="dmPresentDateInput"
              type="date"
              value="${esc(
                presentDate ||
                ''
              )}"
            >

          </label>


          <p>
            Moving Present forward does not
            automatically resolve planned events.
            Any events caught by the new Present
            remain waiting for your decision.
          </p>
        `,

        actions:`

          <button
            class="dm-personnel-secondary"
            type="button"
            data-timeline-close
          >
            Cancel
          </button>

          <button
            class="dm-personnel-primary"
            type="button"
            data-save-present
          >
            Save Present
          </button>
        `

      });


    view
      .querySelector(
        '[data-save-present]'
      )
      .addEventListener(
        'click',
        async ()=>{

          const next =
            byId(
              'dmPresentDateInput'
            ).value
            ||
            null;


          if(
            next &&
            presentDate
            &&
            parseDate(
              next
            ) >
            parseDate(
              presentDate
            )
          ){

            const crossed =
              timelineEvents.filter(
                event=>{

                  if(
                    event.status !==
                    'planned'
                  ){
                    return false;
                  }


                  const date =
                    eventDate(
                      event
                    );


                  if(!date){
                    return false;
                  }


                  return (
                    date >
                    parseDate(
                      presentDate
                    )
                    &&
                    date <=
                    parseDate(
                      next
                    )
                  );

                }
              );


            if(
              crossed.length
            ){

              const approved =
                confirm(
                  `Advancing Present crosses ${crossed.length} unresolved planned event${crossed.length === 1 ? '' : 's'}. They will remain marked as needing resolution. Continue?`
                );


              if(!approved){
                return;
              }

            }

          }


          const {
            error
          } =
            await db()
              .from(
                'dm_campaign_time_state'
              )
              .upsert({

                id:1,

                founders_day:
                  foundersDay,

                present_date:
                  next,

                updated_at:
                  new Date()
                    .toISOString()

              });


          if(error){

            alert(
              error.message
            );

            return;
          }


          closeModal();

          await refresh();

        }
      );

  }


  /* =====================================================
     ROSE SCHEDULE
     ===================================================== */

  function openRoseSchedule(){

    const view =
      modal({

        kicker:
          'CONVERGENCE PROJECTION',

        title:
          'Projected Rose Dates',

        body:`

          <p>
            You do not need to establish these dates yet.
            Leave any or all of them blank until you are ready.
          </p>


          <div class="dm-timeline-form">

            ${ROSE_HOURS
              .map(
                (
                  name,
                  hour
                )=>`

                  <label class="dm-timeline-field">

                    <span>
                      Hour ${hour}
                      ·
                      ${esc(
                        name
                      )}
                    </span>

                    <input
                      type="date"
                      data-rose-projection="${hour}"
                      value="${esc(
                        roseProjection(
                          hour
                        )
                        ||
                        ''
                      )}"
                    >

                  </label>
                `
              )
              .join('')
            }

          </div>
        `,

        actions:`

          <button
            class="dm-personnel-secondary"
            type="button"
            data-timeline-close
          >
            Cancel
          </button>

          <button
            class="dm-personnel-primary"
            type="button"
            data-save-rose-schedule
          >
            Save Projections
          </button>
        `

      });


    view
      .querySelector(
        '[data-save-rose-schedule]'
      )
      .addEventListener(
        'click',
        async ()=>{

          const rows =
            [
              ...view.querySelectorAll(
                '[data-rose-projection]'
              )
            ]
              .map(
                input=>({

                  hour:
                    Number(
                      input.dataset
                        .roseProjection
                    ),

                  projected_date:
                    input.value
                    ||
                    null,

                  updated_at:
                    new Date()
                      .toISOString()

                })
              );


          const {
            error
          } =
            await db()
              .from(
                'rose_clock_schedule'
              )
              .upsert(
                rows
              );


          if(error){

            alert(
              error.message
            );

            return;
          }


          closeModal();

          await refresh();

        }
      );

  }


  /* =====================================================
     ADVANCE ROSE CLOCK
     ===================================================== */

  function openAdvanceRose(){

    if(
      currentRoseHour >=
      12
    ){

      alert(
        'The Rose Clock has reached Release.'
      );

      return;

    }


    const view =
      modal({

        kicker:
          'ADVANCE CONVERGENCE',

        title:
          `Rose Clock · Hour ${currentRoseHour}`,

        body:`

          <div class="dm-timeline-form">

            <label class="dm-timeline-field">

              <span>
                Advance To
              </span>

              <select id="dmRoseAdvanceTarget">

                ${ROSE_HOURS
                  .map(
                    (
                      name,
                      hour
                    )=>{

                      if(
                        hour <=
                        currentRoseHour
                      ){
                        return '';
                      }


                      return `

                        <option value="${hour}">
                          Hour ${hour}
                          ·
                          ${esc(
                            name
                          )}
                        </option>
                      `;

                    }
                  )
                  .join('')
                }

              </select>

            </label>


            <label class="dm-timeline-field">

              <span>
                Caused By
              </span>

              <input
                id="dmRoseAdvanceCause"
                placeholder="Heroes, Villains, NPC, inaction..."
              >

            </label>


            <label
              class="
                dm-timeline-field
                wide
              "
            >

              <span>
                Why did the Clock advance?
              </span>

              <textarea
                id="dmRoseAdvanceReason"
                rows="4"
              ></textarea>

            </label>

          </div>
        `,

        actions:`

          <button
            class="dm-personnel-secondary"
            type="button"
            data-timeline-close
          >
            Cancel
          </button>

          <button
            class="dm-personnel-primary"
            type="button"
            data-confirm-rose-advance
          >
            Advance Clock
          </button>
        `

      });


    view
      .querySelector(
        '[data-confirm-rose-advance]'
      )
      .addEventListener(
        'click',
        async ()=>{

          const target =
            Number(
              byId(
                'dmRoseAdvanceTarget'
              ).value
            );


          const reason =
            clean(
              byId(
                'dmRoseAdvanceReason'
              ).value
            );


          const causedBy =
            clean(
              byId(
                'dmRoseAdvanceCause'
              ).value
            );


          await advanceRoseClock(
            target,
            reason,
            causedBy
          );

        }
      );

  }


  async function advanceRoseClock(
    target,
    reason,
    causedBy
  ){

    const client =
      db();


    const previous =
      currentRoseHour;


    const anticipated =
      roseProjection(
        target
      );


    let compression =
      0;


    /*
      FUTURE COMPRESSION

      Dormant until BOTH:
      - Present exists
      - target Rose Hour has a projected date

      If Hour 4 was projected for Jan 1,
      but is actually reached on Apr 1 of
      the previous year, all Hours 4–12
      move forward by that difference.

      Rose-bound events move automatically
      because their dates are derived from
      these projected hour anchors.
    */

    if(
      presentDate &&
      anticipated
    ){

      const difference =
        daysBetween(
          presentDate,
          anticipated
        );


      if(
        difference >
        0
      ){

        compression =
          difference;


        const shifted =
          roseSchedule
            .filter(
              row =>
                Number(
                  row.hour
                ) >=
                target
                &&
                row.projected_date
            )
            .map(
              row=>({

                hour:
                  Number(
                    row.hour
                  ),

                projected_date:
                  dateString(
                    addDays(
                      row.projected_date,
                      -difference
                    )
                  ),

                updated_at:
                  new Date()
                    .toISOString()

              })
            );


        if(
          shifted.length
        ){

          const {
            error
          } =
            await client
              .from(
                'rose_clock_schedule'
              )
              .upsert(
                shifted
              );


          if(error){

            alert(
              error.message
            );

            return;

          }

        }

      }

    }


    const {
      error:clockError
    } =
      await client
        .from(
          'rose_clock_state'
        )
        .upsert({

          id:1,

          current_hour:
            target,

          updated_at:
            new Date()
              .toISOString()

        });


    if(clockError){

      alert(
        clockError.message
      );

      return;

    }


    const {
      error:historyError
    } =
      await client
        .from(
          'rose_clock_history'
        )
        .insert({

          from_hour:
            previous,

          to_hour:
            target,

          reason:
            reason ||
            'Rose Clock advanced',

          caused_by:
            causedBy ||
            null,

          present_date:
            presentDate,

          anticipated_date:
            anticipated,

          compression_days:
            compression

        });


    if(historyError){

      console.error(
        historyError
      );

    }


    closeModal();

    await refresh();


    if(
      compression >
      0
    ){

      alert(
        `Convergence accelerated by ${compression} day${compression === 1 ? '' : 's'}. Rose Hours ${target}–12 and their Rose-bound future events have moved toward Present.`
      );

    }

  }


  /* =====================================================
     EVENT EDITOR
     ===================================================== */

  function categoryEditor(
    event
  ){

    const selected =
      Array.isArray(
        event.categories
      )
        ? event.categories
        : [];


    return `

      <div class="dm-timeline-category-grid">

        ${EVENT_CATEGORIES
          .map(
            category=>`

              <label class="dm-timeline-check">

                <input
                  type="checkbox"
                  data-event-category="${esc(
                    category
                  )}"
                  ${
                    selected.includes(
                      category
                    )
                      ? 'checked'
                      : ''
                  }
                >

                <span>
                  ${esc(
                    category
                  )}
                </span>

              </label>
            `
          )
          .join('')
        }

      </div>
    `;

  }


  function npcEditor(
    event
  ){

    const selected =
      event.id
        ? npcIdsForEvent(
            event.id
          )
        : [];


    return `

      <div class="dm-timeline-npc-list">

        ${timelineNpcs
          .map(
            npc=>`

              <label class="dm-timeline-check">

                <input
                  type="checkbox"
                  data-event-npc="${npc.id}"
                  ${
                    selected.includes(
                      npc.id
                    )
                      ? 'checked'
                      : ''
                  }
                >

                <span>
                  ${esc(
                    npc.name_cast
                  )}
                </span>

              </label>
            `
          )
          .join('')
        }

      </div>
    `;

  }


  function timingFields(
    event
  ){

    return `

      <label class="dm-timeline-field">

        <span>
          Timing
        </span>

        <select
          id="dmTimelineTimingType"
        >

          <option
            value="undated"
            ${
              event.timing_type ===
              'undated'
                ? 'selected'
                : ''
            }
          >
            Undated / Decide Later
          </option>

          <option
            value="exact"
            ${
              event.timing_type ===
              'exact'
                ? 'selected'
                : ''
            }
          >
            Exact Calendar Date
          </option>

          <option
            value="founder"
            ${
              event.timing_type ===
              'founder'
                ? 'selected'
                : ''
            }
          >
            Relative to Founder’s Day
          </option>

          <option
            value="rose"
            ${
              event.timing_type ===
              'rose'
                ? 'selected'
                : ''
            }
          >
            Rose-Bound Event
          </option>

        </select>

      </label>


      <label
        class="dm-timeline-field"
        data-timing-exact
      >

        <span>
          Calendar Date
        </span>

        <input
          id="dmTimelineExactDate"
          type="date"
          value="${esc(
            event.calendar_date ||
            ''
          )}"
        >

      </label>


      <label
        class="dm-timeline-field"
        data-timing-founder
      >

        <span>
          Days from Founder’s Day
        </span>

        <input
          id="dmTimelineFounderOffset"
          type="number"
          value="${
            Number(
              event.founder_offset_days ??
              0
            )
          }"
        >

      </label>


      <label
        class="dm-timeline-field"
        data-timing-rose
      >

        <span>
          Rose Hour
        </span>

        <select id="dmTimelineRoseHour">

          ${ROSE_HOURS
            .map(
              (
                name,
                hour
              )=>`

                <option
                  value="${hour}"
                  ${
                    Number(
                      event.rose_hour ??
                      0
                    ) ===
                    hour
                      ? 'selected'
                      : ''
                  }
                >
                  ${hour}
                  ·
                  ${esc(
                    name
                  )}
                </option>
              `
            )
            .join('')
          }

        </select>

      </label>


      <label
        class="dm-timeline-field"
        data-timing-rose
      >

        <span>
          Days from Rose Hour
        </span>

        <input
          id="dmTimelineRoseOffset"
          type="number"
          value="${
            Number(
              event.rose_offset_days ??
              0
            )
          }"
        >

      </label>
    `;

  }


  function openEventEditor(
    eventId = null
  ){

    const existing =
      eventId
        ? timelineEvents.find(
            event =>
              event.id ===
              eventId
          )
        : null;


    const event =
      existing ||
      {
        title:'',
        description:'',
        status:'planned',
        categories:[],
        timing_type:'undated',
        calendar_date:null,
        founder_offset_days:0,
        rose_hour:currentRoseHour,
        rose_offset_days:0
      };


    const view =
      modal({

        kicker:
          existing
            ? 'EDIT TIMELINE EVENT'
            : 'NEW TIMELINE EVENT',

        title:
          existing
            ? event.title
            : 'Timeline Event',

        body:`

          <div class="dm-timeline-form">

            <label
              class="
                dm-timeline-field
                wide
              "
            >

              <span>
                Event Title
              </span>

              <input
                id="dmTimelineEventTitle"
                value="${esc(
                  event.title
                )}"
              >

            </label>


            <label class="dm-timeline-field">

              <span>
                Status
              </span>

              <select id="dmTimelineEventStatus">

                ${[
                  'planned',
                  'occurred',
                  'disrupted',
                  'revised'
                ]
                  .map(
                    value=>`

                      <option
                        value="${value}"
                        ${
                          event.status ===
                          value
                            ? 'selected'
                            : ''
                        }
                      >
                        ${
                          value[0]
                            .toUpperCase()
                          +
                          value.slice(1)
                        }
                      </option>
                    `
                  )
                  .join('')
                }

              </select>

            </label>


            ${timingFields(
              event
            )}


            <div
              class="
                dm-timeline-field
                wide
              "
            >

              <span>
                Categories
              </span>

              ${categoryEditor(
                event
              )}

            </div>


            <div
              class="
                dm-timeline-field
                wide
              "
            >

              <span>
                Involved Personnel
              </span>

              ${npcEditor(
                event
              )}

            </div>


            <label
              class="
                dm-timeline-field
                wide
              "
            >

              <span>
                Event Details
              </span>

              <textarea
                id="dmTimelineEventDescription"
                rows="7"
              >${esc(
                event.description
              )}</textarea>

            </label>

          </div>
        `,

        actions:`

          ${
            existing
              ? `
                  <button
                    class="dm-personnel-secondary"
                    type="button"
                    data-delete-timeline-event="${event.id}"
                  >
                    Delete
                  </button>
                `
              : ''
          }

          <button
            class="dm-personnel-secondary"
            type="button"
            data-timeline-close
          >
            Cancel
          </button>

          <button
            class="dm-personnel-primary"
            type="button"
            data-save-timeline-event
          >
            Save Event
          </button>
        `

      });


    function syncTiming(){

      const type =
        byId(
          'dmTimelineTimingType'
        ).value;


      view
        .querySelectorAll(
          '[data-timing-exact]'
        )
        .forEach(
          field =>
            field.hidden =
              type !==
              'exact'
        );


      view
        .querySelectorAll(
          '[data-timing-founder]'
        )
        .forEach(
          field =>
            field.hidden =
              type !==
              'founder'
        );


      view
        .querySelectorAll(
          '[data-timing-rose]'
        )
        .forEach(
          field =>
            field.hidden =
              type !==
              'rose'
        );

    }


    byId(
      'dmTimelineTimingType'
    )
      .addEventListener(
        'change',
        syncTiming
      );


    syncTiming();


    view
      .querySelector(
        '[data-save-timeline-event]'
      )
      .addEventListener(
        'click',
        ()=>saveEvent(
          existing
            ?.id
          ||
          null,
          view
        )
      );


    view
      .querySelector(
        '[data-delete-timeline-event]'
      )
      ?.addEventListener(
        'click',
        ()=>deleteEvent(
          event.id
        )
      );

  }


  async function saveEvent(
    eventId,
    view
  ){

    const title =
      clean(
        byId(
          'dmTimelineEventTitle'
        ).value
      );


    if(!title){

      alert(
        'Event Title is required.'
      );

      return;

    }


    const timing =
      byId(
        'dmTimelineTimingType'
      ).value;


    const categories =
      [
        ...view.querySelectorAll(
          '[data-event-category]:checked'
        )
      ]
        .map(
          field =>
            field.dataset
              .eventCategory
        );


    const npcIds =
      [
        ...view.querySelectorAll(
          '[data-event-npc]:checked'
        )
      ]
        .map(
          field =>
            field.dataset
              .eventNpc
        );


    const payload = {

      title,

      description:
        clean(
          byId(
            'dmTimelineEventDescription'
          ).value
        )
        ||
        null,

      status:
        byId(
          'dmTimelineEventStatus'
        ).value,

      categories,

      timing_type:
        timing,

      calendar_date:
        timing ===
        'exact'
          ? (
              byId(
                'dmTimelineExactDate'
              ).value
              ||
              null
            )
          : null,

      founder_offset_days:
        timing ===
        'founder'
          ? Number(
              byId(
                'dmTimelineFounderOffset'
              ).value
              ||
              0
            )
          : null,

      rose_hour:
        timing ===
        'rose'
          ? Number(
              byId(
                'dmTimelineRoseHour'
              ).value
            )
          : null,

      rose_offset_days:
        timing ===
        'rose'
          ? Number(
              byId(
                'dmTimelineRoseOffset'
              ).value
              ||
              0
            )
          : 0,

      updated_at:
        new Date()
          .toISOString()

    };


    const client =
      db();


    let id =
      eventId;


    if(eventId){

      const {
        error
      } =
        await client
          .from(
            'dm_timeline_events'
          )
          .update(
            payload
          )
          .eq(
            'id',
            eventId
          );


      if(error){

        alert(
          error.message
        );

        return;
      }

    }
    else{

      const {
        data,
        error
      } =
        await client
          .from(
            'dm_timeline_events'
          )
          .insert(
            payload
          )
          .select(
            'id'
          )
          .single();


      if(error){

        alert(
          error.message
        );

        return;
      }


      id =
        data.id;

    }


    /*
      Replace event ↔ NPC links.
      This supports zero, one, or many NPCs.
    */

    const {
      error:deleteError
    } =
      await client
        .from(
          'dm_timeline_event_npcs'
        )
        .delete()
        .eq(
          'event_id',
          id
        );


    if(deleteError){

      alert(
        deleteError.message
      );

      return;
    }


    if(
      npcIds.length
    ){

      const {
        error:linkError
      } =
        await client
          .from(
            'dm_timeline_event_npcs'
          )
          .insert(
            npcIds.map(
              npcId=>({

                event_id:
                  id,

                npc_id:
                  npcId

              })
            )
          );


      if(linkError){

        alert(
          linkError.message
        );

        return;
      }

    }


    closeModal();

    await refresh();

  }


  async function deleteEvent(
    id
  ){

    const event =
      timelineEvents.find(
        item =>
          item.id ===
          id
      );


    if(
      !event
      ||
      !confirm(
        `Delete “${event.title}”?`
      )
    ){
      return;
    }


    const {
      error
    } =
      await db()
        .from(
          'dm_timeline_events'
        )
        .delete()
        .eq(
          'id',
          id
        );


    if(error){

      alert(
        error.message
      );

      return;
    }


    closeModal();

    await refresh();

  }


  /* =====================================================
     NPC INTELLIGENCE
     ===================================================== */

  async function openNpcIntelligence(
    npcId
  ){

    const client =
      db();


    const [

      stateResult,
      secretResult,
      noteResult

    ] =
      await Promise.all([

        client
          .from(
            'npc_campaign_state'
          )
          .select(
            `
              campaign,
              details,
              relationship_score,
              is_visible
            `
          )
          .eq(
            'npc_id',
            npcId
          ),


        client
          .from(
            'npc_dm_secret_notes'
          )
          .select(
            'notes'
          )
          .eq(
            'npc_id',
            npcId
          )
          .maybeSingle(),


        client
          .from(
            'npc_rose_clock_notes'
          )
          .select('*')
          .eq(
            'npc_id',
            npcId
          )

      ]);


    [
      stateResult,
      secretResult,
      noteResult
    ]
      .forEach(
        result=>{

          if(result.error){
            throw result.error;
          }

        }
      );


    const npc =
      npcById(
        npcId
      );


    const states =
      stateResult.data ||
      [];


    const notes =
      noteResult.data ||
      [];


    const hero =
      states.find(
        state =>
          state.campaign ===
          'hero'
      );


    const villain =
      states.find(
        state =>
          state.campaign ===
          'villain'
      );


    const eventMap =
      new Map();


    ROSE_HOURS.forEach(
      (
        _,
        hour
      ) =>
        eventMap.set(
          hour,
          timelineEvents.filter(
            event =>{

              if(
                Number(
                  event.rose_hour
                ) !==
                hour
              ){
                return false;
              }


              return npcIdsForEvent(
                event.id
              ).includes(
                npcId
              );

            }
          )
        )
    );


    const noteMap =
      new Map(
        notes.map(
          note =>[
            Number(
              note.hour
            ),
            note.notes ||
            ''
          ]
        )
      );


    const view =
      modal({

        kicker:
          'PERSONNEL INTELLIGENCE',

        title:
          npc?.name_cast ||
          'Personnel',

        body:`

          <div class="dm-intelligence-grid">

            <section class="dm-intelligence-panel">

              <div class="dm-page-kicker">
                HERO PLAYER NOTES
              </div>

              <div class="dm-intelligence-readonly">

                ${
                  hero?.details
                  ||
                  '<em>No Hero notes.</em>'
                }

              </div>

            </section>


            <section class="dm-intelligence-panel">

              <div class="dm-page-kicker">
                VILLAIN PLAYER NOTES
              </div>

              <div class="dm-intelligence-readonly">

                ${
                  villain?.details
                  ||
                  '<em>No Villain notes.</em>'
                }

              </div>

            </section>

          </div>


          <label class="dm-intelligence-secret">

            <span class="dm-page-kicker">
              DM SECRET NOTES
            </span>

            <textarea
              id="dmNpcSecretNotes"
              rows="7"
            >${esc(
              secretResult.data
                ?.notes
              ||
              ''
            )}</textarea>

          </label>


          <div
            class="dm-page-kicker"
            style="margin-top:18px"
          >
            ROSE CLOCK RECORD
          </div>


          <div class="dm-intelligence-hours">

            ${ROSE_HOURS
              .map(
                (
                  name,
                  hour
                )=>{

                  const linked =
                    eventMap.get(
                      hour
                    )
                    ||
                    [];


                  return `

                    <section
                      class="
                        dm-intelligence-hour
                        ${
                          hour ===
                          currentRoseHour
                            ? 'current'
                            : ''
                        }
                      "
                    >

                      <div class="dm-intelligence-hour-head">

                        <strong>
                          Hour ${hour}
                          ·
                          ${esc(
                            name
                          )}
                        </strong>

                        ${
                          hour ===
                          currentRoseHour
                            ? '<span>CURRENT</span>'
                            : ''
                        }

                      </div>


                      ${
                        linked.length
                          ? `
                              <div class="dm-intelligence-events">

                                ${linked
                                  .map(
                                    event=>`

                                      <button
                                        class="dm-intelligence-event"
                                        type="button"
                                        data-edit-timeline-event="${event.id}"
                                      >

                                        <strong>
                                          ${esc(
                                            event.title
                                          )}
                                        </strong>

                                        <div>
                                          ${esc(
                                            event.description ||
                                            ''
                                          )}
                                        </div>

                                      </button>
                                    `
                                  )
                                  .join('')
                                }

                              </div>
                            `
                          : ''
                      }


                      <label class="dm-intelligence-rose-note">

                        <textarea
                          rows="3"
                          data-intelligence-rose-note="${hour}"
                          placeholder="No personal development at this hour."
                        >${esc(
                          noteMap.get(
                            hour
                          )
                          ||
                          ''
                        )}</textarea>

                      </label>

                    </section>

                  `;

                }
              )
              .join('')
            }

          </div>
        `,

        actions:`

          <button
            class="dm-personnel-secondary"
            type="button"
            data-timeline-close
          >
            Close
          </button>

          <button
            class="dm-personnel-primary"
            type="button"
            data-save-intelligence="${npcId}"
          >
            Save Intelligence
          </button>
        `

      });


    view
      .querySelector(
        '[data-save-intelligence]'
      )
      .addEventListener(
        'click',
        ()=>saveIntelligence(
          npcId,
          view
        )
      );

  }


  async function saveIntelligence(
    npcId,
    view
  ){

    const client =
      db();


    const secret =
      clean(
        byId(
          'dmNpcSecretNotes'
        ).value
      );


    const {
      error:secretError
    } =
      await client
        .from(
          'npc_dm_secret_notes'
        )
        .upsert({

          npc_id:
            npcId,

          notes:
            secret,

          updated_at:
            new Date()
              .toISOString()

        });


    if(secretError){

      alert(
        secretError.message
      );

      return;
    }


    const rows =
      [
        ...view.querySelectorAll(
          '[data-intelligence-rose-note]'
        )
      ]
        .map(
          field=>({

            npc_id:
              npcId,

            hour:
              Number(
                field.dataset
                  .intelligenceRoseNote
              ),

            notes:
              clean(
                field.value
              ),

            updated_at:
              new Date()
                .toISOString()

          })
        );


    const filled =
      rows.filter(
        row =>
          row.notes
      );


    const blank =
      rows
        .filter(
          row =>
            !row.notes
        )
        .map(
          row =>
            row.hour
        );


    if(filled.length){

      const {
        error
      } =
        await client
          .from(
            'npc_rose_clock_notes'
          )
          .upsert(
            filled,
            {
              onConflict:
                'npc_id,hour'
            }
          );


      if(error){

        alert(
          error.message
        );

        return;
      }

    }


    if(blank.length){

      const {
        error
      } =
        await client
          .from(
            'npc_rose_clock_notes'
          )
          .delete()
          .eq(
            'npc_id',
            npcId
          )
          .in(
            'hour',
            blank
          );


      if(error){

        alert(
          error.message
        );

        return;
      }

    }


    closeModal();

    await refresh();

  }


  /* =====================================================
     REFRESH
     ===================================================== */

  async function refresh(){

    const mount =
      byId(
        'dmTimelineMount'
      );


    if(!mount){
      return;
    }


    mount.innerHTML = `

      <div class="dm-module-loading">
        Synchronizing temporal records...
      </div>
    `;


    try{

      await loadTimeline();

      render();

    }
    catch(error){

      console.error(
        'Timeline failed:',
        error
      );


      mount.innerHTML = `

        <div
          class="dm-console-panel"
          style="padding:18px"
        >

          <strong>
            Timeline could not load.
          </strong>

          <p>
            ${esc(
              error.message
            )}
          </p>

        </div>
      `;

    }

  }


  /* =====================================================
     PAGE EVENTS
     ===================================================== */

  document.addEventListener(
    'click',
    event=>{

const timelineRange =
  event.target.closest(
    '[data-timeline-range]'
  );


if(timelineRange){

  if(
    timelineRange.disabled
  ){
    return;
  }


  setTimelineRange(
    timelineRange.dataset
      .timelineRange
  );


  return;

}

      if(
        event.target.closest(
          '[data-set-founders-day]'
        )
      ){

        openFoundersDay();

        return;
      }


      if(
        event.target.closest(
          '[data-set-present]'
        )
      ){

        openPresentDate();

        return;
      }


      if(
        event.target.closest(
          '[data-edit-rose-schedule]'
        )
      ){

        openRoseSchedule();

        return;
      }


      if(
        event.target.closest(
          '[data-advance-rose]'
        )
      ){

        openAdvanceRose();

        return;
      }


      const rose =
        event.target.closest(
          '[data-select-rose-hour]'
        );


      if(rose){

        selectedRoseHour =
          Number(
            rose.dataset
              .selectRoseHour
          );


        render();

        return;
      }


      if(
        event.target.closest(
          '[data-add-timeline-event]'
        )
      ){

        openEventEditor();

        return;
      }


      const edit =
        event.target.closest(
          '[data-edit-timeline-event]'
        );


      if(edit){

        openEventEditor(
          edit.dataset
            .editTimelineEvent
        );

        return;
      }


      const intelligence =
        event.target.closest(
          '[data-open-intelligence]'
        );


      if(intelligence){

        openNpcIntelligence(
          intelligence.dataset
            .openIntelligence
        );

      }

    }
  );


  document.addEventListener(
    'change',
    event=>{

      if(
        event.target.matches(
          '[data-filter-status]'
        )
      ){

        filters.status =
          event.target.value;

        render();

      }


      if(
        event.target.matches(
          '[data-filter-category]'
        )
      ){

        filters.category =
          event.target.value;

        render();

      }


      if(
        event.target.matches(
          '[data-filter-npc]'
        )
      ){

        filters.npc =
          event.target.value;

        render();

      }


      if(
        event.target.matches(
          '[data-filter-rose]'
        )
      ){

        filters.rose =
          event.target.value;

        render();

      }

if(
  event.target.matches(
    '[data-filter-start-date]'
  )
){

  filters.startDate =
    event.target.value;

  render();

}


if(
  event.target.matches(
    '[data-filter-end-date]'
  )
){

  filters.endDate =
    event.target.value;

  render();

}

    }
  );


  /* =====================================================
     START
     ===================================================== */

  document.addEventListener(
    'DOMContentLoaded',
    refresh
  );


  /* =====================================================
     PUBLIC API

     Personnel can open the same Intelligence screen.
     ===================================================== */

  window.epcotDmTimeline = {

    refresh,

    openNpcIntelligence,

    getCurrentRoseHour(){

      return currentRoseHour;

    }

  };

})();
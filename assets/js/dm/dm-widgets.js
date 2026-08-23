/* =====================================================
   EPCOT DND
   DM WIDGET PLATFORM
   ===================================================== */

(function(){

  const widgets = [];

  let mounted = false;

  let modal = null;


  /* =====================================================
     HELPERS
     ===================================================== */

  function escapeHtml(value){

    return String(
      value ?? ''
    )
      .replaceAll('&','&amp;')
      .replaceAll('<','&lt;')
      .replaceAll('>','&gt;')
      .replaceAll('"','&quot;')
      .replaceAll("'",'&#039;');

  }


  function randomInt(min,max){

    return Math.floor(
      Math.random() *
      (
        max -
        min +
        1
      )
    ) + min;

  }


  function roll(count,sides){

    const results = [];

    let total = 0;


    for(
      let i = 0;
      i < count;
      i += 1
    ){

      const value =
        randomInt(
          1,
          sides
        );


      results.push(
        value
      );


      total +=
        value;

    }


    return {
      total,
      results
    };

  }


  function pick(list){

    return list[
      randomInt(
        0,
        list.length - 1
      )
    ];

  }


  async function copyText(text){

    if(!text){
      return;
    }


    try{

      await navigator.clipboard.writeText(
        text
      );

    } catch(error){

      console.warn(
        'Clipboard unavailable.',
        error
      );

    }

  }


  /* =====================================================
     SHARED RESULT MODAL
     ===================================================== */

  function ensureModal(){

    if(modal){
      return modal;
    }


    document.body.insertAdjacentHTML(
      'beforeend',
      `
        <div
          class="dm-widget-modal"
          id="dmWidgetModal"
          hidden
        >

          <div
            class="dm-widget-modal-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="dmWidgetModalTitle"
          >

            <button
              class="dm-widget-modal-close"
              type="button"
              data-widget-modal-close
              aria-label="Close"
            >
              ×
            </button>

            <div
              class="dm-widget-modal-kicker"
              data-widget-modal-kicker
            ></div>

            <h2
              class="dm-widget-modal-title"
              id="dmWidgetModalTitle"
              data-widget-modal-title
            ></h2>

            <div
              class="dm-widget-modal-body"
              data-widget-modal-body
            ></div>

            <div
              class="dm-widget-modal-actions"
              data-widget-modal-actions
            ></div>

          </div>

        </div>
      `
    );


    modal =
      document.getElementById(
        'dmWidgetModal'
      );


    modal.addEventListener(
      'click',
      event=>{

        if(
          event.target === modal ||
          event.target.closest(
            '[data-widget-modal-close]'
          )
        ){

          closeModal();

        }

      }
    );


    document.addEventListener(
      'keydown',
      event=>{

        if(
          event.key ===
          'Escape'
        ){

          closeModal();

        }

      }
    );


    return modal;

  }


  function closeModal(){

    if(!modal){
      return;
    }


    modal.hidden =
      true;

  }


  function showModal({
    kicker = 'RESULT',
    title = 'Result',
    body = '',
    actions = []
  } = {}){

    const element =
      ensureModal();


    element.querySelector(
      '[data-widget-modal-kicker]'
    ).textContent =
      kicker;


    element.querySelector(
      '[data-widget-modal-title]'
    ).textContent =
      title;


    element.querySelector(
      '[data-widget-modal-body]'
    ).innerHTML =
      body;


    const actionArea =
      element.querySelector(
        '[data-widget-modal-actions]'
      );


    actionArea.innerHTML =
      '';


    actions.forEach(
      action=>{

        const button =
          document.createElement(
            'button'
          );


        button.type =
          'button';


        button.textContent =
          action.label;


        if(
          action.secondary
        ){

          button.classList.add(
            'secondary'
          );

        }


        button.addEventListener(
          'click',
          ()=>{

            action.onClick?.(
              element
            );

          }
        );


        actionArea.appendChild(
          button
        );

      }
    );


    element.hidden =
      false;


    return element;

  }


  function copyAction(
    label,
    text
  ){

    return {

      label:
        label ||
        'Copy Result',

      async onClick(
        modalElement
      ){

        await copyText(
          text
        );


        const button =
          Array.from(
            modalElement.querySelectorAll(
              '.dm-widget-modal-actions button'
            )
          )
            .find(
              item =>
                item.textContent ===
                label
            );


        if(button){

          button.textContent =
            'Copied';


          setTimeout(
            ()=>{

              button.textContent =
                label;

            },
            900
          );

        }

      }

    };

  }


/* =====================================================
   WIDGET ORGANIZATION
   ===================================================== */

const WIDGET_GROUPS = [

  {
    id:'downtime',
    title:'Downtime & Rewards',
    subtitle:'Training, crafting, gathering, rewards, and campaign downtime.'
  },

  {
    id:'generators',
    title:'Generators & Inspiration',
    subtitle:'Quick inspiration, random results, and reserve personnel.'
  },

  {
    id:'combat',
    title:'Combat Tools',
    subtitle:'Encounter, damage, chase, and combat resolution tools.'
  },

  {
    id:'reference',
    title:'Reference',
    subtitle:'Rules, system calculations, and quick-reference material.'
  }

];


/*
  Existing widgets are organized here so we do not
  have to edit all sixteen registrations.

  Future widgets may simply include:

      group:'combat'

  in their W.register({...}) object.
*/

const WIDGET_GROUP_BY_ID = {

  /* =====================================================
     DOWNTIME & REWARDS
     ===================================================== */

  'downtime-training':
    'downtime',

  'downtime-gathering':
    'downtime',

  'downtime-crafting':
    'downtime',

  'downtime-social':
    'downtime',

  'downtime-potion-brewing':
    'downtime',

  'loot-generator':
    'downtime',


  /* =====================================================
     GENERATORS & INSPIRATION
     ===================================================== */

  'sensory-generator':
    'generators',

  'product-solution-generator':
    'generators',

  'reserve-personnel':
    'generators',


  /* =====================================================
     COMBAT TOOLS
     ===================================================== */

  'encounter-calculator':
    'combat',

  'fallen-revived-consequences':
    'combat',

  'spell-damage-calculator':
    'combat',

  'trap-damage-calculator':
    'combat',

  'chase-obstacle-generator':
    'combat',


  /* Future combat widgets */

  'crit-results':
    'combat',

  'mob-roll-generator':
    'combat',


  /* =====================================================
     REFERENCE
     ===================================================== */

  'nsbi-dc-calculator':
    'reference',

  'common-rules':
    'reference'

};


/* =====================================================
   GROUP HELPERS
   ===================================================== */

function widgetGroupId(
  widget
){

  return (
    widget.group ||
    WIDGET_GROUP_BY_ID[
      widget.id
    ] ||
    'reference'
  );

}


function widgetsForGroup(
  groupId
){

  return widgets.filter(
    widget =>
      widgetGroupId(
        widget
      ) ===
      groupId
  );

}


function widgetGroupStorageKey(
  groupId
){

  return (
    'epcot-dm-widget-group-' +
    groupId
  );

}


function widgetGroupIsOpen(
  groupId
){

  const saved =
    localStorage.getItem(
      widgetGroupStorageKey(
        groupId
      )
    );


  /*
    Everything begins open until
    the DM deliberately collapses it.
  */

  return saved !==
    'closed';

}


/* =====================================================
   RENDER WIDGET
   ===================================================== */

function renderWidget(
  widget
){

  return `
    <article
      class="dm-widget-card"
      data-widget-card="${escapeHtml(
        widget.id
      )}"
    >

      <header class="dm-widget-header">

        <div class="dm-widget-number">
          ${escapeHtml(
            widget.code
          )}
        </div>

        <div class="dm-widget-heading-copy">

          <strong>
            ${escapeHtml(
              widget.title
            )}
          </strong>

          <small>
            ${escapeHtml(
              widget.subtitle
            )}
          </small>

        </div>

      </header>


      <div class="dm-widget-body">
        ${widget.render()}
      </div>

    </article>
  `;

}


/* =====================================================
   RENDER GROUP
   ===================================================== */

function renderWidgetGroup(
  group
){

  const groupWidgets =
    widgetsForGroup(
      group.id
    );


  if(
    !groupWidgets.length
  ){
    return '';
  }


  const isOpen =
    widgetGroupIsOpen(
      group.id
    );


  return `

    <section
      class="
        dm-widget-group
        ${
          isOpen
            ? 'is-open'
            : 'is-closed'
        }
      "
      data-widget-group="${escapeHtml(
        group.id
      )}"
    >

      <button
        class="dm-widget-group-header"
        type="button"
        data-widget-group-toggle="${escapeHtml(
          group.id
        )}"
        aria-expanded="${
          isOpen
            ? 'true'
            : 'false'
        }"
      >

        <div class="dm-widget-group-heading">

          <span
            class="dm-widget-group-arrow"
            aria-hidden="true"
          >
            ▾
          </span>

          <div>

            <strong>
              ${escapeHtml(
                group.title
              )}
            </strong>

            <small>
              ${escapeHtml(
                group.subtitle
              )}
            </small>

          </div>

        </div>


        <span class="dm-widget-group-count">

          ${String(
            groupWidgets.length
          ).padStart(
            2,
            '0'
          )}

          ${
            groupWidgets.length ===
            1
              ? 'WIDGET'
              : 'WIDGETS'
          }

        </span>

      </button>


      <div
        class="dm-widget-group-body"
        ${
          isOpen
            ? ''
            : 'hidden'
        }
      >

        <div class="dm-widget-group-grid">

          ${groupWidgets
            .map(
              renderWidget
            )
            .join('')
          }

        </div>

      </div>

    </section>

  `;

}


/* =====================================================
   INITIALIZE WIDGET
   ===================================================== */

function initializeWidget(
  widget,
  card
){

  widget.init?.(
    card,
    api
  );

}


/* =====================================================
   COUNT
   ===================================================== */

function updateCount(){

  const count =
    document.getElementById(
      'dmWidgetCount'
    );


  if(count){

    count.textContent =
      String(
        widgets.length
      ).padStart(
        2,
        '0'
      );

  }

}


/* =====================================================
   GROUP TOGGLES
   ===================================================== */

function connectWidgetGroupToggles(
  grid
){

  grid
    .querySelectorAll(
      '[data-widget-group-toggle]'
    )
    .forEach(
      button => {

        button.addEventListener(
          'click',
          ()=>{

            const groupId =
              button.dataset
                .widgetGroupToggle;


            const section =
              grid.querySelector(
                `[data-widget-group="${CSS.escape(
                  groupId
                )}"]`
              );


            if(!section){
              return;
            }


            const body =
              section.querySelector(
                '.dm-widget-group-body'
              );


            const opening =
              section.classList
                .contains(
                  'is-closed'
                );


            section.classList.toggle(
              'is-open',
              opening
            );


            section.classList.toggle(
              'is-closed',
              !opening
            );


            if(body){

              body.hidden =
                !opening;

            }


            button.setAttribute(
              'aria-expanded',
              opening
                ? 'true'
                : 'false'
            );


            localStorage.setItem(
              widgetGroupStorageKey(
                groupId
              ),
              opening
                ? 'open'
                : 'closed'
            );

          }
        );

      }
    );

}


/* =====================================================
   RENDER ALL GROUPS
   ===================================================== */

function renderAllWidgets(){

  const grid =
    document.getElementById(
      'dmWidgetGrid'
    );


  if(!grid){
    return;
  }


  grid.innerHTML =
    WIDGET_GROUPS
      .map(
        renderWidgetGroup
      )
      .join('');


  widgets.forEach(
    widget => {

      const card =
        grid.querySelector(
          `[data-widget-card="${CSS.escape(
            widget.id
          )}"]`
        );


      if(card){

        initializeWidget(
          widget,
          card
        );

      }

    }
  );


  connectWidgetGroupToggles(
    grid
  );


  updateCount();

}


/* =====================================================
   MOUNT
   ===================================================== */

function mount(){

  if(mounted){
    return;
  }


  const grid =
    document.getElementById(
      'dmWidgetGrid'
    );


  if(!grid){
    return;
  }


  mounted =
    true;


  renderAllWidgets();

}


/* =====================================================
   REGISTER
   ===================================================== */

function register(
  widget
){

  if(
    !widget?.id ||
    widgets.some(
      item =>
        item.id ===
        widget.id
    )
  ){
    return;
  }


  widgets.push(
    widget
  );


  /*
    Re-rendering here means a newly registered
    widget automatically lands in its group,
    even if registration occurs after mount.
  */

  if(mounted){

    renderAllWidgets();

  }

}

  function listWidgets(){

    return widgets.map(
      widget => ({
        id:widget.id,
        code:widget.code,
        title:widget.title,
        subtitle:widget.subtitle,
        group:widgetGroupId(widget)
      })
    );

  }


  function mountWidget(
    widgetId,
    container
  ){

    const widget =
      widgets.find(
        item => item.id === widgetId
      );


    if(
      !widget ||
      !container
    ){
      return false;
    }


    container.innerHTML =
      renderWidget(widget);


    const card =
      container.querySelector(
        `[data-widget-card="${CSS.escape(widget.id)}"]`
      );


    if(card){
      initializeWidget(
        widget,
        card
      );
    }


    return true;

  }


  const api = {

    register,
    listWidgets,
    mountWidget,
    escapeHtml,
    randomInt,
    roll,
    pick,
    copyText,
    showModal,
    closeModal,
    copyAction

  };


  window.epcotDmWidgets =
    api;


  if(
    document.readyState ===
    'loading'
  ){

    document.addEventListener(
      'DOMContentLoaded',
      mount,
      {
        once:true
      }
    );

  } else {

    mount();

  }

})();



/* =====================================================
   EPCOT DND
   DM WIDGET LIBRARY

   FUTURE WIDGETS ARE APPENDED BELOW.
   ===================================================== */

(function(){

  const W =
    window.epcotDmWidgets;


  if(!W){
    return;
  }


  /* =====================================================
     TRAINING DATA
     ===================================================== */

  const TRAINING_TIERS = {

    1:{
      label:
        'Learn a Skill or Tool',

      tickets:
        5,

      dc:
        15,

      success:
        'Gain one successful step toward proficiency. Complete this track successfully three consecutive times to gain proficiency.',

      critical:
        'Gain two successful training benefits. This may apply to two skills or tool proficiencies.'
    },

    2:{
      label:
        'Improve an Ability Score',

      tickets:
        15,

      dc:
        18,

      success:
        'Increase one trained ability score by +1, to a maximum of 20.',

      critical:
        'Increase trained ability scores by a total of +2, still respecting the maximum score of 20.'
    },

    3:{
      label:
        'Expertise',

      tickets:
        30,

      dc:
        20,

      success:
        'Gain Expertise in one eligible trained skill, or unlock one Origin feature.',

      critical:
        'Gain two Expertise or Origin-feature benefits.'
    },

    4:{
      label:
        'Imagineer’s Blessing',

      tickets:
        40,

      dc:
        25,

      success:
        'Unlock one General feature.',

      critical:
        'Unlock two General features.'
    },

    5:{
      label:
        'Board Recognition',

      tickets:
        50,

      dc:
        30,

      success:
        'Unlock one Epic Boon feature.',

      critical:
        'Unlock one Epic Boon feature and one General feature.'
    }

  };


  const TRAINING_COMPLICATIONS = [

    'Ride Malfunction: The attraction halts mid-loop. Lose 1 Ticket as you assist in emergency evacuation.',

    'Power Surge: The simulator overloads, flooding you with sensory input. Gain 1 level of Exhaustion but also gain Inspiration.',

    'Emotional Overload: The music swells, holograms cry, and you burst into tears. No progress, but your next Downtime roll has Advantage.',

    'Data Corruption: Your metrics reset. Lose all cumulative training bonuses this session.',

    'Guest Complaint: A guest NPC blames you for their nausea. HR requests an incident report.',

    'AI Malfunction: The animatronic mentor repeats nonsense slogans. Gain 2d10 common ingredients.',

    'Unexpected Rival: Another trainee beats your score and mocks you publicly. Disadvantage on your next Ride roll.',

    'Safety Protocol Override: Make a DC 13 Constitution save or take 1d6 damage from whiplash.',

    'Prophetic Glitch: The Ride flashes a glimpse of your future. The DM provides a mysterious vision.',

    'Marketing Survey: You are pulled aside for a guest-feedback interview. No gain.',

    'Over-Simulation: The DC for your next Ride increases by +2.',

    'Emotional Support Bot: An overly helpful automaton follows you for the next session.',

    'Inspirational Speech Malfunction: A holographic mentor delivers an eerie, incorrect inspirational slogan.',

    'Training Loop: Repeat the same challenge. If the repeated challenge succeeds, double the reward.',

    'Heroic Flashback: Gain +1 on Wisdom checks until your next rest.',

    'Corporate Audit: An executive observes your session. Disadvantage on your next Ride roll.',

    'Ride Spirit: A spectral Imagineer appears. You may reroll the simulation, but another failure causes another complication roll.',

    'Inspiration Overload: Gain a +1 morale bonus on your next Ride.',

    'System Error: The attraction flickers into another plane. The DM determines a magical surge.',

    'EUREKA MOMENT: The glitch perfects your training. The training automatically succeeds and you gain a permanent +1 morale bonus to future Rides.'

  ];


  /* =====================================================
     CRAFTING DATA
     ===================================================== */

  const CRAFT_TOOLS = {

    Armor:
      'Leatherworker’s Tools, Smith’s Tools, or Weaver’s Tools depending on the armor.',

    Potion:
      'Alchemist’s Supplies or Herbalism Kit.',

    Ring:
      'Jeweler’s Tools.',

    Rod:
      'Woodcarver’s Tools.',

    Scroll:
      'Calligrapher’s Supplies.',

    Staff:
      'Woodcarver’s Tools.',

    Wand:
      'Woodcarver’s Tools.',

    Weapon:
      'Leatherworker’s Tools, Smith’s Tools, or Woodcarver’s Tools depending on the weapon.',

    'Wondrous Item':
      'Tinker’s Tools or the tool required to make the nonmagical base item.'

  };


  const CRAFT_COSTS = {

    Common:{
      multiplier:
        5,
      tickets:
        2
    },

    Uncommon:{
      multiplier:
        50,
      tickets:
        5
    },

    Rare:{
      multiplier:
        500,
      tickets:
        25
    },

    'Very Rare':{
      multiplier:
        5000,
      tickets:
        50
    },

    Legendary:{
      multiplier:
        15000,
      tickets:
        100
    }

  };


  const CRAFT_BOONS = [

    'Boon of Gold: The crafted item is worth twice the normal gold value.',

    'Boon of Excess: You create two copies of the crafted item.',

    'Boon of Disney Magic: The item is enchanted with a level 1 or 2 spell that resets every day at dawn.',

    'Boon of Talent: The creation exceeds expectations. Select an item from the tier above at the same cost.'

  ];


  const CRAFT_COMPLICATIONS = [

    'Sparks Fly: A prototype explodes, dealing 1d6 fire damage and singeing your notes.',

    'Budget Cuts: Lose 1 Ticket worth of progress.',

    'Stolen Concept: A rival Imagineer claims credit for your idea. Gain a temporary Nemesis.',

    'Regulatory Violation: A compliance officer shuts you down until you succeed on a DC 14 Persuasion check.',

    'Material Shortage: Your next crafted item has a cosmetic flaw.',

    'Haunted Prototype: The object develops eerie sentience and whispers improvement suggestions at night.',

    'Unscheduled Safety Drill: The Ticket cost of your next crafted item doubles.',

    'Inspiration Burnout: Gain 1 level of Exhaustion.',

    'Corporate Sabotage: Select an item from the tier below instead.',

    'Runaway Success: Marketing claims the design. Gain only half of its profit.',

    'Patent War: Skip one Ticket worth of progress.',

    'Time Loop Prototype: Lose 1 Ticket but gain 1 Heroic Inspiration.',

    'Gremlin Sabotage: A tiny construct chews through the wiring. Make a DC 15 Dexterity save or trigger a minor explosion.',

    'Sudden Innovation: Your next project requires half as many Tickets as normal.',

    'Artistic Block: Make a DC 13 Wisdom save or scrap the project without recovering the cost.',

    'Overtime Crunch: Finish the project but gain 1 level of Exhaustion.',

    'Unexpected Ally: Reduce the current project cost by half, but owe a minor favor.',

    'The Muse Appears: Gain immediate success and permanently reduce future Backstage Ticket costs by 1.',

    'Board Review: The product sells for its expected price divided by 1d4.',

    'Technological Breakthrough: Select a new item to craft from the tier above.'

  ];


  /* =====================================================
     SOCIAL DATA
     ===================================================== */

  const SOCIAL_COMPLICATIONS = [

    'Mic Feedback: Lose 1 Relationship Point with an NPC.',

    'Heckler in the Front Row: Disadvantage on your next Performance or Persuasion check.',

    'Celebrity Guest: Lose 1d4 Relationship Points with an NPC.',

    'Romantic Misunderstanding: A fan falls in love, or pretends to. Social chaos follows.',

    'Wardrobe Malfunction: Gain 1 Relationship Point with one NPC and lose 1 with another.',

    'Corporate Jingle Overload: Disadvantage on Intelligence or Mindwave checks until your next rest.',

    'Overzealous Sponsor: Gain 1d6 gp but lose 2 Relationship Points with an NPC.',

    'Scandalous Gossip: Lose the ability to contact an NPC until the rumor is cleared.',

    'Artistic Rival: Make an opposed Charisma skill check. Gain 1d8 Relationship Points on success or lose 1d8 on failure.',

    'Stage Fright: Make a DC 13 Charisma save or forfeit your next social reward.',

    'Emotional Triumph: Reroll until successful, double the reward, and gain 1 level of Exhaustion.',

    'Unsanctioned Remix: Owe 250 gp to clear the legal fine.',

    'Prop Malfunction: An animatronic erupts in confetti, causing minor damage and major laughter.',

    'Backstage Betrayal: Lose 1 Relationship Point with 1d6 NPCs.',

    'Unexpected Standing Ovation: Gain 1 Relationship Point with 1d6 NPCs.',

    'Flash Mob Glitch: Dozens of holograms unexpectedly join the performance.',

    'Charitable Sponsor: Gain 25 gp.',

    'Rumor Mill: Gain one useful piece of gossip chosen by the DM.',

    'Showstopper Moment: Gain Inspiration and your next Downtime check automatically succeeds.',

    'Corporate Legend: Permanently increase your Charisma ability score by +1.'

  ];


  /* =====================================================
     GATHERING DATA
     ===================================================== */

  const GATHERING_COMPLICATIONS = [

    'Sudden Storm: Lose 1 Ticket and gather no materials.',

    'Wildlife Encounter: Roll initiative against a CR-appropriate creature.',

    'Poisonous Flora: Make a DC 12 Constitution save or take 1d6 poison damage.',

    'Broken Equipment: Replace 10 gp worth of gear.',

    'Bandit Ambush: Lose 1d10 gp unless you win a quick contested check.',

    'Hostile Fey: Lose 1 additional Ticket.',

    'Haunted Ruins: Bring back something carrying a minor haunting effect.',

    'Illusionary Terrain: Waste time exploring holographic terrain. No progress.',

    'Corporate Rangers: Pay a 5 gp fine or convince security to let you go.',

    'Mechanical Wildlife: Gain salvage worth 10 gp after an animatronic attacks.',

    'Lost Time: Gain 1 rare ingredient.',

    'Mythic Echo: Your next roll has Advantage.',

    'Artifact Fragment: Craft one uncommon magic item.',

    'Mirage Mirage: Gain +1 Wisdom for the next day.',

    'Tourist Caravan: Gain 1 Relationship Point with 1d4 NPCs.',

    'Shortcut Discovered: Halve the DC of your next gathering attempt.',

    'Phantom Guide: Gain Inspiration and succeed on your gathering check.',

    'Temporal Loop: Repeat the roll with a +2 bonus.',

    'Unseen Observer: A corporate drone records you. Flip a coin to determine whether the footage helps or embarrasses you later.',

    'Golden Discovery: Gain a rare resource and double the attempted reward.'

  ];


  /* =====================================================
     INGREDIENT DATA

     [Name, Combat, Utility, Whimsy]
     ===================================================== */

  const INGREDIENTS = {

    common:[

      ['Amber',9,5,4],
      ['Apper Carrot',0,3,1],
      ['Bamboo',3,3,3],
      ['Bashu Powder',2,0,0],
      ['Blue Back Salmon',3,4,7],
      ['Boom Beri',7,6,1],
      ['Bora Bug',4,8,3],
      ['Brush Reed',1,10,6],
      ['Bundle of Driko Twigs',1,1,2],
      ['Camp Mite',6,4,8],
      ['Chicken Egg',1,1,2],
      ['Dreamlight Blend Tea',2,7,5],
      ['Clay Snake Tail',8,6,5],
      ['Cloud Horn',1,0,0],
      ['Creeping Bolete',3,10,6],
      ['Dorrin Plate',7,8,4],
      ['Dried Fruit',2,1,4],
      ['Earwax',0,0,0],
      ['Fish Folk Tooth',9,4,3],
      ['Fish Head',4,5,4],
      ['Flash Paper',6,9,1],
      ['Green Slime',8,6,7],
      ['Gohaku Rice',3,2,3],
      ['Hakuma Sapwood',5,1,9],
      ['Hill Dragon Egg',9,3,8],
      ['Howler Fur',10,5,4],
      ['Itchi Beri',0,1,0],
      ['Jumping Bonfire',6,4,10],
      ['Jack-O’-Lantern Bits',2,1,3],
      ['Kloth Leech',1,1,1],
      ['Knobble Leaf Seaweed',1,1,1],
      ['Kojo Root',6,3,2],
      ['Lovers Vine',0,0,2],
      ['Mandrake Root',8,5,2],
      ['Mellowort',4,8,7],
      ['Monkey’s Coil',2,0,1],
      ['Mountain Ox Dung',10,3,8],
      ['Mouse Tree Nut',4,6,5],
      ['Narutomaki',0,0,0],
      ['Nobblewort',3,1,2],
      ['Oporion Glass',1,10,0],
      ['Origami Crane',6,0,10],
      ['Pink Candle Wax',2,2,0],
      ['Peeping Willow',0,0,1],
      ['Poison',9,8,0],
      ['Pungent Sea Foam',5,7,5],
      ['Pyramid Melon',2,2,2],
      ['Queen’s Dilemma',7,5,3],
      ['Raka Paste',4,10,0],
      ['Rattle Shoot',10,8,7],
      ['Ribbon Rot',5,3,9],
      ['Rust Crab',8,4,2],
      ['Scalefruit Rind',4,2,2],
      ['Seashell',0,0,1],
      ['Sea Water',1,0,0],
      ['Sheep Dragon Wool',10,8,7],
      ['Snap Vine Sap',0,2,0],
      ['Spindle Leg Spider Webs',5,9,6],
      ['Spirit Root',6,0,9],
      ['Squid Ink',4,9,7],
      ['Tangle Weed',8,8,4],
      ['Ube',2,6,5],
      ['Varrow',0,1,0],
      ['Venus Fly Rat',9,2,8],
      ['Windbloom',6,7,0],
      ['Witch’s Broom',3,0,5],
      ['Witch’s Eye Coral',1,0,10],
      ['Yugi Sap',0,4,2],
      ['Yuma Shrub',5,8,4],
      ['Dreamlight Petal',3,5,9],
      ['Heartline Nectar',5,9,4],
      ['Mindwave Crystal',8,10,2],
      ['Bravura Dust',6,5,7],
      ['Craftspark Filament',4,9,6],
      ['Starpath Sand',2,6,8],
      ['Eureka Pearl',9,8,9],
      ['Showlight Moss',4,7,6],
      ['Chromatic Dust',7,6,5],
      ['Echo Feather',5,4,9],
      ['Arcwhale Oil',8,9,3],
      ['Pixie Glass',3,10,8],
      ['Harmony Thread',2,9,7],
      ['Wish Candle Wax',3,6,8],
      ['Memory Dew',4,8,9],
      ['Echo Nut',7,5,5],
      ['Holo Vine',6,9,3],
      ['Neon Lotus',8,5,9],
      ['Kinetic Clay',9,9,6],
      ['Imaginite pebble',10,10,10],
      ['Marquee Bloom',4,5,8],
      ['Whistle Fern',2,7,4],
      ['Ticker Tape Lichen',3,8,6],
      ['Polychrome Gel',7,10,7],
      ['Cometfruit',8,6,9],
      ['Radiant Coal',9,7,5],
      ['Spectra Honey',5,9,8],
      ['Dreamvine',3,6,10],
      ['Spirit Ribbon',2,8,9],
      ['Fable Water',4,7,10],
      ['Halcyon Feather',8,9,9]

    ],


    uncommon:[

      ['Black Pearl',13,14,15],
      ['Black Cinnamon',16,12,11],
      ['Bottle Cap (Supa-Fizz!)',11,13,16],
      ['Crackling Jasper',17,15,12],
      ['Corrupted Seawater',17,11,14],
      ['Backlot Ramen Broth',12,14,17],
      ['Dawn Petal',11,13,17],
      ['Dragon Root',14,15,16],
      ['Essence of Glumbug',11,11,17],
      ['Feather Rock',13,17,15],
      ['Fizzing Green',12,14,12],
      ['Forge Slag',15,14,11],
      ['Spectra Glow Worms',12,15,14],
      ['Happy Joy Cake',12,13,12],
      ['Kojobi Fruit',14,14,14],
      ['Laughing Moss',11,16,16],
      ['Living Spud',14,12,17],
      ['Lions Blume',17,13,16],
      ['Molted Lizard Skin',15,12,12],
      ['Mountain Snail',14,15,12],
      ['Mournshade',13,14,13],
      ['Munchanka Root',17,11,11],
      ['Nakudama Spice',12,15,14],
      ['Night Thistle',14,17,16],
      ['Noodle Eel',13,12,16],
      ['Sanctuary Spring Water',11,16,14],
      ['Pok Pok Flakes',13,14,13],
      ['Petrified Alligator',15,16,13],
      ['Shadowroot',15,13,12],
      ['Scumweed',11,12,11],
      ['Sleeping Merchant',13,13,13],
      ['Spark Plug',11,17,11],
      ['Spirit Tea',11,11,17],
      ['Spring',14,17,15],
      ['Sun Shroom',13,16,14],
      ['Vinyl Record',15,15,15],
      ['Wolfenite',11,17,11],
      ['Wychwood',14,13,15],
      ['Yellow Slime',17,11,11]

    ],


    rare:[

      ['Blossom of Spirit Vine',18,18,19],
      ['Bottled Lightning',20,20,18],
      ['Bubble Gum',18,19,20],
      ['Coal from the Wandering Line',19,19,20],
      ['Crimson Octopus Ink',19,18,19],
      ['Dragon Fang',20,18,19],
      ['Fairy Willow',18,18,20],
      ['Giant Koi Fish Scale',18,20,18],
      ['Golden Root',18,18,18],
      ['Hand of Eryo',18,18,19],
      ['Jade Chrysalis',19,20,18],
      ['Lionfish Poison',20,0,0],
      ['Frozen Dragon’s Breath',0,0,20],
      ['Orange Slime',20,20,20],
      ['Oracle Lantern Oil',0,20,0],
      ['Ostrich Dragon Feather',18,18,19],
      ['Mickey Mouse Figurine',0,19,18],
      ['Sage’s Beetle',18,20,0],
      ['Starstone',18,0,19],
      ['Tears of the Moon',18,18,18]

    ]

  };


  /* =====================================================
     POTION TABLES

     Highest ingredient attribute determines the table.
     ===================================================== */

  const POTIONS = {

  Combat:[

    {
      name:'Rabbit’s Speed',
      effect:'For the next 10 minutes, your walking speed increases by 5 feet.'
    },

    {
      name:'Weapon Master’s Elixir',
      effect:'For the next 24 hours, gain proficiency with one melee weapon of your choice.'
    },

    {
      name:'Spirit of Salyri',
      effect:'For the next 24 hours, gain proficiency with one type of armor of your choice.'
    },

    {
      name:'Beast Hide',
      effect:'For 1 minute, you have resistance to cold damage.'
    },

    {
      name:'Spirit Armor',
      effect:'Pour this potion on a creature that is not wearing armor. For 1 hour, that creature has AC 15 while it remains unarmored.'
    },

    {
      name:'Displacement Field',
      effect:'Until the start of your next turn, all attacks against you are made with disadvantage.'
    },

    {
      name:'Shepherd’s Bane',
      effect:'For 1 hour, you grow claws. Your unarmed strikes with them deal 1d6 + Strength modifier slashing damage.'
    },

    {
      name:'Bottled Bomb',
      effect:'Throw within 60 feet. Creatures within 5 feet make a DC 14 Dexterity save, taking 1d8 force damage on a failure or half on a success.'
    },

    {
      name:'Wonder Juice',
      effect:'For 1 minute, everything you wear or carry counts as magical for overcoming resistance or immunity to nonmagical attacks and damage.'
    },

    {
      name:'Candlecap',
      effect:'For 1 hour, flaming hair sheds bright light 20 feet and dim light another 20 feet. Once per turn, a headbutt can deal +1d4 fire damage. As an action, end the effect to deal 2d4 fire damage to all other creatures within 5 feet.'
    },

    {
      name:'Eagle’s Vision',
      effect:'For 1 minute, attacking at long range does not impose disadvantage on your ranged weapon attacks.'
    },

    {
      name:'Paranoia',
      effect:'For the next 8 hours, you cannot be surprised.'
    },

    {
      name:'Bottled Torch',
      effect:'When uncorked, the potion creates a fiery blade for 1 minute. It can be used as an improvised melee weapon dealing 2d4 fire damage on a hit.'
    },

    {
      name:'Static Shock',
      effect:'For 24 hours, after a creature touches you or hits you with a melee attack using a metal weapon, you may use your reaction to deal 1d10 lightning damage to it. The effect then ends.'
    },

    {
      name:'Incoming!',
      effect:'For 1 minute, gain +2 AC against ranged attacks.'
    },

    {
      name:'Lightning Breath',
      effect:'For 24 hours, you may once use a bonus action to target a creature within 30 feet. It makes a DC 12 Dexterity save, taking 1d10 lightning damage on a failure or half on a success. The potion then ends.'
    },

    {
      name:'Heroism',
      effect:'Gain advantage on the next attack roll you make within 24 hours.'
    },

    {
      name:'Slugskin',
      effect:'For 1 minute, gain resistance to piercing damage and you may leave a slime trail as part of your movement.'
    },

    {
      name:'Thunderbelch',
      effect:'Roll 1d4 when consumed. After that many rounds, you must use your action to belch. Other creatures within 10 feet make a DC 14 Constitution save, taking 3d8 thunder damage and becoming deafened until the end of your next turn on a failure, or half damage without deafness on a success.'
    },

    {
      name:'Seeking Smoke',
      effect:'Throw at a creature within 30 feet. It must succeed on a DC 12 Dexterity save or be coated in smoke for 1 minute, imposing disadvantage on Dexterity (Stealth) checks made to hide.'
    },

    {
      name:'Dancing Juice',
      effect:'Coat a melee weapon. Within the next hour, when it hits a creature you may force a DC 12 Constitution save. On a failure, the target’s speed becomes 0 until the end of its next turn and the coating ends.'
    },

    {
      name:'Prickleskin',
      effect:'For 1 minute, spines cover your body. When you successfully grapple a creature, you may use a bonus action while maintaining the grapple to deal 1d4 piercing damage.'
    },

    {
      name:'Tiny Bubbles',
      effect:'Creates a 20-foot cube of bubbles within 30 feet for 1 hour. The first time a creature enters the bubbles on a turn, it must make a DC 13 Dexterity save. On a failure, the bubbles burst and deal 1d6 thunder damage to all creatures inside.'
    },

    {
      name:'Claws of the Crab King',
      effect:'For 1 minute, your hands become crab claws. Unarmed strikes using them deal double damage to objects and structures, and grapple checks are made with advantage. The claws cannot perform tasks requiring manual precision.'
    },

    {
      name:'Rubberskin',
      effect:'For 1 hour, gain resistance to lightning damage.'
    },

    {
      name:'Keening Voice',
      effect:'For 1 hour, as a bonus action make a ranged attack against a creature within 60 feet using your Charisma (Performance) bonus. On a hit, deal 1d6 thunder damage.'
    },

    {
      name:'Kinetic Pop',
      effect:'Pour over a nonmagical weapon. The next time it hits within 1 hour, double the damage rolled by the weapon’s damage dice.'
    },

    {
      name:'Healing Gas',
      effect:'Throw at a point within 60 feet. Each creature within 5 feet regains 1d4 + 1 hit points.'
    },

    {
      name:'Cinderskin',
      effect:'For 1 hour, gain resistance to fire damage.'
    },

    {
      name:'Iron Mind',
      effect:'For 1 hour, gain advantage on saving throws against being charmed and resistance to psychic damage.'
    },

    {
      name:'Gargoyle Hooch',
      effect:'For 1 hour, gain +2 AC and reduce your walking speed by 5 feet.'
    },

    {
      name:'Elixir of Jipampa',
      effect:'For 24 hours, gain +5 to initiative. Once during the duration, when a trigger would allow a reaction after you have already used yours that round, you may take a second reaction and end the potion.'
    },

    {
      name:'Catspeed',
      effect:'Once within the next 24 hours, when you take the Attack action you may make two additional attacks as part of that action. The potion then ends. You can also purr like a cat while it remains active.'
    },

    {
      name:'Durability',
      effect:'For 1 minute, gain 10 temporary hit points at the start of each of your turns.'
    },

    {
      name:'Fire Shield',
      effect:'For 24 hours or until triggered, the next time you would take fire damage you instead take none and regain hit points equal to half the damage you would have taken.'
    },

    {
      name:'Tunnel Vision',
      effect:'For 1 minute, the first weapon attack you hit with on each of your turns deals an extra 1d12 damage of the same type. You also suffer -2 AC for the duration.'
    },

    {
      name:'Ratatam’s Glowskin Elixir',
      effect:'For 8 hours, shed dim light 10 feet and optionally bright light 10 feet plus dim light another 10 feet. As an action, you may end the potion by producing a flare. Creatures within 30 feet that can see you make a DC 16 Constitution save or become blinded for 1 minute, repeating the save at the end of each turn.'
    },

    {
      name:'Don’t Hit Me Juice',
      effect:'Throw at a creature within 30 feet. It must succeed on a DC 16 Wisdom save or become pacified for 1 minute, unable to attack, cast spells affecting enemies, or deal damage. It repeats the save at the end of each turn.'
    },

    {
      name:'Invulnerability',
      effect:'Until the start of your next turn, you are immune to all damage. On your following turn, you cannot move or take actions.'
    },

    {
      name:'Bottled Bind',
      effect:'Throw at a creature within 30 feet. It must succeed on a DC 15 Strength save or become restrained for 1 minute. It may use its action to make a DC 15 Strength check, ending the restraint on a success.'
    },

    {
      name:'Respiratory Distress',
      effect:'Throw within 60 feet to create a 15-foot-radius gas cloud. Creatures inside when it appears make a DC 15 Constitution save. On a failure, they spend their reaction coughing and lose concentration if concentrating.'
    },

    {
      name:'Pumpkin Patch Guard',
      effect:'For 1 minute, your head becomes a Jack-O’-Lantern. Your eyes project a 15-foot cone that causes creatures within it to be affected by Faerie Fire. At the start of each turn, choose the direction of the cone and whether it is active.'
    },

    {
      name:'Sheep Dragon Brew',
      effect:'For 1 hour, gain +1 AC and resistance to cold damage.'
    },

    {
      name:'Enhanced Static Shock',
      effect:'For 24 hours, after a creature touches you or hits you with a melee attack using a metal weapon, use your reaction to deal 3d10 lightning damage to it. The potion then ends.'
    },

    {
      name:'Enhanced Lightning Breath',
      effect:'For 24 hours, you may once use a bonus action to target a creature within 30 feet. It makes a DC 16 Dexterity save, taking 3d10 lightning damage on a failure or half on a success. The potion then ends.'
    },

    {
      name:'Enhanced Bottled Bomb',
      effect:'Throw within 60 feet. Creatures within 5 feet make a DC 16 Dexterity save, taking 3d8 force damage on a failure or half on a success.'
    },

    {
      name:'Wrathful Spirit',
      effect:'Roll 2d8 when consumed. For 1 minute, whenever you cast a spell you may cause one target damaged by it to take extra force damage equal to the rolled total.'
    },

    {
      name:'Rapid Withdrawal',
      effect:'For 1 minute, whenever a hostile creature damages you, you may use your reaction to teleport up to 15 feet to an unoccupied space you can see.'
    },

    {
      name:'Life-Steal',
      effect:'As an action, target a creature within 10 feet. It takes 3d6 necrotic damage and the potion becomes a healing elixir that restores hit points equal to the necrotic damage dealt.'
    },

    {
      name:'Demonskin',
      effect:'For 1 minute, gain +2 AC and resistance to cold, fire, lightning, and bludgeoning, piercing, and slashing damage from nonmagical attacks. Your creature type becomes Demon (Fiend) for the duration.'
    },

    {
      name:'Withered Will',
      effect:'For 1 minute, as a bonus action breathe a 60-foot cone. Creatures in it make a DC 17 Constitution save. On a failure, speed is halved, reactions are unavailable, and attacks have disadvantage until the start of your next turn. At the start of your next turn, regain this breath on a d6 roll of 4–6.'
    },

    {
      name:'Astounding Vigor',
      effect:'Gain temporary hit points equal to your hit point maximum. They last for 24 hours or until lost.'
    },

    {
      name:'Many Hands',
      effect:'Spectral arms erupt from you. Observers make a DC 19 Wisdom save or become frightened until the start of your next turn, with friendly creatures having advantage. All other creatures within 20 feet make a DC 19 Constitution save, taking 10d6 necrotic damage and becoming unable to regain hit points until the start of your next turn on a failure, or half damage on a success.'
    },

    {
      name:'Epic Bottled Bomb',
      effect:'Throw within 60 feet. Creatures within 30 feet make a DC 19 Dexterity save, taking 20d6 force damage on a failure or half on a success.'
    },

    {
      name:'Essence of Great Rivers',
      effect:'For 24 hours, when you fail a saving throw you may choose to succeed instead. You may do this three times before the potion ends.'
    },

    {
      name:'Carla Cackletooth’s Corruption Cocktail',
      effect:'Pouring out the potion summons 10 corrupted muks under your control until they are destroyed.'
    },

    {
      name:'Hunter’s Speed',
      effect:'Roll 1d4. For 1 minute, gain a flying speed of 90 feet and whenever you take the Attack action, make additional attacks equal to 1 plus the number rolled.'
    },

    {
      name:'Hero’s Blade',
      effect:'Pour over a weapon. For 1 minute, it gains +3 to attack and damage rolls. Creatures hit by it lose the benefit of damage immunities and resistances for 1 minute.'
    },

    {
      name:'Severed Reaction',
      effect:'Permanently gain the ability to take two reactions each round instead of one. Each time you take a second reaction, lose hit points equal to half your level. This does not count against your potion-effect limit.'
    },

    {
      name:'Dragon Frog Transmutation',
      effect:'Transform into an Elder Dragon Frog as if by True Polymorph for 1 minute, or 10 minutes if a Dragon Fang of Yutro was used in brewing.'
    }

  ],


  Utility:[

    {name:'Sensorius Maximus',effect:'For 1 hour, gain +3 to Wisdom (Perception) checks.'},
    {name:'Flip and Skip',effect:'For 1 hour, gain +3 to Dexterity (Acrobatics) checks.'},
    {name:'Brute Brew',effect:'For 1 hour, gain +3 to Strength (Athletics) checks.'},
    {name:'Animal Affinity',effect:'For 1 hour, gain +3 to Wisdom (Animal Handling) checks.'},
    {name:'Detective’s Tonic',effect:'For 1 hour, gain +3 to Intelligence (Investigation) checks.'},
    {name:'Cave Diver',effect:'For 10 minutes, move across walls and ceilings while leaving your hands free, and gain a climbing speed equal to your walking speed.'},
    {name:'Perfect Memory',effect:'For 1 hour, perfectly record everything you see and hear in memory. You can recall those memories perfectly for 24 hours afterward.'},
    {name:'Eyes of Akibu',effect:'For 4 hours, see objects up to 300 feet away as though they were one-tenth as distant.'},
    {name:'Glowskin',effect:'For 4 hours, your skin sheds bright light for 30 feet and dim light for another 30 feet.'},
    {name:'Tiny Telekinesis',effect:'For 1 minute, use an action to telekinetically move an unattended inanimate object no larger than 5 inches or heavier than 1 pound up to 30 feet, provided it remains within 60 feet of you.'},
    {name:'Irresistible Charm',effect:'For 10 minutes, gain Expertise in Persuasion.'},
    {name:'Pathseeking',effect:'For 1 hour, see tracks left by Secret Path potions and see into the Spirit Realm (Ethereal Plane).'},
    {name:'Iron Belly',effect:'Gain 5 temporary hit points and resistance to poison damage for 1 hour.'},
    {name:'Face of Fugari',effect:'For 1 minute, gain advantage on Charisma (Intimidation) checks.'},
    {name:'Duck Foot',effect:'For 1 hour, gain a 40-foot swimming speed and the ability to make an excellent quacking sound.'},
    {name:'Potion of Fog',effect:'Create a Fog Cloud centered on yourself for 1 hour without concentration. It moves with you until you use an action to expel the remaining fog into its current location.'},
    {name:'Secret Path',effect:'Apply to boots. For 24 hours they leave magical tracks invisible except to creatures able to see invisible objects or affected by Pathseeking. Tracks remain for one month.'},
    {name:'Grandma’s Turnip Soup',effect:'During a short rest, roll 1d4 Hit Dice and regain hit points from them without expending those Hit Dice.'},
    {name:'Herbalist’s Aid',effect:'For 1 hour, gain +3 to ability checks made to locate ingredients.'},
    {name:'Homeward Tonic',effect:'For 24 hours, always know the direction of the place you consider home while on the same plane.'},
    {name:'Soft Paw',effect:'For 10 minutes, gain advantage on Dexterity checks.'},
    {name:'Potion of Healing Touch',effect:'For up to 1 hour, you may once use a bonus action to touch a creature and restore 2d4 hit points.'},
    {name:'Cat’s Eye',effect:'For 1 hour, gain darkvision to 60 feet, or increase existing darkvision by 30 feet.'},
    {name:'Liquid Mending',effect:'Pour over an object to repair one break or tear as if using the Mending spell.'},
    {name:'Liquid Lockpick',effect:'Pour into a lock to reduce its picking DC by 1d4 for 1 hour. A lock cannot benefit from this potion more than once.'},
    {name:'Language Lore',effect:'For 1 hour, understand the literal meaning of any spoken language you hear.'},
    {name:'Pig Snout',effect:'For 1 hour, gain advantage on Wisdom (Perception) checks relying on smell.'},
    {name:'Machine Oil',effect:'Pour over a functioning machine to magically power it for 1 minute as though activated by a spirit or Jolt spell.'},
    {name:'Potion of Soft Steps',effect:'For 10 minutes, float an inch above the ground, gain +2 to Dexterity (Stealth), and leave no discernible tracks.'},
    {name:'Liquid Cat',effect:'Pour out the potion to create a friendly cat familiar for 24 hours, as if using Find Familiar.'},
    {name:'Twin Vision',effect:'Two creatures each drink half. For 8 hours, the first may see through the second creature’s eyes and use its special senses while becoming blind to its own senses. This functions within 1 mile.'},
    {name:'Spirit Repellent',effect:'Drink or pour onto a 1-foot square. For 1 minute, spirits CR 5 or lower within 30 feet must make a DC 15 Charisma save or be teleported 35 feet away and unable to willingly enter the area.'},
    {name:'Essence of the River Spirit',effect:'Pour into a small pool. For 1 hour, a creature soaking for at least 10 minutes regains 4d4 + 4 hit points. Up to six creatures may benefit.'},
    {name:'Potion of Freezing',effect:'Pour into liquid to freeze up to a 20-foot cube solid for 1 hour.'},
    {name:'Potion of Attunement',effect:'Apply a drop to a magic item requiring attunement and drink the rest to instantly attune to that item.'},
    {name:'Water Breathing',effect:'For 1 hour, you can breathe underwater.'},
    {name:'Liquid Dispel',effect:'Throw at a creature, object, or magical effect within 30 feet. Any spell of 3rd level or lower affecting the target immediately ends.'},
    {name:'Pocket Stomach',effect:'For 1 hour, your stomach functions as a Bag of Holding for objects you can fit in your mouth. When the duration ends, you vomit the contents.'},
    {name:'Liquid Arcana',effect:'Roll 1d4 when brewed. Drinking the potion restores one expended spell slot of that level or lower.'},
    {name:'Arcane Solvent',effect:'Apply to a magic item to end a creature’s attunement to it. If that creature is wearing or carrying the item, it may resist with a DC 13 Wisdom save.'},
    {name:'Gardner’s Solution',effect:'Apply to a plant to instantly grow it to full maturity, limited by available space.'},
    {name:'Potion of Exertion',effect:'When consumed, gain another action this round at initiative count 1.'},
    {name:'Breakfast in a Bottle',effect:'Roll 1d4 for the number of servings created. A creature consuming one serving is fed for the day and reduces Exhaustion by 1. A creature can benefit only once per long rest. Food spoils after 24 hours.'},
    {name:'Twin Telepathy',effect:'Two creatures each drink half. For 24 hours, they can communicate telepathically across any distance.'},
    {name:'Potion of Reprieve',effect:'For 1 hour, gain one chosen benefit of Greater Restoration. When the potion ends, the suppressed effect returns.'},
    {name:'Uncanny Focus',effect:'For 1 minute, gain advantage on Constitution saves to maintain concentration, and becoming incapacitated does not automatically end concentration.'},
    {name:'Meditative Trance',effect:'The next short rest you take becomes a deep trance granting the benefits of a long rest, even if you already completed a long rest within the past 24 hours.'},
    {name:'Potion of Holistic Wellness',effect:'Regain 4d8 + 4 hit points and remove all conditions affecting you except grappled, prone, or restrained.'},
    {name:'Sharp Mind',effect:'For 8 hours, gain +2 to Intelligence saving throws, resistance to psychic damage, and read ten times faster than normal.'},
    {name:'Mind over Might',effect:'For 24 hours, use Intelligence or Wisdom instead of Strength or Dexterity for Athletics and Acrobatics checks, and gain proficiency in those skills if needed.'},
    {name:'Simulacrum Elixir',effect:'Your original body falls into deep sleep while your mind controls a perfect construct clone with half your hit point maximum. The clone cannot regain spell slots or become more powerful and lasts until dismissed or reduced to 0 hit points.'},
    {name:'Hidden Hand',effect:'For 24 hours, gain telekinetic powers as though affected by the Telekinesis spell.'},
    {name:'Last Resort',effect:'A crystalline cocoon places you in invulnerable stasis beginning at the start of your next turn. Roll 1d6 to determine whether its duration is measured in hours, days, weeks, months, years, or decades, then 1d4 for the amount.'},
    {name:'Elixir of Echoes',effect:'For 1 minute after drinking, you may cast once a spell another creature cast within 100 feet during the previous minute, without spell slot or material components, using the original caster’s save DC and attack bonus.'},
    {name:'Blessing of the Moon Spirit',effect:'Permanently increase your hit point maximum by 2d10. While touching moonlight, once per long rest you may use a bonus action to expend three Hit Dice. This permanent effect does not count against your potion-effect limit.'},
    {name:'Bowark’s Bombastic Beer',effect:'While the potion remains active, you may reroll any ability check, attack roll, or saving throw you make. The effect ends after seven rerolls.'},
    {name:'Unified Might',effect:'For 1 hour, two ability scores of your choice become 25.'},
    {name:'Umi’s Powerful Undertow',effect:'For 1 hour, spells that produce or manipulate water are treated as being cast one slot level higher, and water-based damaging spells deal +2d12 bludgeoning damage. Alternatively, throw the potion to summon three water elementals under your control until destroyed.'},
    {name:'Island Nectar',effect:'Regain 100 hit points. As part of the same bonus action, immediately make one melee weapon attack, cast a spell targeting only one creature or object, or move up to your speed.'},
    {name:'Elixir of Omnimind',effect:'For 1 minute, you can concentrate on two spells simultaneously. When forced to make a concentration save, make a separate save for each spell.'}

  ],


  Whimsy:[

    {name:'Melodious Bird Calls',effect:'For 24 hours, perfectly mimic the call of any songbird.'},
    {name:'Projected Thoughts',effect:'For 1 hour, a bubble above your head can display your thoughts as silent illusory words or images.'},
    {name:'Intoxicating Aroma',effect:'You smell like expertly crafted perfume for 22 years. This does not count against your potion-effect limit.'},
    {name:'Ladybug Kinship',effect:'For 1 minute after opening, the potion produces 500 ladybugs per round until it fully evaporates.'},
    {name:'Essence of Umami',effect:'Pour over food. Anyone tasting it experiences their own personal ultimate culinary experience.'},
    {name:'Vocal Stranger',effect:'For 1 hour, perfectly mimic the speech of someone you do not know, or a random unfamiliar voice.'},
    {name:'Beard Brew',effect:'Instantly grow a random style of facial hair that remains until shaved. This does not count against your potion-effect limit.'},
    {name:'Photosynthetic Skin',effect:'For 24 hours, while the sun is out, regain 1 hit point at the start of every hour.'},
    {name:'Paradise Plumage',effect:'For 24 hours, gain magnificent plumage and advantage on Charisma (Performance) checks made to distract or amaze.'},
    {name:'Musical Mixer',effect:'Once uncorked, produces beautiful ethereal music for 1 hour while evaporating.'},
    {name:'Stink Brew',effect:'For 1d4 rounds, other creatures within 15 feet must succeed on a DC 13 Constitution save or be unable to willingly move closer to you.'},
    {name:'Duko the Trickster’s Elixir',effect:'Once consumed, you may produce one egg, rock, coin, or 2-foot string from your mouth. The effect remains until used and does not count against your potion-effect limit.'},
    {name:'Manifested Nostalgia',effect:'For 4 hours, become a child version of yourself, one size smaller to a minimum of Small, and your Strength and Dexterity become 10 unless already lower.'},
    {name:'Pigment',effect:'For 8 hours, produce unlimited oil paints of any desired color from your fingertips.'},
    {name:'Audio Oddity',effect:'For 1 hour, spells you cast produce no sound.'},
    {name:'Hindsight',effect:'Pour over an object and lick the potion from it to learn one minor but useful piece of information about that object.'},
    {name:'Super Singing',effect:'For 1 hour, you cannot speak without singing and have advantage on Charisma (Performance) checks using your voice.'},
    {name:'Fluffplum Tonic',effect:'For 1 hour, gain the effects of Feather Fall and weigh no more than 1 pound.'},
    {name:'Merriment',effect:'For 1 hour, gain Expertise in one chosen skill and disadvantage on ability checks using all other skills.'},
    {name:'Bubble Message',effect:'Speak a message while consuming the potion. You hiccup a bubble that travels toward a familiar creature at 1 mile per hour and delivers the message in your voice when it pops.'},
    {name:'Crystal Clear',effect:'Pour into a nonmagical liquid no larger than a 20-foot cube to make that liquid invisible for 1d4 hours.'},
    {name:'Elder Elixir',effect:'Temporarily double your age for 1d12 months. This does not count against your potion-effect limit.'},
    {name:'Witch’s Hidden Gem',effect:'For 1 hour, all liquid you drink turns into wine as you consume it.'},
    {name:'Carbonated Snake',effect:'Shake and point the bottle to fire its contents into a space within 10 feet, where they become a poisonous snake.'},
    {name:'Shadow Child',effect:'For 1 hour, an apparition visible only to you emerges and functions as an Unseen Servant.'},
    {name:'Hsirebbig',effect:'For 24 hours, speak a special language understood only by others under the effects of Hsirebbig. Even Comprehend Languages cannot decipher it.'},
    {name:'Sky Swimming',effect:'For 10 minutes, gain a 15-foot flying speed and hover, but move as though swimming and obey underwater-combat rules while airborne.'},
    {name:'Passing Memory',effect:'The brewer stores one chosen memory in the potion. Another creature drinking it gains that memory.'},
    {name:'Bottled Slime',effect:'If thrown into an unoccupied space within 30 feet, the bottle shatters and releases a soda slime that acts independently.'},
    {name:'Oil of the Trademark Flourish',effect:'Apply to an object to permanently assign it a signature sound whenever it is used, removable as a curse.'},
    {name:'Mosspot',effect:'For 1 hour, polymorph into a mossling spirit without requiring concentration.'},
    {name:'Incredible Luck',effect:'Gain advantage on the next 1d4 ability checks, attack rolls, or saving throws you make.'},
    {name:'Grand Friendship',effect:'Divide among up to eight creatures. For 24 hours, participants gain a 60-foot flying speed, but only while holding hands with every other participant.'},
    {name:'Witch’s Lament',effect:'A rain cloud appears and your head permanently transforms into that of an anthropomorphic animal chosen by the GM.'},
    {name:'Spirit Appendage',effect:'Grow a 6-foot prehensile tail that acts as a third arm and supports your weight. It lasts 1d12 days before falling off.'},
    {name:'Move a Thing',effect:'Pour over an object weighing 500 pounds or less. Each hour it becomes up to 1d100 pounds lighter until reaching exactly 10 pounds. It remains 10 pounds for one week.'},
    {name:'Gobble Gunk',effect:'For 1 hour, safely eat anything you can fit in your mouth. Magical objects are vomited back up when the duration ends.'},
    {name:'Pocket Portal',effect:'Bury the potion for 24 hours to grow a temporary portal to the Spirit Realm. The portal then remains open for 24 hours.'},
    {name:'Don’t Eat Dirt',effect:'For 10 days, become immune to the prone condition and cannot voluntarily go prone.'},
    {name:'Lunar Elixir',effect:'Pour out to create a 20-foot-radius, 300-foot-high cylinder of lunar gravity for 8 hours. Jump distance is tripled and falling damage is halved inside it.'},
    {name:'Lifetime Supply',effect:'Grow 1d4 + 2, multiplied by 100, feet of hair over 1 minute. When the minute ends, all of your hair falls out.'},
    {name:'Invisible Tonic',effect:'Pour over a Small or smaller object to make it invisible until the effect is removed as a curse.'},
    {name:'Liquid Disguise',effect:'The potion takes on the essence of a random humanoid within 1 mile when brewed. Drinking it transforms your appearance into that humanoid for 24 hours.'},
    {name:'Spirit Sweets',effect:'A spirit CR 8 or lower drinking this potion becomes drunk and happy for 1d4 days. Alternatively, pouring it out attracts spirits CR 2 or lower within 1 mile for up to 8 hours.'},
    {name:'A New Look',effect:'Your head transforms into that of a random anthropomorphic animal until removed as a curse. This does not count against your potion-effect limit.'},
    {name:'Shadow Puppet',effect:'Your shadow becomes sentient and develops its own personality while remaining attached to you. The effect lasts until removed as a curse and does not count against your potion-effect limit.'},
    {name:'Object Embodiment',effect:'For 1 hour, transform into an object of your choice as though by True Polymorph without concentration.'},
    {name:'Phoenix Elixir',effect:'For 24 hours, become immune to fire damage. When the duration ends, your body burns to ash. One hour later, you are reborn in the nearest bonfire while your former equipment remains behind.'},
    {name:'Unknown Elixir',effect:'Gain the ability to cast one random spell of 6th level or lower once without a spell slot, using save DC 17 and spell attack +9. The effect lasts until used and does not count against your potion-effect limit.'},
    {name:'Illusion in a Bottle',effect:'Pour out to create an illusion as though using Major Image for 1 hour. Examining it reveals the illusion with a successful DC 18 Intelligence (Investigation) check.'},
    {name:'Homegrown',effect:'Pour over an unobstructed area at least 50 feet square. After 1 minute, a newly formed and furnished grand home appears.'},
    {name:'Mind Transfer',effect:'For 1 hour, the first creature to touch you after consumption receives your mind and soul. You may contest Intelligence or Wisdom at the start of each of its turns to control it until your next turn. Your original body remains unconscious. If the host dies while you inhabit it, you also die.'},
    {name:'New Life',effect:'Transform into a perfect illusory likeness and voice of a humanoid chosen by the brewer for 7 years, removable as a curse. Only magic detection or illusion-piercing senses reveal the disguise.'},
    {name:'Ups-A-Daisy',effect:'Pour over a creature or object to awaken it as though using Awaken. It remains charmed by you for 1 year.'},
    {name:'Spiritual Rebuke',effect:'Pour onto the ground to create a 10-foot cube functioning as an Antimagic Field for 1 year.'},
    {name:'Newly Found Magic',effect:'Permanently learn one random 3rd-level spell and cast it once per long rest without expending a spell slot. This does not count against your potion-effect limit.'},
    {name:'Crafter’s Brew',effect:'Add to a larger container or small body of water to create an enchanting bath. The first nonmagical object submerged for at least 1 minute gains a permanent random magical effect of uncommon rarity or higher.'},
    {name:'Dancing Feet',effect:'Until dismissed as an action, you move by dancing. Gain +10 feet walking speed, +5 to Charisma (Performance) checks involving dance, and proficiency in Dexterity saving throws if you lack it.'},
    {name:'Chicken Chaser',effect:'Permanently gain the ability to speak with chickens. Once ever, summon 100 chickens in a 20-foot radius. Other creatures there make a DC 19 Dexterity save, taking 30d6 slashing damage on a failure or half on a success.'},
    {name:'Disappearing Act',effect:'Your body and carried equipment vanish, and your sentience transfers into a random object within 100 miles.'}

  ]

};

window.EPCOT_POTIONS = POTIONS;

  /* =====================================================
     INGREDIENT HELPERS
     ===================================================== */

  function ingredientObject(
    row,
    rarity
  ){

    return {

      name:
        row[0],

      combat:
        row[1],

      utility:
        row[2],

      whimsy:
        row[3],

      rarity

    };

  }


  function allIngredients(){

    return Object.entries(
      INGREDIENTS
    )
      .flatMap(
        ([rarity,list]) =>

          list.map(
            row =>
              ingredientObject(
                row,
                rarity
              )
          )

      );

  }


  function randomIngredient(
    rarity
  ){

    const list =
      INGREDIENTS[
        rarity
      ];


    if(
      rarity ===
      'uncommon'
    ){

      /*
        Original table uses 2d20.
        Keep that probability curve.
      */

      const total =
        W.roll(
          2,
          20
        ).total;


      return ingredientObject(
        list[
          total - 2
        ],
        rarity
      );

    }


    return ingredientObject(
      W.pick(
        list
      ),
      rarity
    );

  }


  function quantityForRarity(
    rarity
  ){

    if(
      rarity ===
      'common'
    ){

      return W.roll(
        1,
        20
      ).total;

    }


    if(
      rarity ===
      'uncommon'
    ){

      return W.roll(
        1,
        10
      ).total;

    }


    return W.roll(
      1,
      4
    ).total;

  }


  function titleCase(
    value
  ){

    return value
      .charAt(0)
      .toUpperCase() +
      value.slice(1);

  }


  function complicationChance(){

    return W.randomInt(
      1,
      20
    ) === 1;

  }


  /* =====================================================
     WIDGET 1
     MAGIC KINGDOM TRAINING
     ===================================================== */

  W.register({

    id:
      'downtime-training',

    code:
      'MK-01',

    title:
      'Magic Kingdom Training',

    subtitle:
      'Training simulator',


    render(){

      return `
        <div class="dm-widget-form">

          <label class="dm-widget-field">

            <span>
              Training Tier
            </span>

            <select data-training-tier>

              <option value="1">
                Tier 1 · Skill / Tool
              </option>

              <option value="2">
                Tier 2 · Ability Score
              </option>

              <option value="3">
                Tier 3 · Expertise
              </option>

              <option value="4">
                Tier 4 · General Feature
              </option>

              <option value="5">
                Tier 5 · Epic Boon
              </option>

            </select>

          </label>


          <div class="dm-widget-mini-stats">

            <div class="dm-widget-mini-stat">

              <span>
                Tickets
              </span>

              <strong
                data-training-tickets
              >
                5
              </strong>

            </div>


            <div class="dm-widget-mini-stat">

              <span>
                Required DC
              </span>

              <strong
                data-training-dc
              >
                15
              </strong>

            </div>

          </div>


          <label class="dm-widget-field">

            <span>
              Final Check
            </span>

            <input
              data-training-total
              type="number"
              min="0"
              max="99"
              step="1"
              inputmode="numeric"
              placeholder="0–99"
            >

          </label>


          <label
            class="dm-widget-nat"
            data-training-nat1-wrap
            hidden
          >

            <input
              data-training-nat1
              type="checkbox"
            >

            <span>
              This was a Natural 1
            </span>

          </label>


          <label
            class="dm-widget-nat"
            data-training-nat20-wrap
            hidden
          >

            <input
              data-training-nat20
              type="checkbox"
            >

            <span>
              This was a Natural 20
            </span>

          </label>

        </div>


        <div class="dm-widget-actions">

          <button
            class="dm-widget-button"
            type="button"
            data-training-resolve
          >
            Resolve Training
          </button>

        </div>
      `;

    },


    init(root){

      const tier =
        root.querySelector(
          '[data-training-tier]'
        );


      const tickets =
        root.querySelector(
          '[data-training-tickets]'
        );


      const dc =
        root.querySelector(
          '[data-training-dc]'
        );


      const total =
        root.querySelector(
          '[data-training-total]'
        );


      const nat1Wrap =
        root.querySelector(
          '[data-training-nat1-wrap]'
        );


      const nat20Wrap =
        root.querySelector(
          '[data-training-nat20-wrap]'
        );


      const nat1 =
        root.querySelector(
          '[data-training-nat1]'
        );


      const nat20 =
        root.querySelector(
          '[data-training-nat20]'
        );


      function syncTier(){

        const data =
          TRAINING_TIERS[
            tier.value
          ];


        tickets.textContent =
          data.tickets;


        dc.textContent =
          data.dc;

      }


      function syncNatural(){

        const value =
          Number(
            total.value
          );


        nat1Wrap.hidden =
          value !== 1;


        nat20Wrap.hidden =
          value !== 20;


        if(
          value !== 1
        ){

          nat1.checked =
            false;

        }


        if(
          value !== 20
        ){

          nat20.checked =
            false;

        }

      }


      tier.addEventListener(
        'change',
        syncTier
      );


      total.addEventListener(
        'input',
        ()=>{

          if(
            total.value !== ''
          ){

            let value =
              Number(
                total.value
              );


            if(value < 0){
              value = 0;
            }


            if(value > 99){
              value = 99;
            }


            total.value =
              value;

          }


          syncNatural();

        }
      );


      nat1.addEventListener(
        'change',
        ()=>{

          if(nat1.checked){

            nat20.checked =
              false;

          }

        }
      );


      nat20.addEventListener(
        'change',
        ()=>{

          if(nat20.checked){

            nat1.checked =
              false;

          }

        }
      );


      syncTier();


      root.querySelector(
        '[data-training-resolve]'
      ).addEventListener(
        'click',
        ()=>{

          if(
            total.value === ''
          ){

            W.showModal({

              kicker:
                'MAGIC KINGDOM',

              title:
                'Final Check Needed',

              body:
                `
                  <p>
                    Enter a numerical final check
                    from 0 to 99.
                  </p>
                `

            });


            return;

          }


          const value =
            Number(
              total.value
            );


          const data =
            TRAINING_TIERS[
              tier.value
            ];


          if(
            nat1.checked
          ){

            const complication =
              W.pick(
                TRAINING_COMPLICATIONS
              );


            W.showModal({

              kicker:
                'TRAINING FAILURE',

              title:
                'Critical Training Failure',

              body:
                `
                  <div class="dm-widget-modal-result failure">

                    <strong>
                      NATURAL 1
                    </strong>

                    Training fails and a
                    complication occurs.

                  </div>

                  <p>
                    ${W.escapeHtml(
                      complication
                    )}
                  </p>
                `,

              actions:[
                W.copyAction(
                  'Copy Result',
                  `MAGIC KINGDOM TRAINING
CRITICAL FAILURE
${complication}`
                )
              ]

            });


            return;

          }


          if(
            nat20.checked
          ){

            W.showModal({

              kicker:
                'TRAINING SUCCESS',

              title:
                'Exceptional Work!',

              body:
                `
                  <div class="dm-widget-modal-result success">

                    <strong>
                      NATURAL 20
                    </strong>

                    Outstanding performance.
                    Your training benefit is doubled.

                  </div>

                  <p>
                    <strong>
                      Reward:
                    </strong>
                    ${W.escapeHtml(
                      data.critical
                    )}
                  </p>

                  <p>
                    Ticket Cost:
                    ${data.tickets}
                  </p>
                `,

              actions:[
                W.copyAction(
                  'Copy Result',
                  `MAGIC KINGDOM TRAINING
NATURAL 20 SUCCESS
Tier ${tier.value}: ${data.label}
Tickets: ${data.tickets}
Reward: ${data.critical}`
                )
              ]

            });


            return;

          }


          /*
            User specified:
            Higher than the DC succeeds.
          */

          const success =
            value >
            data.dc;


          if(success){

            W.showModal({

              kicker:
                'TRAINING SUCCESS',

              title:
                'Training Complete!',

              body:
                `
                  <div class="dm-widget-modal-result success">

                    <strong>
                      SUCCESS
                    </strong>

                    Check ${value}
                    exceeds DC ${data.dc}.

                  </div>

                  <p>
                    Great work.
                    The simulator confirms
                    successful advancement.
                  </p>

                  <p>
                    <strong>
                      Reward:
                    </strong>
                    ${W.escapeHtml(
                      data.success
                    )}
                  </p>

                  <p>
                    Ticket Cost:
                    ${data.tickets}
                  </p>
                `,

              actions:[
                W.copyAction(
                  'Copy Result',
                  `MAGIC KINGDOM TRAINING
SUCCESS
Tier ${tier.value}: ${data.label}
Check: ${value}
DC: ${data.dc}
Tickets: ${data.tickets}
Reward: ${data.success}`
                )
              ]

            });


            return;

          }


          const consequence =
            complicationChance();


          if(consequence){

            const complication =
              W.pick(
                TRAINING_COMPLICATIONS
              );


            W.showModal({

              kicker:
                'TRAINING FAILURE',

              title:
                'Failure With Complication',

              body:
                `
                  <div class="dm-widget-modal-result failure">

                    <strong>
                      FAILED
                    </strong>

                    Check ${value}
                    did not exceed
                    DC ${data.dc}.

                  </div>

                  <p>
                    The failed simulation
                    triggered an additional
                    training complication.
                  </p>

                  <p>
                    ${W.escapeHtml(
                      complication
                    )}
                  </p>
                `,

              actions:[
                W.copyAction(
                  'Copy Result',
                  `MAGIC KINGDOM TRAINING
FAILURE WITH COMPLICATION
Check: ${value}
DC: ${data.dc}
${complication}`
                )
              ]

            });

          } else {

            W.showModal({

              kicker:
                'TRAINING FAILURE',

              title:
                'Training Unsuccessful',

              body:
                `
                  <div class="dm-widget-modal-result failure">

                    <strong>
                      FAILED
                    </strong>

                    Check ${value}
                    did not exceed
                    DC ${data.dc}.

                  </div>

                  <p>
                    No advancement is gained,
                    but no additional
                    complication occurs.
                  </p>
                `

            });

          }

        }
      );

    }

  });



  /* =====================================================
     WIDGET 2
     ANIMAL KINGDOM GATHERING
     ===================================================== */

  W.register({

    id:
      'downtime-gathering',

    code:
      'AK-02',

    title:
      'Animal Kingdom Gathering',

    subtitle:
      'Nature · Survival · Perception',


    render(){

      const ingredientOptions =
        allIngredients()
          .sort(
            (a,b) =>
              a.name.localeCompare(
                b.name
              )
          )
          .map(
            item =>
              `
                <option
                  value="${W.escapeHtml(
                    item.name
                  )}"
                >
                  ${W.escapeHtml(
                    item.name
                  )}
                  ·
                  ${titleCase(
                    item.rarity
                  )}
                </option>
              `
          )
          .join('');


      return `
        <div class="dm-widget-form">

          <div class="dm-widget-note">
            Roll Nature, Survival,
            or Perception.
            Gathering costs 1 Ticket.
          </div>


          <label class="dm-widget-field">

            <span>
              Target
            </span>

            <select data-gather-dc>

              <option value="10">
                DC 10 · Common
              </option>

              <option value="15">
                DC 15 · Uncommon
              </option>

              <option value="20">
                DC 20 · Rare
              </option>

            </select>

          </label>


          <label class="dm-widget-field">

            <span>
              Final Check
            </span>

            <input
              data-gather-total
              type="number"
              min="0"
              max="99"
              step="1"
              placeholder="Nature / Survival / Perception"
            >

          </label>


          <label class="dm-widget-nat">

            <input
              data-gather-known
              type="checkbox"
            >

            <span>
              Known Ingredient
            </span>

          </label>


          <label
            class="dm-widget-field"
            data-gather-known-field
            hidden
          >

            <span>
              Ingredient
            </span>

            <select
              data-gather-known-name
            >

              <option value="">
                Choose ingredient...
              </option>

              ${ingredientOptions}

            </select>

          </label>

        </div>


        <div class="dm-widget-actions">

          <button
            class="dm-widget-button"
            type="button"
            data-gather-resolve
          >
            Resolve Gathering
          </button>

        </div>
      `;

    },


    init(root){

      const known =
        root.querySelector(
          '[data-gather-known]'
        );


      const knownField =
        root.querySelector(
          '[data-gather-known-field]'
        );


      known.addEventListener(
        'change',
        ()=>{

          knownField.hidden =
            !known.checked;

        }
      );


      root.querySelector(
        '[data-gather-resolve]'
      ).addEventListener(
        'click',
        ()=>{

          const dc =
            Number(
              root.querySelector(
                '[data-gather-dc]'
              ).value
            );


          const totalField =
            root.querySelector(
              '[data-gather-total]'
            );


          if(
            totalField.value === ''
          ){

            W.showModal({

              kicker:
                'ANIMAL KINGDOM',

              title:
                'Gathering Check Needed',

              body:
                `
                  <p>
                    Roll Nature, Survival,
                    or Perception and enter
                    the final result.
                  </p>
                `

            });


            return;

          }


          const total =
            Number(
              totalField.value
            );


          if(
            total <
            dc
          ){

            const consequence =
              complicationChance();


            if(consequence){

              const complication =
                W.pick(
                  GATHERING_COMPLICATIONS
                );


              W.showModal({

                kicker:
                  'GATHERING FAILURE',

                title:
                  'Failure With Complication',

                body:
                  `
                    <div class="dm-widget-modal-result failure">

                      <strong>
                        FAILED
                      </strong>

                      Check ${total}
                      did not reach
                      DC ${dc}.

                    </div>

                    <p>
                      ${W.escapeHtml(
                        complication
                      )}
                    </p>
                  `,

                actions:[
                  W.copyAction(
                    'Copy Result',
                    `ANIMAL KINGDOM GATHERING
FAILURE WITH COMPLICATION
Check: ${total}
DC: ${dc}
${complication}`
                  )
                ]

              });

            } else {

              W.showModal({

                kicker:
                  'GATHERING FAILURE',

                title:
                  'Nothing Gathered',

                body:
                  `
                    <div class="dm-widget-modal-result failure">

                      <strong>
                        FAILED
                      </strong>

                      Check ${total}
                      did not reach
                      DC ${dc}.

                    </div>

                    <p>
                      No ingredients are gathered.
                      No additional complication occurs.
                    </p>
                  `

              });

            }


            return;

          }


          let rarity =
            dc === 10
              ? 'common'
              : dc === 15
                ? 'uncommon'
                : 'rare';


          let items = [];

          let quantity = 0;


          if(
            known.checked
          ){

            const selectedName =
              root.querySelector(
                '[data-gather-known-name]'
              ).value;


            const ingredient =
              allIngredients()
                .find(
                  item =>
                    item.name ===
                    selectedName
                );


            if(!ingredient){

              W.showModal({

                kicker:
                  'ANIMAL KINGDOM',

                title:
                  'Choose an Ingredient',

                body:
                  `
                    <p>
                      Select the known
                      ingredient being gathered.
                    </p>
                  `

              });


              return;

            }


            rarity =
              ingredient.rarity;


            quantity =
              quantityForRarity(
                rarity
              );


            items =
              Array.from(
                {
                  length:
                    quantity
                },
                () =>
                  ingredient
              );

          } else {

            quantity =
              quantityForRarity(
                rarity
              );


            items =
              Array.from(
                {
                  length:
                    quantity
                },
                () =>
                  randomIngredient(
                    rarity
                  )
              );

          }


          const grouped =
            new Map();


          items.forEach(
            item=>{

              const existing =
                grouped.get(
                  item.name
                );


              if(existing){

                existing.quantity += 1;

              } else {

                grouped.set(
                  item.name,
                  {
                    ...item,
                    quantity:1
                  }
                );

              }

            }
          );


          const rows =
            Array.from(
              grouped.values()
            )
              .map(
                item =>
                  `
                    <p>
                      <strong>
                        ${item.quantity} ×
                        ${W.escapeHtml(
                          item.name
                        )}
                      </strong>
                      <br>
                      Combat ${item.combat}
                      · Utility ${item.utility}
                      · Whimsy ${item.whimsy}
                    </p>
                  `
              )
              .join('');


          const copyRows =
            Array.from(
              grouped.values()
            )
              .map(
                item =>
                  `${item.quantity} × ${item.name} (C ${item.combat}, U ${item.utility}, W ${item.whimsy})`
              )
              .join('\n');


          W.showModal({

            kicker:
              'GATHERING SUCCESS',

            title:
              'Resources Gathered!',

            body:
              `
                <div class="dm-widget-modal-result success">

                  <strong>
                    SUCCESS
                  </strong>

                  Check ${total}
                  reached DC ${dc}.

                </div>

                <p>
                  <strong>
                    ${quantity}
                    ${titleCase(
                      rarity
                    )}
 ingredient${
                      quantity === 1
                        ? ''
                        : 's'
                    } found.
                  </strong>
                </p>

                ${rows}
              `,

            actions:[
              W.copyAction(
                'Copy Result',
                `ANIMAL KINGDOM GATHERING
SUCCESS
Check: ${total}
${quantity} ${titleCase(rarity)} ingredient${quantity === 1 ? '' : 's'}
${copyRows}`
              )
            ]

          });

        }
      );

    }

  });



  /* =====================================================
     WIDGET 3
     BACKSTAGE CRAFTING
     ===================================================== */

  W.register({

    id:
      'downtime-crafting',

    code:
      'BS-03',

    title:
      'Backstage Crafting',

    subtitle:
      'Workshop fabrication',


    render(){

      return `
        <div class="dm-widget-form">

          <label class="dm-widget-field">

            <span>
              Item Type
            </span>

            <select data-craft-type>

              ${
                Object.keys(
                  CRAFT_TOOLS
                )
                  .map(
                    type =>
                      `
                        <option>
                          ${W.escapeHtml(
                            type
                          )}
                        </option>
                      `
                  )
                  .join('')
              }

            </select>

          </label>


          <label class="dm-widget-field">

            <span>
              Rarity
            </span>

            <select data-craft-rarity>

              <option>
                Common
              </option>

              <option>
                Uncommon
              </option>

              <option>
                Rare
              </option>

              <option>
                Very Rare
              </option>

              <option>
                Legendary
              </option>

            </select>

          </label>


          <label class="dm-widget-field">

            <span>
              Listed Price
            </span>

            <input
              data-craft-price
              type="number"
              min="0"
              step=".01"
              placeholder="gp · leave blank if none"
            >

          </label>

        </div>


        <div class="dm-widget-actions two">

          <button
            class="dm-widget-button secondary"
            type="button"
            data-craft-cost
          >
            Calculate Cost
          </button>

          <button
            class="dm-widget-button"
            type="button"
            data-craft-pay
            disabled
          >
            Pay Costs and Craft
          </button>

        </div>
      `;

    },


    init(root){

      const type =
        root.querySelector(
          '[data-craft-type]'
        );


      const rarity =
        root.querySelector(
          '[data-craft-rarity]'
        );


      const price =
        root.querySelector(
          '[data-craft-price]'
        );


      const payButton =
        root.querySelector(
          '[data-craft-pay]'
        );


      let currentCost =
        null;


      function invalidate(){

        currentCost =
          null;


        payButton.disabled =
          true;

      }


      type.addEventListener(
        'change',
        invalidate
      );


      rarity.addEventListener(
        'change',
        invalidate
      );


      price.addEventListener(
        'input',
        invalidate
      );


      root.querySelector(
        '[data-craft-cost]'
      ).addEventListener(
        'click',
        ()=>{

          const listed =
            Number(
              price.value
            );


          const data =
            CRAFT_COSTS[
              rarity.value
            ];


          let gold = 0;

          let formula = '';


          if(
            price.value.trim() !== '' &&
            Number.isFinite(
              listed
            )
          ){

            gold =
              listed /
              2;


            formula =
              `Half of the listed ${listed.toLocaleString()} gp price.`;

          } else {

            const d10 =
              W.randomInt(
                1,
                10
              );


            gold =
              d10 *
              data.multiplier;


            formula =
              `${d10} × ${data.multiplier.toLocaleString()} gp.`;

          }


          currentCost = {

            gold,
            tickets:
              data.tickets,

            rarity:
              rarity.value,

            type:
              type.value,

            tool:
              CRAFT_TOOLS[
                type.value
              ],

            formula

          };


          payButton.disabled =
            false;


          const autoComplete =
            (
              rarity.value ===
                'Common' ||
              rarity.value ===
                'Uncommon'
            ) &&
            gold < 250;


          W.showModal({

            kicker:
              'BACKSTAGE COST',

            title:
              'Workshop Estimate',

            body:
              `
                <div class="dm-widget-modal-result">

                  <strong>
                    ${gold.toLocaleString()} gp
                    + ${data.tickets} Tickets
                  </strong>

                  ${W.escapeHtml(
                    formula
                  )}

                </div>

                <p>
                  <strong>
                    Required Proficiency:
                  </strong>
                  ${W.escapeHtml(
                    CRAFT_TOOLS[
                      type.value
                    ]
                  )}
                </p>

                ${
                  autoComplete
                    ? `
                        <p>
                          This common or uncommon
                          item is under 250 gp.
                          Three Tickets automatically
                          complete the item.
                        </p>
                      `
                    : ''
                }

                <p>
                  Close this window,
                  then choose
                  <strong>
                    Pay Costs and Craft
                  </strong>
                  when the character commits.
                </p>
              `,

            actions:[
              W.copyAction(
                'Copy Cost',
                `BACKSTAGE CRAFTING
${rarity.value} ${type.value}
Cost: ${gold.toLocaleString()} gp + ${data.tickets} Tickets
Required: ${CRAFT_TOOLS[type.value]}`
              )
            ]

          });

        }
      );


      payButton.addEventListener(
        'click',
        ()=>{

          if(!currentCost){
            return;
          }


          /*
            Crafting rule:
            1-2 = complication
            3-4 = boon
          */

          const workshopRoll =
            W.randomInt(
              1,
              4
            );


          if(
            workshopRoll <=
            2
          ){

            const complication =
              W.pick(
                CRAFT_COMPLICATIONS
              );


            W.showModal({

              kicker:
                'BACKSTAGE CRAFTING',

              title:
                'Crafted With Complication',

              body:
                `
                  <div class="dm-widget-modal-result failure">

                    <strong>
                      COMPLICATION
                    </strong>

                    The project was crafted,
                    but the workshop generated
                    an additional problem.

                  </div>

                  <p>
                    ${W.escapeHtml(
                      complication
                    )}
                  </p>
                `,

              actions:[
                W.copyAction(
                  'Copy Result',
                  `BACKSTAGE CRAFTING
${currentCost.rarity} ${currentCost.type}
Cost Paid: ${currentCost.gold.toLocaleString()} gp + ${currentCost.tickets} Tickets
COMPLICATION
${complication}`
                )
              ]

            });

          } else {

            const boon =
              W.pick(
                CRAFT_BOONS
              );


            W.showModal({

              kicker:
                'BACKSTAGE CRAFTING',

              title:
                'Crafted With Imagineer Boon!',

              body:
                `
                  <div class="dm-widget-modal-result success">

                    <strong>
                      IMAGINEER BOON
                    </strong>

                    The workshop produces
                    an exceptional result.

                  </div>

                  <p>
                    ${W.escapeHtml(
                      boon
                    )}
                  </p>
                `,

              actions:[
                W.copyAction(
                  'Copy Result',
                  `BACKSTAGE CRAFTING
${currentCost.rarity} ${currentCost.type}
Cost Paid: ${currentCost.gold.toLocaleString()} gp + ${currentCost.tickets} Tickets
IMAGINEER BOON
${boon}`
                )
              ]

            });

          }

        }
      );

    }

  });



  /* =====================================================
     WIDGET 4
     PAVILIONS SOCIAL EVENTS
     ===================================================== */

  W.register({

    id:
      'downtime-social',

    code:
      'PV-04',

    title:
      'Pavilions Social Events',

    subtitle:
      'Charisma networking',


    render(){

      return `
        <div class="dm-widget-form">

          <label class="dm-widget-field">

            <span>
              Social Goal
            </span>

            <select data-social-dc>

              <option value="10">
                DC 10 · Rumor / Contact
              </option>

              <option value="15">
                DC 15 · Relationship
              </option>

              <option value="20">
                DC 20 · Sponsor Favor
              </option>

            </select>

          </label>


          <label class="dm-widget-field">

            <span>
              Charisma-Based Roll
            </span>

            <input
              data-social-roll
              type="number"
              min="1"
              max="20"
              step="1"
              inputmode="numeric"
              placeholder="1–20"
            >

          </label>

        </div>


        <div class="dm-widget-note">
          Costs 1 Ticket.
          Enter the d20 result from a
          Charisma-based check.
        </div>


        <div class="dm-widget-actions">

          <button
            class="dm-widget-button"
            type="button"
            data-social-resolve
          >
            Resolve Event
          </button>

        </div>
      `;

    },


    init(root){

      const rollField =
        root.querySelector(
          '[data-social-roll]'
        );


      rollField.addEventListener(
        'input',
        ()=>{

          if(
            rollField.value === ''
          ){
            return;
          }


          let value =
            Number(
              rollField.value
            );


          if(value < 1){
            value = 1;
          }


          if(value > 20){
            value = 20;
          }


          rollField.value =
            value;

        }
      );


      root.querySelector(
        '[data-social-resolve]'
      ).addEventListener(
        'click',
        ()=>{

          if(
            rollField.value === ''
          ){

            W.showModal({

              kicker:
                'PAVILIONS',

              title:
                'Charisma Roll Needed',

              body:
                `
                  <p>
                    Enter a Charisma-based
                    d20 roll from 1 to 20.
                  </p>
                `

            });


            return;

          }


          const dc =
            Number(
              root.querySelector(
                '[data-social-dc]'
              ).value
            );


          const roll =
            Number(
              rollField.value
            );


          if(
            roll >=
            dc
          ){

            let reward = '';


            if(
              dc === 10
            ){

              reward =
                'Gain 1 Rumor or Contact. Tell the DM they owe you a rumor or contact.';

            }


            if(
              dc === 15
            ){

              const points =
                W.roll(
                  1,
                  8
                ).total + 1;


              reward =
                `Gain ${points} Relationship Points. Tell the DM which character receives these points.`;

            }


            if(
              dc === 20
            ){

              reward =
                'Secure Sponsor Favor. Tell the DM which character provides this favor.';

            }


            W.showModal({

              kicker:
                'SOCIAL SUCCESS',

              title:
                'The Pavilion Loves You!',

              body:
                `
                  <div class="dm-widget-modal-result success">

                    <strong>
                      SUCCESS
                    </strong>

                    Roll ${roll}
                    meets or exceeds
                    DC ${dc}.

                  </div>

                  <p>
                    <strong>
                      Reward:
                    </strong>
                    ${W.escapeHtml(
                      reward
                    )}
                  </p>
                `,

              actions:[
                W.copyAction(
                  'Copy Result',
                  `PAVILIONS SOCIAL EVENT
SUCCESS
Roll: ${roll}
DC: ${dc}
Reward: ${reward}`
                )
              ]

            });


            return;

          }


          if(
            complicationChance()
          ){

            const complication =
              W.pick(
                SOCIAL_COMPLICATIONS
              );


            W.showModal({

              kicker:
                'SOCIAL FAILURE',

              title:
                'Failure With Consequence',

              body:
                `
                  <div class="dm-widget-modal-result failure">

                    <strong>
                      FAILED
                    </strong>

                    Roll ${roll}
                    did not reach
                    DC ${dc}.

                  </div>

                  <p>
                    ${W.escapeHtml(
                      complication
                    )}
                  </p>
                `,

              actions:[
                W.copyAction(
                  'Copy Result',
                  `PAVILIONS SOCIAL EVENT
FAILURE WITH CONSEQUENCE
Roll: ${roll}
DC: ${dc}
${complication}`
                )
              ]

            });

          } else {

            W.showModal({

              kicker:
                'SOCIAL FAILURE',

              title:
                'The Event Falls Flat',

              body:
                `
                  <div class="dm-widget-modal-result failure">

                    <strong>
                      FAILED
                    </strong>

                    Roll ${roll}
                    did not reach
                    DC ${dc}.

                  </div>

                  <p>
                    The benefit is not gained,
                    but no additional consequence occurs.
                  </p>
                `

            });

          }

        }
      );

    }

  });



  /* =====================================================
     WIDGET 5
     POTION BREWING
     ===================================================== */

  W.register({

    id:
      'downtime-potion-brewing',

    code:
      'AK-05',

    title:
      'Potion Brewing',

    subtitle:
      'Three-ingredient formula',


    render(){

      const options =
        allIngredients()
          .sort(
            (a,b) =>
              a.name.localeCompare(
                b.name
              )
          )
          .map(
            item =>
              `
                <option
                  value="${W.escapeHtml(
                    item.name
                  )}"
                >
                  ${W.escapeHtml(
                    item.name
                  )}
                </option>
              `
          )
          .join('');


      return `
        <div class="dm-widget-form">

          <label class="dm-widget-field">

            <span>
              Ingredient 1
            </span>

            <select
              data-potion-ingredient
            >

              <option value="">
                Choose...
              </option>

              ${options}

            </select>

          </label>


          <label class="dm-widget-field">

            <span>
              Ingredient 2
            </span>

            <select
              data-potion-ingredient
            >

              <option value="">
                Choose...
              </option>

              ${options}

            </select>

          </label>


          <label class="dm-widget-field">

            <span>
              Ingredient 3
            </span>

            <select
              data-potion-ingredient
            >

              <option value="">
                Choose...
              </option>

              ${options}

            </select>

          </label>

        </div>


        <div class="dm-widget-note">
          Costs 1 Ticket.
          Save the recipe if you want
          to reproduce the same potion later.
        </div>


        <div class="dm-widget-actions">

          <button
            class="dm-widget-button"
            type="button"
            data-potion-brew
          >
            Brew Potion
          </button>

        </div>
      `;

    },


    init(root){

      const ingredientMap =
        new Map(
          allIngredients()
            .map(
              item => [
                item.name,
                item
              ]
            )
        );


function finishPotion(
  category,
  score,
  selected
){

  /*
    Winning attribute score directly selects
    the numbered potion from that category.

    Ingredient rarity therefore naturally
    controls access to stronger potions.
  */

  if(
    score <= 0
  ){

    W.showModal({

      kicker:
        'POTION BREWING',

      title:
        'Inert Brew',

      body:
        `
          <div class="dm-widget-modal-result failure">

            <strong>
              SCORE 0
            </strong>

            The ingredients produce no
            dominant magical resonance.

          </div>

          <p>
            No magical potion is created.
          </p>
        `

    });


    return;

  }


  const potionNumber =
    Math.min(
      60,
      Math.max(
        1,
        Math.floor(
          score
        )
      )
    );


  const potion =
    POTIONS[
      category
    ][
      potionNumber - 1
    ];


  if(!potion){

    W.showModal({

      kicker:
        'POTION BREWING',

      title:
        'Potion Result Missing',

      body:
        `
          <p>
            No potion is configured for
            ${W.escapeHtml(
              category
            )}
            result
            ${potionNumber}.
          </p>
        `

    });


    return;

  }


  const recipe =
    selected
      .map(
        item =>
          item.name
      )
      .join(
        ' + '
      );


  const rarityBreakdown =
    selected.reduce(
      (
        result,
        item
      )=>{

        result[
          item.rarity
        ] += 1;


        return result;

      },
      {
        common:0,
        uncommon:0,
        rare:0
      }
    );


  const potionText =
`POTION

${potion.name}

Type: ${category}
Potion Result: ${potionNumber}

Effect:
${potion.effect}`;


  const recipeText =
`POTION RECIPE

${potion.name}

Type: ${category}
Potion Result: ${potionNumber}
Brewing Score: ${score}

Ingredients:
${selected
  .map(
    item =>
      `• ${item.name} (${titleCase(
        item.rarity
      )})`
  )
  .join('\n')}

Effect:
${potion.effect}`;


  W.showModal({

    kicker:
      'POTION DISCOVERY',

    title:
      potion.name,

    body:
      `
        <div class="dm-widget-modal-result success">

          <strong>
            ${W.escapeHtml(
              category
            )}
            POTION #${potionNumber}
          </strong>

          Brewing Score:
          ${score}

        </div>


        <p>
          <strong>
            Potion Effect
          </strong>
        </p>

        <p>
          ${W.escapeHtml(
            potion.effect
          )}
        </p>


        <div class="dm-widget-note">

          Ingredient Grade:
          ${rarityBreakdown.common}
          Common ·
          ${rarityBreakdown.uncommon}
          Uncommon ·
          ${rarityBreakdown.rare}
          Rare

        </div>


        <p>
          Save the potion for inventory,
          or save the full recipe if you
          want to reproduce it later.
        </p>
      `,

    actions:[

      W.copyAction(
        'Copy Potion',
        potionText
      ),

      W.copyAction(
        'Copy Recipe',
        recipeText
      )

    ]

  });

}

      root.querySelector(
        '[data-potion-brew]'
      ).addEventListener(
        'click',
        ()=>{

          const selected =
            Array.from(
              root.querySelectorAll(
                '[data-potion-ingredient]'
              )
            )
              .map(
                select =>
                  ingredientMap.get(
                    select.value
                  )
              );


          if(
            selected.some(
              item =>
                !item
            )
          ){

            W.showModal({

              kicker:
                'POTION BREWING',

              title:
                'Three Ingredients Needed',

              body:
                `
                  <p>
                    Select all three ingredients
                    before brewing.
                  </p>
                `

            });


            return;

          }


          const scores = {

            Combat:
              selected.reduce(
                (sum,item) =>
                  sum +
                  item.combat,
                0
              ),

            Utility:
              selected.reduce(
                (sum,item) =>
                  sum +
                  item.utility,
                0
              ),

            Whimsy:
              selected.reduce(
                (sum,item) =>
                  sum +
                  item.whimsy,
                0
              )

          };


          const highest =
            Math.max(
              ...Object.values(
                scores
              )
            );


          const leaders =
            Object.entries(
              scores
            )
              .filter(
                ([,value]) =>
                  value ===
                  highest
              )
              .map(
                ([category]) =>
                  category
              );


          if(
            leaders.length ===
            1
          ){

            finishPotion(
              leaders[0],
              highest,
              selected
            );


            return;

          }


          const buttons =
            leaders.map(
              category => ({

                label:
                  `Choose ${category}`,

                onClick(){

                  finishPotion(
                    category,
                    highest,
                    selected
                  );

                }

              })
            );


          W.showModal({

            kicker:
              'POTION BREWING',

            title:
              'Brewing Tie',

            body:
              `
                <div class="dm-widget-scoreboard">

                  <div>

                    <span>
                      Combat
                    </span>

                    <strong>
                      ${scores.Combat}
                    </strong>

                  </div>


                  <div>

                    <span>
                      Utility
                    </span>

                    <strong>
                      ${scores.Utility}
                    </strong>

                  </div>


                  <div>

                    <span>
                      Whimsy
                    </span>

                    <strong>
                      ${scores.Whimsy}
                    </strong>

                  </div>

                </div>

                <p>
                  More than one potion type
                  shares the highest score.
                  The brewer chooses which
                  winning category the potion uses.
                </p>
              `,

            actions:
              buttons

          });

        }
      );

    }

  });



  /* =====================================================
     FUTURE WIDGETS GO BELOW THIS LINE
     ===================================================== */

/* =====================================================
   WIDGET 6
   SENSORY GENERATOR
   ===================================================== */

(function(){

  const W =
    window.epcotDmWidgets;


  if(!W){
    return;
  }


  const SENSORY_TABLES = {

    Wonderful:{

      Sight:[

        'Light ripples like pixie dust across every surface.',
        'Colors bloom brighter than nature allows—storybook vivid.',
        'Lanterns float lazily upward, drifting like forgotten wishes.',
        'Water reflects the world with perfect, shimmering clarity.',
        'Soft golden beams spotlight pathways as if stage-lit.',
        'Butterflies leave glowing trails that fade like tiny firework sparks.',
        'Buildings curve in whimsical shapes—no hard angles.',
        'Every shadow hides something delightful rather than threatening.',
        'Holographic illusions playfully flicker at the edge of vision.',
        'Clouds shape themselves into beloved creatures that wave.',
        'Flowers open in choreographed spirals, like a parade beginning.',
        'Stars twinkle even during the day—Nyx watching with a smile.',
        'Pathways glitter with embedded crystal flecks.',
        'Floating banners animate like living canvas paintings.',
        'Wildlife emerges with oversized, expressive eyes.',
        'Colors shift gently like a pastel kaleidoscope.',
        'Mist curls around ankles like friendly spirits.',
        'Structures rise impossibly high but look feather-light.',
        'Small motes of light gather around PCs, curious.',
        'The horizon looks like a painted backdrop slightly glowing.'

      ],


      Sound:[

        'A dreamy chime plays whenever someone takes a step.',
        'Soft orchestral music swells from no visible source.',
        'Children’s laughter echoes faintly, but warmly.',
        'Wind whistles in perfect harmony with itself.',
        'Tinkling bells respond to movement, like hidden sprites applauding.',
        'Distant fireworks thrum like a heartbeat of celebration.',
        'Trickling streams hum a tune recognizable from childhood.',
        'Floating orbs emit curious, melodic chirps.',
        'A chorus of birds harmonizes like a practiced ensemble.',
        'Wooden structures creak in friendly, familiar rhythms.',
        'Leaves rustle as if whispering encouragement.',
        'Doors open with theatrical whooshes.',
        'Laughter ripples through the air like bubbles.',
        'Echoes return not eerie but playfully distorted.',
        'Every footstep sounds soft and rhythmic, like a parade march.',
        'A distant narrator’s voice warmly describes your journey ahead.',
        'Brass fanfares drift in on the wind.',
        'Magic sparks with a pleasant ping.',
        'The hum of energy thrums like a monorail gliding into station.',
        'Even silence feels full, expectant—like right before a show begins.'

      ],


      Smell:[

        'Fresh popcorn drifting through the breeze.',
        'Sweet vanilla and pastry dough from an unseen bakery.',
        'Gentle citrus and salt air like a perfect beach morning.',
        'Pine and earth after magical rain.',
        'Warm caramel carried by enchanted vents.',
        'Blossoms scented like childhood memory.',
        'Cotton candy with a hint of cool night air.',
        'Crisp linen, as if everything was just freshly cleaned by magic.',
        'Honey and wildflowers from invisible gardens.',
        'A nostalgic blend of old books and warm lantern oil.',
        'Cinnamon drifting from street carts.',
        'Cool mineral scent of a shimmering fountain.',
        'Firework smoke—sweet, not acrid.',
        'Warm spices evocative of festival nights.',
        'Rainbows seem to have a scent: lightly sugary, lightly floral.',
        'Chocolate drifting from unseen kitchens.',
        'Lavender and chamomile calming the atmosphere.',
        'The air smells “new,” like a just-opened attraction.',
        'Clean ozone like freshly cast benevolent magic.',
        'A comforting scent from the PC’s childhood home.'

      ],


      Taste:[

        'A faint sweetness like cotton candy caught on the wind.',
        'A refreshing coolness like peppermint.',
        'Warm vanilla drifting across the tongue.',
        'Air that tastes like crisp apples.',
        'A hint of fresh-baked bread.',
        'Light fizzing like soda bubbles in the mouth.',
        'Chocolate richness as if someone nearby just opened cocoa.',
        'A citrus sparkle that brightens mood instantly.',
        'A buttery flavor like movie-night nostalgia.',
        'Cool water freshness as if from a mountain spring.',
        'Berries bursting in imagined sweetness.',
        'A marshmallow softness, vague but pleasant.',
        'Sugary pastry with notes of cinnamon.',
        'Subtle honeyed warmth.',
        'Sparkling wine without the alcohol—just the effervescence.',
        'Air tastes “golden,” like the smell of fireworks translated into flavor.',
        'Subtle caramel warmth.',
        'A festival treat flavor unique to this place.',
        'Magic itself seems “tasty,” sweet and bright.',
        'A flavor the PC loved as a child.'

      ],


      Touch:[

        'Warmth hugs the skin like sunlight filtered through clouds.',
        'A soft breeze feels like a gentle hand guiding forward.',
        'Surfaces are smooth and welcoming to the touch.',
        'Water is always the perfect temperature.',
        'Magic crackles like super-soft static—pleasant, never painful.',
        'Grass feels impossibly plush underfoot.',
        'Air pressure feels comforting, wrapping softly around you.',
        'Ropes, handles, and rails feel perfectly polished.',
        'Clothing settles more comfortably here, as if magically tailored.',
        'Mist lands on skin like velvet droplets.',
        'Light feels warm when it touches you.',
        'Everything has a faint bounce, like the world itself is cushioned.',
        'Magic pulses near the fingertips like a friendly heartbeat.',
        'Stones feel warm, like they’ve been basking in the sun.',
        'Floors gently adjust underfoot, subtly helping balance.',
        'No drafts feel unpleasant—every breeze feels intentional.',
        'Even mundane objects feel enchanted, lighter in hand.',
        'Water splashes playfully, never soaking unwillingly.',
        'Warmth increases when near something important or heroic.',
        'The world feels alive and glad you’re here.'

      ],


      Emotion:[

        'A burst of childlike excitement with no clear source.',
        'The sense you are stepping into destiny.',
        'A comforting presence watching over you.',
        'Confidence feels easier to hold.',
        'Curiosity overwhelms all fear.',
        'Deep nostalgia tugs at the heart.',
        'Quiet awe settles like dew.',
        'A sudden urge to sing, hum, or laugh.',
        'You feel welcomed, as if expected.',
        'Hope swells like a rising orchestra.',
        'Gratitude for simply being here.',
        'Fear melts into anticipation.',
        'Small joys seem monumental.',
        'Determination sharpens like a hero’s calling.',
        'Warmth fills the chest like gentle embers.',
        'You feel stories forming around you.',
        'Something whispers: “You are meant for greatness.”',
        'Joy bubbles uncontrollably.',
        'Peace settles like a weighted blanket.',
        'You feel part of something wondrous and alive.'

      ]

    },


    Dreadful:{

      Sight:[

        'Lights flicker like dying fireflies.',
        'Animatronic-style movements twitch in living creatures.',
        'Shadows stretch longer than they should—reaching.',
        'Color drains subtly from the world.',
        'Mist hides figures that vanish when focused on.',
        'Empty pathways feel too clean.',
        'Reflections lag behind real motion by half a second.',
        'Statues shift position when unobserved.',
        'Firework embers fall but never touch the ground.',
        'Water looks dark and depthless, swallowing light.',
        'Lanterns sway though there is no wind.',
        'Clouds churn in unnatural spirals overhead.',
        'Architecture bends subtly, as if breathing.',
        'Eyes carved into murals track movement.',
        'Colors saturate too deeply, as if rotting.',
        'Dust motes move independently, swarming.',
        'Footprints appear beside the PCs—not behind them.',
        'Light sources cast multiple overlapping shadows.',
        'Pathways ahead seem shorter than they look behind.',
        'Figures smile too widely, too perfectly.'

      ],


      Sound:[

        'A music box melody plays slightly out of tune.',
        'Footsteps echo from nowhere, perfectly synced with yours.',
        'Air vents whisper in unintelligible voices.',
        'Laughter… but abruptly cut short.',
        'Machinery hums as if preparing a show no one asked for.',
        'Something rustles without movement.',
        'Water drips rhythmically like a countdown.',
        'A cheerful tune slows into a dirge as players approach danger.',
        'A distant scream swallowed immediately by silence.',
        'Whispers just behind the ear—too close.',
        'Wind imitates the voice of someone familiar.',
        'Wood groans like something trapped beneath it.',
        'A parade beat thumps faintly, but no parade arrives.',
        'Something claps once. Loudly.',
        'Breathing is heard from where the PCs just walked.',
        'Machinery clicks like teeth grinding.',
        'Bells chime out of sequence, discordant.',
        'The world goes still, devouring all noise.',
        'A cheerful voice greets you—but it’s distorted.',
        'Heartbeats not your own thrum beneath the ground.'

      ],


      Smell:[

        'The sweet smell of carnival treats… gone sour.',
        'Burned sugar, like fireworks that went wrong.',
        'Rotting wood masked by artificial floral scents.',
        'Ozone heavy enough to sting the nose.',
        'Damp stone and cold metal.',
        'A faintly chemical scent—cleaner, too strong.',
        'Popcorn left out too long, stale and faintly moldy.',
        'Old leather and overheated animatronics.',
        'Plastic melting under unseen heat.',
        'Dust thick enough to coat the tongue.',
        'Something metallic—like fresh blood or rusted steel.',
        'A scent from childhood twisted unnervingly.',
        'Sulfur mingled with cheap perfume.',
        'Stale air locked away for decades.',
        'The sickly-sweet smell of overripe fruit.',
        'Oil leaking from unseen machinery.',
        'Wet fur—close, unseen.',
        'The faint smell of Halloween fog, far too early.',
        'Firework smoke with no fireworks.',
        'A scent that shouldn’t exist—like a memory you never had.'

      ],


      Taste:[

        'Bitter static on the tongue.',
        'Metallic tang as if biting a coin.',
        'Air tastes stale and heavy.',
        'The faint taste of ash.',
        'Something sweet that’s been left out too long.',
        'A cold numbness spreads across the tongue.',
        'Sourness creeping in unexpectedly.',
        'The taste of fear—dry and papery.',
        'Oily aftertaste from the air.',
        'Copper—sharp and unmistakable.',
        'Burnt caramel, acrid and wrong.',
        'Dust coating the mouth.',
        'A phantom coldness like inhaling ice.',
        'Plastic or rubber faintly melted.',
        'Sickly sweetness like spoiled fruit.',
        'A chalky sensation as if biting stone.',
        'Bitter herbs with no source.',
        'The taste of a lie—something familiar but corrupted.',
        'The air feels chewed, as if stale breath lingers.',
        'A flavor that triggers dread without recognition.'

      ],


      Touch:[

        'Air feels too still, pressing on the skin.',
        'Cold drafts brush ankles like hands.',
        'Surfaces feel sticky even when clean.',
        'Mist clings like clutching fingers.',
        'Fabrics feel rougher, heavier, restrictive.',
        'Hair rises from static that has no source.',
        'The ground vibrates almost imperceptibly.',
        'Temperature drops suddenly.',
        'Walls feel warm, as if alive.',
        'Something brushes past but nothing is there.',
        'Water feels thicker than water should.',
        'Railings tremble faintly, like something moving inside them.',
        'The air around magical objects feels sharp, almost biting.',
        'Stone feels damp, pulsing.',
        'A phantom weight rests on a shoulder.',
        'Dust settles on skin faster than normal.',
        'Echoes feel like physical ripples.',
        'Pressure builds behind eyes and temples.',
        'Something tugs at clothing lightly.',
        'The world feels like it’s waiting to close in.'

      ],


      Emotion:[

        'An irrational sense of being watched.',
        'A pit in the stomach with no known cause.',
        'Nostalgia corrupted—something cherished now feels wrong.',
        'Hope drains slowly, like leaking sand.',
        'A sense of déjà vu that shouldn’t be possible.',
        'Hesitation clings to every movement.',
        'The urge to whisper, afraid to break silence.',
        'A creeping fear something is behind you.',
        'Familiar joy feels hollow.',
        'A sudden drop in temperature mirrors sinking dread.',
        'Anger bubbles unprovoked.',
        'Memories feel heavier, almost burdensome.',
        'The feeling that the world is rehearsing something.',
        'Paranoia swells, irrational but persistent.',
        'Old fears resurface sharply.',
        'You feel smaller, diminished.',
        'A whisper of dread tickles the mind: “Turn back.”',
        'A sense that something important is missing.',
        'Pressure on the chest as though the world is holding its breath.',
        'A certainty that something wants your story to end here.'

      ]

    }

  };


  W.register({

    id:
      'sensory-generator',

    code:
      'DM-06',

    title:
      'Sensory Generator',

    subtitle:
      'Wonderful or dreadful detail',


    render(){

      return `
        <div class="dm-widget-form">

          <label class="dm-widget-field">

            <span>
              Tone
            </span>

            <select data-sensory-tone>

              <option>
                Random
              </option>

              <option>
                Wonderful
              </option>

              <option>
                Dreadful
              </option>

            </select>

          </label>


          <label class="dm-widget-field">

            <span>
              Sense
            </span>

            <select data-sensory-sense>

              <option>
                Random
              </option>

              <option>
                Sight
              </option>

              <option>
                Sound
              </option>

              <option>
                Smell
              </option>

              <option>
                Taste
              </option>

              <option>
                Touch
              </option>

              <option>
                Emotion
              </option>

            </select>

          </label>

        </div>


        <div class="dm-widget-actions">

          <button
            class="dm-widget-button"
            type="button"
            data-sensory-generate
          >
            Generate
          </button>

        </div>
      `;

    },


    init(root){

      const toneField =
        root.querySelector(
          '[data-sensory-tone]'
        );


      const senseField =
        root.querySelector(
          '[data-sensory-sense]'
        );


      function generate(){

        const tone =
          toneField.value ===
          'Random'
            ? W.pick([
                'Wonderful',
                'Dreadful'
              ])
            : toneField.value;


        const sense =
          senseField.value ===
          'Random'
            ? W.pick([
                'Sight',
                'Sound',
                'Smell',
                'Taste',
                'Touch',
                'Emotion'
              ])
            : senseField.value;


        const result =
          W.pick(
            SENSORY_TABLES[
              tone
            ][
              sense
            ]
          );


        const copy =
`${tone.toUpperCase()} ${sense.toUpperCase()}

${result}`;


        W.showModal({

          kicker:
            `${tone.toUpperCase()} ${sense.toUpperCase()}`,

          title:
            'Sensory Detail',

          body:
            `
              <div class="dm-widget-modal-result">

                <strong>
                  ${W.escapeHtml(
                    sense
                  )}
                </strong>

                ${W.escapeHtml(
                  result
                )}

              </div>
            `,

          actions:[

            {

              label:
                'Reroll All',

              onClick(){
                generate();
              }

            },

            W.copyAction(
              'Copy Result',
              copy
            )

          ]

        });

      }


      root.querySelector(
        '[data-sensory-generate]'
      )
        .addEventListener(
          'click',
          generate
        );

    }

  });

})();

/* =====================================================
   WIDGET 7
   PRODUCT SOLUTION GENERATOR
   ===================================================== */

(function(){

  const W =
    window.epcotDmWidgets;


  if(!W){
    return;
  }


  const PRODUCT_SOLUTIONS = {

    'Progress Dynamics':{

      slogan:
        'Tomorrow Begins With the Buttons You Press Today',

      products:[

        ['P-Shift Modular Button.','a button with no wiring that “activates progress.”'],
        ['ProgressWave™ Soundbar.','a soundbar that emits a faint hum marketed as “motivational resonance.”'],
        ['CycleFrame Calendar.','a wall calendar with the same month printed on every page.'],
        ['Efficiency Pebble.','a stone placed on a desk to “discipline distraction.”'],
        ['Auto-Prioritizer Pad.','a notebook whose pages all say “Yes!”'],
        ['FlowGrid Wall Panel.','a plastic grid designed to “realign workplace micro-energies.”'],
        ['TomorrowTray.','a food tray with inspirational quotes hidden beneath the plate.'],
        ['Synchrony Clock.','a clock whose hands all point to 12 because “it’s always time.”'],
        ['RefreshBand.','a wristband that vibrates randomly to “prompt renewal.”'],
        ['InspireCard™.','a laminated card that simply says “You Did It!”']

      ],

      assignments:[

        ['Seamless Tomorrow Initiative','a supervisor overheard you say “maybe later” and interpreted it as visionary alignment.'],
        ['Pathway Efficiency Audit','you walked briskly once; your stride was flagged as “innovative locomotion.”'],
        ['Project YES-Flow','you nodded during a meeting and the system logged “radical agreement.”'],
        ['Home Micro-Improvement Rally','a survey bot misread your shrug as approval of a plan.'],
        ['IdeaSeed Observation Log','you paused while walking and an algorithm labeled it “Thoughtful Reflection.”'],
        ['Dynamic Desk Optimization','you moved a paper slightly and cameras recorded “Intent to Innovate.”'],
        ['Atmospheric Morale Study','you inhaled audibly once in an elevator.'],
        ['Personal Progress Pilot','you filled out no forms, which itself was interpreted as disruptive boldness.'],
        ['Forward Momentum Review','your badge got stuck in the scanner and AI labeled you a pioneer.'],
        ['Progress Dynamics Beta Tester','you walked past a kiosk that was signing up volunteers.']

      ]

    },


    VistaCorp:{

      slogan:
        'See the Future From the Window of the Present',

      products:[

        ['Vistalens 360° Window.','a standard-sized window supported by enormous marketing claims.'],
        ['ClarityFrame Goggles.','goggles through which everything looks the same, though the brochure promises “Sharper.”'],
        ['OpenView Curtains.','semi-transparent plastic sheets marketed as “horizon enhancers.”'],
        ['SightSync Desk Lamp.','a desk lamp that flickers arbitrarily to “calibrate visual ambition.”'],
        ['Farsight Tile.','a floor tile with a dot that supposedly “expands perception.”'],
        ['PerceptaPen.','a pen that writes only in faint gray to “reduce cognitive clutter.”'],
        ['Borderless Photo Frame.','a slightly smaller photo frame that “liberates the edges.”'],
        ['Outlook Orb.','a glass ball that does nothing while “illuminating personal vision.”'],
        ['Daybreak Shutters.','shutters painted yellow inside to “improve optimism metrics.”'],
        ['Echoview Notepad.','a stack of blank pages labeled “Your Thoughts Go Here.”']

      ],

      assignments:[

        ['Next-Gen Sightline Mapping','a drone caught you looking around and flagged “Spatial Curiosity.”'],
        ['View Quality Assessment','you stared out a window for a moment and it was interpreted as professional interest.'],
        ['Horizons Benchmark Study','you mentioned the word “see” in casual speech.'],
        ['Color Temperature Review','a coworker complimented your shirt and the algorithm tagged you as an “Aesthetic Leader.”'],
        ['VistaSync Pilot Group','you walked toward a window during sunset.'],
        ['Ambient Light Logging','the system misheard your sneeze as “please.”'],
        ['Panorama Leadership Track','HR claims you demonstrated panoramic thinking by turning your head.'],
        ['Clarity Outreach Taskforce','you blinked three times in a row.'],
        ['Visual Potential Dashboard','you adjusted a curtain in a public space.'],
        ['Multi-Angle Perspective Pilot','you once said “maybe” in a meeting, which scored as flexibility.']

      ]

    },


    Monsanto:{

      slogan:
        'Growing a Future That Looks a Lot Like Yesterday',

      products:[

        ['HarvestCore™ Dial.','a pantry sticker pretending to regulate freshness.'],
        ['GrowGlow Soil Patch.','an LED sticker intended for potted plants.'],
        ['FlavorField Fork.','a fork with a small hole that supposedly “oxygenates taste.”'],
        ['SeedSync Packet.','an empty packet printed with inspirational vegetables.'],
        ['NutrientWave Spray.','scented water marketed as a “Flavor Memory Trigger.”'],
        ['CropCompass Mat.','a placemat printed with arrows pointing toward “growth.”'],
        ['EverSprout Rope.','decorative cord sold as a “root energy enhancer.”'],
        ['BloomTube Vase.','a vase with a tiny fan noise inside that claims to provide a “constant breeze.”'],
        ['AgriPulse Timer.','a timer that beeps randomly to remind users to “nurture.”'],
        ['EcoShelf Wrapper.','plastic shelf wrap labeled a “biological alignment membrane.”']

      ],

      assignments:[

        ['Garden of Harmonized Flavor','you doodled a flower once.'],
        ['Sustainable Mood Tracking','someone said you “seem green today,” which was recorded as environmental passion.'],
        ['Flavor Emotion Survey','you described soup as “fine,” which scored as culinary analysis.'],
        ['Seed Behavior Observation Log','you paused too long near a planter.'],
        ['Pantry Optimization Grid','a camera saw you reach into your cupboard.'],
        ['CropCycle Concept Board','you said “I should eat better,” which was interpreted as agricultural innovation.'],
        ['EcoMood Calibration','a leaf blew past you and the system flagged you as nature-aligned.'],
        ['Root Harmony Index','your shoes had mud on them one day.'],
        ['GustoGrowth Initiative','you ordered a salad.'],
        ['Flavor Forecasting Task','you sniffed something suspiciously.']

      ]

    },


    Fordham:{

      slogan:
        'Forward Motion—Even When Staying Put',

      products:[

        ['PathStream™ Mobility Indicator.','a wristband that glows at random.'],
        ['StrideGlide™ Insoles.','insoles that squeak softly to “motivate steps.”'],
        ['Momentum Loop.','a circle rolled across a desk to “simulate action.”'],
        ['TurnEase Handle Grip.','a doorknob cover that “optimizes rotational effort.”'],
        ['PulseTrack Lanyard.','a lanyard that flashes green whenever it feels like it.'],
        ['ForwardFold Map.','a map with no labels designed to “encourage exploration.”'],
        ['TransitTile.','a floor tile users stand on to “become part of the network.”'],
        ['MoveMate Sticker.','a sticker that says RUN.'],
        ['StrideScope Binoculars.','binoculars held upside down for “future-oriented viewing.”'],
        ['TrailTrace Pen.','a pen that leaves a faint line on the user’s hand as “movement memory.”']

      ],

      assignments:[

        ['Motion Efficiency Audit','you sighed during a walk.'],
        ['Active Pathway Simulation','you walked in a circle once.'],
        ['City Stride Survey','you asked “Where is that?” one time.'],
        ['Forward Momentum Leadership Track','you accidentally stepped backward and the system flagged the anomaly.'],
        ['Locomotion Wellness Check','a smartwatch misread your pulse.'],
        ['Directional Integrity Review','you pointed at something.'],
        ['Personal Trail Mapping','you wandered off the main path one time.'],
        ['Foot Traffic Harmony Report','a camera triangulated your gait.'],
        ['Momentum Capture Initiative','you stuttered while saying “Let’s go.”'],
        ['Multi-Modal Travel Dreamboard','you described a trip once, years ago.']

      ]

    },


    'WestHouse Systems':{

      slogan:
        'The Home That Works—Even If Nothing Else Does',

      products:[

        ['HomeFlow™ Synchronizer.','an empty cube marketed as balancing domestic energies.'],
        ['ComfortCloud Pad.','a soft pad that does nothing while supposedly regulating calm.'],
        ['AmbientSync EchoSpeaker.','a speaker that plays soft clicks at random intervals.'],
        ['BalanceBeam Shelf Divider.','flat plastic dividers labeled “equilibrium.”'],
        ['DailyPulse Clock.','a clock with no numbers.'],
        ['SimpliSwitch.','a switch connected to absolutely nothing.'],
        ['AtmosThread Blanket.','a thin blanket enhanced with “imagination fibers.”'],
        ['NestMod Wall Brick.','a plastic block mounted to a wall to “anchor wellness.”'],
        ['QuietLoop Doorstop.','a rubber wedge that squeaks loudly.'],
        ['Serenity Beacon.','a light that sometimes turns itself off.']

      ],

      assignments:[

        ['Domestic Flow Optimization','you pushed a chair slightly sideways.'],
        ['Household Harmony Indexing','you muttered “ugh” at laundry once.'],
        ['Room Temperature Sentiment Charting','a thermostat glitch named you “Comfort Monitor.”'],
        ['Routine Rhythm Mapping','you repeated a chore at the same time twice.'],
        ['Furniture Vector Alignment','a camera captured you tilting your head at a couch.'],
        ['Domestic Efficiency Diary','you opened a cabinet too hard.'],
        ['Quiet Operation Initiative','you said “shh” once.'],
        ['Light-Level Observation Log','you flipped a switch.'],
        ['Home Functionality Reassessment','you asked “Where is the remote?”'],
        ['Wellness Space Prototype Study','you sighed when entering a room.']

      ]

    },


    'Disney Enterprises':{

      slogan:
        'Dream Responsibly',

      products:[

        ['DreamSpark™ Ambient Lamp.','a lamp with preprogrammed flickers.'],
        ['ImaginEar Buds.','earbuds that play gentle chimes at random.'],
        ['WishFrame.','a picture frame that supposedly responds to imagination but does not.'],
        ['MagicMote Wand.','a remote-control wand to which nothing responds.'],
        ['WonderShimmer Tape.','glitter tape promising “instant magic uplift.”'],
        ['DreamWeave Desk Mat.','a mat covered in printed spirals intended to inspire creativity.'],
        ['SparkFlow Candle.','an electronic candle that smells faintly of factory vanilla.'],
        ['AmbienceCard Deck.','cards covered in abstract symbols used to “tune your mood.”'],
        ['JoyJar.','a jar labeled JOY.'],
        ['MagicTrace Quill.','a normal writing quill that hums slightly.']

      ],

      assignments:[

        ['Creative Renaissance Proposal','you once described something as “cute.”'],
        ['Emotional Color Review','your shirt was a particularly bright color.'],
        ['Sparkle Metrics Trial Group','glitter from a child’s craft rubbed onto you.'],
        ['Wonder Index Study','you stared at a mural.'],
        ['Happiness Vibe Inventory','you smiled reflexively.'],
        ['Aesthetic Enhancement Audit','you asked whether a decoration came in another color.'],
        ['Magic-Level Calibration','a child pointed at you and giggled.'],
        ['Dream Catalyst Pilot','you yawned in a way a sensor tagged as “yearning.”'],
        ['JoyCycle Leadership Initiative','you clapped once.'],
        ['IdeaSpark Showcase','your name was randomly pulled from a volunteer list.']

      ]

    }

  };


  W.register({

    id:
      'product-solution-generator',

    code:
      'CAST-07',

    title:
      'Product Solution Generator',

    subtitle:
      'Character inspiration',


    render(){

      return `
        <div class="dm-widget-form">

          <label class="dm-widget-field">

            <span>
              Company
            </span>

            <select data-product-company>

              <option value="Random">
                Random
              </option>

              ${
                Object.keys(
                  PRODUCT_SOLUTIONS
                )
                  .map(
                    company =>
                      `
                        <option
                          value="${W.escapeHtml(
                            company
                          )}"
                        >
                          ${W.escapeHtml(
                            company
                          )}
                        </option>
                      `
                  )
                  .join('')
              }

            </select>

          </label>

        </div>


        <div class="dm-widget-note">
          Generates a revolutionary product
          and the strange corporate logic
          that assigned you to it.
        </div>


        <div class="dm-widget-actions">

          <button
            class="dm-widget-button"
            type="button"
            data-product-generate
          >
            Generate
          </button>

        </div>
      `;

    },


    init(root){

      const companyField =
        root.querySelector(
          '[data-product-company]'
        );


      function generate(){

        const companies =
          Object.keys(
            PRODUCT_SOLUTIONS
          );


        const company =
          companyField.value ===
          'Random'
            ? W.pick(
                companies
              )
            : companyField.value;


        const data =
          PRODUCT_SOLUTIONS[
            company
          ];


        const product =
          W.pick(
            data.products
          );


        const assignment =
          W.pick(
            data.assignments
          );


        const sentence =
`${company} — ${assignment[0]}

You are demonstrating “${data.slogan}” through your innovative and revolutionary product/service, the ${product[0]} This amazing product or service is ${product[1]}

You were selected for this production team when ${assignment[1]}`;


        W.showModal({

          kicker:
            company.toUpperCase(),

          title:
            assignment[0],

          body:
            `
              <p>
                You are demonstrating
                <strong>
                  “${W.escapeHtml(
                    data.slogan
                  )}”
                </strong>
                through your innovative and
                revolutionary product,
                the
                <strong>
                  ${W.escapeHtml(
                    product[0]
                  )}
                </strong>
              </p>

              <p>
                This amazing product or service
                is
                ${W.escapeHtml(
                  product[1]
                )}
              </p>

              <div class="dm-widget-modal-result">

                <strong>
                  Why You?
                </strong>

                You were selected for this
                production team when
                ${W.escapeHtml(
                  assignment[1]
                )}

              </div>
            `,

          actions:[

            {

              label:
                'Reroll All',

              onClick(){
                generate();
              }

            },

            W.copyAction(
              'Copy Result',
              sentence
            )

          ]

        });

      }


      root.querySelector(
        '[data-product-generate]'
      )
        .addEventListener(
          'click',
          generate
        );

    }

  });

})();

/* =====================================================
   WIDGET 8
   LOOT GENERATOR

   DM ONLY
   UNBOUND SUPPORT TOOL

   Flow:
   Level
      ↓
   Selected Loot Types
      ↓
   GP / Hoard GP
      ↓
   Number of Magic Items
      ↓
   Individual Rarity Roll
      ↓
   Category Roll
      ↓
   Final Item
   ===================================================== */

(function(){

  const W =
    window.epcotDmWidgets;


  if(!W){
    return;
  }


  /* =====================================================
     BASIC DATA HELPERS
     ===================================================== */

  function lines(text){

    return String(text)
      .trim()
      .split('\n')
      .map(
        item =>
          item.trim()
      )
      .filter(Boolean);

  }


  function pairs(text){

    return lines(text)
      .map(
        line => {

          const marker =
            line.indexOf(' :: ');


          if(marker === -1){

            return {
              name:line,
              effect:''
            };

          }


          return {

            name:
              line.slice(
                0,
                marker
              ),

            effect:
              line.slice(
                marker + 4
              )

          };

        }
      );

  }


  const RARITY_ORDER = [
    'Common',
    'Uncommon',
    'Rare',
    'Very Rare',
    'Legendary'
  ];


  function increaseRarity(
    rarity
  ){

    const index =
      RARITY_ORDER.indexOf(
        rarity
      );


    if(
      index === -1
    ){
      return rarity;
    }


    return RARITY_ORDER[
      Math.min(
        index + 1,
        RARITY_ORDER.length - 1
      )
    ];

  }


  function rollRange(
    table
  ){

    const value =
      W.randomInt(
        1,
        100
      );


    const found =
      table.find(
        row =>
          value <=
          row.max
      );


    return {
      roll:value,
      value:found?.value || null
    };

  }


  /* =====================================================
     LEVEL RULES
     ===================================================== */

  const LEVEL_BANDS = {

    '1-4':{

      label:
        'Levels 1–4',

      magicCount(){

        return Math.max(
          0,
          W.roll(
            1,
            4
          ).total - 1
        );

      },

      magicFormula:
        '1d4 − 1',

      gp(){

        const result =
          W.roll(
            3,
            6
          );


        return {
          value:
            result.total,

          formula:
            `3d6 [${result.results.join(', ')}]`
        };

      },

      hoard(){

        const result =
          W.roll(
            2,
            4
          );


        return {
          value:
            result.total *
            100,

          formula:
            `2d4 × 100 [${result.results.join(', ')}]`
        };

      }

    },


    '5-10':{

      label:
        'Levels 5–10',

      magicCount(){

        return W.roll(
          1,
          3
        ).total;

      },

      magicFormula:
        '1d3',

      gp(){

        const result =
          W.roll(
            2,
            8
          );


        return {
          value:
            result.total *
            10,

          formula:
            `2d8 × 10 [${result.results.join(', ')}]`
        };

      },

      hoard(){

        const result =
          W.roll(
            8,
            100
          );


        return {
          value:
            result.total *
            100,

          formula:
            `8d100 × 100 [${result.results.join(', ')}]`
        };

      }

    },


    '11-16':{

      label:
        'Levels 11–16',

      magicCount(){

        return W.roll(
          1,
          4
        ).total;

      },

      magicFormula:
        '1d4',

      gp(){

        const result =
          W.roll(
            2,
            10
          );


        return {
          value:
            result.total *
            10,

          formula:
            `2d10 × 10 [${result.results.join(', ')}]`
        };

      },

      hoard(){

        const result =
          W.roll(
            8,
            8
          );


        return {
          value:
            result.total *
            1000,

          formula:
            `8d8 × 1,000 [${result.results.join(', ')}]`
        };

      }

    },


    '17-20':{

      label:
        'Levels 17–20',

      magicCount(){

        return W.roll(
          1,
          6
        ).total;

      },

      magicFormula:
        '1d6',

      gp(){

        const result =
          W.roll(
            2,
            8
          );


        return {
          value:
            result.total *
            100,

          formula:
            `2d8 × 100 [${result.results.join(', ')}]`
        };

      },

      hoard(){

        const result =
          W.roll(
            6,
            10
          );


        return {
          value:
            result.total *
            10000,

          formula:
            `6d10 × 10,000 [${result.results.join(', ')}]`
        };

      }

    }

  };


  /* =====================================================
     MAGIC ITEM RARITY

     Every item receives its own d100 roll.
     ===================================================== */

  function rollRarity(
    band
  ){

    const roll =
      W.randomInt(
        1,
        100
      );


    let rarity =
      'Common';


    if(
      band ===
      '1-4'
    ){

      if(
        roll <=
        54
      ){

        rarity =
          'Common';

      } else if(
        roll <=
        91
      ){

        rarity =
          'Uncommon';

      } else {

        rarity =
          'Rare';

      }

    }


    if(
      band ===
      '5-10'
    ){

      if(
        roll <=
        30
      ){

        rarity =
          'Common';

      } else if(
        roll <=
        81
      ){

        rarity =
          'Uncommon';

      } else if(
        roll <=
        98
      ){

        rarity =
          'Rare';

      } else {

        rarity =
          'Very Rare';

      }

    }


    if(
      band ===
      '11-16'
    ){

      if(
        roll <=
        11
      ){

        rarity =
          'Common';

      } else if(
        roll <=
        34
      ){

        rarity =
          'Uncommon';

      } else if(
        roll <=
        70
      ){

        rarity =
          'Rare';

      } else if(
        roll <=
        93
      ){

        rarity =
          'Very Rare';

      } else {

        rarity =
          'Legendary';

      }

    }


    if(
      band ===
      '17-20'
    ){

      if(
        roll <=
        20
      ){

        rarity =
          'Rare';

      } else if(
        roll <=
        64
      ){

        rarity =
          'Very Rare';

      } else {

        rarity =
          'Legendary';

      }

    }


    return {
      roll,
      rarity
    };

  }


  /* =====================================================
     CATEGORY ROLL

     1 Arcane Implement
     2 Armor
     3 Ring
     4 Spell
     5 Weapon
     6 Wondrous Item
     7 Potion
     8 Increase rarity and reroll category
     ===================================================== */

  const CATEGORY_BY_ROLL = {

    1:
      'Arcane Implement',

    2:
      'Armor',

    3:
      'Ring',

    4:
      'Spell',

    5:
      'Weapon',

    6:
      'Wondrous Item',

    7:
      'Potion'

  };


  function rollCategory(
    startingRarity
  ){

    let rarity =
      startingRarity;


    let boosts =
      0;


    let roll =
      W.randomInt(
        1,
        8
      );


    while(
      roll === 8
    ){

      rarity =
        increaseRarity(
          rarity
        );


      boosts += 1;


      roll =
        W.randomInt(
          1,
          8
        );

    }


    return {

      category:
        CATEGORY_BY_ROLL[
          roll
        ],

      categoryRoll:
        roll,

      rarity,

      boosts

    };

  }


  /* =====================================================
     COMMON BASE ARCANE IMPLEMENTS
     ===================================================== */

  const COMMON_ARCANE_BASES =
    lines(`
Carved wooden wand
Smooth ash wand
Twisted willow wand
Simple oak staff
Walking stick with carved animal head
Training rod made of lacquered bamboo
Branch-like staff with tiny knots
Metal rod capped with steel
Polished birch wand
Traveler’s quarterstaff
Decorative rod with no magic
Plain driftwood wand
    `);


  /* =====================================================
     UNCOMMON ARCANE IMPLEMENT ENCHANTMENTS
     ===================================================== */

  const UNCOMMON_ARCANE =
    pairs(`
of Lanternlight Bolts :: Once per day, your next spell sheds bright light in 20 feet.
of Dreamlight Traces :: Reduce psychic damage taken by 1d6 once per rest.
of Animated Spark :: Small motes dance around the implement.
of Forest Guidance :: +1 to Nature checks and +1 to Survival checks in forests.
of Helpful Sidekicks :: Add +1 to a spell attack roll once per long rest.
of Sparkling Clean Casting :: The implement never gets dirty and spell somatics look pristine.
of Trolley Momentum :: Advantage on concentration checks after moving 10 or more feet.
of Harmonic Wandwork :: +1 to Performance when using spellcasting gestures.
of Brave Spellcraft :: Once per day, reroll a failed save to maintain concentration.
of Hidden Glimmer Detection :: Cast Detect Magic once per day without components.
of Fairy Dust Arc :: Your first spell after a long rest deals +1 radiant damage.
of Optimistic Casting :: Gain +1 to Initiative.
of Crafting Sparks :: Conjure tiny harmless sparks useful for light crafting.
of Royal Presence :: +1 to Persuasion while holding the implement.
of Firefly Arcana :: Advantage on Arcana checks involving magical creatures.
of Villain’s Flaire :: +1 to Intimidation.
of Acrobat’s Focus :: +1 to Acrobatics while wielded.
of EPCOT Calibration :: Advantage on Arcana checks involving constructs and machinery.
of Carousel Pulse :: Once per day add +1 to a Constitution save.
of Calming Crystal :: Advantage against charm.
of Splashing Spellcraft :: Create tiny water illusions.
of Monorail Surge :: Once per day gain +10 feet of movement for 1 round after casting a spell.
of Laugh-Fed Focus :: Reduce psychic damage taken by 1.
of Explorer’s Resonance :: +1 to Investigation.
of Glamour Casting :: Cast Minor Illusion once per day.
of Tinkerer’s Beam :: Your spells shed harmless arcane schematics.
of Animated Companionship :: The implement taps rhythmically when impatient.
of Concert Echo :: Once per day add +1 thunder damage to a spell.
of Poison Apple Warding :: Advantage on your next save against poison once per day.
of Teacup Twirl :: +1 to Dexterity saves while holding the implement.
of Sure-Spiral Grip :: Advantage against being disarmed.
of Fireworks Echo :: A missed spell attack produces harmless sparks.
of Choir Harmony :: Once per day, allies gain +1 to their next saving throw.
of Villain’s Minor Hex :: Once per day add +1d4 to Intimidation.
of Mirror-Flash Cantrip :: Cast Light once per day.
of Lost-Boy Misfire :: Once per day reroll a spell attack if you are hidden.
of Snowglobe Sight :: Ignore obscured-vision penalties caused by snowfall.
of Shadow Trinket Focus :: +1 to Sleight of Hand.
of Festival Beat :: +1 Initiative the first time you cast a spell each combat.
of Pirate’s Swagger :: Once per long rest add +1 to a spell attack roll.
of Gummi Charge :: Ignore the first 5 feet of difficult terrain for 1 round after casting.
of Spark-Tracer :: +1 Arcana when deciphering runes.
of River Spirit Breath :: +1 to checks made near natural water.
of Spotlight Beam :: Once per day a spell creates a 10-foot spotlight.
of Haunted Fog :: Once per day become lightly obscured for 1 round after casting.
of Sage’s Thought :: +1 Insight.
of Coronation Radiance :: Advantage on one Charisma save per long rest.
of Animated Echo :: The implement faintly echoes your casting gestures.
of EPCOT Memory Sync :: Recall the previous 6 seconds flawlessly.
of the Little Wish :: Once per long rest treat a spell attack roll as a 10 before modifiers.
    `);


  const RARE_ARCANE =
    pairs(`
of the Wishing Star’s Beam :: Once per day treat a spell attack roll as a natural 20 for damage only.
of the Storyborn Sorcerer :: Cast Misty Step once per short rest after casting a leveled spell.
of the Everlasting Kingdom’s Herald :: Allies within 10 feet gain +1 to spell attack rolls.
of Royal Metamorphosis :: Once per day gain 10 temporary HP while transforming your casting form.
of Titan-Song Reverberation :: Spells deal +1 thunder damage and critical hits can deafen.
of Maleficent’s Thorns :: When struck by a melee attack, deal 1d6 force damage back to the attacker.
of Ursula’s Commanding Coil :: Once per day silence a creature hit by one of your spells, Constitution save applies.
of the Genie’s Empowered Wish :: Once per day cast Enhance Ability at 3rd level without components.
of EPCOT Nova Conduit :: Once per short rest reduce incoming damage by 10.
of the Lion King’s Spiritcall :: When you defeat a foe with a spell, nearby enemies must save or become frightened.
of Winter’s Final Frost :: Cold spells deal +1 cold damage and critical hits reduce speed by 10 feet.
of the Grand Illumination :: Once per day create a 30-foot aura granting allies +2 AC and advantage on saves for 1 minute.
of the Shadow Queen’s Dominion :: Advantage on spell attacks made in dim light or darkness.
of the Forest Guardian’s Pact :: Once per day vines restrain a creature hit by your spell, Dexterity save applies.
of the Last Dragon’s Rise :: Once per day maximize the damage of a spell.
of the Great Mouse’s Miracle :: Once per day reroll all spell damage dice showing 1.
of the Oceanheart’s Surge :: Lightning spells deal +1d6 lightning damage near water.
of Tomorrowland’s Starflight :: Once per day gain a 30-foot flying speed for 1 round after casting.
of the Nova Horizon :: Once per long rest create a 30-foot line dealing 3d6 radiant force as part of a spell.
of the Storybook Ascendant :: Once per week, dropping to 0 HP instead leaves you at 1 HP and grants advantage on spell attacks for 1 minute.
    `);


  /* =====================================================
     HIGH-TIER ARCANE IMPLEMENTS
     ===================================================== */

  const VERY_RARE_ARCANE =
    lines(`
Enspelled Staff (level 4 or 5 spell)
Rod of Absorption
Rod of Security
Rod of the Pact Keeper, +3
Staff of Fire
Staff of Frost
Staff of Power
Staff of Striking
Staff of Thunder and Lightning
Wand of Polymorph
Wand of the War Mage, +3
    `);


  const LEGENDARY_ARCANE =
    lines(`
Enspelled Staff (level 6, 7, or 8 spell)
Rod of Resurrection
Staff of the Magi
    `);


  /* =====================================================
     COMMON ARMOR

     Weighted from original d100 table.
     ===================================================== */

  const COMMON_ARMOR = [

    {
      max:5,
      value:{
        name:'Padded Armor',
        effect:'Light Armor · AC 11 + Dex · Stealth disadvantage.'
      }
    },

    {
      max:15,
      value:{
        name:'Leather Armor',
        effect:'Light Armor · AC 11 + Dex.'
      }
    },

    {
      max:25,
      value:{
        name:'Studded Leather',
        effect:'Light Armor · AC 12 + Dex.'
      }
    },

    {
      max:30,
      value:{
        name:'Hide',
        effect:'Medium Armor · AC 12 + Dex, maximum +2.'
      }
    },

    {
      max:35,
      value:{
        name:'Chain Shirt',
        effect:'Medium Armor · AC 13 + Dex, maximum +2.'
      }
    },

    {
      max:42,
      value:{
        name:'Scale Mail',
        effect:'Medium Armor · AC 14 + Dex, maximum +2 · Stealth disadvantage.'
      }
    },

    {
      max:50,
      value:{
        name:'Breastplate',
        effect:'Medium Armor · AC 14 + Dex, maximum +2.'
      }
    },

    {
      max:55,
      value:{
        name:'Half Plate',
        effect:'Medium Armor · AC 15 + Dex, maximum +2 · Stealth disadvantage.'
      }
    },

    {
      max:60,
      value:{
        name:'Ring Mail',
        effect:'Heavy Armor · AC 14 · Stealth disadvantage.'
      }
    },

    {
      max:70,
      value:{
        name:'Chain Mail',
        effect:'Heavy Armor · AC 16 · Strength 13 required · Stealth disadvantage.'
      }
    },

    {
      max:75,
      value:{
        name:'Splint',
        effect:'Heavy Armor · AC 17 · Strength 15 required · Stealth disadvantage.'
      }
    },

    {
      max:85,
      value:{
        name:'Plate',
        effect:'Heavy Armor · AC 18 · Strength 15 required · Stealth disadvantage.'
      }
    },

    {
      max:100,
      value:{
        name:'Shield',
        effect:'+2 AC.'
      }
    }

  ];


  const UNCOMMON_ARMOR =
    pairs(`
of Lanternlight Vigil :: Once per long rest, shed warm golden light in 20 feet as an action.
of Dreamlight Drifting :: Advantage on saves against magical sleep or drowsiness.
of Pixar Bounce :: Reduce fall damage by 1d6.
of Enchanted Forest Guide :: Advantage on Survival checks to track or navigate.
of Sidekick Whispers :: Once per day gain +2 to one ability check after faint phantom encouragement.
of Sparkling Cleanliness :: The armor never gets dirty.
of Trolley Troubles :: Advantage on checks to avoid being knocked prone.
of Singing Stone :: Gain advantage on Performance checks involving singing.
of Storybook Courage :: Once per long rest gain +1 to a saving throw.
of Hidden Mickeys :: Automatically notice magical sigils or runes within 5 feet.
of Fairy Dust Flicker :: Once per long rest hover 1 inch above the ground for 1 minute.
of Optimistic Echoes :: Once per long rest gain advantage against being frightened.
of Whistle While You Work :: Advantage on repair or crafting checks made during short rests.
of Royal Flair :: +1 Persuasion.
of Rogue’s Firefly :: Produce a tiny harmless mote of light.
of Villainous Laughtrack :: Gain advantage on Intimidation if you cackle beforehand.
of Court Jester’s Bounce :: +1 Acrobatics.
of EPCOT Efficiency :: Complete travel and labor about 10 percent faster.
of Carousel Resilience :: Once per day reroll a failed Constitution save against exhaustion.
of Crystal Lake Calm :: Advantage on Wisdom saves against charm.
of Sorcerer’s Apprentice Drip :: Produce small water splashes and never become uncomfortably hot.
of Monorail Momentum :: Once per day gain +5 feet walking speed for 10 minutes.
of Laugh Floor Levity :: Once per rest reduce psychic damage by 1d6.
of Wilderness Explorer Badges :: Gain proficiency in one tool of your choice each dawn.
of Grim Grinning Glamour :: Cast Disguise Self once per day.
of Tomorrowland Charge :: Advantage on checks to operate or understand arcane machinery.
of Living Cupboard Clatter :: The armor harmlessly reorganizes carried small objects.
of Kinetic Concert :: +1 on saves against thunder damage.
of Poison Apple Warning :: Once per long rest gain advantage on a save against poison.
of Spinning Tea Cup Twist :: Advantage against being grappled.
of Ol’ Reliable :: Advantage on saves against being disarmed.
of Fireworks Finale :: When critically hit, harmless sparks impose disadvantage on the attacker’s next attack.
of Singing Sword Harmony :: Allies within 10 feet gain +1 to their next Wisdom save.
of Villain’s Boon (Minor) :: Once per day gain +2 to Intimidation.
of Magic Mirror Glints :: Once per long rest detect magic for 1 minute.
of Lost Boy Mischief :: Advantage against restraints such as ropes, vines, or nets.
of Snowglobe Serenity :: Cold weather imposes no penalties.
of Shadow Market Trinkets :: +1 Sleight of Hand.
of Festival Glow :: Friendly creatures have advantage to find you in a crowd.
of Pirate’s Swagger (Minor) :: Once per long rest gain +1 Initiative.
of Gummi Bears Bounce :: When Dashing, ignore the first 5 feet of difficult terrain.
of Tinkerer’s Spark :: +1 Arcana involving constructs or enchantments.
of River Spirit Blessing :: +1 to checks made in or near natural water.
of Stage Spotlight :: As an action create a harmless spotlight centered on you for 1 minute.
of Haunted Mansion Breeze :: Once per rest become lightly obscured by swirling fog.
of Royal Advisor’s Insight :: +1 Insight.
of Coronation Confidence :: Once per day gain advantage on a Charisma save.
of Animation Quirk :: A tiny part of the armor becomes harmlessly semi-sentient.
of EPCOT Archives :: Perfectly recall any fact learned today.
of Mini-Wish :: Once per long rest treat a failed check as though the d20 showed 10 before modifiers.
    `);


  const RARE_ARMOR =
    pairs(`
of True Love’s Triumph :: Once per long rest, when you fail a save, an ally within 30 feet may choose to succeed it for you.
of Lighthouse of the Heart :: Allies within 10 feet gain +1 to all saving throws.
of Wishing Star’s Favor :: Once per long rest treat a non-attack d20 roll as a natural 20.
of Sorcerer Supreme’s Mantle :: Cast Misty Step once per short rest without components.
of Royal Transformation :: Once per day transform into regal form and gain 5 temporary HP.
of Titan-Song Fortitude :: Gain resistance to thunder and force damage.
of Maleficent Thorns :: A creature that hits you with a melee attack takes 1d6 piercing damage.
of Ursula’s Contract :: Once per long rest steal a creature’s voice for 1 minute, Constitution save applies.
of Genie’s Small Wish :: Once per day cast Enhance Ability without components.
of EPCOT Prototype Shielding :: Once per short rest use a reaction to reduce incoming damage by 10.
of Spirit of the Lion King :: Once per day, dropping to 0 HP instead leaves you at 1 HP.
of Winter’s Final Frost :: Gain cold resistance and hostile creatures within 5 feet treat the ground as difficult terrain.
of The Great Illumination :: Once per day create a 30-foot aura granting allies +2 AC for 1 minute.
of Shadow Queen’s Majesty :: Advantage on Charisma saves and cast Darkness centered on yourself once per day.
of Evergreen Forest Guardians :: Once per long rest tiny spirits grant +2 to one save or check.
of The Last Dragon’s Spark :: Advantage on death saves and maximize healing received once per long rest.
of The Great Mouse’s Miracle :: Once per day reroll a natural 1 on a save, ability check, or attack.
of Moana’s Oceanheart :: Once per rest use a reaction to halve fire or lightning damage.
of Tomorrowland Nova Core :: Once per day fly up to 30 feet as movement without provoking opportunity attacks.
of Storybook Ending :: Once per long rest, if you would die, survive at 1 HP and gain advantage on all rolls for 1 minute.
    `);


  const VERY_RARE_ARMOR =
    lines(`
Animated Shield
Armor, +2
Demon Armor
Dragon Scale Mail
Dwarven Plate
Enspelled Armor (level 4 or 5 spell)
Shield, +3
Shield of the Cavalier
Spellguard Shield
    `);


  const LEGENDARY_ARMOR =
    lines(`
Armor, +3
Armor of Invulnerability
Efreeti Chain
Enspelled Armor (level 6, 7, or 8 spell)
Plate Armor of Etherealness
    `);


  /* =====================================================
     RINGS
     ===================================================== */

  const COMMON_RINGS =
    lines(`
Simple Copper Band
Engraved Copper Ring
Worn Brass Ring
Silver Band, Polished
Silver Ring with Small Carved Glyph
Gold Ring, Plain
Gold Ring with Hammered Pattern
Iron Signet Ring
Pewter Ring with Tiny Etched Star
Braided Leather Ring
Bone Ring
Wooden Ring with Inlaid Shell
    `);


  const UNCOMMON_RINGS =
    pairs(`
Ring of Lanternlight Warmth :: Gain advantage on one saving throw against fear per long rest.
Ring of Dreamlight Calm :: Once per day reduce incoming psychic damage by 1d6.
Ring of Pixar Spark :: +1 Acrobatics.
Ring of Forest Whisper :: Advantage on Survival in natural environments.
Ring of Friendly Sidekicks :: Once per long rest add +2 to any ability check after seeing the roll.
Ring of Sparkling Purity :: Your hands and ring never get dirty.
Ring of Trolley Balance :: Advantage against being knocked prone.
Ring of Songheart :: +1 Performance when singing.
Ring of Storybook Courage :: Once per long rest gain +2 to one saving throw.
Ring of Hidden Glimmers :: Detect faint magical auras within 5 feet.
Ring of Fairy Dust Drift :: Reduce fall damage by 1d6.
Ring of Optimistic Fortune :: +1 Initiative.
Ring of Cheerful Crafting :: Work about 10 percent faster on crafting and repair tasks.
Ring of Royal Manner :: +1 Persuasion.
Ring of Firefly Focus :: Advantage on Perception in dim light.
Ring of Villain’s Grin :: +1 Intimidation.
Ring of Jester’s Step :: +1 Acrobatics.
Ring of Efficient Pavilions :: Once per long rest take the Use Object action as a bonus action.
Ring of Carousel Endurance :: Once per long rest reroll a failed Constitution save against exhaustion.
Ring of Crystal Mirror Calm :: Advantage against charm.
Ring of Apprentice’s Splash :: Create small magical water effects.
Ring of Monorail Moment :: Once per rest gain +10 feet movement for 1 round.
Ring of Laugh Floor Levity :: Reduce psychic damage by 1.
Ring of Explorer’s Eye :: +1 Investigation.
Ring of Glamour Veil :: Cast Disguise Self once per day.
Ring of Proto-Engineering :: +1 Arcana involving constructs or magic items.
Ring of Animated Charm :: The ring expresses mood by glowing faintly.
Ring of Concert Echo :: Once per long rest add +1 thunder damage to one hit or spell.
Ring of Poison Apple Sense :: Once per long rest gain advantage on a save against poison.
Ring of Teacup Pivot :: Advantage when escaping grapples.
Ring of Steadfast Grip :: Advantage on checks to hold ropes, ladders, or edges.
Ring of Fireworks Flicker :: Once per long rest add +1 after failing a Dexterity save.
Ring of Resonant Harmony :: Once per day allies within 5 feet gain +1 to their next saving throw.
Ring of Villain’s Wink :: Once per long rest gain +2 Intimidation.
Ring of Mirrorflash :: Once per day give one creature disadvantage on its next Perception check.
Ring of Lost-Boy Luck :: Once per long rest gain advantage on Stealth.
Ring of Snowglobe Chill :: Ignore penalties from extreme cold.
Ring of Shadow Trinkets :: +1 Sleight of Hand.
Ring of Festival Pulse :: Once per day gain 2 temporary HP when initiative is rolled.
Ring of Pirate’s Swagger (Minor) :: Once per long rest add +1 to a melee attack roll.
Ring of Gummi Momentum :: Ignore the first 5 feet of difficult terrain each turn.
Ring of Spark-Tinkering :: +1 Arcana while inspecting runes.
Ring of River Spirit Calm :: +1 to checks near natural water.
Ring of Spotlight Charm :: Once per day create a 10-foot spotlight centered on yourself.
Ring of Mansion Mist :: Once per rest become lightly obscured for 1 round.
Ring of Advisor’s Insight :: +1 Insight.
Ring of Coronation Glow :: Once per day gain advantage on a Charisma save.
Ring of Animated Antics :: Produce tiny comedic illusions.
Ring of EPCOT Recall :: Perfectly remember the last conversation.
Ring of Mini-Wish :: Once per long rest treat an ability-check d20 as a 10 before modifiers.
    `);


  const RARE_RINGS =
    pairs(`
Ring of True Love’s Triumph :: Once per long rest, when you fail a save, an ally within 30 feet may choose to succeed it for you.
Ring of the Wishing Star’s Blessing :: Once per long rest treat any non-attack d20 roll as a natural 20.
Ring of the Everlasting Kingdom :: Allies within 10 feet gain +1 to saving throws.
Ring of the Sorcerer Supreme :: Cast Misty Step once per short rest.
Ring of Royal Metamorphosis :: Once per long rest gain 10 temporary HP for 1 minute.
Ring of Titanborn Fortitude :: Resistance to thunder and force damage.
Ring of Maleficent’s Thorns :: A creature that hits you with a melee attack takes 1d6 piercing damage.
Ring of Ursula’s Pact :: Once per long rest silence a target for 1 minute, Constitution save applies.
Ring of Genie’s Small Wish :: Once per day cast Enhance Ability at 3rd level.
Ring of EPCOT Nova Shielding :: Once per short rest use a reaction to reduce incoming damage by 10.
Ring of the Lion King’s Roar :: When you reduce a creature to 0 HP, nearby enemies must save or become frightened.
Ring of Winter’s Crown :: Cold resistance and hostile creatures within 5 feet treat the ground as difficult terrain.
Ring of the Great Illumination :: Once per long rest create a 30-foot aura granting allies +2 AC for 1 minute.
Ring of the Shadow Queen :: Advantage on attacks and Charisma checks in dim light or darkness.
Ring of the Guardian Spirits :: Once per day gain advantage on any roll after seeing it.
Ring of the Last Dragon’s Spark :: Once per long rest maximize one damage roll.
Ring of the Great Mouse’s Miracle :: Once per day reroll all damage dice that show 1.
Ring of Moana’s Oceanheart :: Fire resistance and once per rest halve lightning damage.
Ring of Tomorrowland’s Nova Circuit :: Once per long rest gain a 30-foot flying speed for 1 round.
Ring of the Storybook Ending :: Once per week, if you would die, drop to 1 HP and gain advantage on all rolls for 1 minute.
    `);


  const VERY_RARE_RINGS =
    lines(`
Ring of Regeneration
Ring of Shooting Stars
Ring of Telekinesis
    `);


  const LEGENDARY_RINGS =
    lines(`
Ring of Djinni Summoning
Ring of Elemental Command
Ring of Invisibility
Ring of Spell Turning
Ring of Three Wishes
    `);


  /* =====================================================
     SPELL SCROLLS
     ===================================================== */

  const COMMON_SPELLS =
    lines(`
Cure Wounds
Magic Missile
Shield
Detect Magic
Faerie Fire
Feather Fall
Bless
Thunderwave
Disguise Self
Expeditious Retreat
Fog Cloud
Protection from Evil and Good
Lesser Restoration
Scorching Ray
Shatter
Invisibility
Mirror Image
Hold Person
Misty Step
Aid
    `);


  const UNCOMMON_SPELLS =
    pairs(`
Scroll of Lanternlight Empowerment :: The next spell you cast sheds bright light and its target glows faintly for 1 round.
Scroll of Dreamlight Harmonization :: Your next spell gains +1 to its spell attack roll or +1 to its save DC.
Scroll of Fairytale Echo :: Create harmless storybook sparkles and symbols around the spell.
Scroll of Sidekick Surge :: If the spell restores HP, each creature healed regains 1 additional HP.
Scroll of Optimistic Casting :: Gain +1 Initiative the next time you roll it.
Scroll of Trolley Momentum :: After casting the spell, immediately move 5 feet without provoking opportunity attacks.
Scroll of Teacup Twist :: Gain advantage on your next Dexterity save within 10 minutes.
Scroll of Firework Spark :: If the spell deals damage, add +1 thunder damage to one creature.
Scroll of EPCOT Precision :: Increase the spell’s range by 10 percent, rounded up.
Scroll of Whisperwind Insight :: After casting, gain +1 to your next ability check.
    `);


  const RARE_SPELLS =
    pairs(`
Scroll of the Wishing Star’s Surge :: Treat one damage die from the spell as its maximum value.
Scroll of Storybook Transcendence :: Gain advantage on the spell attack after seeing the roll.
Scroll of Titan-Song Amplification :: Add +1d4 thunder damage to one creature affected by the spell.
Scroll of Royal Metamorphosis :: When you cast the spell, gain 5 temporary HP.
Scroll of Ursula’s Binding Whisper :: One target has disadvantage on its saving throw against the spell.
Scroll of Maleficent’s Curseflare :: If the spell deals damage, change its damage type to necrotic or force.
Scroll of the Sorcerer Supreme :: After casting the spell, cast Misty Step as a free action.
Scroll of the Great Illumination :: Allies within 10 feet gain +1 AC until your next turn.
Scroll of Tomorrowland Overclocking :: Double the spell’s duration, to a maximum of 1 minute.
Scroll of the Final Storybeat :: If the spell reduces a creature to 0 HP, gain advantage on all rolls for 1 round.
    `);


  const VERY_RARE_SPELLS =
    lines(`
Spell Scroll (level 6)
Spell Scroll (level 7)
Spell Scroll (level 8)
    `);


  const LEGENDARY_SPELLS =
    lines(`
Spell Scroll (level 9)
Scroll of Titan Summoning
    `);


  /* =====================================================
     COMMON WEAPONS
     Weighted from original d100 table.
     ===================================================== */

  const COMMON_WEAPONS = [

    {max:3,value:{name:'Club',effect:'1d4 Bludgeoning · Light.'}},
    {max:6,value:{name:'Dagger',effect:'1d4 Piercing · Finesse, Light, Thrown 20/60.'}},
    {max:9,value:{name:'Greatclub',effect:'1d8 Bludgeoning · Two-Handed.'}},
    {max:12,value:{name:'Handaxe',effect:'1d6 Slashing · Light, Thrown 20/60.'}},
    {max:15,value:{name:'Javelin',effect:'1d6 Piercing · Thrown 30/120.'}},
    {max:18,value:{name:'Light Hammer',effect:'1d4 Bludgeoning · Light, Thrown 20/60.'}},
    {max:21,value:{name:'Mace',effect:'1d6 Bludgeoning.'}},
    {max:24,value:{name:'Quarterstaff',effect:'1d6/1d8 Bludgeoning · Versatile.'}},
    {max:27,value:{name:'Sickle',effect:'1d4 Slashing · Light.'}},
    {max:30,value:{name:'Scimitar',effect:'1d6 Slashing · Finesse, Light.'}},
    {max:33,value:{name:'Shortsword',effect:'1d6 Piercing · Finesse, Light.'}},
    {max:36,value:{name:'Battleaxe',effect:'1d8/1d10 Slashing · Versatile.'}},
    {max:39,value:{name:'Flail',effect:'1d8 Bludgeoning.'}},
    {max:42,value:{name:'Glaive',effect:'1d10 Slashing · Heavy, Reach, Two-Handed.'}},
    {max:45,value:{name:'Greataxe',effect:'1d12 Slashing · Heavy, Two-Handed.'}},
    {max:48,value:{name:'Greatsword',effect:'2d6 Slashing · Heavy, Two-Handed.'}},
    {max:51,value:{name:'Halberd',effect:'1d10 Slashing · Heavy, Reach, Two-Handed.'}},
    {max:54,value:{name:'Lance',effect:'1d12 Piercing · Reach.'}},
    {max:57,value:{name:'Longsword',effect:'1d8/1d10 Slashing · Versatile.'}},
    {max:60,value:{name:'Maul',effect:'2d6 Bludgeoning · Heavy, Two-Handed.'}},
    {max:63,value:{name:'Morningstar',effect:'1d8 Piercing.'}},
    {max:66,value:{name:'Pike',effect:'1d10 Piercing · Heavy, Reach.'}},
    {max:69,value:{name:'Rapier',effect:'1d8 Piercing · Finesse.'}},
    {max:72,value:{name:'Spear',effect:'1d6/1d8 Piercing · Versatile, Thrown 20/60.'}},
    {max:75,value:{name:'Trident',effect:'1d6/1d8 Piercing · Versatile, Thrown 20/60.'}},
    {max:78,value:{name:'War Pick',effect:'1d8 Piercing.'}},
    {max:81,value:{name:'Warhammer',effect:'1d8/1d10 Bludgeoning · Versatile.'}},
    {max:84,value:{name:'Whip',effect:'1d4 Slashing · Finesse, Reach.'}},
    {max:87,value:{name:'Light Crossbow',effect:'1d8 Piercing · Loading, Two-Handed.'}},
    {max:89,value:{name:'Dart',effect:'1d4 Piercing · Finesse, Thrown 20/60.'}},
    {max:91,value:{name:'Shortbow',effect:'1d6 Piercing · Two-Handed.'}},
    {max:93,value:{name:'Sling',effect:'1d4 Bludgeoning · Ammunition 30/120.'}},
    {max:96,value:{name:'Blowgun',effect:'1 Piercing · Loading, Ammunition 25/100.'}},
    {max:98,value:{name:'Hand Crossbow',effect:'1d6 Piercing · Light, Loading.'}},
    {max:99,value:{name:'Heavy Crossbow',effect:'1d10 Piercing · Heavy, Loading, Two-Handed.'}},
    {max:100,value:{name:'Longbow',effect:'1d8 Piercing · Heavy, Two-Handed.'}}

  ];


  const UNCOMMON_WEAPONS =
    pairs(`
of Lanternlight Strike :: Once per long rest add 1d4 radiant damage.
of Dreamlight Precision :: Advantage on one attack per long rest.
of Pixar Bounceback :: After a miss, gain +1 AC until your next turn.
of Enchanted Forest’s Edge :: +1 to attacks made in natural terrain.
of Sidekick Spirit :: Once per day add +2 to hit after seeing the roll.
of Sparkling Sharpness :: The weapon never dulls and has advantage on checks to cut restraints.
of Trolley Whirl :: Once per rest impose disadvantage on one melee attack targeting you.
of Singing Steel :: +1 Performance when singing.
of Storybook Valor :: After rolling a natural 1 to attack, gain +1 to your next saving throw.
of Hidden Mickey Ricochet :: Once per long rest reroll a missed ranged attack.
of Fairy Flicker :: A hit target glows faintly in a 5-foot radius.
of Optimistic Parry :: Gain +1 to your next attack after an enemy misses you.
of Whistle-Slice :: Instantly carve simple symbols or messages into wood or stone.
of Royal Command :: +1 Persuasion while brandishing the weapon.
of Firefly Glow :: Advantage on Perception in dim light.
of Villainous Cackle :: +2 Intimidation while holding the weapon.
of Jester’s Quickstep :: +1 Acrobatics while wielded.
of EPCOT Efficiency :: Draw or stow the weapon without an action once per round.
of Carousel Momentum :: On a critical hit, move 5 feet without provoking opportunity attacks.
of Crystal Calm :: Advantage against charm while holding the weapon.
of Apprentice Splash :: Create a harmless 5-foot water splash once per round.
of Monorail Thrust :: Once per day extend reach by 5 feet for one attack.
of Laugh Floor Strike :: Once per rest reduce psychic damage by 1d6.
of Explorer’s Aim :: +1 to ranged attacks while above ground level.
of Ghostly Glamour :: Cast Disguise Self once per day.
of Tomorrowland Pulse :: Advantage on attacks against constructs.
of Living Weapon Quirk :: The weapon develops a harmless personality.
of Concert Crash :: Once per day deal +1 thunder damage for 1 minute.
of Poison Apple Warning :: The weapon vibrates faintly when poison is nearby.
of Teacup Spin :: Use a bonus action to dramatically rotate around a target.
of Ol’ Reliable Force :: Advantage against being disarmed.
of Fireworks Spark :: Defeating a creature produces harmless sparks.
of Singing Blade Harmony :: Allies within 5 feet gain +1 to their next saving throw.
of Villain’s Boon (Minor) :: Once per rest gain +2 Intimidation.
of Mirror Flash :: Once per long rest cast Guidance without components.
of Lost Boy Trickshot :: Advantage on ranged attacks while hidden.
of Snowglobe Stillness :: Cold environments do not penalize attacks.
of Shadow Trinkets :: +1 Sleight of Hand involving weapon draws.
of Festival Rhythm :: +1 Initiative.
of Pirate’s Swagger (Minor) :: On a natural 20, gain 5 temporary HP after shouting “YO-HO!”
of Gummi Gumption :: Ignore the first 5 feet of difficult terrain when moving to attack.
of Spark-Tinkered Edge :: +1 Arcana involving magical runes.
of River Spirit Accuracy :: +1 to attacks against creatures in water or rain.
of Spotlight Strike :: Once per day illuminate a struck enemy.
of Mansion Mist :: Once per rest become lightly obscured after attacking.
of Advisor’s Insight :: +1 Insight while brandishing.
of Coronation Edge :: Once per long rest add 1d4 radiant damage to an attack.
of Animated Curiosity :: The weapon can point toward interesting objects.
of EPCOT Recall :: Perfectly recall the previous 6 seconds.
of Mini-Wish :: Once per day treat a missed attack as a d20 result of 10 before modifiers.
    `);


  const RARE_WEAPONS =
    pairs(`
of True Love’s Smite :: Once per day add 2d8 radiant damage while defending an ally.
of Lighthouse Justice :: Allies within 10 feet gain +1 to attack rolls while you brandish the weapon.
of Wishing Star Surge :: Once per long rest treat an attack as a natural 20 for damage only.
of Sorcerer Supreme Slash :: Once per day cast Misty Step as a bonus action after hitting.
of Royal Metamorphosis :: On a critical hit gain 10 temporary HP.
of Titan-Song Impact :: Deal +1 thunder damage and critical hits push the target 10 feet.
of Maleficent Thorns :: Hits deal +1d6 necrotic damage and melee attackers take 1 piercing damage.
of Ursula’s Temptation :: Once per day silence a creature you strike, Constitution save applies.
of Genie’s Wishstrike :: Once per day add +1d8 to an attack roll after seeing it.
of Prototype EPCOT Cannon :: Once per rest convert an attack into a 15-foot line dealing 2d6 force damage.
of Lion King’s Roar :: Once per long rest after a kill, nearby enemies must save or become frightened.
of Winter’s Bite :: Hits deal +1d4 cold damage and critical hits reduce speed by 10 feet.
of Illumination Finale :: Once per day create a radiant flare; your next attack has advantage and deals +1d8 damage.
of Shadow Queen’s Edge :: Advantage on attacks in dim light or darkness.
of Forest Guardian’s Blessing :: Once per day vines restrain a creature you hit, Dexterity save applies.
of Dragon-Sparked Might :: Once per long rest maximize the damage of one hit.
of The Great Mouse’s Miracle :: Once per day reroll all damage dice showing 1.
of Oceanheart’s Fury :: Deal +1d6 lightning damage while fighting near water.
of Tomorrowland Nova Blade :: Once per day make one attack with +10 feet reach.
of Storybook Finale :: Once per day, after dropping a foe to 0 HP, gain advantage on attacks for 1 minute.
    `);


  const VERY_RARE_WEAPONS =
    lines(`
Ammunition, +3
Ammunition of Slaying
Dancing Sword
Dwarven Thrower
Energy Bow
Enspelled Weapon (level 4 or 5 spell)
Executioner’s Axe
Frost Brand
Nine Lives Stealer
Oathbow
Quarterstaff of the Acrobat
Scimitar of Speed
Sword of Sharpness
Thunderous Greatclub
Weapon, +3
Wraps of Unarmed Power, +3
    `);


  const LEGENDARY_WEAPONS =
    lines(`
Defender
Enspelled Weapon (level 6, 7, or 8 spell)
Hammer of Thunderbolts
Holy Avenger
Luck Blade
Moonblade
Rod of Lordly Might
Sword of Answering
Vorpal Sword
    `);


  /* =====================================================
     WONDROUS ITEMS
     ===================================================== */

  const COMMON_WONDROUS =
    lines(`
Carved wooden animal charm
Small silver bell
Glass marble with shifting colors
Tiny brass spyglass
Feather quill with colored ink
Woven charm bracelet
Patchwork cloth pouch
Leather-bound miniature journal
Hand-carved slingshot
Simple compass
Wooden toy soldier
Seashell necklace
Painted stone token
Smooth river stone carved with a spiral
Embroidered handkerchief
Small music box
Tin wind-up toy
Glass vial of colored sand
Simple wooden flute
Miniature lantern with a candle
    `);


  const UNCOMMON_WONDROUS =
    pairs(`
Charm of Lanternlight Glow :: Shed warm light in 20 feet at will.
Pouch of Dreamlight Sparks :: Create floating sparkles once per long rest.
Toy of Boundless Bounce :: +1 Acrobatics.
Guidebook of Whispering Trails :: Advantage on Survival checks to navigate.
Token of Sidekick Luck :: Once per day add +2 to a check after seeing the roll.
Bell of Sparkling Clean :: Dust and grime slide magically off objects you touch.
Compass of Trolley Turning :: Advantage against being moved unwillingly.
Flute of Singing Breezes :: +1 Performance with wind instruments.
Pendant of Storybook Courage :: Once per long rest gain +2 to a saving throw.
Glimmerstone :: Sense faint magic when touching it.
Feather of Fairy Drift :: Reduce fall damage by 1d6.
Badge of Optimistic Rhythm :: +1 Initiative.
Apron of Cheerful Prep :: Craft or cook about 10 percent faster.
Mantle Pin of Royal Prowess :: +1 Persuasion.
Firefly Lantern :: Advantage on Perception in dim light.
Mask of Villainous Flair :: +1 Intimidation while worn.
Jester’s Shoes :: +1 Acrobatics.
EPCOT Protocol Band :: Once per day take Use Object as a bonus action.
Carved Carousel Horse :: Once per day gain advantage on a Constitution save against exhaustion.
Crystal of Tranquil Mind :: Advantage against charm.
Water-Sling of Apprentice’s Splash :: Create harmless water effects.
Monorail Badge :: Once per rest gain +10 feet speed for 1 round.
Laugh Orb :: Reduce psychic damage by 1.
Explorer’s Pin :: +1 Investigation.
Mirror of Everyday Glamour :: Cast Disguise Self once per day.
Techno-Primer Cog :: +1 Arcana involving constructs or machinery.
Animated Trinket :: Tiny object moves with harmless personality.
Concert Shell :: Once per day deal +1 thunder damage.
Apple of Caution :: Once per day gain advantage on a save against poison.
Teacup Token :: Advantage when escaping grapples.
Grip-Charmed Gloves :: Advantage to retain small objects.
Mini Firework Rod :: Emit harmless colorful sparks.
Harmony Stone :: Once per day allies gain +1 to their next saving throw.
Villain’s Wink Brooch :: Once per day gain +2 Intimidation.
Flash-Mirror Clip :: Once per day impose disadvantage on one Perception check.
Lost Boy Trinket :: Once per day gain advantage on Stealth.
Snowglobe Keychain :: Ignore cold-terrain penalties.
Shadow Pocket :: +1 Sleight of Hand.
Festival Talisman :: Once per day gain 2 temporary HP when initiative is rolled.
Rogue’s Swagger Buckle :: Once per day add +1 to one melee attack.
Gummi Boot Charms :: Ignore 5 feet of difficult terrain each turn.
Tinkerer’s Sparkstone :: +1 Arcana while deciphering runes.
River Spirit Ribbon :: +1 to checks made near natural water.
Spotlight Brooch :: Create a magical 10-foot spotlight.
Haunted Mist Vial :: Once per day become lightly obscured by fog.
Advisor’s Eyeglass :: +1 Insight.
Coronation Sash :: Once per long rest gain advantage on a Charisma save.
Animated Hair Ribbon :: The ribbon develops harmless personality.
Memory-Lock Charm :: Perfectly recall the last conversation.
Teardrop of the Little Wish :: Once per day treat an ability-check d20 as a 10 before modifiers.
    `);


  const RARE_WONDROUS =
    pairs(`
Radiant Crown of True Love’s Triumph :: Once per day transfer a failed save to an ally who succeeds instead.
Starforged Locket of the Wishing Star :: Once per day treat any non-attack d20 roll as a natural 20.
Banner of the Everlasting Kingdom :: Allies within 10 feet gain +1 to all saving throws.
Mantle of the Sorcerer Supreme :: Cast Misty Step once per short rest.
Regalia of Royal Transcendence :: Once per day gain 10 temporary HP and radiate glamour for 1 minute.
Heart of Titanborn Might :: Resistance to thunder and force damage.
Shroud of Maleficent’s Thorns :: A creature that hits you takes 1d6 piercing damage.
Pendant of Ursula’s Bargain :: Once per day silence a creature for 1 minute, Constitution save applies.
Lamp of the Genie’s Gentle Wish :: Once per day cast Enhance Ability at 3rd level.
Harness of the EPCOT Nova Grid :: Once per short rest reduce incoming damage by 10.
Horn of the Lion King’s Challenge :: When you reduce a foe to 0 HP, nearby enemies must save or become frightened.
Crown of Winter’s Requiem :: Cold resistance and hostile creatures within 5 feet treat the ground as difficult terrain.
Orb of the Great Illumination :: Once per day create a 30-foot aura granting allies +2 AC for 1 minute.
Mask of the Shadow Queen’s Authority :: Advantage on Charisma checks made in darkness.
Charm of the Forest Guardians :: Once per day gain advantage on any roll after seeing it.
Ember of the Last Dragon’s Spark :: Once per long rest maximize one damage roll.
Medallion of the Great Mouse’s Miracle :: Once per day reroll damage dice showing 1.
Oceanheart Shell of Moana’s Blessing :: Fire resistance and once per rest halve lightning damage.
Band of Tomorrowland Flight :: Once per long rest fly 30 feet as movement.
Relic of the Storybook Ending :: Once per week, if you would die, instead drop to 1 HP and gain advantage on all rolls for 1 minute.
    `);


  /*
    High-tier Wondrous pools merge Arcana,
    Implements, and Relics results while
    excluding obvious armor, weapons,
    rings, scrolls, and potions.
  */

  const VERY_RARE_WONDROUS =
    lines(`
Amulet of the Planes
Bag of Devouring
Candle of Invocation
Carpet of Flying
Cauldron of Rebirth
Cloak of Arachnida
Crystal Ball
Figurine of Wondrous Power (Obsidian Steed)
Hat of Many Spells
Helm of Brilliance
Horseshoes of a Zephyr
Instrument of the Bards (Anstruth Harp)
Ioun Stone of Absorption
Ioun Stone of Agility
Ioun Stone of Fortitude
Ioun Stone of Insight
Ioun Stone of Intellect
Ioun Stone of Leadership
Ioun Stone of Strength
Lute of Thunderous Thumping
Manual of Bodily Health
Manual of Gainful Exercise
Manual of Golems
Manual of Quickness of Action
Mirror of Life Trapping
Nolzur’s Marvelous Pigments
Robe of Scintillating Colors
Robe of Stars
Spirit Board
Tome of Clear Thought
Tome of Leadership and Influence
Tome of Understanding
    `);


  const LEGENDARY_WONDROUS =
    lines(`
Apparatus of Kwalish
Cloak of Invisibility
Crystal Ball of Mind Reading
Crystal Ball of Telepathy
Crystal Ball of True Seeing
Cubic Gate
Deck of Many Things
Instrument of the Bards (Ollamh Harp)
Ioun Stone of Greater Absorption
Ioun Stone of Mastery
Ioun Stone of Regeneration
Iron Flask
Robe of the Archmagi
Scarab of Protection
Sovereign Glue
Sphere of Annihilation
Talisman of Pure Good
Talisman of the Sphere
Talisman of Ultimate Evil
Tome of the Stilled Tongue
Universal Solvent
Well of Many Worlds
    `);

    /* =====================================================
   HIGH-TIER MAGIC ITEM DETAILS

   Concise mechanical summaries derived from
   the installed Very Rare / Legendary item data.

   These descriptions are intentionally compact
   so Loot results remain readable.
   ===================================================== */

const HIGH_TIER_MAGIC_DETAILS = {

  /* =====================================================
     ARCANE IMPLEMENTS
     ===================================================== */

  "Enspelled Staff (level 4 or 5 spell)":
    "Contains one level 4 or 5 spell. The staff has 6 charges, regains 1d6 charges at dawn, and expends 1 charge to cast its bound spell. Requires attunement by a spellcaster.",

  "Rod of Absorption":
    "When a spell targets only you, use your Reaction to cancel it and store its spell energy. The rod can absorb up to 50 spell levels over its existence, and stored energy can be used to cast your prepared spells without expending spell slots.",

  "Rod of Security":
    "As a Magic action, transport yourself and up to 199 willing creatures to a harmless demiplane of your design. Visitors have food and water, do not age there, and regain Hit Points over time.",

  "Rod of the Pact Keeper, +3":
    "While holding the rod, gain +3 to Warlock spell attack rolls and Warlock spell save DCs. Once per Long Rest, use a Magic action to regain one spell slot. Requires Warlock attunement.",

  "Staff of Fire":
    "While holding the staff, gain Resistance to Fire damage. It has 10 charges used to cast Burning Hands, Fireball, and Wall of Fire, and regains 1d6 + 4 charges each dawn.",

  "Staff of Frost":
    "While holding the staff, gain Resistance to Cold damage. It has 10 charges used to cast Cone of Cold, Fog Cloud, Ice Storm, and Wall of Ice, and regains 1d6 + 4 charges each dawn.",

  "Staff of Power":
    "Functions as a +2 magic Quarterstaff. While holding it, gain +2 AC, saving throws, and spell attacks. Its 20 charges power several potent spells and can also fuel a devastating Retributive Strike.",

  "Staff of Striking":
    "Functions as a +3 magic Quarterstaff. It has 10 charges. When you hit with a melee attack, spend up to 3 charges to deal an additional 1d6 Force damage per charge.",

  "Staff of Thunder and Lightning":
    "Functions as a +2 magic Quarterstaff. Once per dawn for each property, unleash extra Lightning damage, stunning thunder, or combine both effects into a powerful thunder-and-lightning strike.",

  "Wand of Polymorph":
    "Has 7 charges. Spend 1 charge to cast Polymorph with save DC 15. Regains 1d6 + 1 charges each dawn; using the final charge risks destroying the wand.",

  "Wand of the War Mage, +3":
    "While holding the wand, gain +3 to spell attack rolls and ignore Half Cover when making spell attacks. Requires attunement by a spellcaster.",


  "Enspelled Staff (level 6, 7, or 8 spell)":
    "Contains one level 6, 7, or 8 spell. The staff has 6 charges, regains 1d6 charges at dawn, and expends 1 charge to cast its bound spell. Requires attunement by a spellcaster.",

  "Rod of Resurrection":
    "Has 5 charges. Spend 1 charge to cast Heal or all 5 charges to cast Resurrection. Regains 1 charge each dawn; expending the last charge risks causing the rod to vanish.",

  "Staff of the Magi":
    "Functions as a +2 magic Quarterstaff and grants +2 to spell attacks. It has 50 charges for numerous spells, grants advantage against spells, can absorb targeted spells into charges, and can unleash a devastating Retributive Strike.",


  /* =====================================================
     ARMOR
     ===================================================== */

  "Animated Shield":
    "While holding the shield, use a Bonus Action to animate it for 1 minute. It hovers in your space and protects you as though wielded while leaving both hands free.",

  "Armor, +2":
    "While wearing this magic armor, gain +2 to Armor Class in addition to the armor's normal AC.",

  "Demon Armor":
    "Gain +1 AC, know Abyssal, and your clawed gauntlets make empowered Slashing Unarmed Strikes. The armor is cursed: it cannot normally be removed and hinders you against demons.",

  "Dragon Scale Mail":
    "Gain +1 AC, Resistance determined by the dragon that supplied the scales, and advantage on saves against Dragon breath weapons. Once per dawn, sense the nearest matching dragon within 30 miles.",

  "Dwarven Plate":
    "Gain +2 AC. When an effect moves you against your will along the ground, use your Reaction to reduce the forced movement by up to 10 feet.",

  "Enspelled Armor (level 4 or 5 spell)":
    "Contains one level 4 or 5 Abjuration or Illusion spell. The armor has 6 charges, regains 1d6 charges each dawn, and expends 1 charge to cast its bound spell.",

  "Shield, +3":
    "This magic Shield provides an additional +3 bonus to AC beyond the Shield's normal AC bonus.",

  "Shield of the Cavalier":
    "A powerful protective shield designed to defend both its bearer and nearby allies. Requires attunement and provides enhanced defensive capabilities while wielded.",

  "Spellguard Shield":
    "While wielding the shield, gain advantage on saving throws against spells and other magical effects. Spell attacks made against you have disadvantage.",


  "Armor, +3":
    "While wearing this magic armor, gain +3 to Armor Class in addition to the armor's normal AC.",

  "Armor of Invulnerability":
    "While wearing this Plate Armor, gain Resistance to Bludgeoning, Piercing, and Slashing damage. Once per dawn, become immune to those damage types for 10 minutes.",

  "Efreeti Chain":
    "Gain +3 AC, Immunity to Fire damage, and knowledge of Primordial. You can stand and move across molten rock as though it were solid ground.",

  "Enspelled Armor (level 6, 7, or 8 spell)":
    "Contains one level 6, 7, or 8 Abjuration or Illusion spell. The armor has 6 charges, regains 1d6 charges each dawn, and expends 1 charge to cast its bound spell.",

  "Plate Armor of Etherealness":
    "While wearing this armor, you can magically enter the Ethereal Plane and later return to the plane you left. Requires attunement.",


  /* =====================================================
     RINGS
     ===================================================== */

  "Ring of Regeneration":
    "While wearing the ring and above 0 HP, regain 1d6 Hit Points every 10 minutes. Lost body parts also regrow after several days if you remain alive.",

  "Ring of Shooting Stars":
    "Cast Dancing Lights or Light at will. The ring has 6 charges that power Faerie Fire, moving lightning spheres, and explosive shooting-star attacks. Regains 1d6 charges each dawn.",

  "Ring of Telekinesis":
    "While wearing the ring, you can cast Telekinesis from it without expending spell slots.",


  "Ring of Djinni Summoning":
    "Summon a particular Djinni within 120 feet for up to 1 hour while concentrating. The Djinni is friendly and obeys your commands. The ring cannot summon it again for 24 hours.",

  "Ring of Elemental Command":
    "Linked to Air, Earth, Fire, or Water. Gain strong elemental defenses and movement abilities, advantage against Elementals, and the power to magically compel nearby Elementals.",

  "Ring of Invisibility":
    "As a Magic action, become Invisible. The condition lasts until you remove the ring or use a Bonus Action to become visible again.",

  "Ring of Spell Turning":
    "Gain advantage on saving throws against spells that target only you. Particularly successful saves can turn certain spells back onto their caster.",

  "Ring of Three Wishes":
    "Contains three charges. Spend a charge to cast Wish. The ring becomes nonmagical after its final charge is used.",


  /* =====================================================
     SPELL SCROLLS
     ===================================================== */

  "Spell Scroll (level 6)":
    "Contains one level 6 spell. Reading the scroll casts the spell and consumes the scroll, following the normal rules for Spell Scrolls.",

  "Spell Scroll (level 7)":
    "Contains one level 7 spell. Reading the scroll casts the spell and consumes the scroll, following the normal rules for Spell Scrolls.",

  "Spell Scroll (level 8)":
    "Contains one level 8 spell. Reading the scroll casts the spell and consumes the scroll, following the normal rules for Spell Scrolls.",

  "Spell Scroll (level 9)":
    "Contains one level 9 spell. Reading the scroll casts the spell and consumes the scroll, following the normal rules for Spell Scrolls.",

  "Scroll of Titan Summoning":
    "A Legendary scroll capable of summoning an extraordinarily powerful Titan. The exact summoned creature and full summoning rules are determined by the scroll's item entry.",


  /* =====================================================
     WEAPONS
     ===================================================== */

  "Ammunition, +3":
    "Gain +3 to attack and damage rolls made with this ammunition. After the ammunition hits a target, it loses its magic.",

  "Ammunition of Slaying":
    "Designed to kill one chosen creature type. When that creature type is damaged by the ammunition, it makes a DC 17 Constitution save or takes an additional 6d10 Force damage, half on success.",

  "Dancing Sword":
    "Use a Bonus Action to toss the weapon into the air. It hovers, flies up to 30 feet, and attacks using your attack roll and ability modifier. It can attack four times before returning to you.",

  "Dwarven Thrower":
    "A +3 Warhammer with Thrown 20/60. Ranged hits deal +1d8 Force damage, or +2d8 against Giants, and the weapon immediately flies back to your hand.",

  "Energy Bow":
    "A +1 bow that creates magical Force arrows. Its arrows can deal Force damage, restrain targets, teleport willing creatures or objects, and create temporary ladders of energy.",

  "Enspelled Weapon (level 4 or 5 spell)":
    "Contains one level 4 or 5 Conjuration, Divination, Evocation, Necromancy, or Transmutation spell. It has 6 charges, regains 1d6 at dawn, and spends 1 charge to cast the bound spell.",

  "Executioner’s Axe":
    "Gain +1 to attack and damage rolls. Humanoids struck by the weapon take an additional 2d6 Slashing damage, and you gain Temporary Hit Points equal to that extra damage.",

  "Frost Brand":
    "Hits deal an extra 1d6 Cold damage, and while holding the weapon you have Resistance to Fire damage. In freezing temperatures it glows, and once per hour it can extinguish nearby nonmagical flames.",

  "Nine Lives Stealer":
    "A powerful magic weapon with limited charges. Critical hits against vulnerable creatures can force a Constitution save that slays the target outright, consuming a charge.",

  "Oathbow":
    "Designate one creature as your sworn enemy. Attacks against that enemy have advantage, ignore most cover and long-range disadvantage, and deal an additional 3d6 Piercing damage.",

  "Quarterstaff of the Acrobat":
    "A +2 Quarterstaff that can alter its length. It enhances Acrobatics and includes defensive and mobility techniques depending on its current form.",

  "Scimitar of Speed":
    "Gain +2 to attack and damage rolls. On each of your turns, you can make one additional attack with the scimitar as a Bonus Action.",

  "Sword of Sharpness":
    "Maximize weapon damage against objects. On a natural 20 against a creature, deal an additional 14 Slashing damage and give the target 1 Exhaustion level.",

  "Thunderous Greatclub":
    "Sets your Strength to at least 20, deals an additional 1d8 Thunder damage to creatures and 3d8 to objects, and can unleash powerful thunderclaps and seismic effects.",

  "Weapon, +3":
    "Gain +3 to attack rolls and damage rolls made with this magic weapon.",

  "Wraps of Unarmed Power, +3":
    "While wearing the wraps, gain +3 to attack and damage rolls made with your Unarmed Strikes.",


  "Defender":
    "Gain +3 to attack and damage rolls. On the first attack of each turn, transfer any portion of that +3 bonus from attack and damage to your AC until the start of your next turn.",

  "Enspelled Weapon (level 6, 7, or 8 spell)":
    "Contains one level 6, 7, or 8 Conjuration, Divination, Evocation, Necromancy, or Transmutation spell. It has 6 charges and spends 1 charge to cast the bound spell.",

  "Hammer of Thunderbolts":
    "A +1 magic Maul or Warhammer with 5 charges. It can be thrown to unleash a stunning thunderclap and return to your hand. When combined with giant-strength magic, it gains devastating anti-Giant abilities.",

  "Holy Avenger":
    "A +3 weapon. Hits against Fiends and Undead deal an additional 2d10 Radiant damage. Nearby allies gain advantage on saves against spells and magical effects while the weapon is drawn.",

  "Luck Blade":
    "A +1 weapon that also grants +1 to saving throws. Once per dawn reroll a failed D20 Test. It also contains 1d3 charges that can each cast Wish.",

  "Moonblade":
    "A sentient Legendary elven weapon that chooses its wielder. Each Moonblade has several randomly determined magical runes that grant additional powers, bonuses, spells, or weapon properties.",

  "Rod of Lordly Might":
    "Functions as a +3 Mace and can transform into several other weapons and tools using its buttons. It also carries powerful once-per-dawn abilities for draining life, paralyzing foes, and terrifying enemies.",

  "Sword of Answering":
    "A +3 Longsword. When a creature within reach damages you, use your Reaction to attack it with advantage. Damage from this special attack ignores Resistance and Immunity.",

  "Vorpal Sword":
    "A +3 Slashing weapon that ignores Slashing Resistance. On a natural 20, it can sever a creature's head and kill it outright; creatures immune to decapitation instead suffer substantial extra damage.",


  /* =====================================================
     WONDROUS ITEMS
     VERY RARE
     ===================================================== */

  "Amulet of the Planes":
    "As a Magic action, name a familiar location on another plane and make a DC 15 Arcana check. Success casts Plane Shift; failure sends you and nearby creatures to a randomly determined planar destination.",

  "Bag of Devouring":
    "Looks like a Bag of Holding but is connected to an extradimensional creature. Living creatures reaching inside can be dragged into it and devoured, while stored objects periodically vanish to another plane.",

  "Candle of Invocation":
    "Burns for up to 4 hours. While within its light, you have advantage on D20 Tests, and Clerics or Druids can cast prepared level 1 spells without expending slots. It can instead be consumed to cast Gate.",

  "Carpet of Flying":
    "Use its command word to make the carpet hover and fly. Its carrying capacity and Fly Speed depend on its randomly determined size.",

  "Cauldron of Rebirth":
    "Functions as a spellcasting focus. After a Long Rest it can create a Greater Healing Potion, and once per 7 days it can return a Humanoid corpse to life using salt and an overnight ritual.",

  "Cloak of Arachnida":
    "Gain Poison Resistance, a Climb Speed equal to your Speed, the ability to traverse walls and ceilings, freedom of movement through webs, and the ability to cast an enlarged Web once per dawn.",

  "Crystal Ball":
    "While touching the crystal orb, you can cast Scrying with save DC 17.",

  "Figurine of Wondrous Power (Obsidian Steed)":
    "Transforms into a Nightmare for up to 24 hours. The Nightmare defends itself but may occasionally ignore orders and transport its rider to Hades.",

  "Hat of Many Spells":
    "A Wizard spellcasting focus that allows attempts to cast Wizard spells you do not know. Failed attempts trigger unpredictable magical effects.",

  "Helm of Brilliance":
    "Studded with magical gems granting Fire Resistance, radiant anti-Undead effects, flaming-weapon power, and access to spells including Daylight, Fireball, Wall of Fire, and Prismatic Spray.",

  "Horseshoes of a Zephyr":
    "A horse or similar creature wearing all four shoes floats just above the ground, moving normally over unstable or liquid surfaces without touching them.",

  "Instrument of the Bards (Anstruth Harp)":
    "A powerful Bardic instrument granting several spells and enhancing charm magic. Requires attunement by a Bard.",

  "Ioun Stone of Absorption":
    "While orbiting your head, the stone can cancel spells targeting only you by absorbing their magical energy until its absorption capacity is exhausted.",

  "Ioun Stone of Agility":
    "While the stone orbits your head, your Dexterity increases by 2, up to the item's maximum.",

  "Ioun Stone of Fortitude":
    "While the stone orbits your head, your Constitution increases by 2, up to the item's maximum.",

  "Ioun Stone of Insight":
    "While the stone orbits your head, your Wisdom increases by 2, up to the item's maximum.",

  "Ioun Stone of Intellect":
    "While the stone orbits your head, your Intelligence increases by 2, up to the item's maximum.",

  "Ioun Stone of Leadership":
    "While the stone orbits your head, your Charisma increases by 2, up to the item's maximum.",

  "Ioun Stone of Strength":
    "While the stone orbits your head, your Strength increases by 2, up to the item's maximum.",

  "Lute of Thunderous Thumping":
    "A powerful magical instrument capable of producing thunderous magical effects and enhancing musical spellcasting.",

  "Manual of Bodily Health":
    "After completing the required study of this magical manual, permanently increase Constitution by 2 and increase its maximum by 2. The book then loses its magic for many years.",

  "Manual of Gainful Exercise":
    "After completing the required study of this magical manual, permanently increase Strength by 2 and increase its maximum by 2. The book then loses its magic for many years.",

  "Manual of Golems":
    "Contains instructions and magic required to create a specific type of Golem. Creating the Golem requires significant time, materials, and use of the manual.",

  "Manual of Quickness of Action":
    "After completing the required study of this magical manual, permanently increase Dexterity by 2 and increase its maximum by 2. The book then loses its magic for many years.",

  "Mirror of Life Trapping":
    "Can magically imprison creatures inside extradimensional cells within the mirror. Trapped creatures remain there until released or the mirror is destroyed.",

  "Nolzur’s Marvelous Pigments":
    "Painting an object or feature with these magical pigments causes the depicted thing to become real, subject to the item's creation limits.",

  "Robe of Scintillating Colors":
    "The robe can blaze with shifting colors, producing brilliant light that can incapacitate creatures that see it and make you difficult to attack.",

  "Robe of Stars":
    "Grants defensive magical benefits, contains magical star projectiles that can be launched as attacks, and allows travel to the Astral Plane.",

  "Spirit Board":
    "A powerful magical board used to communicate with or interact with spirits and supernatural entities.",

  "Tome of Clear Thought":
    "After completing the required study of this magical tome, permanently increase Intelligence by 2 and increase its maximum by 2. The book then loses its magic for many years.",

  "Tome of Leadership and Influence":
    "After completing the required study of this magical tome, permanently increase Charisma by 2 and increase its maximum by 2. The book then loses its magic for many years.",

  "Tome of Understanding":
    "After completing the required study of this magical tome, permanently increase Wisdom by 2 and increase its maximum by 2. The book then loses its magic for many years.",


  /* =====================================================
     WONDROUS ITEMS
     LEGENDARY
     ===================================================== */

  "Apparatus of Kwalish":
    "A 500-pound iron barrel that transforms into a two-person armored lobster vehicle. It has AC 20, 200 HP, walking and swimming movement, grasping claws, lights, diving controls, and an airtight compartment.",

  "Cloak of Invisibility":
    "Has 3 charges and regains 1d3 each dawn. Spend 1 charge to become Invisible for up to 1 hour while wearing the cloak.",

  "Crystal Ball of Mind Reading":
    "Cast Scrying at save DC 17. While scrying, you can also cast Detect Thoughts through the sensor without separately concentrating on it.",

  "Crystal Ball of Telepathy":
    "Cast Scrying at save DC 17, communicate telepathically through the sensor, and cast Suggestion through it once per dawn.",

  "Crystal Ball of True Seeing":
    "Cast Scrying at save DC 17. While scrying, gain Truesight out to 120 feet centered on the spell's sensor.",

  "Cubic Gate":
    "The cube's six faces are keyed to different planes. It has 3 charges that can cast Gate or Plane Shift to the plane associated with a chosen face.",

  "Deck of Many Things":
    "A legendary deck whose cards produce extreme permanent or campaign-changing effects, ranging from Wishes and ability increases to imprisonment, powerful enemies, lost wealth, or death.",

  "Instrument of the Bards (Ollamh Harp)":
    "One of the most powerful Instruments of the Bards, granting numerous high-level spells and enhancing charm magic. Requires Bard attunement.",

  "Ioun Stone of Greater Absorption":
    "While orbiting your head, the stone can cancel spells targeting only you by absorbing spell levels until its large absorption capacity is exhausted.",

  "Ioun Stone of Mastery":
    "While the stone orbits your head, your Proficiency Bonus increases by 1.",

  "Ioun Stone of Regeneration":
    "While the stone orbits your head, you gradually regenerate Hit Points and can regrow lost body parts over time.",

  "Iron Flask":
    "Can magically imprison an extraplanar creature inside the flask. A released creature can temporarily be compelled to obey the flask's bearer.",

  "Robe of the Archmagi":
    "Powerful spellcaster robes that provide strong AC, advantage against spells and magical effects, and increase spell save DC and spell attack rolls. Requires appropriate spellcaster attunement.",

  "Scarab of Protection":
    "Grants advantage on saving throws against spells. It also contains limited charges that can turn failed saves against dangerous necromantic or death effects into successes.",

  "Sovereign Glue":
    "Creates an extraordinarily powerful permanent bond between objects. Once set, it can normally be undone only by similarly exceptional magical solvents.",

  "Sphere of Annihilation":
    "A 2-foot sphere of absolute darkness that annihilates matter passing through it. Creatures contacting it suffer tremendous Force damage, and control of the sphere requires magical effort.",

  "Talisman of Pure Good":
    "A powerful item aligned with good. Good creatures can use it to destroy or banish profoundly evil enemies, while incompatible wielders suffer dangerous consequences.",

  "Talisman of the Sphere":
    "Greatly improves your ability to control a Sphere of Annihilation and enhances attacks made by moving the sphere into creatures.",

  "Talisman of Ultimate Evil":
    "A powerful item aligned with evil. Evil creatures can use it to destroy or banish profoundly good enemies, while incompatible wielders suffer dangerous consequences.",

  "Tome of the Stilled Tongue":
    "A sinister spellbook associated with Vecna. It functions as a spellbook and grants additional magical capabilities tied to the spells written within it.",

  "Universal Solvent":
    "A rare magical liquid capable of dissolving Sovereign Glue and other otherwise permanent magical adhesives.",

  "Well of Many Worlds":
    "A magical cloth that can be unfolded on a surface to create a two-way portal to another plane of existence. The destination is determined when the portal opens."

};


/* =====================================================
   HIGH-TIER RESULT HELPER
   ===================================================== */

function highTierMagicItem(
  name,
  rarity,
  category
){

  return {

    name,

    effect:
      HIGH_TIER_MAGIC_DETAILS[
        name
      ]
      ||
      `${rarity} ${category}. Consult the full magic item record for complete rules.`

  };

}

  /* =====================================================
     ITEM GENERATION
     ===================================================== */

  function combineBaseAndEffect(
    base,
    enchantment
  ){

    return {

      name:
        `${base.name || base} ${enchantment.name}`,

      effect:
        [
          base.effect || '',
          enchantment.effect || ''
        ]
          .filter(Boolean)
          .join(' ')

    };

  }


  function getCommonArmor(){

    return rollRange(
      COMMON_ARMOR
    ).value;

  }


  function getCommonWeapon(){

    return rollRange(
      COMMON_WEAPONS
    ).value;

  }


function generateArcane(
  rarity
){

  if(
    rarity ===
    'Common'
  ){

    return {
      name:
        W.pick(
          COMMON_ARCANE_BASES
        ),
      effect:''
    };

  }


  if(
    rarity ===
    'Uncommon'
  ){

    return combineBaseAndEffect(
      W.pick(
        COMMON_ARCANE_BASES
      ),
      W.pick(
        UNCOMMON_ARCANE
      )
    );

  }


  if(
    rarity ===
    'Rare'
  ){

    return combineBaseAndEffect(
      W.pick(
        COMMON_ARCANE_BASES
      ),
      W.pick(
        RARE_ARCANE
      )
    );

  }


  const name =
    W.pick(
      rarity ===
      'Very Rare'
        ? VERY_RARE_ARCANE
        : LEGENDARY_ARCANE
    );


  return highTierMagicItem(
    name,
    rarity,
    'Arcane Implement'
  );

}



function generateArmor(
  rarity
){

  if(
    rarity ===
    'Common'
  ){

    return getCommonArmor();

  }


  if(
    rarity ===
    'Uncommon'
  ){

    return combineBaseAndEffect(
      getCommonArmor(),
      W.pick(
        UNCOMMON_ARMOR
      )
    );

  }


  if(
    rarity ===
    'Rare'
  ){

    return combineBaseAndEffect(
      getCommonArmor(),
      W.pick(
        RARE_ARMOR
      )
    );

  }


  const name =
    W.pick(
      rarity ===
      'Very Rare'
        ? VERY_RARE_ARMOR
        : LEGENDARY_ARMOR
    );


  return highTierMagicItem(
    name,
    rarity,
    'Armor'
  );

}



function generateRing(
  rarity
){

  const pools = {

    Common:
      COMMON_RINGS,

    Uncommon:
      UNCOMMON_RINGS,

    Rare:
      RARE_RINGS,

    'Very Rare':
      VERY_RARE_RINGS,

    Legendary:
      LEGENDARY_RINGS

  };


  const picked =
    W.pick(
      pools[
        rarity
      ]
    );


  /*
    Uncommon and Rare entries are already
    objects containing name + effect.
  */

  if(
    typeof picked !==
    'string'
  ){

    return picked;

  }


  /*
    High-tier entries are strings.
    Pull their effect from the installed
    description library.
  */

  if(
    rarity ===
    'Very Rare'
    ||
    rarity ===
    'Legendary'
  ){

    return highTierMagicItem(
      picked,
      rarity,
      'Ring'
    );

  }


  /*
    Common rings are mundane base objects.
  */

  return {

    name:
      picked,

    effect:
      'Common ring.'

  };

}



function generateSpell(
  rarity
){

  const pools = {

    Common:
      COMMON_SPELLS,

    Uncommon:
      UNCOMMON_SPELLS,

    Rare:
      RARE_SPELLS,

    'Very Rare':
      VERY_RARE_SPELLS,

    Legendary:
      LEGENDARY_SPELLS

  };


  const picked =
    W.pick(
      pools[
        rarity
      ]
    );


  if(
    rarity ===
    'Common'
  ){

    return {

      name:
        `Spell Scroll: ${picked}`,

      effect:
        'Cast the listed spell from the scroll. The scroll is consumed when successfully used.'

    };

  }


  /*
    Your custom Uncommon and Rare scrolls
    already contain their own effects.
  */

  if(
    typeof picked !==
    'string'
  ){

    return picked;

  }


  if(
    rarity ===
    'Very Rare'
    ||
    rarity ===
    'Legendary'
  ){

    return highTierMagicItem(
      picked,
      rarity,
      'Spell Scroll'
    );

  }


  return {

    name:
      picked,

    effect:
      ''

  };

}



function generateWeapon(
  rarity
){

  if(
    rarity ===
    'Common'
  ){

    return getCommonWeapon();

  }


  if(
    rarity ===
    'Uncommon'
  ){

    return combineBaseAndEffect(
      getCommonWeapon(),
      W.pick(
        UNCOMMON_WEAPONS
      )
    );

  }


  if(
    rarity ===
    'Rare'
  ){

    return combineBaseAndEffect(
      getCommonWeapon(),
      W.pick(
        RARE_WEAPONS
      )
    );

  }


  const name =
    W.pick(
      rarity ===
      'Very Rare'
        ? VERY_RARE_WEAPONS
        : LEGENDARY_WEAPONS
    );


  return highTierMagicItem(
    name,
    rarity,
    'Weapon'
  );

}



function generateWondrous(
  rarity
){

  const pools = {

    Common:
      COMMON_WONDROUS,

    Uncommon:
      UNCOMMON_WONDROUS,

    Rare:
      RARE_WONDROUS,

    'Very Rare':
      VERY_RARE_WONDROUS,

    Legendary:
      LEGENDARY_WONDROUS

  };


  const picked =
    W.pick(
      pools[
        rarity
      ]
    );


  /*
    Uncommon and Rare custom EPCOT
    entries already contain their effects.
  */

  if(
    typeof picked !==
    'string'
  ){

    return picked;

  }


  /*
    Very Rare and Legendary items now
    retrieve the description you installed
    in HIGH_TIER_MAGIC_DETAILS.
  */

  if(
    rarity ===
    'Very Rare'
    ||
    rarity ===
    'Legendary'
  ){

    return highTierMagicItem(
      picked,
      rarity,
      'Wondrous Item'
    );

  }


  return {

    name:
      picked,

    effect:
      'Common wondrous item.'

  };

}


  /* =====================================================
     POTION LOOT

     d4:
     1 Combat
     2 Utility
     3 Whimsy
     4 DM / Player Choice

     Rarity determines which part of
     the 1–60 potion table is available.
     ===================================================== */

  const POTION_RANGES = {

    Common:[
      1,
      20
    ],

    Uncommon:[
      21,
      40
    ],

    Rare:[
      41,
      50
    ],

    'Very Rare':[
      51,
      55
    ],

    Legendary:[
      56,
      60
    ]

  };


  function potionFromCategory(
    category,
    rarity
  ){

    const potions =
      window.EPCOT_POTIONS;


    if(
      !potions?.[
        category
      ]
    ){

      return {
        name:
          'Potion Data Unavailable',
        effect:
          'EPCOT_POTIONS was not exposed before the Loot widget loaded.'
      };

    }


    const [
      minimum,
      maximum
    ] =
      POTION_RANGES[
        rarity
      ];


    const number =
      W.randomInt(
        minimum,
        maximum
      );


    const potion =
      potions[
        category
      ][
        number - 1
      ];


    return {

      name:
        potion.name,

      effect:
        potion.effect,

      potionCategory:
        category,

      potionNumber:
        number

    };

  }


  function generatePotion(
    rarity
  ){

    const typeRoll =
      W.randomInt(
        1,
        4
      );


    if(
      typeRoll <=
      3
    ){

      const category =
        [
          'Combat',
          'Utility',
          'Whimsy'
        ][
          typeRoll - 1
        ];


      const result =
        potionFromCategory(
          category,
          rarity
        );


      return {
        ...result,
        potionRoll:typeRoll
      };

    }


    /*
      A 4 is explicitly DM/player choice.

      Rather than secretly randomizing that
      choice, provide one legal candidate
      from each potion family.
    */

    const choices =
      [
        'Combat',
        'Utility',
        'Whimsy'
      ]
        .map(
          category =>
            potionFromCategory(
              category,
              rarity
            )
        );


    return {

      name:
        'Potion Choice',

      effect:
        'The potion-type roll was 4. Choose one of the generated Combat, Utility, or Whimsy options.',

      potionRoll:
        4,

      choices

    };

  }


  function generateItemByCategory(
    category,
    rarity
  ){

    if(
      category ===
      'Arcane Implement'
    ){

      return generateArcane(
        rarity
      );

    }


    if(
      category ===
      'Armor'
    ){

      return generateArmor(
        rarity
      );

    }


    if(
      category ===
      'Ring'
    ){

      return generateRing(
        rarity
      );

    }


    if(
      category ===
      'Spell'
    ){

      return generateSpell(
        rarity
      );

    }


    if(
      category ===
      'Weapon'
    ){

      return generateWeapon(
        rarity
      );

    }


    if(
      category ===
      'Wondrous Item'
    ){

      return generateWondrous(
        rarity
      );

    }


    return generatePotion(
      rarity
    );

  }


  /* =====================================================
     ONE MAGIC ITEM
     ===================================================== */

  function generateMagicItem(
    band
  ){

    const rarityResult =
      rollRarity(
        band
      );


    const categoryResult =
      rollCategory(
        rarityResult.rarity
      );


    const item =
      generateItemByCategory(
        categoryResult.category,
        categoryResult.rarity
      );


    return {

      baseRarity:
        rarityResult.rarity,

      rarityRoll:
        rarityResult.roll,

      finalRarity:
        categoryResult.rarity,

      category:
        categoryResult.category,

      categoryRoll:
        categoryResult.categoryRoll,

      rarityBoosts:
        categoryResult.boosts,

      ...item

    };

  }


  /* =====================================================
     RESULT RENDERING
     ===================================================== */

  function renderMagicItem(
    item,
    index
  ){

    const boostText =
      item.rarityBoosts > 0
        ? `
            <div class="dm-widget-note">
              Category roll increased rarity
              ${
                item.rarityBoosts
              }
              time${
                item.rarityBoosts === 1
                  ? ''
                  : 's'
              }:
              ${W.escapeHtml(
                item.baseRarity
              )}
              →
              ${W.escapeHtml(
                item.finalRarity
              )}
            </div>
          `
        : '';


    if(
      Array.isArray(
        item.choices
      )
    ){

      const choices =
        item.choices
          .map(
            choice =>
              `
                <p>
                  <strong>
                    ${W.escapeHtml(
                      choice.potionCategory
                    )}:
                    ${W.escapeHtml(
                      choice.name
                    )}
                  </strong>

                  <br>

                  ${W.escapeHtml(
                    choice.effect
                  )}
                </p>
              `
          )
          .join('');


      return `
        <div class="dm-widget-modal-result success">

          <strong>
            ${index + 1}.
            ${W.escapeHtml(
              item.finalRarity
            )}
            Potion
          </strong>

          <small>
            Rarity d100:
            ${item.rarityRoll}
            ·
            Category d8:
            ${item.categoryRoll}
            ·
            Potion d4:
            4
          </small>

          <p>
            <strong>
              DM / Player Choice
            </strong>
          </p>

          ${choices}

          ${boostText}

        </div>
      `;

    }


    const potionMeta =
      item.potionCategory
        ? `
            ·
            ${W.escapeHtml(
              item.potionCategory
            )}
            #${item.potionNumber}
          `
        : '';


    return `
      <div class="dm-widget-modal-result success">

        <strong>
          ${index + 1}.
          ${W.escapeHtml(
            item.finalRarity
          )}
          ${W.escapeHtml(
            item.category
          )}
        </strong>

        <small>
          Rarity d100:
          ${item.rarityRoll}
          ·
          Category d8:
          ${item.categoryRoll}
          ${potionMeta}
        </small>

        <p>
          <strong>
            ${W.escapeHtml(
              item.name
            )}
          </strong>
        </p>

        ${
          item.effect
            ? `
                <p>
                  ${W.escapeHtml(
                    item.effect
                  )}
                </p>
              `
            : ''
        }

        ${boostText}

      </div>
    `;

  }


  function magicItemCopyText(
    item,
    index
  ){

    let text =
`${index + 1}. ${item.finalRarity} ${item.category}
${item.name}`;


    if(
      item.effect
    ){

      text +=
        `\n${item.effect}`;

    }


    if(
      item.choices
    ){

      text +=
        '\nDM / Player Choice:';


      item.choices.forEach(
        choice=>{

          text +=
`\n- ${choice.potionCategory}: ${choice.name}
  ${choice.effect}`;

        }
      );

    }


    if(
      item.rarityBoosts > 0
    ){

      text +=
`\nRarity Boost: ${item.baseRarity} → ${item.finalRarity}`;

    }


    return text;

  }


  /* =====================================================
     WIDGET
     ===================================================== */

  W.register({

    id:
      'loot-generator',

    code:
      'DM-08',

    title:
      'Loot Generator',

    subtitle:
      'GP · Hoards · Magic Items',


    render(){

      return `
        <div class="dm-widget-form">

          <label class="dm-widget-field">

            <span>
              Character / Party Level
            </span>

            <select
              data-loot-level
            >

              <option value="1-4">
                Levels 1–4
              </option>

              <option value="5-10">
                Levels 5–10
              </option>

              <option value="11-16">
                Levels 11–16
              </option>

              <option value="17-20">
                Levels 17–20
              </option>

            </select>

          </label>


          <div class="dm-widget-note">
            Select one or more loot types.
          </div>


          <label class="dm-widget-nat">

            <input
              data-loot-gp
              type="checkbox"
              checked
            >

            <span>
              GP
            </span>

          </label>


          <label class="dm-widget-nat">

            <input
              data-loot-hoard
              type="checkbox"
            >

            <span>
              Hoard GP
            </span>

          </label>


          <label class="dm-widget-nat">

            <input
              data-loot-magic
              type="checkbox"
            >

            <span>
              Magic Items
            </span>

          </label>

        </div>


        <div class="dm-widget-actions">

          <button
            class="dm-widget-button"
            type="button"
            data-loot-generate
          >
            Generate Loot
          </button>

        </div>
      `;

    },


    init(root){

      const levelField =
        root.querySelector(
          '[data-loot-level]'
        );


      const gpField =
        root.querySelector(
          '[data-loot-gp]'
        );


      const hoardField =
        root.querySelector(
          '[data-loot-hoard]'
        );


      const magicField =
        root.querySelector(
          '[data-loot-magic]'
        );


      function generate(){

        const wantsGp =
          gpField.checked;


        const wantsHoard =
          hoardField.checked;


        const wantsMagic =
          magicField.checked;


        if(
          !wantsGp &&
          !wantsHoard &&
          !wantsMagic
        ){

          W.showModal({

            kicker:
              'LOOT GENERATOR',

            title:
              'Choose Some Loot',

            body:
              `
                <p>
                  Check GP, Hoard GP,
                  Magic Items,
                  or any combination of them.
                </p>
              `

          });


          return;

        }


        const bandKey =
          levelField.value;


        const band =
          LEVEL_BANDS[
            bandKey
          ];


        let gpResult =
          null;


        let hoardResult =
          null;


        let magicItems =
          [];


        let magicCount =
          0;


        if(
          wantsGp
        ){

          gpResult =
            band.gp();

        }


        if(
          wantsHoard
        ){

          hoardResult =
            band.hoard();

        }


        if(
          wantsMagic
        ){

          magicCount =
            band.magicCount();


          magicItems =
            Array.from(
              {
                length:
                  magicCount
              },
              () =>
                generateMagicItem(
                  bandKey
                )
            );

        }


        let body =
          '';


        let copy =
`LOOT
${band.label}`;


        if(
          gpResult
        ){

          body += `
            <div class="dm-widget-modal-result success">

              <strong>
                GP
              </strong>

              <p>
                ${gpResult.value.toLocaleString()}
                gp
              </p>

              <small>
                ${W.escapeHtml(
                  gpResult.formula
                )}
              </small>

            </div>
          `;


          copy +=
`\n\nGP
${gpResult.value.toLocaleString()} gp
${gpResult.formula}`;

        }


        if(
          hoardResult
        ){

          body += `
            <div class="dm-widget-modal-result success">

              <strong>
                Hoard GP
              </strong>

              <p>
                ${hoardResult.value.toLocaleString()}
                gp
              </p>

              <small>
                ${W.escapeHtml(
                  hoardResult.formula
                )}
              </small>

            </div>
          `;


          copy +=
`\n\nHOARD GP
${hoardResult.value.toLocaleString()} gp
${hoardResult.formula}`;

        }


        if(
          wantsMagic
        ){

          body += `
            <div class="dm-widget-note">

              Magic Item Count:
              ${magicCount}

              ·

              ${W.escapeHtml(
                band.magicFormula
              )}

            </div>
          `;


          copy +=
`\n\nMAGIC ITEMS
${magicCount} item${
  magicCount === 1
    ? ''
    : 's'
} (${band.magicFormula})`;


          if(
            magicCount === 0
          ){

            body += `
              <div class="dm-widget-modal-result">

                <strong>
                  No Magic Items
                </strong>

                The magic-item count
                resolved to 0.

              </div>
            `;


            copy +=
              '\nNo magic items.';

          } else {

            body +=
              magicItems
                .map(
                  renderMagicItem
                )
                .join('');


            magicItems.forEach(
              (
                item,
                index
              )=>{

                copy +=
`\n\n${magicItemCopyText(
  item,
  index
)}`;

              }
            );

          }

        }


        W.showModal({

          kicker:
            'LOOT GENERATED',

          title:
            band.label,

          body,

          actions:[

            {

              label:
                'Roll Again',

              onClick(){

                generate();

              }

            },

            W.copyAction(
              'Copy Results',
              copy
            )

          ]

        });

      }


      root.querySelector(
        '[data-loot-generate]'
      )
        .addEventListener(
          'click',
          generate
        );

    }

  });

})();

/* =====================================================
   COMBAT TOOLS BATCH
   WIDGETS 9–14
   ===================================================== */


/* =====================================================
   WIDGET 9
   NSBI DC CALCULATOR
   DM ONLY
   ===================================================== */

(function(){

  const W =
    window.epcotDmWidgets;


  if(!W){
    return;
  }


  const DURATION = {

    'Instant':0,
    'Minute':1,
    'Hour':2,
    'Week':4,
    'Permanent':6

  };


  const EXPERIENCE = {

    'Mastered':0,
    'Proficient':1,
    'Developing':2,
    'Observed':3,
    'Inexperienced':6

  };


  const MAGNITUDE = {

    'Natural / Tiny':1,
    'Tweaked / Small':3,
    'Synthetic / Medium':5,
    'Reality-Bending / Large':7,
    'Reality-Breaking / XL':10

  };


  function optionsFor(
    object
  ){

    return Object.entries(
      object
    )
      .map(
        ([label,value]) =>
          `
            <option value="${value}">
              ${W.escapeHtml(
                label
              )}
              · +${value}
            </option>
          `
      )
      .join('');

  }


  W.register({

    id:
      'nsbi-dc-calculator',

    code:
      'CB-09',

    title:
      'NSBI DC Calculator',

    subtitle:
      'Effect difficulty',


    render(){

      return `
        <div class="dm-widget-form">

          <label class="dm-widget-field">

            <span>
              Duration
            </span>

            <select data-nsbi-duration>
              ${optionsFor(
                DURATION
              )}
            </select>

          </label>


          <label class="dm-widget-field">

            <span>
              Experience
            </span>

            <select data-nsbi-experience>
              ${optionsFor(
                EXPERIENCE
              )}
            </select>

          </label>


          <label class="dm-widget-field">

            <span>
              Magnitude / Area
            </span>

            <select data-nsbi-magnitude>
              ${optionsFor(
                MAGNITUDE
              )}
            </select>

          </label>

        </div>


        <div class="dm-widget-actions">

          <button
            class="dm-widget-button"
            type="button"
            data-nsbi-calculate
          >
            Calculate DC
          </button>

        </div>
      `;

    },


    init(root){

      root.querySelector(
        '[data-nsbi-calculate]'
      )
        .addEventListener(
          'click',
          ()=>{

            const durationSelect =
              root.querySelector(
                '[data-nsbi-duration]'
              );


            const experienceSelect =
              root.querySelector(
                '[data-nsbi-experience]'
              );


            const magnitudeSelect =
              root.querySelector(
                '[data-nsbi-magnitude]'
              );


            const duration =
              Number(
                durationSelect.value
              );


            const experience =
              Number(
                experienceSelect.value
              );


            const magnitude =
              Number(
                magnitudeSelect.value
              );


            const total =
              duration +
              experience +
              magnitude;


            const durationName =
              durationSelect
                .selectedOptions[0]
                .textContent
                .split('·')[0]
                .trim();


            const experienceName =
              experienceSelect
                .selectedOptions[0]
                .textContent
                .split('·')[0]
                .trim();


            const magnitudeName =
              magnitudeSelect
                .selectedOptions[0]
                .textContent
                .split('·')[0]
                .trim();


            const copy =
`NSBI DC
Final DC: ${total}

Duration: ${durationName} (+${duration})
Experience: ${experienceName} (+${experience})
Magnitude / Area: ${magnitudeName} (+${magnitude})`;


            W.showModal({

              kicker:
                'NSBI DIFFICULTY',

              title:
                `DC ${total}`,

              body:
                `
                  <div class="dm-widget-modal-result success">

                    <strong>
                      FINAL DC ${total}
                    </strong>

                    ${duration}
                    + ${experience}
                    + ${magnitude}

                  </div>


                  <p>
                    <strong>
                      Duration:
                    </strong>
                    ${W.escapeHtml(
                      durationName
                    )}
                    (+${duration})
                  </p>


                  <p>
                    <strong>
                      Experience:
                    </strong>
                    ${W.escapeHtml(
                      experienceName
                    )}
                    (+${experience})
                  </p>


                  <p>
                    <strong>
                      Magnitude / Area:
                    </strong>
                    ${W.escapeHtml(
                      magnitudeName
                    )}
                    (+${magnitude})
                  </p>
                `,

              actions:[

                W.copyAction(
                  'Copy DC',
                  copy
                )

              ]

            });

          }
        );

    }

  });

})();

/* =====================================================
   WIDGET 10
   ENCOUNTER CALCULATOR
   DM ONLY
   ===================================================== */

(function(){

  const W =
    window.epcotDmWidgets;


  if(!W){
    return;
  }


  const ENCOUNTER_XP = {

    1:[50,75,100],
    2:[100,150,200],
    3:[150,225,400],
    4:[250,375,500],
    5:[500,750,1100],
    6:[600,1000,1400],
    7:[750,1300,1700],
    8:[1000,1700,2100],
    9:[1300,2000,2600],
    10:[1600,2300,3100],
    11:[1900,2900,4100],
    12:[2200,3700,4700],
    13:[2600,4200,5400],
    14:[2900,4900,6200],
    15:[3300,5400,7800],
    16:[3800,6100,9800],
    17:[4500,7200,11700],
    18:[5000,8700,14200],
    19:[5500,10700,17200],
    20:[6400,13200,22000]

  };


  W.register({

    id:
      'encounter-calculator',

    code:
      'CB-10',

    title:
      'Encounter Calculator',

    subtitle:
      'Party XP thresholds',


    render(){

      return `
        <div class="dm-widget-form">

          <label class="dm-widget-field">

            <span>
              Party Levels
            </span>

            <input
              type="text"
              data-encounter-levels
              placeholder="Example: 5, 5, 5, 6"
            >

          </label>

        </div>


        <div class="dm-widget-note">
          Enter every PC level,
          separated by commas.
        </div>


        <div class="dm-widget-actions">

          <button
            class="dm-widget-button"
            type="button"
            data-encounter-calculate
          >
            Calculate Encounter
          </button>

        </div>
      `;

    },


    init(root){

      root.querySelector(
        '[data-encounter-calculate]'
      )
        .addEventListener(
          'click',
          ()=>{

            const raw =
              root.querySelector(
                '[data-encounter-levels]'
              ).value;


            const levels =
              raw
                .split(',')
                .map(
                  value =>
                    Number(
                      value.trim()
                    )
                )
                .filter(
                  value =>
                    Number.isInteger(
                      value
                    ) &&
                    value >= 1 &&
                    value <= 20
                );


            if(!levels.length){

              W.showModal({

                kicker:
                  'ENCOUNTER CALCULATOR',

                title:
                  'Party Levels Needed',

                body:
                  `
                    <p>
                      Enter at least one
                      character level from 1–20.
                    </p>
                  `

              });


              return;

            }


            const totals =
              levels.reduce(
                (
                  result,
                  level
                )=>{

                  const row =
                    ENCOUNTER_XP[
                      level
                    ];


                  result.easy +=
                    row[0];

                  result.medium +=
                    row[1];

                  result.deadly +=
                    row[2];


                  return result;

                },
                {
                  easy:0,
                  medium:0,
                  deadly:0
                }
              );


            const copy =
`ENCOUNTER THRESHOLDS

Party: ${levels.join(', ')}

Easy: ${totals.easy.toLocaleString()} XP
Medium: ${totals.medium.toLocaleString()} XP
Deadly: ${totals.deadly.toLocaleString()} XP`;


            W.showModal({

              kicker:
                'ENCOUNTER BUDGET',

              title:
                `${levels.length} Character${
                  levels.length === 1
                    ? ''
                    : 's'
                }`,

              body:
                `
                  <div class="dm-widget-mini-stats">

                    <div class="dm-widget-mini-stat">
                      <span>Easy</span>
                      <strong>
                        ${totals.easy.toLocaleString()}
                      </strong>
                    </div>

                    <div class="dm-widget-mini-stat">
                      <span>Medium</span>
                      <strong>
                        ${totals.medium.toLocaleString()}
                      </strong>
                    </div>

                    <div class="dm-widget-mini-stat">
                      <span>Deadly</span>
                      <strong>
                        ${totals.deadly.toLocaleString()}
                      </strong>
                    </div>

                  </div>

                  <p>
                    Party Levels:
                    ${W.escapeHtml(
                      levels.join(', ')
                    )}
                  </p>
                `,

              actions:[

                W.copyAction(
                  'Copy Results',
                  copy
                )

              ]

            });

          }
        );

    }

  });

})();



/* =====================================================
   WIDGET 11
   FALLEN / REVIVED CONSEQUENCES
   DM + PLAYER SHARED
   UNBOUND ONLY
   ===================================================== */

(function(){

  const W =
    window.epcotDmWidgets;


  if(!W){
    return;
  }


  const FALLEN_RESULTS = [

    'Lost an Eye',
    'Severed Arm',
    'Lost Leg',
    'Lose Digit',
    'Deep Scar on Torso',
    'Frightened of Enemy Type',
    'Broken Wrist',
    'Broken Ribs — Lose Actions',
    '+1 Exhaustion',
    'Minor Scar on Face'

  ];


  const REVIVED_RESULTS = [

    'Amnesia for the Past 1d20 Days',
    'Revival Fails',
    'Reduced Speed',
    'Additional Language',
    'Shimmering Golden Freckles',
    'Sees Ghosts',
    'Burn Scars on Body',
    'Enemies Have Advantage',
    'Only White Hair Grows',
    'Celestial / Fiend Appearance'

  ];


  W.register({

    id:
      'fallen-revived-consequences',

    code:
      'CB-11',

    title:
      'Fallen / Revived',

    subtitle:
      'Unbound consequences',


    render(){

      return `
        <div class="dm-widget-form">

          <label class="dm-widget-field">

            <span>
              Result Type
            </span>

            <select data-fallen-type>

              <option value="Fallen">
                Fallen
              </option>

              <option value="Revived">
                Revived
              </option>

            </select>

          </label>

        </div>


        <div class="dm-widget-actions">

          <button
            class="dm-widget-button"
            type="button"
            data-fallen-roll
          >
            Roll Consequence
          </button>

        </div>
      `;

    },


    init(root){

      function generate(){

        const type =
          root.querySelector(
            '[data-fallen-type]'
          ).value;


        const roll =
          W.randomInt(
            1,
            10
          );


        let result =
          type ===
          'Fallen'
            ? FALLEN_RESULTS[
                roll - 1
              ]
            : REVIVED_RESULTS[
                roll - 1
              ];


        /*
          Automatically resolve the
          1d20-day amnesia result.
        */

        if(
          type ===
          'Revived' &&
          roll === 1
        ){

          const days =
            W.randomInt(
              1,
              20
            );


          result =
            `Amnesia for the Past ${days} Day${
              days === 1
                ? ''
                : 's'
            }`;

        }


        const copy =
`${type.toUpperCase()} CONSEQUENCE
Roll: ${roll}
${result}`;


        W.showModal({

          kicker:
            `${type.toUpperCase()} CONSEQUENCE`,

          title:
            result,

          body:
            `
              <div class="dm-widget-modal-result">

                <strong>
                  d10 → ${roll}
                </strong>

                ${W.escapeHtml(
                  result
                )}

              </div>
            `,

          actions:[

            {

              label:
                'Roll Again',

              onClick(){
                generate();
              }

            },

            W.copyAction(
              'Copy Result',
              copy
            )

          ]

        });

      }


      root.querySelector(
        '[data-fallen-roll]'
      )
        .addEventListener(
          'click',
          generate
        );

    }

  });

})();



/* =====================================================
   WIDGET 12
   SPELL DAMAGE
   DM ONLY
   ===================================================== */

(function(){

  const W =
    window.epcotDmWidgets;


  if(!W){
    return;
  }


  const SPELL_DAMAGE = {

    C:{
      single:[1,10],
      aoe:[1,6]
    },

    1:{
      single:[2,10],
      aoe:[2,6]
    },

    2:{
      single:[3,10],
      aoe:[3,6]
    },

    3:{
      single:[5,10],
      aoe:[6,6]
    },

    4:{
      single:[6,10],
      aoe:[7,6]
    },

    5:{
      single:[7,10],
      aoe:[8,6]
    },

    6:{
      single:[10,10],
      aoe:[11,6]
    },

    7:{
      single:[11,10],
      aoe:[12,6]
    },

    8:{
      single:[12,10],
      aoe:[13,6]
    },

    9:{
      single:[15,10],
      aoe:[16,6]
    }

  };


  W.register({

    id:
      'spell-damage-calculator',

    code:
      'CB-12',

    title:
      'Spell Damage',

    subtitle:
      'Single target / AOE',


    render(){

      return `
        <div class="dm-widget-form">

          <label class="dm-widget-field">

            <span>
              Spell Level
            </span>

            <select data-spell-level>

              <option value="C">
                Cantrip
              </option>

              ${
                Array.from(
                  {
                    length:9
                  },
                  (
                    _,
                    index
                  ) =>
                    `
                      <option value="${index + 1}">
                        Level ${index + 1}
                      </option>
                    `
                )
                  .join('')
              }

            </select>

          </label>


          <label class="dm-widget-field">

            <span>
              Targeting
            </span>

            <select data-spell-target>

              <option value="single">
                1 Target
              </option>

              <option value="aoe">
                AOE
              </option>

            </select>

          </label>

        </div>


        <div class="dm-widget-actions">

          <button
            class="dm-widget-button"
            type="button"
            data-spell-damage
          >
            Roll Damage
          </button>

        </div>
      `;

    },


    init(root){

      function generate(){

        const level =
          root.querySelector(
            '[data-spell-level]'
          ).value;


        const target =
          root.querySelector(
            '[data-spell-target]'
          ).value;


        const [
          count,
          sides
        ] =
          SPELL_DAMAGE[
            level
          ][
            target
          ];


        const rolled =
          W.roll(
            count,
            sides
          );


        const formula =
          `${count}d${sides}`;


        const levelLabel =
          level ===
          'C'
            ? 'Cantrip'
            : `Level ${level}`;


        const targetLabel =
          target ===
          'single'
            ? '1 Target'
            : 'AOE';


        const copy =
`SPELL DAMAGE
${levelLabel}
${targetLabel}

Damage: ${formula}
Rolled: ${rolled.total}
Dice: ${rolled.results.join(', ')}`;


        W.showModal({

          kicker:
            'SPELL DAMAGE',

          title:
            `${rolled.total} Damage`,

          body:
            `
              <div class="dm-widget-modal-result success">

                <strong>
                  ${formula}
                  → ${rolled.total}
                </strong>

                ${W.escapeHtml(
                  rolled.results.join(
                    ' + '
                  )
                )}

              </div>

              <p>
                ${W.escapeHtml(
                  levelLabel
                )}
                ·
                ${W.escapeHtml(
                  targetLabel
                )}
              </p>
            `,

          actions:[

            {

              label:
                'Roll Again',

              onClick(){
                generate();
              }

            },

            W.copyAction(
              'Copy Damage',
              copy
            )

          ]

        });

      }


      root.querySelector(
        '[data-spell-damage]'
      )
        .addEventListener(
          'click',
          generate
        );

    }

  });

})();



/* =====================================================
   WIDGET 13
   TRAP DAMAGE CALCULATOR
   DM ONLY
   ===================================================== */

(function(){

  const W =
    window.epcotDmWidgets;


  if(!W){
    return;
  }


  const TRAP_DATA = {

    '1-4':{

      nuisance:{
        dc:[10,12],
        damage:[1,10]
      },

      deadly:{
        dc:[13,15],
        damage:[2,10]
      }

    },


    '5-10':{

      nuisance:{
        dc:[12,14],
        damage:[2,10]
      },

      deadly:{
        dc:[15,17],
        damage:[4,10]
      }

    },


    '11-16':{

      nuisance:{
        dc:[14,16],
        damage:[4,10]
      },

      deadly:{
        dc:[17,19],
        damage:[10,10]
      }

    },


    '17-20':{

      nuisance:{
        dc:[16,18],
        damage:[10,10]
      },

      deadly:{
        dc:[19,21],
        damage:[18,10]
      }

    }

  };


  const TRAP_EXAMPLES = [

    'Collapsing Roof — Bludgeoning',
    'Falling Net — DC 10 Athletics',
    'Fire-Casting Statue — Fire',
    'Hidden Pit — Climb to Escape',
    'Darts / Needle — Poison, Poisoned Condition',
    'Rolling Stone — Bludgeoning, Prone',
    'Spike Pit — Bludgeoning and Piercing'

  ];


  const HAZARD_EXAMPLES = [

    'Brown Mold — Cold',
    'Fireball Fungus — Fire',
    'Green Slime — Acid',
    'Poison Gas — Poison; Disadvantage on Death Saves',
    'Quicksand Pit — Sinks 1d4 ft; Restrained; DC 10 Athletics + feet sunk',
    'Razorvine — Slashing',
    'Rockslide — Bludgeoning, Prone',
    'Vicious Vine — Necrotic',
    'Webs — Restrained',
    'Yellow Mold — Poison; Poisoned Condition'

  ];


  W.register({

    id:
      'trap-damage-calculator',

    code:
      'CB-13',

    title:
      'Trap Damage',

    subtitle:
      'Trap / hazard builder',


    render(){

      return `
        <div class="dm-widget-form">

          <label class="dm-widget-field">

            <span>
              Character Level
            </span>

            <select data-trap-level>

              <option value="1-4">
                Levels 1–4
              </option>

              <option value="5-10">
                Levels 5–10
              </option>

              <option value="11-16">
                Levels 11–16
              </option>

              <option value="17-20">
                Levels 17–20
              </option>

            </select>

          </label>


          <label class="dm-widget-field">

            <span>
              Severity
            </span>

            <select data-trap-severity>

              <option value="nuisance">
                Nuisance
              </option>

              <option value="deadly">
                Deadly
              </option>

            </select>

          </label>


          <label class="dm-widget-field">

            <span>
              Inspiration Type
            </span>

            <select data-trap-example>

              <option value="none">
                None
              </option>

              <option value="trap">
                Random Trap
              </option>

              <option value="hazard">
                Random Hazard
              </option>

            </select>

          </label>

        </div>


        <div class="dm-widget-note">
          Attack Bonus: +4
        </div>


        <div class="dm-widget-actions">

          <button
            class="dm-widget-button"
            type="button"
            data-trap-generate
          >
            Generate Trap
          </button>

        </div>
      `;

    },


    init(root){

      function generate(){

        const level =
          root.querySelector(
            '[data-trap-level]'
          ).value;


        const severity =
          root.querySelector(
            '[data-trap-severity]'
          ).value;


        const exampleType =
          root.querySelector(
            '[data-trap-example]'
          ).value;


        const data =
          TRAP_DATA[
            level
          ][
            severity
          ];


        const dc =
          W.randomInt(
            data.dc[0],
            data.dc[1]
          );


        const [
          count,
          sides
        ] =
          data.damage;


        const damage =
          W.roll(
            count,
            sides
          );


        let example =
          '';


        if(
          exampleType ===
          'trap'
        ){

          example =
            W.pick(
              TRAP_EXAMPLES
            );

        }


        if(
          exampleType ===
          'hazard'
        ){

          example =
            W.pick(
              HAZARD_EXAMPLES
            );

        }


        const formula =
          `${count}d${sides}`;


        const severityLabel =
          severity ===
          'nuisance'
            ? 'Nuisance'
            : 'Deadly';


        const copy =
`TRAP / HAZARD
Levels ${level}
${severityLabel}

DC: ${dc}
DC Range: ${data.dc[0]}–${data.dc[1]}
Attack Bonus: +4
Damage: ${formula}
Rolled Damage: ${damage.total}${
  example
    ? `\nExample: ${example}`
    : ''
}`;


        W.showModal({

          kicker:
            'TRAP CALCULATOR',

          title:
            `${severityLabel} · DC ${dc}`,

          body:
            `
              <div class="dm-widget-mini-stats">

                <div class="dm-widget-mini-stat">

                  <span>
                    DC
                  </span>

                  <strong>
                    ${dc}
                  </strong>

                </div>


                <div class="dm-widget-mini-stat">

                  <span>
                    Attack
                  </span>

                  <strong>
                    +4
                  </strong>

                </div>


                <div class="dm-widget-mini-stat">

                  <span>
                    Damage
                  </span>

                  <strong>
                    ${formula}
                  </strong>

                </div>

              </div>


              <div class="dm-widget-modal-result failure">

                <strong>
                  DAMAGE ROLL:
                  ${damage.total}
                </strong>

                ${W.escapeHtml(
                  damage.results.join(
                    ' + '
                  )
                )}

              </div>


              ${
                example
                  ? `
                      <p>
                        <strong>
                          Inspiration:
                        </strong>
                        ${W.escapeHtml(
                          example
                        )}
                      </p>
                    `
                  : ''
              }
            `,

          actions:[

            {

              label:
                'Roll Again',

              onClick(){
                generate();
              }

            },

            W.copyAction(
              'Copy Result',
              copy
            )

          ]

        });

      }


      root.querySelector(
        '[data-trap-generate]'
      )
        .addEventListener(
          'click',
          generate
        );

    }

  });

})();



/* =====================================================
   WIDGET 14
   CHASE OBSTACLES
   DM ONLY
   ===================================================== */

(function(){

  const W =
    window.epcotDmWidgets;


  if(!W){
    return;
  }


  const WILDS_CHASE = {

    1:
      'Swarm of Insects',

    2:
      'Stream / Ravine — DC 10 Strength or Dexterity save or treat as Difficult Terrain.',

    3:
      'Blowing Sand / Dirt / Ash / Snow / Pollen — DC 10 Constitution save or become Blinded and move at half Speed.',

    4:
      'Sudden Drop — DC 10 Dexterity save or fall 10 feet.',

    5:
      'Razorvine — DC 15 Dexterity save; spend 10 feet of movement or take 1d10 Slashing damage.',

    6:
      'Native Creature — DC 10 Wisdom or Charisma save or the creature joins the chase.'

  };


  const CITY_CHASE = {

    1:
      'Large Obstacle — DC 10 Dexterity save or treat as Difficult Terrain.',

    2:
      'Crowd Blocking the Way — DC 10 Strength, Dexterity, or Charisma save or treat as Difficult Terrain.',

    3:
      'Maze of Barrels — DC 10 Dexterity or Intelligence save or treat as Difficult Terrain.',

    4:
      'Slippery Liquid — DC 10 Dexterity save or fall Prone.',

    5:
      'Brawl in Progress — DC 10 Strength, Dexterity, or Charisma save or treat as Difficult Terrain and take 2d4 Bludgeoning damage from the brawlers.',

    6:
      'Run Into Something — DC 10 Dexterity save or take 1d4 Bludgeoning damage.'

  };


  W.register({

    id:
      'chase-obstacle-generator',

    code:
      'CB-14',

    title:
      'Chase Obstacles',

    subtitle:
      'Wilds / city complications',


    render(){

      return `
        <div class="dm-widget-form">

          <label class="dm-widget-field">

            <span>
              Chase Environment
            </span>

            <select data-chase-type>

              <option value="Wilds">
                Wilds
              </option>

              <option value="City">
                City
              </option>

            </select>

          </label>

        </div>


        <div class="dm-widget-actions">

          <button
            class="dm-widget-button"
            type="button"
            data-chase-roll
          >
            Roll Obstacle
          </button>

        </div>
      `;

    },


    init(root){

      function generate(){

        const type =
          root.querySelector(
            '[data-chase-type]'
          ).value;


        const roll =
          W.randomInt(
            1,
            12
          );


        const table =
          type ===
          'Wilds'
            ? WILDS_CHASE
            : CITY_CHASE;


        const result =
          roll <= 6
            ? table[
                roll
              ]
            : 'No Complication';


        const copy =
`${type.toUpperCase()} CHASE
d12: ${roll}

${result}`;


        W.showModal({

          kicker:
            `${type.toUpperCase()} CHASE`,

          title:
            result ===
            'No Complication'
              ? 'Clear Path'
              : 'Obstacle!',

          body:
            `
              <div class="dm-widget-modal-result ${
                result ===
                'No Complication'
                  ? 'success'
                  : 'failure'
              }">

                <strong>
                  d12 → ${roll}
                </strong>

                ${W.escapeHtml(
                  result
                )}

              </div>
            `,

          actions:[

            {

              label:
                'Roll Again',

              onClick(){
                generate();
              }

            },

            W.copyAction(
              'Copy Result',
              copy
            )

          ]

        });

      }


      root.querySelector(
        '[data-chase-roll]'
      )
        .addEventListener(
          'click',
          generate
        );

    }

  });

})();

/* =====================================================
   WIDGET 15
   COMMON RULES
   SEARCHABLE 5.5e / 2024 QUICK REFERENCE

   Includes embedded calculators for:
   - Jumping
   - Carrying Capacity
   - Falling
   - Suffocation
   - Exhaustion
   - Object HP
   - Concentration
   - Passive Perception
   ===================================================== */

(function(){

  const W =
    window.epcotDmWidgets;


  if(!W){
    return;
  }


  /* =====================================================
     HELPERS
     ===================================================== */

  function abilityModifier(
    score
  ){

    return Math.floor(
      (
        Number(score) -
        10
      ) /
      2
    );

  }


  function signed(
    value
  ){

    const number =
      Number(
        value
      );


    return number >= 0
      ? `+${number}`
      : String(
          number
        );

  }


  function ruleButton(
    rule
  ){

    return `
      <button
        class="dm-widget-button secondary"
        type="button"
        data-common-rule="${W.escapeHtml(
          rule.id
        )}"
        style="
          width:100%;
          text-align:left;
          margin-bottom:7px;
        "
      >
        ${W.escapeHtml(
          rule.title
        )}
      </button>
    `;

  }


  /* =====================================================
     RULE LIBRARY
     ===================================================== */

  const RULES = [

    /* ===================================================
       CORE CHECKS
       =================================================== */

    {
      id:'difficulty-class',
      category:'Checks & Actions',
      title:'Typical Difficulty Classes',
      aliases:'dc difficulty check easy hard moderate impossible nearly very',
      body:`
        <p>
          Use these as quick benchmarks when
          a rule does not already provide a DC.
        </p>

        <div class="dm-widget-modal-result">
          <strong>Very Easy · DC 5</strong>
          Easy · DC 10<br>
          Moderate · DC 15<br>
          Hard · DC 20<br>
          Very Hard · DC 25<br>
          Nearly Impossible · DC 30
        </div>
      `
    },


    {
      id:'actions',
      category:'Checks & Actions',
      title:'Actions',
      aliases:'action attack dash disengage dodge help hide influence magic ready search study utilize',
      body:`
        <p>
          The standard actions are:
        </p>

        <div class="dm-widget-modal-result">
          Attack · Dash · Disengage · Dodge · Help · Hide ·
          Influence · Magic · Ready · Search · Study · Utilize
        </div>
      `
    },


    {
      id:'ritual',
      category:'Checks & Actions',
      title:'Ritual Casting',
      aliases:'ritual spell slot casting prepared',
      body:`
        <p>
          A prepared spell with the
          <strong>Ritual</strong> tag can be cast
          as a ritual.
        </p>

        <p>
          Ritual casting takes
          <strong>10 minutes longer</strong>
          than the spell's normal casting time
          and expends no spell slot.
        </p>

        <p>
          Because no slot is expended,
          the ritual isn't cast using a
          higher-level spell slot.
        </p>
      `
    },


    {
      id:'concentration',
      category:'Checks & Actions',
      title:'Concentration',
      aliases:'concentrate concentration damage save spell dc',
      calculator:'concentration',
      body:`
        <p>
          Taking damage while concentrating
          requires a Constitution saving throw.
        </p>

        <div class="dm-widget-modal-result">
          <strong>
            DC = 10 or half the damage taken,
            whichever is higher
          </strong>

          Half damage is rounded down.
          The maximum DC is 30.
        </div>

        <p>
          Concentration also ends if you begin
          another Concentration effect,
          become Incapacitated,
          or die.
        </p>
      `
    },


    {
      id:'opportunity-attack',
      category:'Checks & Actions',
      title:'Opportunity Attacks',
      aliases:'opportunity attack reaction leave reach disengage teleport forced movement',
      body:`
        <p>
          When a creature you can see leaves
          your reach using its movement,
          Action, Bonus Action, or Reaction,
          you can use your Reaction to make
          one melee weapon attack or
          Unarmed Strike against it.
        </p>

        <p>
          The attack occurs immediately before
          the creature leaves your reach.
        </p>
      `
    },


    {
      id:'hide',
      category:'Checks & Actions',
      title:'Hide',
      aliases:'hide stealth invisible obscured cover hiding dc 15',
      body:`
        <p>
          To Hide, make a
          <strong>DC 15 Dexterity (Stealth)</strong>
          check while Heavily Obscured or behind
          Three-Quarters or Total Cover, and
          outside every enemy's line of sight.
        </p>

        <p>
          On success, you gain the
          <strong>Invisible</strong> condition
          while hidden. Your Stealth result
          becomes the DC for creatures trying
          to find you with Perception.
        </p>
      `
    },


    {
      id:'passive-perception',
      category:'Checks & Actions',
      title:'Passive Perception',
      aliases:'passive perception awareness wisdom advantage disadvantage',
      calculator:'passive',
      body:`
        <div class="dm-widget-modal-result">
          <strong>
            Passive Perception =
            10 + Perception check bonus
          </strong>

          Advantage adds 5.<br>
          Disadvantage subtracts 5.
        </div>
      `
    },


    {
      id:'critical-hit',
      category:'Checks & Actions',
      title:'Critical Hits',
      aliases:'critical crit natural 20 damage dice',
      body:`
        <p>
          On a Critical Hit, roll the attack's
          damage dice twice and add modifiers
          normally.
        </p>
      `
    },


    {
      id:'knockout',
      category:'Checks & Actions',
      title:'Knocking Out a Creature',
      aliases:'knock out knockout unconscious nonlethal melee zero hp',
      body:`
        <p>
          When a melee attack would reduce
          a creature to 0 HP, the attacker can
          instead leave it at
          <strong>1 HP and Unconscious</strong>.
        </p>

        <p>
          The creature starts a Short Rest.
          It awakens if it regains HP or if
          someone succeeds on a DC 10
          Wisdom (Medicine) check to administer
          first aid.
        </p>
      `
    },


    /* ===================================================
       COVER / VISION
       =================================================== */

    {
      id:'cover',
      category:'Vision & Position',
      title:'Cover',
      aliases:'cover half three quarters total ac dex save',
      body:`
        <div class="dm-widget-modal-result">
          <strong>Half Cover</strong>
          +2 AC and Dexterity saving throws.
        </div>

        <div class="dm-widget-modal-result">
          <strong>Three-Quarters Cover</strong>
          +5 AC and Dexterity saving throws.
        </div>

        <div class="dm-widget-modal-result">
          <strong>Total Cover</strong>
          Can't be targeted directly by an
          attack or other effect.
        </div>

        <p>
          If several degrees apply,
          use only the most protective one.
        </p>
      `
    },


    {
      id:'dim-light',
      category:'Vision & Position',
      title:'Dim Light / Lightly Obscured',
      aliases:'dim light lightly obscured perception sight vision',
      body:`
        <p>
          A creature has
          <strong>Disadvantage on Wisdom
          (Perception) checks made to see</strong>
          something in a Lightly Obscured area.
        </p>
      `
    },


    {
      id:'darkness',
      category:'Vision & Position',
      title:'Darkness / Heavily Obscured',
      aliases:'dark darkness heavily obscured blind blinded vision',
      body:`
        <p>
          While trying to see something
          in a Heavily Obscured space,
          you have the
          <strong>Blinded</strong> condition.
        </p>
      `
    },


    {
      id:'darkvision',
      category:'Vision & Position',
      title:'Darkvision',
      aliases:'darkvision darkness dim light vision',
      body:`
        <p>
          Within its stated range,
          Darkvision lets a creature see
          <strong>Dim Light as Bright Light</strong>
          and
          <strong>Darkness as Dim Light</strong>.
        </p>
      `
    },


    {
      id:'truesight',
      category:'Vision & Position',
      title:'Truesight',
      aliases:'truesight true sight invisible illusion darkness ethereal shapechanger transformation',
      body:`
        <p>
          Within its range, Truesight allows
          a creature to see through normal and
          magical Darkness, see creatures and
          objects with the Invisible condition,
          and see into the Ethereal Plane.
        </p>

        <p>
          Visual illusions appear transparent,
          and the creature automatically succeeds
          on saving throws against them.
        </p>

        <p>
          The creature also discerns the true
          form of creatures or objects transformed
          by magic.
        </p>
      `
    },


    /* ===================================================
       MOVEMENT
       =================================================== */

    {
      id:'jumping',
      category:'Movement',
      title:'Jumping',
      aliases:'jump jumping high long vertical horizontal reach strength athletics acrobatics',
      calculator:'jump',
      body:`
        <p>
          <strong>Running Long Jump:</strong>
          up to your Strength score in feet
          after moving at least 10 feet immediately
          beforehand.
        </p>

        <p>
          <strong>Standing Long Jump:</strong>
          half the running distance.
        </p>

        <p>
          <strong>Running High Jump:</strong>
          3 + Strength modifier feet
          (minimum 0), after a 10-foot run-up.
        </p>

        <p>
          <strong>Standing High Jump:</strong>
          half the running height.
        </p>

        <p>
          Every foot jumped costs a foot
          of movement.
        </p>

        <p>
          Landing a Long Jump in Difficult
          Terrain requires a DC 10 Dexterity
          (Acrobatics) check or you fall Prone.
        </p>

        <p>
          At the DM's option, clearing a low
          obstacle no taller than one-quarter
          of a Long Jump's distance requires
          a DC 10 Strength (Athletics) check.
        </p>
      `
    },


    {
      id:'climbing',
      category:'Movement',
      title:'Climbing',
      aliases:'climb climbing wall movement athletics slippery handholds',
      body:`
        <p>
          Each 1 foot climbed normally costs
          <strong>2 feet of movement</strong>.
        </p>

        <p>
          In Difficult Terrain, each 1 foot
          climbed costs
          <strong>3 feet of movement</strong>.
        </p>

        <p>
          A Climb Speed removes the normal
          extra climbing cost when used.
        </p>

        <p>
          At the DM's option, a slippery surface
          or one with few handholds can require
          a <strong>DC 15 Strength (Athletics)</strong>
          check.
        </p>
      `
    },


    {
      id:'crawling',
      category:'Movement',
      title:'Crawling',
      aliases:'crawl crawling prone movement difficult terrain',
      body:`
        <p>
          Each 1 foot crawled normally costs
          <strong>2 feet of movement</strong>.
        </p>

        <p>
          In Difficult Terrain, each 1 foot
          crawled costs
          <strong>3 feet of movement</strong>.
        </p>
      `
    },


    {
      id:'swimming',
      category:'Movement',
      title:'Swimming',
      aliases:'swim swimming water movement difficult terrain athletics',
      body:`
        <p>
          Each 1 foot swum normally costs
          <strong>2 feet of movement</strong>.
        </p>

        <p>
          In Difficult Terrain, each 1 foot
          costs <strong>3 feet</strong>.
        </p>

        <p>
          A Swim Speed removes the normal
          extra swimming cost when used.
        </p>

        <p>
          At the DM's option, rough water
          can require a
          <strong>DC 15 Strength (Athletics)</strong>
          check.
        </p>
      `
    },


    {
      id:'difficult-terrain',
      category:'Movement',
      title:'Difficult Terrain',
      aliases:'difficult terrain movement extra foot speed',
      body:`
        <p>
          Every foot moved through Difficult
          Terrain costs
          <strong>1 extra foot of movement</strong>.
        </p>

        <p>
          Multiple sources of Difficult Terrain
          don't increase the cost further.
        </p>
      `
    },


    {
      id:'carrying-capacity',
      category:'Movement',
      title:'Carrying / Push / Drag / Lift',
      aliases:'carry carrying capacity weight pounds push drag lift strength size',
      calculator:'carry',
      body:`
        <p>
          Carrying capacity and maximum
          Push/Drag/Lift weight are based
          on Strength and creature size.
        </p>

        <div class="dm-widget-modal-result">
          <strong>Small / Medium</strong>
          Carry: STR × 15 lb<br>
          Push / Drag / Lift: STR × 30 lb
        </div>

        <p>
          Tiny creatures use half those values.
          Each size above Medium doubles them.
        </p>
      `
    },


    /* ===================================================
       UNDERWATER
       =================================================== */

    {
      id:'underwater-combat',
      category:'Combat Environment',
      title:'Underwater Combat',
      aliases:'underwater combat swim fire resistance melee ranged piercing weapon water',
      body:`
        <p>
          <strong>Melee Weapon Attacks:</strong>
          a creature without a Swim Speed has
          Disadvantage unless the weapon deals
          Piercing damage.
        </p>

        <p>
          <strong>Ranged Weapon Attacks:</strong>
          attacks automatically miss beyond
          the weapon's normal range and have
          Disadvantage within normal range.
        </p>

        <p>
          <strong>Fire:</strong>
          anything underwater has
          Resistance to Fire damage.
        </p>
      `
    },


    /* ===================================================
       OBJECTS / STRUCTURES
       =================================================== */

    {
      id:'object-hp',
      category:'Objects & Structures',
      title:'Object HP by Size',
      aliases:'object hp hit points fragile resilient size break destroy',
      calculator:'objecthp',
      body:`
        <div class="dm-widget-modal-result">
          <strong>Tiny</strong>
          Fragile 1d4 · Resilient 2d4
        </div>

        <div class="dm-widget-modal-result">
          <strong>Small</strong>
          Fragile 1d6 · Resilient 3d6
        </div>

        <div class="dm-widget-modal-result">
          <strong>Medium</strong>
          Fragile 1d8 · Resilient 4d8
        </div>

        <div class="dm-widget-modal-result">
          <strong>Large</strong>
          Fragile 1d10 · Resilient 5d10
        </div>

        <p>
          Objects are immune to Poison
          and Psychic damage unless a rule
          says otherwise.
        </p>
      `
    },


    {
      id:'material-objects',
      category:'Objects & Structures',
      title:'Object Materials',
      aliases:'glass wood stone metal object ac hp dc material break',
      body:`
        <div class="dm-widget-modal-result">
          <strong>Glass</strong>
          AC 13 · HP 4 · DC 10
        </div>

        <div class="dm-widget-modal-result">
          <strong>Wood</strong>
          AC 15 · HP 18 · DC 15
        </div>

        <div class="dm-widget-modal-result">
          <strong>Stone</strong>
          AC 17 · HP 40 · DC 20
        </div>

        <div class="dm-widget-modal-result">
          <strong>Metal</strong>
          AC 19 · HP 72 · DC 25
        </div>
      `
    },


    {
      id:'doors',
      category:'Objects & Structures',
      title:'Doors',
      aliases:'door doors iron wood strength dc break',
      body:`
        <div class="dm-widget-modal-result">
          <strong>Medium · 8 × 5 ft</strong>
          Iron DC 20 · Wood DC 15
        </div>

        <div class="dm-widget-modal-result">
          <strong>Large · 10 × 10 ft</strong>
          Iron DC 25 · Wood DC 20
        </div>

        <div class="dm-widget-modal-result">
          <strong>Huge · 20 × 15 ft</strong>
          Iron DC 30 · Wood DC 25
        </div>
      `
    },


    {
      id:'portcullises',
      category:'Objects & Structures',
      title:'Portcullises',
      aliases:'portcullis gate quality dc inferior good superior',
      body:`
        <div class="dm-widget-modal-result">
          <strong>Inferior</strong>
          1d10
        </div>

        <div class="dm-widget-modal-result">
          <strong>Good</strong>
          2d10
        </div>

        <div class="dm-widget-modal-result">
          <strong>Superior</strong>
          4d10
        </div>
      `
    },


    {
      id:'locks',
      category:'Objects & Structures',
      title:'Locks',
      aliases:'lock locks pick complex simple time action minute',
      body:`
        <div class="dm-widget-modal-result">
          <strong>Simple Lock</strong>
          1 Action
        </div>

        <div class="dm-widget-modal-result">
          <strong>Complex Lock</strong>
          1 Minute
        </div>
      `
    },


    {
      id:'secret-doors',
      category:'Objects & Structures',
      title:'Secret Doors',
      aliases:'secret hidden door perception search find dc',
      body:`
        <div class="dm-widget-modal-result">
          <strong>Barely Hidden</strong>
          DC 10
        </div>

        <div class="dm-widget-modal-result">
          <strong>Standard</strong>
          DC 15
        </div>

        <div class="dm-widget-modal-result">
          <strong>Well Hidden</strong>
          DC 20
        </div>
      `
    },


    /* ===================================================
       TRAVEL
       =================================================== */

    {
      id:'travel-pace',
      category:'Travel & Exploration',
      title:'Travel Pace',
      aliases:'travel pace fast normal slow miles hour day distance',
      body:`
        <p>
          Standard travel pace:
        </p>

        <div class="dm-widget-modal-result">
          <strong>Fast</strong>
          4 miles/hour · 30 miles/day
        </div>

        <div class="dm-widget-modal-result">
          <strong>Normal</strong>
          3 miles/hour · 24 miles/day
        </div>

        <div class="dm-widget-modal-result">
          <strong>Slow</strong>
          2 miles/hour · 18 miles/day
        </div>
      `
    },


    {
      id:'terrain-exploration',
      category:'Travel & Exploration',
      title:'Terrain Exploration',
      aliases:'terrain forage navigation search arctic coastal desert forest grassland hill mountain swamp underdark urban water travel',
      body:`
        <div style="overflow-x:auto">

          <table
            style="
              width:100%;
              border-collapse:collapse;
              font-size:.85rem;
            "
          >

            <thead>
              <tr>
                <th>Terrain</th>
                <th>Max</th>
                <th>Forage</th>
                <th>Navigation</th>
                <th>Search</th>
              </tr>
            </thead>

            <tbody>
              <tr><td>Arctic</td><td>Fast*</td><td>20</td><td>10</td><td>10</td></tr>
              <tr><td>Coastal</td><td>Normal</td><td>10</td><td>5</td><td>15</td></tr>
              <tr><td>Desert</td><td>Normal</td><td>20</td><td>10</td><td>10</td></tr>
              <tr><td>Forest</td><td>Normal</td><td>15</td><td>15</td><td>15</td></tr>
              <tr><td>Grassland</td><td>Fast</td><td>15</td><td>5</td><td>15</td></tr>
              <tr><td>Hill</td><td>Normal</td><td>15</td><td>10</td><td>15</td></tr>
              <tr><td>Mountain</td><td>Slow</td><td>20</td><td>15</td><td>20</td></tr>
              <tr><td>Swamp</td><td>Slow</td><td>10</td><td>15</td><td>20</td></tr>
              <tr><td>Underdark</td><td>Normal</td><td>20</td><td>10</td><td>20</td></tr>
              <tr><td>Urban</td><td>Normal</td><td>20</td><td>15</td><td>15</td></tr>
              <tr><td>Water</td><td>Special†</td><td>15</td><td>10</td><td>15</td></tr>
            </tbody>

          </table>

        </div>

        <p>
          * Requires appropriate equipment,
          such as skis.
        </p>

        <p>
          † Water pace depends on the vehicle
          carrying the travelers.
        </p>
      `
    },


    /* ===================================================
       CONDITIONS
       =================================================== */

    {
      id:'blinded',
      category:'Conditions',
      title:'Blinded',
      aliases:'blind blinded condition sight attacks advantage disadvantage',
      body:`
        <p>
          Automatically fail any ability check
          requiring sight.
        </p>

        <p>
          Your attacks have Disadvantage.
          Attacks against you have Advantage.
        </p>
      `
    },


    {
      id:'bloodied',
      category:'Conditions',
      title:'Bloodied',
      aliases:'bloodied half hp hit points',
      body:`
        <p>
          A creature is Bloodied while it has
          <strong>half its Hit Points or fewer</strong>.
        </p>
      `
    },


    {
      id:'charmed',
      category:'Conditions',
      title:'Charmed',
      aliases:'charmed charm charmer social harm',
      body:`
        <p>
          You can't attack the charmer or target
          the charmer with damaging abilities
          or magical effects.
        </p>

        <p>
          The charmer has Advantage on ability
          checks to interact socially with you.
        </p>
      `
    },


    {
      id:'cursed',
      category:'Conditions',
      title:'Cursed',
      aliases:'curse cursed remove curse greater restoration',
      body:`
        <p>
          A curse can originate from a creature,
          object, spell, or other effect.
        </p>

        <p>
          Its specific rules determine what
          removes it. Remove Curse and certain
          restorative magic can end many curses.
        </p>
      `
    },


    {
      id:'dead',
      category:'Conditions',
      title:'Dead',
      aliases:'dead death revive resurrection hp attunement',
      body:`
        <p>
          A dead creature has no Hit Points
          and can't regain Hit Points unless
          first returned to life.
        </p>

        <p>
          Returning from death can remove
          various conditions or effects as
          specified by the revival magic used.
        </p>
      `
    },


    {
      id:'deafened',
      category:'Conditions',
      title:'Deafened',
      aliases:'deaf deafened hearing',
      body:`
        <p>
          Automatically fail any ability check
          that requires hearing.
        </p>
      `
    },


    {
      id:'exhaustion',
      category:'Conditions',
      title:'Exhaustion',
      aliases:'exhaustion exhausted level speed d20 test death rest',
      calculator:'exhaustion',
      body:`
        <p>
          Exhaustion is cumulative.
          You die at
          <strong>6 levels</strong>.
        </p>

        <div class="dm-widget-modal-result">
          Every D20 Test is reduced by
          <strong>2 × Exhaustion level</strong>.
          <br><br>
          Speed is reduced by
          <strong>5 ft × Exhaustion level</strong>.
        </div>

        <p>
          Finishing a Long Rest removes
          1 Exhaustion level.
        </p>
      `
    },


    {
      id:'frightened',
      category:'Conditions',
      title:'Frightened',
      aliases:'frightened fear scared line sight approach',
      body:`
        <p>
          You have Disadvantage on ability checks
          and attack rolls while the source of
          fear is within line of sight.
        </p>

        <p>
          You can't willingly move closer
          to the source of fear.
        </p>
      `
    },


    {
      id:'grappled',
      category:'Conditions',
      title:'Grappled',
      aliases:'grapple grappled speed escape drag carry attack',
      body:`
        <p>
          Speed becomes 0 and can't increase.
        </p>

        <p>
          You have Disadvantage on attacks
          against targets
          <strong>other than the grappler</strong>.
        </p>

        <p>
          The grappler can drag or carry you,
          but each foot costs 1 extra foot
          unless you are Tiny or at least
          two sizes smaller than the grappler.
        </p>

        <p>
          A Grappled creature can use its Action
          to make Athletics or Acrobatics against
          the grapple's escape DC.
        </p>
      `
    },


    {
      id:'incapacitated',
      category:'Conditions',
      title:'Incapacitated',
      aliases:'incapacitated action bonus reaction concentration speech initiative',
      body:`
        <p>
          You can't take Actions,
          Bonus Actions, or Reactions.
        </p>

        <p>
          Concentration ends and you can't speak.
        </p>

        <p>
          If Incapacitated when Initiative is rolled,
          you have Disadvantage on that roll.
        </p>
      `
    },


    {
      id:'invisible',
      category:'Conditions',
      title:'Invisible',
      aliases:'invisible unseen attack initiative sight target concealed',
      body:`
        <p>
          You have Advantage on Initiative.
        </p>

        <p>
          You aren't affected by effects that
          require their target to be seen unless
          the effect's creator can somehow see you.
        </p>

        <p>
          Your equipment is also concealed.
          Your attacks have Advantage and attacks
          against you have Disadvantage when
          invisibility prevents the opponent
          from seeing you.
        </p>
      `
    },


    {
      id:'paralyzed',
      category:'Conditions',
      title:'Paralyzed',
      aliases:'paralyzed paralysis incapacitated speed strength dex save critical',
      body:`
        <p>
          You are Incapacitated.
          Speed is 0 and can't increase.
        </p>

        <p>
          Automatically fail Strength and
          Dexterity saving throws.
        </p>

        <p>
          Attacks against you have Advantage.
          A hit is automatically a Critical Hit
          if the attacker is within 5 feet.
        </p>
      `
    },


    {
      id:'petrified',
      category:'Conditions',
      title:'Petrified',
      aliases:'petrified stone weight resistance poison incapacitated',
      body:`
        <p>
          You and your nonmagical carried
          equipment become a solid inanimate
          substance. Weight increases tenfold
          and aging stops.
        </p>

        <p>
          You are Incapacitated, Speed is 0,
          and you automatically fail Strength
          and Dexterity saves.
        </p>

        <p>
          Attacks against you have Advantage.
          You have Resistance to all damage
          and Immunity to the Poisoned condition.
        </p>
      `
    },


    {
      id:'poisoned',
      category:'Conditions',
      title:'Poisoned',
      aliases:'poison poisoned condition attack ability check disadvantage',
      body:`
        <p>
          You have Disadvantage on
          <strong>attack rolls and ability checks</strong>.
        </p>
      `
    },


    {
      id:'prone',
      category:'Conditions',
      title:'Prone',
      aliases:'prone stand crawl attack advantage disadvantage movement',
      body:`
        <p>
          Your only movement options are
          crawling or spending half your Speed
          to stand.
        </p>

        <p>
          If Speed is 0, you can't stand.
        </p>

        <p>
          Your attacks have Disadvantage.
          Attacks against you have Advantage
          if the attacker is within 5 feet;
          otherwise those attacks have
          Disadvantage.
        </p>
      `
    },


    {
      id:'restrained',
      category:'Conditions',
      title:'Restrained',
      aliases:'restrained speed attack dexterity save advantage disadvantage',
      body:`
        <p>
          Speed becomes 0 and can't increase.
        </p>

        <p>
          Your attacks have Disadvantage.
          Attacks against you have Advantage.
        </p>

        <p>
          You have Disadvantage on
          Dexterity saving throws.
        </p>
      `
    },


    {
      id:'stable',
      category:'Conditions',
      title:'Stable',
      aliases:'stable death dying saving throws zero hp',
      body:`
        <p>
          A Stable creature has 0 HP
          but doesn't make Death Saving Throws.
        </p>
      `
    },


    {
      id:'stunned',
      category:'Conditions',
      title:'Stunned',
      aliases:'stunned incapacitated strength dex save attack advantage',
      body:`
        <p>
          You are Incapacitated.
        </p>

        <p>
          Automatically fail Strength
          and Dexterity saving throws.
        </p>

        <p>
          Attacks against you have Advantage.
        </p>
      `
    },


    {
      id:'surprise',
      category:'Conditions',
      title:'Surprise',
      aliases:'surprise surprised initiative disadvantage',
      body:`
        <p>
          A creature caught unaware at the
          start of combat has
          <strong>Disadvantage on Initiative</strong>.
        </p>
      `
    },


    {
      id:'unconscious',
      category:'Conditions',
      title:'Unconscious',
      aliases:'unconscious prone incapacitated drop holding critical save',
      body:`
        <p>
          You have the Incapacitated
          and Prone conditions and drop
          whatever you're holding.
        </p>

        <p>
          Speed becomes 0 and can't increase.
          You are unaware of your surroundings.
        </p>

        <p>
          Automatically fail Strength and
          Dexterity saves.
        </p>

        <p>
          Attacks against you have Advantage.
          A successful attack is automatically
          a Critical Hit if the attacker is
          within 5 feet.
        </p>

        <p>
          When Unconscious ends,
          you remain Prone.
        </p>
      `
    },


    /* ===================================================
       HAZARDS
       =================================================== */

    {
      id:'burning',
      category:'Hazards & Survival',
      title:'Burning',
      aliases:'burning fire flame damage extinguish',
      body:`
        <p>
          Burning deals
          <strong>1d4 Fire damage per turn</strong>.
        </p>

        <p>
          End it by taking appropriate action
          to extinguish the flames, such as
          dousing, submerging, or smothering them.
        </p>
      `
    },


    {
      id:'falling',
      category:'Hazards & Survival',
      title:'Falling',
      aliases:'fall falling damage height feet water prone athletics acrobatics',
      calculator:'falling',
      body:`
        <p>
          Take
          <strong>1d6 Bludgeoning damage
          per 10 feet fallen</strong>,
          to a maximum of 20d6.
        </p>

        <p>
          You land Prone unless you avoid
          all damage from the fall.
        </p>

        <p>
          Falling into water or another liquid:
          use your Reaction to make a
          <strong>DC 15 Athletics or Acrobatics</strong>
          check. On success, fall damage
          is halved.
        </p>
      `
    },


    {
      id:'suffocation',
      category:'Hazards & Survival',
      title:'Suffocation',
      aliases:'suffocation breath hold breathing choking constitution exhaustion',
      calculator:'suffocation',
      body:`
        <p>
          Hold your breath for
          <strong>
            1 minute + Constitution modifier
          </strong>,
          minimum 30 seconds.
        </p>

        <p>
          Once out of breath or choking,
          gain 1 Exhaustion level at the
          end of each turn.
        </p>

        <p>
          When breathing resumes,
          remove all Exhaustion gained
          specifically from suffocation.
        </p>
      `
    },


    {
      id:'dehydration',
      category:'Hazards & Survival',
      title:'Dehydration',
      aliases:'dehydration water drink gallon exhaustion survival',
      body:`
        <p>
          Drinking less than half the required
          daily water causes 1 Exhaustion level
          at day's end.
        </p>

        <p>
          That Exhaustion can't be removed until
          the creature drinks its full daily need.
        </p>

        <div class="dm-widget-modal-result">
          Tiny · ¼ gallon<br>
          Small · 1 gallon<br>
          Medium · 1 gallon<br>
          Large · 4 gallons<br>
          Huge · 16 gallons<br>
          Gargantuan · 64 gallons
        </div>
      `
    },


    {
      id:'malnutrition',
      category:'Hazards & Survival',
      title:'Malnutrition',
      aliases:'malnutrition food eat pounds exhaustion starvation',
      body:`
        <p>
          Eating less than half the required
          daily food requires a
          <strong>DC 10 Constitution save</strong>
          at day's end or gain 1 Exhaustion.
        </p>

        <p>
          After 5 days with no food,
          the creature automatically gains
          Exhaustion, with another level
          each subsequent foodless day.
        </p>

        <div class="dm-widget-modal-result">
          Tiny · ¼ lb<br>
          Small · 1 lb<br>
          Medium · 1 lb<br>
          Large · 4 lb<br>
          Huge · 16 lb<br>
          Gargantuan · 64 lb
        </div>
      `
    },


    /* ===================================================
       CHASES
       =================================================== */

    {
      id:'chases',
      category:'Travel & Exploration',
      title:'Chases',
      aliases:'chase quarry pursuer dash exhaustion stealth escape pursuit',
      body:`
        <p>
          Track one quarry and one pursuer
          for each active chase matchup.
        </p>

        <p>
          Creatures move and normally take
          one Action on their turns.
          Opportunity Attacks aren't made
          during the chase.
        </p>

        <p>
          A creature can Dash a number of
          times equal to
          <strong>3 + Constitution modifier</strong>.
          Each additional Dash requires a
          DC 10 Constitution save or causes
          1 Exhaustion.
        </p>

        <p>
          A creature drops out of the chase
          at 5 Exhaustion.
        </p>

        <p>
          After each round, a quarry can make
          a Stealth check to escape.
          A quarry still in sight automatically
          fails that attempt.
        </p>

        <p>
          A chase ends when one side stops,
          a participant reaches 5 Exhaustion,
          all quarries escape,
          or the pursuers catch the quarry.
        </p>
      `
    },


    /* ===================================================
       NSBI REFERENCE
       =================================================== */

    {
      id:'nsbi-skills',
      category:'NSBI Reference',
      title:'NSBI Skills',
      aliases:'nsbi dreamlight heartline mindwave bravura craftspark starpath influence endurance analysis performance innovation agility charisma constitution intelligence strength wisdom dexterity',
      body:`
        <div class="dm-widget-modal-result">
          <strong>Dreamlight</strong>
          Influence · Charisma
        </div>

        <div class="dm-widget-modal-result">
          <strong>Heartline</strong>
          Endurance · Constitution
        </div>

        <div class="dm-widget-modal-result">
          <strong>Mindwave</strong>
          Analysis · Intelligence
        </div>

        <div class="dm-widget-modal-result">
          <strong>Bravura</strong>
          Performance · Strength
        </div>

        <div class="dm-widget-modal-result">
          <strong>Craftspark</strong>
          Innovation · Wisdom
        </div>

        <div class="dm-widget-modal-result">
          <strong>Starpath</strong>
          Agility · Dexterity
        </div>
      `
    }

  ];


  /* =====================================================
     CATEGORIES
     ===================================================== */

  const CATEGORIES = [
    'All Rules',
    'Checks & Actions',
    'Vision & Position',
    'Movement',
    'Combat Environment',
    'Conditions',
    'Hazards & Survival',
    'Objects & Structures',
    'Travel & Exploration',
    'NSBI Reference'
  ];


  /* =====================================================
     CALCULATOR HTML
     ===================================================== */

  function calculatorHtml(
    type
  ){

    if(
      type ===
      'jump'
    ){

      return `
        <hr>

        <h3>Jump Calculator</h3>

        <div class="dm-widget-form">

          <label class="dm-widget-field">
            <span>Strength Score</span>
            <input
              type="number"
              min="1"
              max="30"
              value="10"
              data-rule-jump-strength
            >
          </label>

          <label class="dm-widget-field">
            <span>Character Height (ft)</span>
            <input
              type="number"
              min="1"
              max="20"
              step=".1"
              value="6"
              data-rule-jump-height
            >
          </label>

        </div>

        <div class="dm-widget-actions">
          <button
            class="dm-widget-button"
            type="button"
            data-rule-jump-calc
          >
            Calculate Jump
          </button>
        </div>

        <div
          data-rule-jump-result
        ></div>
      `;

    }


    if(
      type ===
      'carry'
    ){

      return `
        <hr>

        <h3>Carrying Calculator</h3>

        <div class="dm-widget-form">

          <label class="dm-widget-field">
            <span>Strength Score</span>
            <input
              type="number"
              min="1"
              max="30"
              value="10"
              data-rule-carry-strength
            >
          </label>

          <label class="dm-widget-field">
            <span>Creature Size</span>

            <select data-rule-carry-size>
              <option>Tiny</option>
              <option>Small</option>
              <option selected>Medium</option>
              <option>Large</option>
              <option>Huge</option>
              <option>Gargantuan</option>
            </select>

          </label>

        </div>

        <div class="dm-widget-actions">
          <button
            class="dm-widget-button"
            type="button"
            data-rule-carry-calc
          >
            Calculate Capacity
          </button>
        </div>

        <div
          data-rule-carry-result
        ></div>
      `;

    }


    if(
      type ===
      'falling'
    ){

      return `
        <hr>

        <h3>Falling Calculator</h3>

        <div class="dm-widget-form">

          <label class="dm-widget-field">
            <span>Distance Fallen (ft)</span>
            <input
              type="number"
              min="0"
              step="1"
              value="30"
              data-rule-fall-feet
            >
          </label>

          <label class="dm-widget-nat">
            <input
              type="checkbox"
              data-rule-fall-water
            >
            <span>
              Falling into Water / Liquid
            </span>
          </label>

        </div>

        <div class="dm-widget-actions two">

          <button
            class="dm-widget-button secondary"
            type="button"
            data-rule-fall-calc
          >
            Calculate
          </button>

          <button
            class="dm-widget-button"
            type="button"
            data-rule-fall-roll
          >
            Roll Damage
          </button>

        </div>

        <div
          data-rule-fall-result
        ></div>
      `;

    }


    if(
      type ===
      'suffocation'
    ){

      return `
        <hr>

        <h3>Breath Calculator</h3>

        <label class="dm-widget-field">
          <span>Constitution Score</span>
          <input
            type="number"
            min="1"
            max="30"
            value="10"
            data-rule-breath-con
          >
        </label>

        <div class="dm-widget-actions">
          <button
            class="dm-widget-button"
            type="button"
            data-rule-breath-calc
          >
            Calculate Breath
          </button>
        </div>

        <div
          data-rule-breath-result
        ></div>
      `;

    }


    if(
      type ===
      'exhaustion'
    ){

      return `
        <hr>

        <h3>Exhaustion Calculator</h3>

        <label class="dm-widget-field">
          <span>Exhaustion Level</span>

          <select data-rule-exhaustion-level>
            <option value="0">0</option>
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
            <option value="5">5</option>
            <option value="6">6</option>
          </select>

        </label>

        <div class="dm-widget-actions">
          <button
            class="dm-widget-button"
            type="button"
            data-rule-exhaustion-calc
          >
            Calculate Effects
          </button>
        </div>

        <div
          data-rule-exhaustion-result
        ></div>
      `;

    }


    if(
      type ===
      'objecthp'
    ){

      return `
        <hr>

        <h3>Object HP Calculator</h3>

        <div class="dm-widget-form">

          <label class="dm-widget-field">
            <span>Object Size</span>

            <select data-rule-object-size>
              <option>Tiny</option>
              <option>Small</option>
              <option selected>Medium</option>
              <option>Large</option>
            </select>

          </label>


          <label class="dm-widget-field">
            <span>Durability</span>

            <select data-rule-object-type>
              <option>Fragile</option>
              <option>Resilient</option>
            </select>

          </label>

        </div>

        <div class="dm-widget-actions two">

          <button
            class="dm-widget-button secondary"
            type="button"
            data-rule-object-calc
          >
            Show HP
          </button>

          <button
            class="dm-widget-button"
            type="button"
            data-rule-object-roll
          >
            Roll HP
          </button>

        </div>

        <div
          data-rule-object-result
        ></div>
      `;

    }


    if(
      type ===
      'concentration'
    ){

      return `
        <hr>

        <h3>Concentration Calculator</h3>

        <label class="dm-widget-field">
          <span>Damage Taken</span>
          <input
            type="number"
            min="0"
            step="1"
            value="20"
            data-rule-concentration-damage
          >
        </label>

        <div class="dm-widget-actions">
          <button
            class="dm-widget-button"
            type="button"
            data-rule-concentration-calc
          >
            Calculate Save DC
          </button>
        </div>

        <div
          data-rule-concentration-result
        ></div>
      `;

    }


    if(
      type ===
      'passive'
    ){

      return `
        <hr>

        <h3>Passive Perception Calculator</h3>

        <div class="dm-widget-form">

          <label class="dm-widget-field">
            <span>Perception Check Bonus</span>
            <input
              type="number"
              min="-20"
              max="30"
              value="0"
              data-rule-passive-bonus
            >
          </label>

          <label class="dm-widget-field">
            <span>Check State</span>

            <select data-rule-passive-state>
              <option value="0">Normal</option>
              <option value="5">Advantage</option>
              <option value="-5">Disadvantage</option>
            </select>

          </label>

        </div>

        <div class="dm-widget-actions">
          <button
            class="dm-widget-button"
            type="button"
            data-rule-passive-calc
          >
            Calculate Passive
          </button>
        </div>

        <div
          data-rule-passive-result
        ></div>
      `;

    }


    return '';

  }


  /* =====================================================
     CALCULATOR WIRING
     ===================================================== */

  function wireCalculator(
    modal,
    type
  ){

    if(
      type ===
      'jump'
    ){

      modal.querySelector(
        '[data-rule-jump-calc]'
      )
        ?.addEventListener(
          'click',
          ()=>{

            const strength =
              Math.max(
                1,
                Number(
                  modal.querySelector(
                    '[data-rule-jump-strength]'
                  ).value
                ) || 1
              );


            const height =
              Math.max(
                0,
                Number(
                  modal.querySelector(
                    '[data-rule-jump-height]'
                  ).value
                ) || 0
              );


            const modifier =
              abilityModifier(
                strength
              );


            const runningLong =
              strength;


            const standingLong =
              runningLong /
              2;


            const runningHigh =
              Math.max(
                0,
                3 +
                modifier
              );


            const standingHigh =
              runningHigh /
              2;


            const runningReach =
              runningHigh +
              (
                height *
                1.5
              );


            const standingReach =
              standingHigh +
              (
                height *
                1.5
              );


            modal.querySelector(
              '[data-rule-jump-result]'
            ).innerHTML =
              `
                <div class="dm-widget-modal-result success">

                  <strong>
                    Strength ${strength}
                    (${signed(
                      modifier
                    )})
                  </strong>

                  Running Long Jump:
                  <strong>${runningLong} ft</strong>
                  <br>

                  Standing Long Jump:
                  <strong>${standingLong} ft</strong>
                  <br><br>

                  Running High Jump:
                  <strong>${runningHigh} ft</strong>
                  <br>

                  Standing High Jump:
                  <strong>${standingHigh} ft</strong>

                  ${
                    height > 0
                      ? `
                          <br><br>

                          Running Vertical Reach:
                          <strong>
                            ${runningReach} ft
                          </strong>
                          <br>

                          Standing Vertical Reach:
                          <strong>
                            ${standingReach} ft
                          </strong>
                        `
                      : ''
                  }

                </div>
              `;

          }
        );

    }


    if(
      type ===
      'carry'
    ){

      modal.querySelector(
        '[data-rule-carry-calc]'
      )
        ?.addEventListener(
          'click',
          ()=>{

            const strength =
              Math.max(
                1,
                Number(
                  modal.querySelector(
                    '[data-rule-carry-strength]'
                  ).value
                ) || 1
              );


            const size =
              modal.querySelector(
                '[data-rule-carry-size]'
              ).value;


            const multipliers = {

              Tiny:[
                7.5,
                15
              ],

              Small:[
                15,
                30
              ],

              Medium:[
                15,
                30
              ],

              Large:[
                30,
                60
              ],

              Huge:[
                60,
                120
              ],

              Gargantuan:[
                120,
                240
              ]

            };


            const [
              carryMultiplier,
              forceMultiplier
            ] =
              multipliers[
                size
              ];


            const carry =
              strength *
              carryMultiplier;


            const force =
              strength *
              forceMultiplier;


            modal.querySelector(
              '[data-rule-carry-result]'
            ).innerHTML =
              `
                <div class="dm-widget-modal-result success">

                  <strong>
                    ${W.escapeHtml(
                      size
                    )}
                    · Strength ${strength}
                  </strong>

                  Carry:
                  <strong>
                    ${carry.toLocaleString()} lb
                  </strong>

                  <br>

                  Push / Drag / Lift:
                  <strong>
                    ${force.toLocaleString()} lb
                  </strong>

                </div>
              `;

          }
        );

    }


    if(
      type ===
      'falling'
    ){

      function calculate(
        rollDamage = false
      ){

        const feet =
          Math.max(
            0,
            Number(
              modal.querySelector(
                '[data-rule-fall-feet]'
              ).value
            ) || 0
          );


        const water =
          modal.querySelector(
            '[data-rule-fall-water]'
          ).checked;


        const dice =
          Math.min(
            20,
            Math.floor(
              feet /
              10
            )
          );


        let rolled =
          null;


        if(
          rollDamage &&
          dice > 0
        ){

          rolled =
            W.roll(
              dice,
              6
            );

        }


        modal.querySelector(
          '[data-rule-fall-result]'
        ).innerHTML =
          `
            <div class="dm-widget-modal-result ${
              dice > 0
                ? 'failure'
                : 'success'
            }">

              <strong>
                ${feet} ft Fall
              </strong>

              Damage:
              <strong>
                ${dice}d6
              </strong>

              ${
                rolled
                  ? `
                      <br>
                      Rolled:
                      <strong>
                        ${rolled.total}
                        Bludgeoning
                      </strong>

                      <br>

                      Dice:
                      ${rolled.results.join(
                        ' + '
                      )}
                    `
                  : ''
              }

              ${
                water
                  ? `
                      <br><br>
                      Water:
                      Reaction · DC 15
                      Athletics or Acrobatics.
                      Success halves fall damage.
                    `
                  : ''
              }

            </div>
          `;

      }


      modal.querySelector(
        '[data-rule-fall-calc]'
      )
        ?.addEventListener(
          'click',
          ()=>calculate(
            false
          )
        );


      modal.querySelector(
        '[data-rule-fall-roll]'
      )
        ?.addEventListener(
          'click',
          ()=>calculate(
            true
          )
        );

    }


    if(
      type ===
      'suffocation'
    ){

      modal.querySelector(
        '[data-rule-breath-calc]'
      )
        ?.addEventListener(
          'click',
          ()=>{

            const constitution =
              Math.max(
                1,
                Number(
                  modal.querySelector(
                    '[data-rule-breath-con]'
                  ).value
                ) || 1
              );


            const modifier =
              abilityModifier(
                constitution
              );


            const minutes =
              Math.max(
                .5,
                1 +
                modifier
              );


            const display =
              minutes ===
              .5
                ? '30 seconds'
                : `${minutes} minute${
                    minutes === 1
                      ? ''
                      : 's'
                  }`;


            modal.querySelector(
              '[data-rule-breath-result]'
            ).innerHTML =
              `
                <div class="dm-widget-modal-result success">

                  <strong>
                    Constitution ${constitution}
                    (${signed(
                      modifier
                    )})
                  </strong>

                  Hold Breath:
                  <strong>
                    ${display}
                  </strong>

                </div>
              `;

          }
        );

    }


    if(
      type ===
      'exhaustion'
    ){

      modal.querySelector(
        '[data-rule-exhaustion-calc]'
      )
        ?.addEventListener(
          'click',
          ()=>{

            const level =
              Number(
                modal.querySelector(
                  '[data-rule-exhaustion-level]'
                ).value
              );


            const penalty =
              level *
              2;


            const speed =
              level *
              5;


            modal.querySelector(
              '[data-rule-exhaustion-result]'
            ).innerHTML =
              `
                <div class="dm-widget-modal-result ${
                  level >= 6
                    ? 'failure'
                    : 'success'
                }">

                  <strong>
                    Exhaustion ${level}
                  </strong>

                  ${
                    level >= 6
                      ? `
                          The creature dies.
                        `
                      : `
                          D20 Tests:
                          <strong>
                            -${penalty}
                          </strong>

                          <br>

                          Speed:
                          <strong>
                            -${speed} ft
                          </strong>
                        `
                  }

                </div>
              `;

          }
        );

    }


    if(
      type ===
      'objecthp'
    ){

      const data = {

        Tiny:{
          Fragile:[1,4],
          Resilient:[2,4]
        },

        Small:{
          Fragile:[1,6],
          Resilient:[3,6]
        },

        Medium:{
          Fragile:[1,8],
          Resilient:[4,8]
        },

        Large:{
          Fragile:[1,10],
          Resilient:[5,10]
        }

      };


      function calculate(
        shouldRoll = false
      ){

        const size =
          modal.querySelector(
            '[data-rule-object-size]'
          ).value;


        const typeValue =
          modal.querySelector(
            '[data-rule-object-type]'
          ).value;


        const [
          count,
          sides
        ] =
          data[
            size
          ][
            typeValue
          ];


        const average =
          Math.floor(
            count *
            (
              (
                sides +
                1
              ) /
              2
            )
          );


        let rolled =
          null;


        if(
          shouldRoll
        ){

          rolled =
            W.roll(
              count,
              sides
            );

        }


        modal.querySelector(
          '[data-rule-object-result]'
        ).innerHTML =
          `
            <div class="dm-widget-modal-result success">

              <strong>
                ${W.escapeHtml(
                  size
                )}
                ${W.escapeHtml(
                  typeValue
                )}
                Object
              </strong>

              HP:
              <strong>
                ${count}d${sides}
              </strong>

              <br>

              Average:
              <strong>
                ${average} HP
              </strong>

              ${
                rolled
                  ? `
                      <br>
                      Rolled HP:
                      <strong>
                        ${rolled.total}
                      </strong>
                    `
                  : ''
              }

            </div>
          `;

      }


      modal.querySelector(
        '[data-rule-object-calc]'
      )
        ?.addEventListener(
          'click',
          ()=>calculate(
            false
          )
        );


      modal.querySelector(
        '[data-rule-object-roll]'
      )
        ?.addEventListener(
          'click',
          ()=>calculate(
            true
          )
        );

    }


    if(
      type ===
      'concentration'
    ){

      modal.querySelector(
        '[data-rule-concentration-calc]'
      )
        ?.addEventListener(
          'click',
          ()=>{

            const damage =
              Math.max(
                0,
                Number(
                  modal.querySelector(
                    '[data-rule-concentration-damage]'
                  ).value
                ) || 0
              );


            const half =
              Math.floor(
                damage /
                2
              );


            const dc =
              Math.min(
                30,
                Math.max(
                  10,
                  half
                )
              );


            modal.querySelector(
              '[data-rule-concentration-result]'
            ).innerHTML =
              `
                <div class="dm-widget-modal-result success">

                  <strong>
                    Constitution Save DC ${dc}
                  </strong>

                  Damage:
                  ${damage}

                  <br>

                  Half Damage:
                  ${half}

                </div>
              `;

          }
        );

    }


    if(
      type ===
      'passive'
    ){

      modal.querySelector(
        '[data-rule-passive-calc]'
      )
        ?.addEventListener(
          'click',
          ()=>{

            const bonus =
              Number(
                modal.querySelector(
                  '[data-rule-passive-bonus]'
                ).value
              ) || 0;


            const adjustment =
              Number(
                modal.querySelector(
                  '[data-rule-passive-state]'
                ).value
              );


            const total =
              10 +
              bonus +
              adjustment;


            modal.querySelector(
              '[data-rule-passive-result]'
            ).innerHTML =
              `
                <div class="dm-widget-modal-result success">

                  <strong>
                    Passive Perception ${total}
                  </strong>

                  10
                  ${signed(
                    bonus
                  )}

                  ${
                    adjustment
                      ? signed(
                          adjustment
                        )
                      : ''
                  }

                </div>
              `;

          }
        );

    }

  }


  /* =====================================================
     OPEN ONE RULE
     ===================================================== */

  function openRule(
    rule
  ){

    const modal =
      W.showModal({

        kicker:
          rule.category.toUpperCase(),

        title:
          rule.title,

        body:
          `
            ${rule.body}

            ${
              calculatorHtml(
                rule.calculator
              )
            }
          `,

        actions:[

          {

            label:
              'Back to Rules',

            secondary:true,

            onClick(){

              showResults();

            }

          }

        ]

      });


    if(
      rule.calculator
    ){

      wireCalculator(
        modal,
        rule.calculator
      );

    }

  }


  /* =====================================================
     SEARCH RESULTS
     ===================================================== */

  let activeRoot =
    null;


  function getMatches(){

    if(
      !activeRoot
    ){
      return [];
    }


    const search =
      activeRoot.querySelector(
        '[data-common-search]'
      )
        .value
        .trim()
        .toLowerCase();


    const category =
      activeRoot.querySelector(
        '[data-common-category]'
      ).value;


    return RULES.filter(
      rule=>{

        const categoryMatch =
          category ===
          'All Rules'
          ||
          rule.category ===
          category;


        if(
          !categoryMatch
        ){
          return false;
        }


        if(
          !search
        ){
          return true;
        }


        const haystack =
          `
            ${rule.title}
            ${rule.aliases || ''}
            ${rule.category}
          `
            .toLowerCase();


        return haystack.includes(
          search
        );

      }
    );

  }


  function showResults(){

    const matches =
      getMatches();


    const body =
      matches.length
        ? `
            <p>
              ${matches.length}
              rule${
                matches.length === 1
                  ? ''
                  : 's'
              }
              found.
            </p>

            <div>
              ${matches
                .map(
                  rule =>
                    ruleButton(
                      rule
                    )
                )
                .join('')
              }
            </div>
          `
        : `
            <div class="dm-widget-modal-result failure">

              <strong>
                No Rules Found
              </strong>

              Try another search term
              or choose another category.

            </div>
          `;


    const modal =
      W.showModal({

        kicker:
          'COMMON RULES',

        title:
          'Rule Reference',

        body

      });


    modal
      .querySelectorAll(
        '[data-common-rule]'
      )
      .forEach(
        button=>{

          button.addEventListener(
            'click',
            ()=>{

              const rule =
                RULES.find(
                  item =>
                    item.id ===
                    button.dataset.commonRule
                );


              if(rule){

                openRule(
                  rule
                );

              }

            }
          );

        }
      );

  }


  /* =====================================================
     WIDGET REGISTRATION
     ===================================================== */

  W.register({

    id:
      'common-rules',

    code:
      'REF-15',

    title:
      'Common Rules',

    subtitle:
      'Search · Reference · Calculate',


    render(){

      return `
        <div class="dm-widget-form">

          <label class="dm-widget-field">

            <span>
              Search Rules
            </span>

            <input
              type="search"
              data-common-search
              placeholder="Jump, grapple, cover..."
            >

          </label>


          <label class="dm-widget-field">

            <span>
              Category
            </span>

            <select
              data-common-category
            >

              ${CATEGORIES
                .map(
                  category =>
                    `
                      <option>
                        ${W.escapeHtml(
                          category
                        )}
                      </option>
                    `
                )
                .join('')
              }

            </select>

          </label>

        </div>


        <div class="dm-widget-note">
          Leave search blank to browse
          the selected category.
        </div>


        <div class="dm-widget-actions">

          <button
            class="dm-widget-button"
            type="button"
            data-common-open
          >
            Find Rules
          </button>

        </div>
      `;

    },


    init(root){

      activeRoot =
        root;


      const search =
        root.querySelector(
          '[data-common-search]'
        );


      root.querySelector(
        '[data-common-open]'
      )
        .addEventListener(
          'click',
          showResults
        );


      search.addEventListener(
        'keydown',
        event=>{

          if(
            event.key ===
            'Enter'
          ){

            event.preventDefault();

            showResults();

          }

        }
      );

    }

  });

})();

/* =====================================================
   WIDGET 16
   RESERVE PERSONNEL
   DM ONLY

   Backup NPC staging system.
   ===================================================== */

(function(){

  const W =
    window.epcotDmWidgets;


  if(!W){
    return;
  }


  /* =====================================================
     HELPERS
     ===================================================== */

  function reserveApi(){

    return window.epcotReservePersonnel ||
      null;

  }


  function reserveEscape(
    value
  ){

    return W.escapeHtml(
      value ?? ''
    );

  }


  function reserveLabel(
    record
  ){

    const pieces = [

      record.title,

      record.company_association,

      record.neighborhood

    ]
      .filter(Boolean);


    return pieces.join(
      ' · '
    );

  }


  /* =====================================================
     LIST MODAL
     ===================================================== */

  async function showReserveList(
    status = 'available',
    searchText = ''
  ){

    const api =
      reserveApi();


    if(!api){

      W.showModal({

        kicker:
          'RESERVE PERSONNEL',

        title:
          'Reserve System Unavailable',

        body:
          `
            <p>
              The Reserve Personnel extension
              has not loaded.
            </p>
          `

      });


      return;

    }


    let records;


    try{

      records =
        await api.list(
          status
        );

    }
    catch(error){

      W.showModal({

        kicker:
          'RESERVE PERSONNEL',

        title:
          'Unable to Load Reserve',

        body:
          `
            <p>
              ${reserveEscape(
                error?.message ||
                error
              )}
            </p>
          `

      });


      return;

    }


    const query =
      String(
        searchText ||
        ''
      )
        .trim()
        .toLowerCase();


    if(query){

      records =
        records.filter(
          record =>{

            const haystack =
              [
                record.name_cast,
                record.name_unbound,
                record.title,
                record.company_association,
                record.magic_domain,
                record.neighborhood
              ]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();


            return haystack.includes(
              query
            );

          }
        );

    }


    const body =
      `

        <div
          class="dm-widget-form"
          style="margin-bottom:14px;"
        >

          <label class="dm-widget-field">

            <span>
              Search Reserve
            </span>

            <input
              type="search"
              data-reserve-list-search
              value="${reserveEscape(
                searchText
              )}"
              placeholder="Name, company, neighborhood..."
            >

          </label>


          <label class="dm-widget-field">

            <span>
              Status
            </span>

            <select
              data-reserve-list-status
            >

              <option
                value="available"
                ${
                  status ===
                  'available'
                    ? 'selected'
                    : ''
                }
              >
                Available
              </option>

            </select>

          </label>

        </div>


        <div class="dm-widget-note">

          ${records.length}
          Reserve NPC${
            records.length === 1
              ? ''
              : 's'
          }

        </div>


        ${
          records.length
            ? records
                .map(
                  record =>{

                    const description =
                      reserveLabel(
                        record
                      );


                    return `

                      <div
                        class="dm-widget-modal-result"
                        style="
                          margin-top:10px;
                        "
                      >

                        <strong>
                          ${reserveEscape(
                            record.name_cast ||
                            'Unnamed Personnel'
                          )}
                        </strong>


                        ${
                          record.name_unbound
                            ? `
                                <div>
                                  Unbound:
                                  ${reserveEscape(
                                    record.name_unbound
                                  )}
                                </div>
                              `
                            : ''
                        }


                        ${
                          description
                            ? `
                                <div
                                  style="
                                    margin-top:5px;
                                    opacity:.8;
                                  "
                                >
                                  ${reserveEscape(
                                    description
                                  )}
                                </div>
                              `
                            : ''
                        }


                        ${
                          record.status ===
                          'promoted'
                            ? `
                                <div
                                  class="dm-widget-note"
                                  style="
                                    margin-top:8px;
                                  "
                                >
                                  Promoted to Personnel
                                </div>
                              `
                            : ''
                        }


                        <div
                          class="dm-widget-actions"
                          style="
                            margin-top:10px;
                          "
                        >

                          <button
                            class="dm-widget-button secondary"
                            type="button"
                            data-reserve-edit="${record.id}"
                          >
                            View / Edit
                          </button>


                          ${
                            record.status ===
                            'available'
                              ? `
                                  <button
                                    class="dm-widget-button"
                                    type="button"
                                    data-reserve-promote="${record.id}"
                                  >
                                    Promote to Personnel
                                  </button>
                                `
                              : ''
                          }


                          ${
                            record.status ===
                            'available'
                              ? `
                                  <button
                                    class="dm-widget-button secondary"
                                    type="button"
                                    data-reserve-delete="${record.id}"
                                  >
                                    Delete
                                  </button>
                                `
                              : ''
                          }

                        </div>

                      </div>

                    `;

                  }
                )
                .join('')
            : `
                <div
                  class="dm-widget-modal-result"
                  style="margin-top:12px;"
                >

                  <strong>
                    No Reserve NPCs Found
                  </strong>

                  ${
                    status ===
                    'available'
                      ? `
                          Add one whenever you have a
                          character concept waiting
                          for a future role.
                        `
                      : `
                          No records match the current
                          search and status.
                        `
                  }

                </div>
              `
        }
      `;


    const modal =
      W.showModal({

        kicker:
          'RESERVE PERSONNEL',

        title:
          status ===
          'promoted'
            ? 'Promoted Archive'
            : 'Backup NPCs',

        body,

        actions:[

          {

            label:
              '+ Add NPC',

            onClick(){

              api.openCreate();

            }

          }

        ]

      });


    /* SEARCH */

    const search =
      modal.querySelector(
        '[data-reserve-list-search]'
      );


    const statusField =
      modal.querySelector(
        '[data-reserve-list-status]'
      );


    search
      ?.addEventListener(
        'keydown',
        event=>{

          if(
            event.key !==
            'Enter'
          ){
            return;
          }


          event.preventDefault();


          showReserveList(
            statusField?.value ||
            'available',
            search.value
          );

        }
      );


    statusField
      ?.addEventListener(
        'change',
        ()=>{

          showReserveList(
            statusField.value,
            search?.value ||
            ''
          );

        }
      );


    /* EDIT */

    modal
      .querySelectorAll(
        '[data-reserve-edit]'
      )
      .forEach(
        button =>{

          button.addEventListener(
            'click',
            ()=>{

              api.openEdit(
                button.dataset.reserveEdit
              );

            }
          );

        }
      );


    /* PROMOTE */

    modal
      .querySelectorAll(
        '[data-reserve-promote]'
      )
      .forEach(
        button =>{

          button.addEventListener(
            'click',
            async ()=>{

              const id =
                button.dataset.reservePromote;


              const record =
                records.find(
                  item =>
                    item.id === id
                );


              const name =
                record?.name_cast ||
                'this NPC';


              const approved =
                confirm(
                  `Promote ${name} to the full Personnel database?\n\nThe Reserve record will remain in the Promoted archive.`
                );


              if(!approved){
                return;
              }


              button.disabled =
                true;


              button.textContent =
                'Promoting...';


              try{

                await api.promote(
                  id
                );


                W.showModal({

                  kicker:
                    'PERSONNEL PROMOTED',

                  title:
                    name,

                  body:
                    `
                      <div
                        class="dm-widget-modal-result success"
                      >

                        <strong>
                          Personnel Record Created
                        </strong>

                        ${reserveEscape(
                          name
                        )}
                        has been added to the
                        full Personnel database.

                      </div>

                      <p>
                        The Reserve copy has been
                        retained in the Promoted archive.
                      </p>
                    `,

                  actions:[

                    {

                      label:
                        'Back to Reserve',

                      onClick(){

                        showReserveList(
                          'available'
                        );

                      }

                    }

                  ]

                });

              }
              catch(error){

                button.disabled =
                  false;


                button.textContent =
                  'Promote to Personnel';


                W.showModal({

                  kicker:
                    'PROMOTION FAILED',

                  title:
                    'Personnel Not Created',

                  body:
                    `
                      <p>
                        ${reserveEscape(
                          error?.message ||
                          error
                        )}
                      </p>
                    `

                });

              }

            }
          );

        }
      );


    /* DELETE */

    modal
      .querySelectorAll(
        '[data-reserve-delete]'
      )
      .forEach(
        button =>{

          button.addEventListener(
            'click',
            async ()=>{

              const id =
                button.dataset.reserveDelete;


              const record =
                records.find(
                  item =>
                    item.id === id
                );


              const name =
                record?.name_cast ||
                'this NPC';


              if(
                !confirm(
                  `Delete ${name} from Reserve Personnel?`
                )
              ){
                return;
              }


              try{

                await api.remove(
                  id
                );


                await showReserveList(
                  status,
                  search?.value ||
                  ''
                );

              }
              catch(error){

                W.showModal({

                  kicker:
                    'DELETE FAILED',

                  title:
                    'Reserve NPC Not Deleted',

                  body:
                    `
                      <p>
                        ${reserveEscape(
                          error?.message ||
                          error
                        )}
                      </p>
                    `

                });

              }

            }
          );

        }
      );

  }

/* =====================================================
   RANDOM RESERVE NPC
   ===================================================== */

async function showRandomReserve(){

  const api =
    reserveApi();


  if(!api){

    W.showModal({

      kicker:
        'RESERVE PERSONNEL',

      title:
        'Reserve System Unavailable',

      body:
        `
          <p>
            The Personnel reserve extension
            has not loaded.
          </p>
        `

    });


    return;

  }


  let records;


  try{

    records =
      await api.list(
        'available'
      );

  }
  catch(error){

    W.showModal({

      kicker:
        'RESERVE PERSONNEL',

      title:
        'Unable to Load Reserve',

      body:
        `
          <p>
            ${reserveEscape(
              error?.message ||
              error
            )}
          </p>
        `

    });


    return;

  }


  if(
    !records.length
  ){

    W.showModal({

      kicker:
        'RESERVE PERSONNEL',

      title:
        'Reserve Empty',

      body:
        `
          <div class="dm-widget-modal-result">

            <strong>
              No Backup NPCs Available
            </strong>

            Add NPCs to Reserve Personnel
            before using the randomizer.

          </div>
        `

    });


    return;

  }


  const record =
    W.pick(
      records
    );


  const description =
    reserveLabel(
      record
    );


  const modal =
    W.showModal({

      kicker:
        'RANDOM RESERVE NPC',

      title:
        record.name_cast ||
        'Unnamed Personnel',

      body:
        `

          ${
            record.cast_image_url
              ? `
                  <div
                    style="
                      display:flex;
                      justify-content:center;
                      margin-bottom:14px;
                    "
                  >

                    <img
                      src="${reserveEscape(
                        record.cast_image_url
                      )}"
                      alt=""
                      style="
                        width:110px;
                        height:110px;
                        object-fit:cover;
                        border-radius:50%;
                      "
                    >

                  </div>
                `
              : ''
          }


          <div class="dm-widget-modal-result success">

            <strong>
              ${reserveEscape(
                record.name_cast ||
                'Unnamed Personnel'
              )}
            </strong>


            ${
              record.name_unbound
                ? `
                    <div>
                      Unbound:
                      ${reserveEscape(
                        record.name_unbound
                      )}
                    </div>
                  `
                : ''
            }


            ${
              description
                ? `
                    <div
                      style="
                        margin-top:7px;
                      "
                    >
                      ${reserveEscape(
                        description
                      )}
                    </div>
                  `
                : ''
            }


            ${
              record.magic_domain
                ? `
                    <div
                      style="
                        margin-top:7px;
                      "
                    >
                      Magic Domain:
                      ${reserveEscape(
                        record.magic_domain
                      )}
                    </div>
                  `
                : ''
            }

          </div>


          <p>
            This NPC is still in Reserve.
            Randomizing does not assign,
            remove, or promote them.
          </p>

        `,

      actions:[

        {

          label:
            'Randomize Again',

          onClick(){

            showRandomReserve();

          }

        },


        {

          label:
            'View / Edit',

          secondary:true,

          onClick(){

            api.openEdit(
              record.id
            );

          }

        },


        {

          label:
            'Promote to Personnel',

          onClick(){

            const name =
              record.name_cast ||
              'this NPC';


            if(
              !confirm(
                `Promote ${name} to the full Personnel database?\n\nThey will be removed from Reserve Personnel.`
              )
            ){
              return;
            }


            api.promote(
              record.id
            )
              .then(
                ()=>{

                  W.showModal({

                    kicker:
                      'PERSONNEL PROMOTED',

                    title:
                      name,

                    body:
                      `
                        <div class="dm-widget-modal-result success">

                          <strong>
                            Personnel Record Created
                          </strong>

                          ${reserveEscape(
                            name
                          )}
                          has been moved into
                          the full Personnel database
                          and removed from Reserve.

                        </div>
                      `,

                    actions:[

                      {

                        label:
                          'Randomize Another',

                        onClick(){

                          showRandomReserve();

                        }

                      }

                    ]

                  });

                }
              )
              .catch(
                error=>{

                  W.showModal({

                    kicker:
                      'PROMOTION FAILED',

                    title:
                      'Personnel Not Created',

                    body:
                      `
                        <p>
                          ${reserveEscape(
                            error?.message ||
                            error
                          )}
                        </p>
                      `

                  });

                }
              );

          }

        }

      ]

    });


  return modal;

}


  /* =====================================================
     WIDGET
     ===================================================== */

  W.register({

    id:
      'reserve-personnel',

    code:
      'NPC-16',

    title:
      'Reserve Personnel',

    subtitle:
      'Backup NPC storage',


    render(){

      return `

        <div class="dm-widget-note">

          Store unused NPC concepts here
          until they are needed in the campaign.

        </div>


 <div class="dm-widget-actions">

  <button
    class="dm-widget-button"
    type="button"
    data-reserve-random
  >
    Random NPC
  </button>


  <button
    class="dm-widget-button secondary"
    type="button"
    data-reserve-add
  >
    + Add NPC
  </button>


  <button
    class="dm-widget-button secondary"
    type="button"
    data-reserve-view
  >
    View Reserve
  </button>

</div>

      `;

    },


    init(root){
root.querySelector(
  '[data-reserve-random]'
)
  .addEventListener(
    'click',
    ()=>{

      showRandomReserve();

    }
  );
      root.querySelector(
        '[data-reserve-add]'
      )
        .addEventListener(
          'click',
          ()=>{

            const api =
              reserveApi();


            if(!api){

              W.showModal({

                kicker:
                  'RESERVE PERSONNEL',

                title:
                  'Reserve System Unavailable',

                body:
                  `
                    <p>
                      The Personnel reserve extension
                      has not loaded.
                    </p>
                  `

              });


              return;

            }


            api.openCreate();

          }
        );


      root.querySelector(
        '[data-reserve-view]'
      )
        .addEventListener(
          'click',
          ()=>{

            showReserveList(
              'available'
            );

          }
        );


      window.addEventListener(
        'epcot:reserve-personnel-changed',
        ()=>{

          /*
            No persistent widget contents need
            refreshing, but this hook is here so
            future reserve counters can update.
          */

        }
      );

    }

  });

})();

})();


/* =====================================================
   FUTURE WIDGETS — GROUPING GUIDE
   =====================================================

   The DM Widgets page is divided into four collapsible
   groups:

   1. DOWNTIME & REWARDS
      group: 'downtime'

      Use for:
      - Downtime activities
      - Training
      - Gathering
      - Crafting
      - Brewing
      - Loot / rewards


   2. GENERATORS & INSPIRATION
      group: 'generators'

      Use for:
      - Random generators
      - Inspiration tools
      - NPC / Personnel generation
      - Random tables that create content


   3. COMBAT TOOLS
      group: 'combat'

      Use for:
      - Encounter tools
      - Combat results
      - Damage calculators
      - Traps
      - Chases
      - Mob tools
      - Crit tools


   4. REFERENCE
      group: 'reference'

      Use for:
      - Common rules
      - NSBI rules / calculations
      - Quick-reference material
      - Rules lookup tools


   =====================================================
   ADDING A NEW WIDGET
   =====================================================

   New widgets should include a "group" property inside
   their W.register({...}) object.

   EXAMPLE:

   W.register({

     id:'example-widget',

     code:'W17',

     group:'combat',

     title:'Example Widget',

     subtitle:'Example description.',

     render(){
       return `
         ...
       `;
     },

     init(root){
       ...
     }

   });


   VALID GROUP VALUES:

     'downtime'
     'generators'
     'combat'
     'reference'


   The shared widget renderer automatically places the
   widget inside the correct collapsible section.

   DO NOT manually add widget cards to the page HTML.

   If no group is provided, the renderer currently
   places the widget in REFERENCE as a safe fallback.


   =====================================================
   EXISTING WIDGETS
   =====================================================

   Older widgets may be assigned through
   WIDGET_GROUP_BY_ID near the top of this file rather
   than having a "group" property in their individual
   W.register({...}) blocks.

   Therefore:

   - EXISTING WIDGET:
     Its group can be changed in WIDGET_GROUP_BY_ID.

   - NEW WIDGET:
     Prefer adding group:'...' directly to W.register().

   This avoids needing to update WIDGET_GROUP_BY_ID
   every time a new widget is created.


   =====================================================
   CURRENT ORGANIZATION
   =====================================================

   DOWNTIME & REWARDS
   - Magic Kingdom Training
   - Animal Kingdom Gathering
   - Backstage Crafting
   - Pavilion Social Events
   - Potion Brewing
   - Loot Generator

   GENERATORS & INSPIRATION
   - Sensory Generator
   - Product Solution Generator
   - Reserve Personnel

   COMBAT TOOLS
   - Encounter Calculator
   - Revived / Fallen Consequences
   - Crit Bonus / Crit Fail
   - Mob Roll Generator
   - Spell Damage
   - Trap Damage
   - Chase Obstacles

   REFERENCE
   - NSBI DC Calculator
   - Common Rules


   IMPORTANT:
   When adding future widgets, preserve this grouping
   system rather than returning to one flat widget grid.
   ===================================================== */
/* =====================================================
   EPCOT DND
   DM SHELL
   ===================================================== */


/* =====================================================
   ELEMENT HELPERS
   ===================================================== */

function dmById(id){
  return document.getElementById(id);
}


function getDmNavButtons(){

  return Array.from(
    document.querySelectorAll(
      '.dm-nav-button'
    )
  );

}


function getDmViews(){

  return Array.from(
    document.querySelectorAll(
      '[data-dm-page]'
    )
  );

}


/* =====================================================
   REDIRECT
   ===================================================== */

function redirectToEpcotLogin(){

  window.location.href =
    'index.html';

}


/* =====================================================
   ACCESS FAILURE
   ===================================================== */

function showDmAuthFailure(
  message
){

  const screen =
    dmById(
      'dmAuthScreen'
    );


  if(!screen){
    return;
  }


  screen.innerHTML = `

    <div class="dm-auth-indicator">

      <div>

        <strong>
          Executive Access Denied
        </strong>

        <div>
          ${message}
        </div>

      </div>

    </div>

  `;

}


/* =====================================================
   VERIFY DM
   ===================================================== */

async function verifyDmAccess(){

  if(!window.epcotAuth){

    throw new Error(
      'EPCOT account system is unavailable.'
    );

  }


  const account =
    await window.epcotAuth
      .getCurrentAccount();


  if(!account){

    throw new Error(
      'No active EPCOT session was found.'
    );

  }


  if(
    account.active !== true
  ){

    throw new Error(
      'This EPCOT account is inactive.'
    );

  }


  if(
    account.role !== 'dm'
  ){

    throw new Error(
      'This account does not have executive access.'
    );

  }


  return account;

}


/* =====================================================
   DM PROFILE
   ===================================================== */

function populateDmProfile(
  account
){

  const name =
    dmById(
      'dmProfileName'
    );


  if(name){

    name.textContent =
      account.display_name ||
      account.username ||
      'DM';

  }

}


/* =====================================================
   SHOW APP
   ===================================================== */

function showDmApp(){

  const authScreen =
    dmById(
      'dmAuthScreen'
    );


  const app =
    dmById(
      'dmApp'
    );


  if(authScreen){

    authScreen.hidden =
      true;

  }


  if(app){

    app.hidden =
      false;

  }

}


/* =====================================================
   NAVIGATION
   ===================================================== */

function openDmView(
  viewName
){

  const buttons =
    getDmNavButtons();


  const views =
    getDmViews();


  buttons.forEach(
    button => {

      button.classList.toggle(
        'active',
        button.dataset.dmView ===
          viewName
      );

    }
  );


  views.forEach(
    view => {

      view.hidden =
        view.dataset.dmPage !==
        viewName;

    }
  );


  try{

    localStorage.setItem(
      'epcot-dm-last-view',
      viewName
    );

  }
  catch(error){

    console.warn(
      'Could not save DM navigation state:',
      error
    );

  }


  document.dispatchEvent(
    new CustomEvent(
      'epcot:dm-view-changed',
      {
        detail:{
          view:viewName
        }
      }
    )
  );

}


/* =====================================================
   INITIAL VIEW
   ===================================================== */

function getInitialDmView(){

  const validViews =
    getDmViews()
      .map(
        view =>
          view.dataset.dmPage
      );


  let saved =
    null;


  try{

    saved =
      localStorage.getItem(
        'epcot-dm-last-view'
      );

  }
  catch(error){

    console.warn(
      'Could not read DM navigation state:',
      error
    );

  }


  if(
    saved &&
    validViews.includes(saved)
  ){

    return saved;

  }


  return 'home';

}


/* =====================================================
   CONNECT NAVIGATION
   ===================================================== */

function connectDmNavigation(){

  getDmNavButtons()
    .forEach(
      button => {

        button.addEventListener(
          'click',
          () => {

            const view =
              button.dataset.dmView;


            if(view){

              openDmView(view);

            }

          }
        );

      }
    );

}


/* =====================================================
   LOGOUT
   ===================================================== */

async function handleDmLogout(){

  const button =
    dmById(
      'dmLogoutButton'
    );


  if(button){

    button.disabled =
      true;

    button.textContent =
      'Logging Out...';

  }


  try{

    await window.epcotAuth
      .logout();


    redirectToEpcotLogin();

  }
  catch(error){

    console.error(
      'DM logout failed:',
      error
    );


    if(button){

      button.disabled =
        false;

      button.textContent =
        'Log Out';

    }

  }

}


function connectDmLogout(){

  const button =
    dmById(
      'dmLogoutButton'
    );


  if(!button){
    return;
  }


  button.addEventListener(
    'click',
    handleDmLogout
  );

}


/* =====================================================
   INITIALIZE
   ===================================================== */

async function initializeDmShell(){

  try{

    const account =
      await verifyDmAccess();


    populateDmProfile(
      account
    );


    connectDmNavigation();

    connectDmLogout();


    showDmApp();


    openDmView(
      getInitialDmView()
    );


    document.dispatchEvent(
      new CustomEvent(
        'epcot:dm-ready',
        {
          detail:{
            account,
            profile:account
          }
        }
      )
    );

  }
  catch(error){

    console.error(
      'DM access verification failed:',
      error
    );


    showDmAuthFailure(
      error?.message ||
      'Executive access could not be verified.'
    );


    window.setTimeout(
      redirectToEpcotLogin,
      1800
    );

  }

}


/* =====================================================
   PUBLIC API
   ===================================================== */

window.epcotDm = {

  openView:
    openDmView,

  getAccount(){

    return window.epcotAuth
      ?.getCurrentAccount();

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
    initializeDmShell
  );

}
else{

  initializeDmShell();

}
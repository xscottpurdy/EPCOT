/* =====================================================
   EPCOT DND
   SHARED NAVIGATION

   Used by:
   - Hero Cast
   - Villain Cast
   - Hero Unbound
   - Villain Unbound
   ===================================================== */


/* =====================================================
   FIND NAVIGATION BUTTONS
   ===================================================== */

const navButtons =
  document.querySelectorAll(
    '.nav button[data-view]'
  );


/* =====================================================
   FIND PAGE VIEWS
   ===================================================== */

const pageViews =
  document.querySelectorAll(
    '[data-page-view]'
  );


/* =====================================================
   SWITCH VIEW
   ===================================================== */

function showView(viewName){

  pageViews.forEach(
    view => {

      const isActive =
        view.dataset.pageView ===
        viewName;

      view.hidden =
        !isActive;

    }
  );


  navButtons.forEach(
    button => {

      const isActive =
        button.dataset.view ===
        viewName;

      button.classList.toggle(
        'active',
        isActive
      );

    }
  );


  window.scrollTo({
    top:0,
    behavior:'smooth'
  });

}


/* =====================================================
   NAVIGATION CLICKS
   ===================================================== */

navButtons.forEach(
  button => {

    button.addEventListener(
      'click',
      () => {

        const viewName =
          button.dataset.view;

        if(!viewName){
          return;
        }

        showView(
          viewName
        );

      }
    );

  }
);
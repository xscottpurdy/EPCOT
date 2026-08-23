/* =====================================================
   EPCOT DND
   SUPABASE DATABASE CONNECTION

   Shared by all app worlds:
   - Hero Cast
   - Villain Cast
   - Hero Unbound
   - Villain Unbound
   ===================================================== */


/* =====================================================
   SUPABASE PROJECT
   ===================================================== */

var SUPABASE_URL =
  'https://yuufbisyzjqnsdbwzzgw.supabase.co';

var SUPABASE_KEY =
  'sb_publishable_4dShwxduft6rGco67emZCw_EQLn8nQc';


/* =====================================================
   READ DATA
   ===================================================== */

/*
  Example:

  const characters =
    await supabaseGet(
      'characters?select=*'
    );
*/

async function supabaseGet(path){

  const response =
    await fetch(
      `${SUPABASE_URL}/rest/v1/${path}`,
      {
        headers:{
          apikey:SUPABASE_KEY
        }
      }
    );

  if(!response.ok){

    const message =
      await response.text();

    throw new Error(
      `${response.status}: ${message}`
    );
  }

  return response.json();
}


/* =====================================================
   UPDATE DATA
   ===================================================== */

/*
  Example:

  await supabasePatch(
    'characters?id=eq.123',
    {
      level:4
    }
  );
*/

async function supabasePatch(
  path,
  body
){

  const response =
    await fetch(
      `${SUPABASE_URL}/rest/v1/${path}`,
      {
        method:'PATCH',

        headers:{
          apikey:SUPABASE_KEY,
          'Content-Type':'application/json',
          Prefer:'return=representation'
        },

        body:
          JSON.stringify(body)
      }
    );

  if(!response.ok){

    const message =
      await response.text();

    throw new Error(
      `${response.status}: ${message}`
    );
  }

  return response.json();
}


/* =====================================================
   CREATE DATA
   ===================================================== */

/*
  Used later for things such as:
  - inventory items
  - character abilities
  - journal entries
*/

async function supabasePost(
  path,
  body
){

  const response =
    await fetch(
      `${SUPABASE_URL}/rest/v1/${path}`,
      {
        method:'POST',

        headers:{
          apikey:SUPABASE_KEY,
          'Content-Type':'application/json',
          Prefer:'return=representation'
        },

        body:
          JSON.stringify(body)
      }
    );

  if(!response.ok){

    const message =
      await response.text();

    throw new Error(
      `${response.status}: ${message}`
    );
  }

  return response.json();
}


/* =====================================================
   DELETE DATA
   ===================================================== */

/*
  Used later for things such as:
  - removing inventory
  - removing abilities
*/

async function supabaseDelete(path){

  const response =
    await fetch(
      `${SUPABASE_URL}/rest/v1/${path}`,
      {
        method:'DELETE',

        headers:{
          apikey:SUPABASE_KEY
        }
      }
    );

  if(!response.ok){

    const message =
      await response.text();

    throw new Error(
      `${response.status}: ${message}`
    );
  }

  return true;
}
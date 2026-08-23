/* =====================================================
   EPCOT DND
   SIMPLE ACCOUNT + SESSION ENGINE

   This application intentionally does NOT use
   Supabase Auth.

   Login identity comes from:
     public.accounts

   Browser session comes from:
     sessionStorage

   Database access uses the Supabase publishable key.
   ===================================================== */


/* =====================================================
   SUPABASE DATABASE CLIENT
   ===================================================== */

const EPCOT_DB_URL =
  'https://yuufbisyzjqnsdbwzzgw.supabase.co';


const EPCOT_DB_KEY =
  'sb_publishable_4dShwxduft6rGco67emZCw_EQLn8nQc';


const epcotDbClient =
  window.supabase.createClient(
    EPCOT_DB_URL,
    EPCOT_DB_KEY,
    {
      auth:{
        persistSession:false,
        autoRefreshToken:false,
        detectSessionInUrl:false
      }
    }
  );


/* =====================================================
   SESSION STORAGE KEYS
   ===================================================== */

const EPCOT_ACCOUNT_SESSION_KEY =
  'epcot-account-id';


/* =====================================================
   NORMALIZE USERNAME
   ===================================================== */

function normalizeEpcotUsername(
  username
){

  return String(
    username || ''
  )
    .trim()
    .toLowerCase();

}


/* =====================================================
   GET ACCOUNT BY ID
   ===================================================== */

async function getEpcotAccountById(
  accountId
){

  if(!accountId){
    return null;
  }


  const {
    data,
    error
  } =
    await epcotDbClient

      .from(
        'accounts'
      )

      .select(
        `
          id,
          username,
          display_name,
          role,
          active,
          created_at,
          updated_at
        `
      )

      .eq(
        'id',
        accountId
      )

      .maybeSingle();


  if(error){

    console.error(
      'EPCOT account lookup failed:',
      error
    );

    return null;

  }


  return data || null;

}


/* =====================================================
   GET CURRENT ACCOUNT
   ===================================================== */

async function getEpcotCurrentAccount(){

  const accountId =
    sessionStorage.getItem(
      EPCOT_ACCOUNT_SESSION_KEY
    );


  if(!accountId){
    return null;
  }


  const account =
    await getEpcotAccountById(
      accountId
    );


  if(
    !account ||
    account.active !== true
  ){

    sessionStorage.removeItem(
      EPCOT_ACCOUNT_SESSION_KEY
    );

    return null;

  }


  return account;

}


/* =====================================================
   LOGIN

   Deliberately simple friend-group login.

   Username + password are checked directly against
   public.accounts.
   ===================================================== */

async function epcotLogin(
  username,
  password
){

  const normalizedUsername =
    normalizeEpcotUsername(
      username
    );


  if(!normalizedUsername){

    throw new Error(
      'Enter your username.'
    );

  }


  if(!password){

    throw new Error(
      'Enter your password.'
    );

  }


  const {
    data:accounts,
    error
  } =
    await epcotDbClient

      .from(
        'accounts'
      )

      .select(
        `
          id,
          username,
          password,
          display_name,
          role,
          active
        `
      )

      .ilike(
        'username',
        normalizedUsername
      )

      .limit(1);


  if(error){
    throw error;
  }


  const account =
    Array.isArray(accounts)
      ? accounts[0]
      : null;


  if(
    !account ||
    account.password !== password
  ){

    throw new Error(
      'Invalid username or password.'
    );

  }


  if(
    account.active !== true
  ){

    throw new Error(
      'This EPCOT account is inactive.'
    );

  }


  sessionStorage.setItem(
    EPCOT_ACCOUNT_SESSION_KEY,
    account.id
  );


  return {

    account,

    profile:
      account

  };

}


/* =====================================================
   LOGOUT
   ===================================================== */

async function epcotLogout(){

  sessionStorage.removeItem(
    EPCOT_ACCOUNT_SESSION_KEY
  );


  sessionStorage.removeItem(
    'epcot-active-character-id'
  );


  sessionStorage.removeItem(
    'epcot-active-character-name'
  );

}


/* =====================================================
   GET PLAYER CHARACTERS

   Replaces old player_characters table.

   Characters now connect directly:

     accounts.id
         ↓
     characters.account_id
   ===================================================== */

async function getEpcotPlayerCharacters(
  accountId = null
){

  let id =
    accountId;


  if(!id){

    const account =
      await getEpcotCurrentAccount();


    if(!account){
      return null;
    }


    id =
      account.id;

  }


  const {
    data,
    error
  } =
    await epcotDbClient

      .from(
        'characters'
      )

      .select(
        `
          id,
          account_id,
          campaign
        `
      )

      .eq(
        'account_id',
        id
      );


  if(error){

    console.error(
      'Player character lookup failed:',
      error
    );

    return null;

  }


  const hero =
    (data || []).find(
      row =>
        row.campaign === 'hero'
    );


  const villain =
    (data || []).find(
      row =>
        row.campaign === 'villain'
    );


  return {

    account_id:
      id,

    hero_character_id:
      hero?.id || null,

    villain_character_id:
      villain?.id || null,

    hero:
      hero || null,

    villain:
      villain || null

  };

}


/* =====================================================
   GET REALITY STATE
   ===================================================== */

async function getEpcotRealityState(
  accountId = null
){

  let id =
    accountId;


  if(!id){

    const account =
      await getEpcotCurrentAccount();


    if(!account){
      return null;
    }


    id =
      account.id;

  }


  const {
    data,
    error
  } =
    await epcotDbClient

      .from(
        'player_reality_state'
      )

      .select(
        `
          account_id,
          campaign,
          reality,
          free_access,
          updated_at
        `
      )

      .eq(
        'account_id',
        id
      )

      .maybeSingle();


  if(error){

    console.error(
      'Reality-state lookup failed:',
      error
    );

    return null;

  }


  return data || null;

}


/* =====================================================
   GET CHARACTER IDENTITY

   Character names now come ONLY from Company File.

   Cast:
     display_name
     image_url

   Unbound:
     unbound_display_name
     unbound_image_url
   ===================================================== */

async function getEpcotCharacterIdentity(
  characterId,
  reality = 'cast'
){

  if(!characterId){
    return null;
  }


  const {
    data,
    error
  } =
    await epcotDbClient

      .from(
        'company_files'
      )

      .select(
        `
          character_id,
          display_name,
          image_url,
          unbound_display_name,
          unbound_image_url
        `
      )

      .eq(
        'character_id',
        characterId
      )

      .maybeSingle();


  if(error){

    console.error(
      'Character identity lookup failed:',
      error
    );

    return null;

  }


  if(!data){
    return null;
  }


  const isUnbound =
    reality === 'unbound';


  return {

    character_id:
      characterId,

    reality:
      isUnbound
        ? 'unbound'
        : 'cast',

    name:
      isUnbound
        ? (
            data.unbound_display_name ||
            data.display_name ||
            'Unnamed Character'
          )
        : (
            data.display_name ||
            data.unbound_display_name ||
            'Unnamed Character'
          ),

    image_url:
      isUnbound
        ? (
            data.unbound_image_url ||
            data.image_url ||
            ''
          )
        : (
            data.image_url ||
            data.unbound_image_url ||
            ''
          ),

    company_file:
      data

  };

}


/* =====================================================
   PLAYER CONTEXT
   ===================================================== */

async function getEpcotPlayerContext(){

  const account =
    await getEpcotCurrentAccount();


  if(
    !account ||
    account.role !== 'player'
  ){

    return null;

  }


  const [
    assignments,
    reality
  ] =
    await Promise.all([

      getEpcotPlayerCharacters(
        account.id
      ),

      getEpcotRealityState(
        account.id
      )

    ]);


  return {

    account,

    profile:
      account,

    assignments,

    reality

  };

}


/* =====================================================
   SESSION COMPATIBILITY

   Some existing shell code asks getSession().

   For our simple system, an active account IS the
   application session.
   ===================================================== */

async function getEpcotSession(){

  const account =
    await getEpcotCurrentAccount();


  if(!account){
    return null;
  }


  return {

    account_id:
      account.id,

    account

  };

}


/* =====================================================
   USER COMPATIBILITY
   ===================================================== */

async function getEpcotUser(){

  return getEpcotCurrentAccount();

}


/* =====================================================
   PROFILE COMPATIBILITY

   Old code calls getProfile().
   The account is now the profile.
   ===================================================== */

async function getEpcotProfile(){

  return getEpcotCurrentAccount();

}


/* =====================================================
   ROLE HELPERS
   ===================================================== */

async function isEpcotDM(){

  const account =
    await getEpcotCurrentAccount();


  return (
    account?.active === true &&
    account?.role === 'dm'
  );

}


async function isEpcotPlayer(){

  const account =
    await getEpcotCurrentAccount();


  return (
    account?.active === true &&
    account?.role === 'player'
  );

}


/* =====================================================
   AUTH WATCH COMPATIBILITY

   There is no external Auth provider anymore.

   Existing code can still register a callback.
   ===================================================== */

function watchEpcotAuth(
  callback
){

  return {

    data:{

      subscription:{

        unsubscribe(){
          /* No external auth listener needed. */
        }

      }

    }

  };

}


/* =====================================================
   PUBLIC API

   IMPORTANT:
   .client remains available because many existing
   gameplay modules already use it for database access.
   ===================================================== */

window.epcotAuth = {

  client:
    epcotDbClient,

  login:
    epcotLogin,

  logout:
    epcotLogout,

  getUser:
    getEpcotUser,

  getProfile:
    getEpcotProfile,

  getSession:
    getEpcotSession,

  getPlayerCharacters:
    getEpcotPlayerCharacters,

  getRealityState:
    getEpcotRealityState,

  getCharacterIdentity:
    getEpcotCharacterIdentity,

  getPlayerContext:
    getEpcotPlayerContext,

  getAccountById:
    getEpcotAccountById,

  getCurrentAccount:
    getEpcotCurrentAccount,

  isDM:
    isEpcotDM,

  isPlayer:
    isEpcotPlayer,

  watch:
    watchEpcotAuth,

  normalizeIdentifier:
    normalizeEpcotUsername

};